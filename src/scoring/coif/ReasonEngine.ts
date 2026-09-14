import { ReasonCode } from './types';

export class ReasonEngine {
  public static format(reasons: ReasonCode[]): string[] {
    return reasons.map(r => {
      const impactPrefix = typeof r.impact === 'string' && r.impact.startsWith('-') ? '[-]' : '[+]';
      return `${impactPrefix} [${r.category}] ${r.description} (${r.impact})`;
    });
  }
}
