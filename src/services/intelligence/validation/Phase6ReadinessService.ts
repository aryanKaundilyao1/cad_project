import { ScoreValidationService } from "./ScoreValidationService";
import { ChampionValidationService } from "./ChampionValidationService";
import { BlockerValidationService } from "./BlockerValidationService";
import { CommitteeValidationService } from "./CommitteeValidationService";
import { RelationshipValidationService } from "./RelationshipValidationService";
import { ExplainabilityValidationService } from "./ExplainabilityValidationService";
import { StakeholderDataQualityService } from "./StakeholderDataQualityService";
import { IndustryCalibrationService } from "./IndustryCalibrationService";
import { PerformanceValidationService } from "./PerformanceValidationService";

export class Phase6ReadinessService {
  /**
   * Orchestrates the entire validation suite and determines Go/No-Go.
   */
  static async certifyReadiness(): Promise<{
    status: 'GO' | 'CONDITIONAL GO' | 'NO GO';
    results: any;
  }> {
    const results = {
      scores: await ScoreValidationService.validate(),
      champions: await ChampionValidationService.validate(),
      blockers: await BlockerValidationService.validate(),
      committees: await CommitteeValidationService.validate(),
      relationships: await RelationshipValidationService.validate(),
      explainability: await ExplainabilityValidationService.validate(),
      dataQuality: await StakeholderDataQualityService.validate(),
      calibration: await IndustryCalibrationService.validate(),
      performance: await PerformanceValidationService.validate()
    };

    const hasFails = Object.values(results).some(r => r.status === 'FAIL');
    const hasWarns = Object.values(results).some(r => r.status === 'WARN');

    let status: 'GO' | 'CONDITIONAL GO' | 'NO GO' = 'GO';

    if (hasFails) {
      status = 'NO GO';
    } else if (hasWarns) {
      status = 'CONDITIONAL GO';
    }

    return {
      status,
      results
    };
  }
}
