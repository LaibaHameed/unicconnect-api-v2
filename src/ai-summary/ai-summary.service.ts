import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Minimum description length required for AI summary
const AI_SUMMARY_MIN_LENGTH = 300;

@Injectable()
export class AiSummaryService {
  private readonly logger = new Logger(AiSummaryService.name);

  private readonly genAI = new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY || '',
  );

  /**
   * Checks if description is long enough
   */
  shouldSummarise(description: string): boolean {
    return true;
  }

  /**
   * Generate concise summary using Gemini
   */
  async summarise(description: string): Promise<string | null> {
    try {

      // SHORT DESCRIPTION HANDLING
      if (description.trim().length < AI_SUMMARY_MIN_LENGTH) {

        // simplify + shorten locally
        const simplified = description
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 140);

        return simplified.endsWith('.')
          ? simplified
          : simplified + '...';
      }

      // LONG DESCRIPTION → GEMINI
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
      });

      const prompt = this.buildPrompt(description);

      const result = await model.generateContent(prompt);

      const response = await result.response;

      const summary = response.text()?.trim();

      if (!summary) {
        this.logger.warn('Gemini returned empty summary');
        return null;
      }

      return summary;

    } catch (error) {
      this.logger.error('Gemini summary generation failed', error);
      return null;
    }
  }

  /**
   * Prompt builder
   */
  private buildPrompt(description: string): string {
    return `
You are a university event assistant.

Write a concise and engaging summary of the following university event description.

Rules:
- Keep it between 1-2 sentences
- Be clear and professional
- Do not use bullet points
- Do not add headings
- Output ONLY the summary

Event Description:
${description}
`;
  }
}