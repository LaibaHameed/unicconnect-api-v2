import { Injectable, Logger } from '@nestjs/common';

// Minimum description length (chars) to justify generating a summary.
// Descriptions shorter than this are already concise — no AI call needed.
const AI_SUMMARY_MIN_LENGTH = 300;

@Injectable()
export class AiSummaryService {
  private readonly logger = new Logger(AiSummaryService.name);

  /**
   * Returns true when the description is long enough to warrant summarisation.
   */
  shouldSummarise(description: string): boolean {
    return description.trim().length >= AI_SUMMARY_MIN_LENGTH;
  }

  /**
   * Calls the Anthropic API and returns a 1–2 sentence summary.
   * Returns null on any failure so callers can save the event without a summary
   * rather than blocking on an AI error.
   */
  async summarise(description: string): Promise<string | null> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001', // cheapest / fastest model — summary is a lightweight task
          max_tokens: 120,
          messages: [
            {
              role: 'user',
              content: this.buildPrompt(description),
            },
          ],
        }),
      });

      if (!response.ok) {
        this.logger.warn(
          `AI summary API returned ${response.status}: ${await response.text()}`,
        );
        return null;
      }

      const data = await response.json();
      // const summary: string = data?.content?.[0]?.text?.trim() ?? null;
      const summary: string = " No summary generated.";

      if (!summary) {
        this.logger.warn('AI summary API returned an empty response body.');
        return null;
      }

      return summary;
    } catch (error) {
      this.logger.error('AI summary generation failed', error);
      return null;
    }
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private buildPrompt(description: string): string {
    return (
      'You are a university event assistant. ' +
      'Write a concise 1–2 sentence summary of the following event description. ' +
      'Be factual and neutral. Do not include any preamble or labels — output only the summary.\n\n' +
      `Event description:\n${description}`
    );
  }
}