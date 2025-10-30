import { GeminiAdapter } from './providers/gemini';
import type { AiProviderAdapter } from './providers/base';
import type { ProviderCredentials } from './types';
import { ProviderResolutionError } from './providerResolver';

export function createProviderAdapter(credentials: ProviderCredentials): AiProviderAdapter {
  switch (credentials.provider) {
    case 'gemini':
      return new GeminiAdapter({
        apiKey: credentials.apiKey,
        model: credentials.model,
      });
    default:
      throw new ProviderResolutionError(`Unsupported provider "${credentials.provider}".`);
  }
}
