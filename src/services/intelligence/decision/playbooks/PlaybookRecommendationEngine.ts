// src/services/intelligence/decision/playbooks/PlaybookRecommendationEngine.ts

import { PlaybookDecisionMatrixEngine, MatrixInputs } from './PlaybookDecisionMatrixEngine';

export interface PlaybookRecommendationResult {
    playbookName: string;
    score: number;
    reasonCodes: string[];
}

export class PlaybookRecommendationEngine {
    
    static recommendPlaybook(inputs: MatrixInputs): PlaybookRecommendationResult {
        const matrixResult = PlaybookDecisionMatrixEngine.determinePlaybook(inputs);
        
        // Base score calculations based on urgency and intent
        let score = (inputs.intentScore * 0.5) + (inputs.urgencyScore * 0.5);
        
        // Boost if there is a very clear product direction
        if (inputs.topProduct && inputs.topProduct.totalScore > 85) {
            score += 10;
        }

        return {
            playbookName: matrixResult.playbookName,
            score: Math.min(100, score),
            reasonCodes: matrixResult.reasonCodes
        };
    }
}
