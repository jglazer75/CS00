import { GoogleGenerativeAI, type Content, type Part } from '@google/generative-ai';
import type { AiProviderAdapter, ProviderRunOptions, ProviderRunResult } from './base';

export type GeminiAdapterConfig = {
  apiKey: string;
  model?: string;
};

export class GeminiAdapter implements AiProviderAdapter {
  readonly name = 'gemini';
  private client: GoogleGenerativeAI;
  private modelName: string;

  constructor(config: GeminiAdapterConfig) {
    this.client = new GoogleGenerativeAI(config.apiKey);
    this.modelName = config.model || 'gemini-2.0-flash';
  }

  async run(options: ProviderRunOptions): Promise<ProviderRunResult> {
    const { prompt, responseFormat } = options;
    const model = this.client.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        responseMimeType: responseFormat?.type === 'json' ? 'application/json' : 'text/plain',
      },
    });

    // Convert RenderedPrompt to Gemini Content
    const contents: Content[] = [];
    let systemInstruction: string | undefined;

    for (const segment of prompt.segments) {
      if (segment.role === 'system') {
        // Concatenate multiple system segments if necessary
        systemInstruction = systemInstruction 
          ? `${systemInstruction}\n${segment.content}`
          : segment.content;
      } else {
        const role = segment.role === 'assistant' ? 'model' : 'user';
        const parts: Part[] = [{ text: segment.content }];
        
        // Merge with previous content if role is same (Gemini expects alternating roles usually, 
        // but 'user' messages can sometimes be consecutive if representing distinct inputs, 
        // though typically we should merge them or ensure alternating. 
        // For simplicity, we'll just push. Using chat history format.)
        contents.push({ role, parts });
      }
    }

    try {
      const result = await model.generateContent({
        contents,
        systemInstruction: systemInstruction ? { role: 'system', parts: [{ text: systemInstruction }] } : undefined,
      });

      const response = result.response;
      const text = response.text();

      // If JSON is expected, try to parse it
      let content: string | Record<string, unknown> = text;
      if (responseFormat?.type === 'json') {
        try {
          content = JSON.parse(text);
        } catch {
          // If parse fails, return raw text but maybe log warning? 
          // For now, keep as string or try to extract JSON from markdown block
          const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
          if (jsonMatch) {
            try {
              content = JSON.parse(jsonMatch[1]);
            } catch {
              // ignore
            }
          }
        }
      }

      return {
        model: this.modelName,
        content,
        rawResponse: result,
      };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      // Improve error handling/wrapping
      throw new Error(`Gemini API Error: ${msg}`);
    }
  }
}