import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { ProviderCredentials, ProviderIdentifier } from './types';

type UserProviderRecord = {
  id: string;
  provider_name: string;
  encrypted_api_key: string;
  model_preferences: {
    default?: string;
  } | null;
};

type TeamProviderSettingsRecord = {
  selected_user_provider_id: string | null;
  allow_system_fallback: boolean | null;
};

type TeamProviderLookupResult = {
  credentials: ProviderCredentials | null;
  allowFallback: boolean;
};

export class ProviderResolutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProviderResolutionError';
  }
}

export async function resolveProviderCredentials(params: {
  userId: string;
  preferredProvider?: ProviderIdentifier;
  teamId?: string;
}): Promise<ProviderCredentials> {
  const teamLookup = params.teamId ? await lookupTeamProvider(params.teamId) : null;
  const providerName = params.preferredProvider ?? teamLookup?.credentials?.provider ?? 'gemini';

  if (teamLookup?.credentials && teamLookup.credentials.provider === providerName) {
    return teamLookup.credentials;
  }

  const userOverride = await lookupUserProvider(params.userId, providerName);
  if (userOverride) {
    return userOverride;
  }

  if (teamLookup && !teamLookup.allowFallback) {
    throw new ProviderResolutionError(
      `Team configuration requires a configured provider for "${providerName}". No fallback is allowed.`
    );
  }

  if (providerName !== 'gemini') {
    throw new ProviderResolutionError(`Provider "${providerName}" is not configured for system fallback.`);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new ProviderResolutionError('GEMINI_API_KEY is not defined. Configure the system fallback provider.');
  }

  return {
    provider: 'gemini',
    apiKey,
    model: process.env.GEMINI_MODEL ?? 'gemini-pro',
    isUserSupplied: false,
  };
}

async function lookupUserProvider(userId: string, providerName: ProviderIdentifier): Promise<ProviderCredentials | null> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from<UserProviderRecord>('user_ai_providers')
    .select('id, provider_name, encrypted_api_key, model_preferences')
    .eq('user_id', userId)
    .eq('provider_name', providerName)
    .maybeSingle();

  if (error) {
    console.warn('Failed to lookup user AI provider', error);
    return null;
  }

  if (!data) {
    return null;
  }

  // TODO: decrypt `encrypted_api_key` once KMS or Supabase Vault is in place.
  return toProviderCredentials(data);
}

async function lookupTeamProvider(teamId: string): Promise<TeamProviderLookupResult | null> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from<TeamProviderSettingsRecord>('team_ai_settings')
    .select('selected_user_provider_id, allow_system_fallback')
    .eq('team_id', teamId)
    .maybeSingle();

  if (error) {
    if (error?.code === '42P01') {
      // Table not yet created in this environment; treat as no team configuration.
      console.warn('Team AI settings table not found; ignoring team provider resolution.');
      return null;
    }
    console.warn('Failed to lookup team AI settings', error);
    return {
      credentials: null,
      allowFallback: true,
    };
  }

  if (!data) {
    return {
      credentials: null,
      allowFallback: true,
    };
  }

  const allowFallback = data.allow_system_fallback !== false;

  if (!data.selected_user_provider_id) {
    return {
      credentials: null,
      allowFallback,
    };
  }

  const record = await fetchProviderRecordById(data.selected_user_provider_id);
  if (!record) {
    return {
      credentials: null,
      allowFallback,
    };
  }

  return {
    credentials: toProviderCredentials(record),
    allowFallback,
  };
}

async function fetchProviderRecordById(providerId: string): Promise<UserProviderRecord | null> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from<UserProviderRecord>('user_ai_providers')
    .select('id, provider_name, encrypted_api_key, model_preferences')
    .eq('id', providerId)
    .maybeSingle();

  if (error) {
    console.warn('Failed to fetch provider record by id', error);
    return null;
  }

  return data ?? null;
}

function toProviderCredentials(record: UserProviderRecord): ProviderCredentials {
  return {
    provider: record.provider_name,
    apiKey: record.encrypted_api_key,
    model: record.model_preferences?.default,
    isUserSupplied: true,
  };
}
