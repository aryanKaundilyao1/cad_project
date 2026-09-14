/**
 * Converts a deterministic Opportunity Score (0-100) into a Purchase Probability (0-100%).
 * Uses linear interpolation across defined bands as specified in Phase 5B requirements.
 * This is the cold-start mechanism before Machine Learning calibration is possible.
 */
export class ColdStartProbabilityService {
    static calculateProbability(opportunityScore: number): number {
        if (opportunityScore >= 90) {
            return this.interpolate(opportunityScore, 90, 100, 65, 80);
        }
        if (opportunityScore >= 75) {
            return this.interpolate(opportunityScore, 75, 89, 45, 65);
        }
        if (opportunityScore >= 60) {
            return this.interpolate(opportunityScore, 60, 74, 25, 45);
        }
        if (opportunityScore >= 45) {
            return this.interpolate(opportunityScore, 45, 59, 12, 25);
        }
        if (opportunityScore >= 30) {
            return this.interpolate(opportunityScore, 30, 44, 5, 12);
        }
        return 4.9; // Below 30 is < 5%
    }

    private static interpolate(score: number, scoreMin: number, scoreMax: number, probMin: number, probMax: number): number {
        // Prevent division by zero if bounds are the same
        if (scoreMax === scoreMin) return probMax;
        
        const ratio = (score - scoreMin) / (scoreMax - scoreMin);
        const probability = probMin + (ratio * (probMax - probMin));
        
        // Return rounded to 2 decimal places
        return Math.round(probability * 100) / 100;
    }
}
