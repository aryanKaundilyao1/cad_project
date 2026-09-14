// src/services/intelligence/decision/analytics/RecommendationAdoptionEngine.ts

export interface AdoptionMetrics {
    adoptionRate: number;
    completionRate: number;
    ignoreRate: number;
}

export class RecommendationAdoptionEngine {
    
    /**
     * Calculates the rates at which users are accepting, ignoring, and completing AI recommendations.
     */
    static calculateAdoption(
        generated: number, 
        accepted: number, 
        ignored: number, 
        completed: number
    ): AdoptionMetrics {
        
        if (generated === 0) return { adoptionRate: 0, completionRate: 0, ignoreRate: 0 };

        const adoptionRate = (accepted / generated) * 100;
        const ignoreRate = (ignored / generated) * 100;
        
        let completionRate = 0;
        if (accepted > 0) {
            completionRate = (completed / accepted) * 100;
        }

        return {
            adoptionRate: Math.round(adoptionRate * 100) / 100,
            completionRate: Math.round(completionRate * 100) / 100,
            ignoreRate: Math.round(ignoreRate * 100) / 100
        };
    }
}
