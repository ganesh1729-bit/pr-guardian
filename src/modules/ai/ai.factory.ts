
import { AIProvider } from './ai.types.js';
import { GeminiProvider } from './ai.service.js';
import { GroqProvider } from './groq.service.js';

export class AIProviderFactory {
  static create(): AIProvider {
    const provider = process.env.AI_PROVIDER?.toLowerCase();

    switch (provider) {
      case 'gemini':
        return new GeminiProvider();

      case 'groq':
        return new GroqProvider();

      default:
        throw new Error(
          `Unsupported AI provider: ${provider}. Supported providers: gemini, groq`
        );
    }
  }
}
