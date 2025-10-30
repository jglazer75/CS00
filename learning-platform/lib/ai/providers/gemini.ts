import type { ProviderRunOptions, ProviderRunResult, AiProviderAdapter } from './base';

type GeminiAdapterOptions = {
  apiKey: string;
  model?: string;
};

type GeminiPart = {
  text?: string;
};

type GeminiContent = {
  role?: 'user' | 'model' | 'system';
  parts: GeminiPart[];
};

type GeminiCandidate = {
  content?: GeminiContent;
  finishReason?: string;
  safetyRatings?: Array<Record<string, unknown>>;
};

type GeminiGenerateContentResponse = {
  candidates?: GeminiCandidate[];
  promptFeedback?: Record<string, unknown>;
  modelVersion?: string;
};

const GEMINI_API_BASE_URL = process.env.GEMINI_API_BASE_URL ?? 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_MODEL = 'gemini-1.5-pro-latest';

export class GeminiAdapter implements AiProviderAdapter {
  readonly name = 'gemini';

  private readonly apiKey: string;
  private readonly model: string;

  constructor(options: GeminiAdapterOptions) {
    if (!options.apiKey) {
      throw new Error('GeminiAdapter requires an API key.');
    }

    this.apiKey = options.apiKey;
    this.model = options.model ?? DEFAULT_MODEL;
  }

  async run(options: ProviderRunOptions): Promise<ProviderRunResult> {
    const requestPayload = buildRequestPayload(options);
    const endpoint = new URL(
      `/models/${encodeURIComponent(this.model)}:generateContent?key=${encodeURIComponent(this.apiKey)}`,
      GEMINI_API_BASE_URL
    );

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });

    if (!response.ok) {
      const errorBody = await safeParseJson(response);
      throw new Error(`Gemini API error (${response.status}): ${JSON.stringify(errorBody)}`);
    }

    const payload = (await response.json()) as GeminiGenerateContentResponse;
    const primaryCandidate = payload.candidates?.[0];
    if (!primaryCandidate?.content?.parts?.length) {
      throw new Error('Gemini API did not return any content.');
    }

    const textResponse = collectText(primaryCandidate.content.parts);
    if (!textResponse) {
      throw new Error('Gemini API response missing text content.');
    }

    const structuredContent = parseStructuredContent(textResponse, options.responseFormat?.type);

    return {
      model: payload.modelVersion ?? this.model,
      content: structuredContent ?? textResponse,
      rawResponse: {
        payload,
        finishReason: primaryCandidate.finishReason,
        safetyRatings: primaryCandidate.safetyRatings,
        promptFeedback: payload.promptFeedback,
      },
    };
  }
}

function buildRequestPayload(options: ProviderRunOptions) {
  const { prompt, responseFormat } = options;
  const systemSegments: string[] = [];
  const conversation: GeminiContent[] = [];

  for (const segment of prompt.segments) {
    if (!segment.content || segment.content.trim().length === 0) {
      continue;
    }

    if (segment.role === 'system') {
      systemSegments.push(segment.content);
      continue;
    }

    conversation.push({
      role: mapRole(segment.role),
      parts: [{ text: segment.content }],
    });
  }

  if (conversation.length === 0) {
    throw new Error('GeminiAdapter requires at least one non-system prompt segment.');
  }

  const generationConfig: Record<string, unknown> = {};
  if (responseFormat?.type === 'json' || responseFormat?.type === 'structured') {
    generationConfig.responseMimeType = 'application/json';
    if (responseFormat.type === 'structured' && responseFormat.schema) {
      generationConfig.responseSchema = responseFormat.schema;
    }
  }

  const payload: {
    contents: GeminiContent[];
    systemInstruction?: GeminiContent;
    generationConfig?: Record<string, unknown>;
  } = {
    contents: conversation,
  };

  if (systemSegments.length > 0) {
    payload.systemInstruction = {
      role: 'system',
      parts: systemSegments.map((text) => ({ text })),
    };
  }

  if (Object.keys(generationConfig).length > 0) {
    payload.generationConfig = generationConfig;
  }

  return payload;
}

function mapRole(role: string): 'user' | 'model' {
  if (role === 'assistant') {
    return 'model';
  }
  return 'user';
}

function collectText(parts: GeminiPart[]): string {
  return parts
    .map((part) => part.text ?? '')
    .filter((text) => text.length > 0)
    .join('\n')
    .trim();
}

function parseStructuredContent(text: string, formatType?: 'markdown' | 'json' | 'structured') {
  if (!formatType || formatType === 'markdown') {
    return undefined;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Failed to parse Gemini ${formatType} response as JSON: ${error instanceof Error ? error.message : 'unknown error'}`);
  }
}

async function safeParseJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return await response.text();
  }
}
