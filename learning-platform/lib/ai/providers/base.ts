import type { RenderedPrompt } from '../types';
import type { AiTaskPrompt } from '../schema';

export type ProviderRunOptions = {
  prompt: RenderedPrompt;
  responseFormat?: AiTaskPrompt['responseFormat'];
};

export type ProviderRunResult = {
  model: string;
  content: string | Record<string, unknown>;
  rawResponse?: unknown;
};

export interface AiProviderAdapter {
  readonly name: string;
  run(options: ProviderRunOptions): Promise<ProviderRunResult>;
}
