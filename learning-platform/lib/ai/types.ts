import type { AiPromptTemplateSegment } from './schema';

export type RenderedPromptSegment = {
  role: AiPromptTemplateSegment['role'];
  content: string;
};

export type RenderedPrompt = {
  segments: RenderedPromptSegment[];
};

export type ProviderIdentifier = 'gemini' | string;

export type ProviderRequestContext = {
  requestId: string;
  taskId: string;
  moduleId: string;
  userId: string;
  persona?: string;
  difficulty?: string;
};

export type ProviderCredentials = {
  provider: ProviderIdentifier;
  apiKey: string;
  model?: string;
  isUserSupplied: boolean;
};
