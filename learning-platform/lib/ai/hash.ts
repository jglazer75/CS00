import { createHash } from 'crypto';
import type { RenderedPrompt } from './types';

export function buildPromptCacheKey(params: {
  prompt: RenderedPrompt;
  provider: string;
  model?: string;
  taskId: string;
  payloadFingerprint?: string;
}): string {
  const hash = createHash('sha256');
  hash.update(params.provider);
  if (params.model) {
    hash.update(params.model);
  }
  hash.update(params.taskId);
  hash.update(JSON.stringify(params.prompt.segments));
  if (params.payloadFingerprint) {
    hash.update(params.payloadFingerprint);
  }
  return hash.digest('hex');
}
