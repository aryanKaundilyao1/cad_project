export class ActionCalibrationService {
  /**
   * Adjusts default action impacts based on the specific industry of the opportunity.
   */
  static calibrateImpact(baseImpact: number, industry: string, actionType: string): number {
    let multiplier = 1.0;

    // Example: Missing Executive Alignment is far more dangerous in heavy Construction
    if (industry === 'Construction' && actionType === 'EXECUTIVE_ALIGNMENT') {
      multiplier = 1.5;
    }
    
    // Example: Procurement holds less weight in small Fit-Out deals
    if (industry === 'Fit-Out' && actionType === 'PROCUREMENT_ACCELERATION') {
      multiplier = 0.8;
    }

    return baseImpact * multiplier;
  }
}
