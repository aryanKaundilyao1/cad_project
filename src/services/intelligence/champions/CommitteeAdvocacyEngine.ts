export class CommitteeAdvocacyEngine {
  /**
   * Aggregates individual champion scores to answer: Do we have enough support?
   */
  static evaluate(championInfluences: number[], blockerInfluences: number[]): { balance: string, summary: string } {
    const totalChampionInfluence = championInfluences.reduce((a, b) => a + b, 0);
    const totalBlockerInfluence = blockerInfluences.reduce((a, b) => a + b, 0);
    
    const total = totalChampionInfluence + totalBlockerInfluence;
    
    if (total === 0) return { balance: 'NEUTRAL', summary: 'No significant champions or blockers identified.' };

    const championRatio = totalChampionInfluence / total;

    if (championRatio > 0.7) {
      return { balance: 'FAVORABLE', summary: `Strong support. Champions control ${Math.round(championRatio * 100)}% of the polarized influence.` };
    } else if (championRatio < 0.4) {
      return { balance: 'UNFAVORABLE', summary: `High risk. Blockers control ${Math.round((1 - championRatio) * 100)}% of the polarized influence.` };
    }
    
    return { balance: 'CONTESTED', summary: `Deal is contested. Support and resistance are roughly equal.` };
  }
}
