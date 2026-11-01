
import { GoogleGenAI } from '@google/genai';
import {
  AIProvider,
  ReviewInput,
  ReviewResult
} from './ai.types.js';

export class GeminiProvider implements AIProvider {

  async reviewPullRequest(input: ReviewInput): Promise<ReviewResult> {

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is missing');
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
You are an expert software engineer performing a professional code review.

Review this GitHub pull request.

TITLE:
${input.title}

DESCRIPTION:
${input.description ?? 'No description provided'}

CHANGED FILES:
${JSON.stringify(input.files, null, 2)}

Analyze for:
1. Bugs and logical errors
2. Security vulnerabilities
3. Performance problems
4. Code quality issues
5. Missing or insufficient tests

Only report genuine issues. Do not invent problems.

Return valid JSON matching this structure:

{
  "summary": "Overall review summary",
  "overall_risk": "low | medium | high | critical",
  "findings": [
    {
      "severity": "critical | high | medium | low",
      "category": "bug | security | performance | quality | testing",
      "file": "filename",
      "description": "What is wrong",
      "suggestion": "How to fix it"
    }
  ]
}
`;

    const response = await ai.models.generateContent({
      model: process.env.AI_MODEL || 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.2,
        responseMimeType: 'application/json'
      }
    });

    if (!response.text) {
      throw new Error('Gemini returned an empty response');
    }

    return JSON.parse(response.text) as ReviewResult;
  }
}

// Temporary compatibility with the existing review tool.
export class AIService extends GeminiProvider {}
