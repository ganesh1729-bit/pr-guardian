
import Groq from 'groq-sdk';
import {
  AIProvider,
  ReviewInput,
  ReviewResult
} from './ai.types.js';

export class GroqProvider implements AIProvider {
  async reviewPullRequest(input: ReviewInput): Promise<ReviewResult> {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      throw new Error('GROQ_API_KEY is missing');
    }

    const groq = new Groq({ apiKey });

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

IMPORTANT REVIEW RULES:

1. Only report issues supported by the provided code diff.
2. Every finding must reference an actual changed file.
3. The line number must correspond to a changed line in the diff.
4. Include exact code evidence supporting the finding.
5. Confidence must be an integer between 0 and 100.
6. Do not report speculative performance or security concerns.
7. If no genuine issues exist, return an empty findings array.
8. Never invent file paths, line numbers, or code.

Return valid JSON matching this structure:

{
  "summary": "Overall review summary",
  "overall_risk": "low | medium | high | critical",
  "findings": [
    {
      "severity": "critical | high | medium | low",
      "category": "bug | security | performance | quality | testing",
      "file": "path/to/file.js",
      "line": 42,
      "confidence": 95,
      "description": "Explain the actual issue",
      "suggestion": "How to fix it",
      "evidence": "Exact code from the changed lines supporting this finding"

  validation_status?: 'verified' | 'unverified' | 'rejected';
  validation_reason?: string;
    }
  ]
}
`;

   const response = await groq.chat.completions.create({
  model: process.env.AI_MODEL || 'openai/gpt-oss-120b',
  messages: [
    {
      role: 'user',
      content: prompt
    }
  ],
  temperature: 0.2,
  max_completion_tokens: 8192,
  response_format: { type: 'json_object' }
});

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error('Groq returned an empty response');
    }

    return JSON.parse(content) as ReviewResult;
  }
}
