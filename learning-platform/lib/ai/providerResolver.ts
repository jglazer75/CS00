import { getSupabaseServerClient } from '@/lib/supabase/server';
import { decryptApiKey } from './crypto';
import type { ProviderCredentials, ProviderIdentifier } from './types';

type UserProviderRecord = {
  id: string;
  provider_name: string;
  encrypted_api_key: string;
  model_preferences: {
    default?: string;
  } | null;
};

type ModuleProviderRecord = {
  module_id: string;
  provider: string;
  model: string | null;
  encrypted_api_key: string | null;
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
  moduleId: string;
  preferredProvider?: ProviderIdentifier;
  teamId?: string;
}): Promise<ProviderCredentials> {
  const { userId, moduleId, preferredProvider, teamId } = params;

  // 1. Team Context (Phase 2+)
  const teamLookup = teamId ? await lookupTeamProvider(teamId) : null;
  const providerName = preferredProvider ?? teamLookup?.credentials?.provider ?? 'gemini';

  if (teamLookup?.credentials && teamLookup.credentials.provider === providerName) {
    return teamLookup.credentials;
  }

  // 2. User Override (Personal Key)
  const userOverride = await lookupUserProvider(userId, providerName);
  if (userOverride) {
    return userOverride;
  }

  // 3. Module Config (Developer Key)
  const moduleConfig = await lookupModuleProvider(moduleId);
  if (moduleConfig && moduleConfig.provider === providerName) {
    return moduleConfig;
  }

  // 4. System Fallback
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
    model: process.env.GEMINI_MODEL ?? 'gemini-2.0-flash',
    isUserSupplied: false,
  };
}

async function lookupUserProvider(userId: string, providerName: ProviderIdentifier): Promise<ProviderCredentials | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('user_ai_providers')
    .select('id, provider_name, encrypted_api_key, model_preferences')
    .eq('user_id', userId)
    .eq('provider_name', providerName)
    .maybeSingle<UserProviderRecord>();

  if (error) {
    console.warn('Failed to lookup user AI provider', error);
    return null;
  }

  if (!data) {
    return null;
  }

  return toProviderCredentials(data);
}

async function lookupModuleProvider(moduleId: string): Promise<ProviderCredentials | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('module_ai_settings')
    .select('module_id, provider, model, encrypted_api_key')
    .eq('module_id', moduleId)
    .maybeSingle<ModuleProviderRecord>();

  if (error) {
    if (error.code === '42P01') return null; // Table not yet created
    console.warn('Failed to lookup module AI settings', error);
    return null;
  }

  if (!data || !data.encrypted_api_key) {
    return null;
  }

  return {
    provider: data.provider,
    apiKey: data.encrypted_api_key,
    model: data.model ?? undefined,
    isUserSupplied: true, // Treated as supplied by developer/module
  };
}

async function lookupTeamProvider(teamId: string): Promise<TeamProviderLookupResult | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('team_ai_settings')
    .select('selected_user_provider_id, allow_system_fallback')
    .eq('team_id', teamId)
    .maybeSingle<TeamProviderSettingsRecord>();

  if (error) {
    if (error?.code === '42P01') {
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
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('user_ai_providers')
    .select('id, provider_name, encrypted_api_key, model_preferences')
    .eq('id', providerId)
    .maybeSingle<UserProviderRecord>();

  if (error) {
    console.warn('Failed to fetch provider record by id', error);
    return null;
  }

  return data ?? null;
}

function toProviderCredentials(record: UserProviderRecord): ProviderCredentials {
  // Attempt decryption; fall back to raw value for rows stored before encryption was added
  const apiKey = decryptApiKey(record.encrypted_api_key) ?? record.encrypted_api_key;
  return {
    provider: record.provider_name,
    apiKey,
    model: record.model_preferences?.default,
    isUserSupplied: true,
  };
}