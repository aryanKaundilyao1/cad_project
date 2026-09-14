export class PriorityExplanationService {
  static generateExplanation(score: number, drivers: any[], momentum: string, risks: any[]) {
    let text = `Opportunity Priority Score: ${score}.\n`;
    
    if (risks.length > 0) {
      text += `WARNING: Immediate attention required due to ${risks.length} active risks.\n`;
    }

    if (drivers.length > 0) {
      const topDriver = drivers.reduce((prev, current) => 
        (Math.abs(prev.impact_weight) > Math.abs(current.impact_weight)) ? prev : current
      );
      text += `Primary Driver: ${topDriver.description} (${topDriver.impact_weight > 0 ? '+' : ''}${topDriver.impact_weight} pts).\n`;
    }

    text += `Momentum is currently ${momentum}.`;

    return text;
  }
}
