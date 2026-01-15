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

/**
 * Negotiation & Simulation Types
 */

export type MessageRole = 'system' | 'user' | 'assistant';

export type NegotiationMessage = {
  role: MessageRole;
  content: string;
  timestamp: string;
  stateDelta?: Record<string, unknown>; // Optional changes to the deal state in this turn
  metadata?: Record<string, unknown>;
};

export type NegotiationStatus = 'active' | 'completed' | 'stalemate' | 'aborted';

export type NegotiationSession = {
  id: string;
  userId: string;
  moduleId: string;
  taskId: string;
  status: NegotiationStatus;
  userRole: string;
  aiRole: string;
  currentState: Record<string, unknown>;
  history: NegotiationMessage[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};
