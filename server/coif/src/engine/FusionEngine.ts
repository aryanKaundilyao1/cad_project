import { ReasonCode } from './types';

export class FusionEngine {
  public static fuse(oieScore: number, coifScore: number, confidenceScore: number): { finalScore: number; reasons: ReasonCode[] } {
    const reasons: ReasonCode[] = [];

    // Confidence Weighted Fusion
    // If COIF confidence is high, weight COIF more. If low, fall back to OIE.
    const coifWeight = confidenceScore / 100;
    const oieWeight = 1 - coifWeight;

    const rawFinal = (oieScore * oieWeight) + (coifScore * coifWeight);
    const finalScore = Math.round(Math.min(100, Math.max(0, rawFinal)));

    reasons.push({
      category: 'General',
      description: `Confidence-Weighted Fusion applied (COIF Weight: ${(coifWeight * 100).toFixed(0)}%, OIE Weight: ${(oieWeight * 100).toFixed(0)}%)`,
      impact: `Final Score: ${finalScore}`,
    });

    return { finalScore, reasons };
  }
}
