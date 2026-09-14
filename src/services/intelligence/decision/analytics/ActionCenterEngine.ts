// src/services/intelligence/decision/analytics/ActionCenterEngine.ts

export interface ActionTaskInput {
    id: string;
    urgencyScore: number;
    probabilityScore: number;
    dealValue: number;
    confidenceScore: number;
}

export interface PrioritizedAction {
    id: string;
    priorityScore: number;
    priorityLevel: string;
}

export class ActionCenterEngine {
    
    /**
     * Prioritizes tasks in the action center based on Urgency + Probability + Deal Value + Confidence.
     */
    static prioritizeActions(tasks: ActionTaskInput[]): PrioritizedAction[] {
        
        // Normalize deal value (Assuming 1M is max normal deal for scoring purposes)
        const maxDealValue = 1000000;
        
        return tasks.map(task => {
            const normalizedValue = Math.min((task.dealValue / maxDealValue) * 100, 100);
            
            // Formula: Priority Score = Urgency + Probability + Deal Value + Confidence
            // We'll average them to keep the score 0-100
            const priorityScore = (task.urgencyScore + task.probabilityScore + normalizedValue + task.confidenceScore) / 4;
            
            let priorityLevel = 'Low';
            if (priorityScore >= 80) priorityLevel = 'Critical';
            else if (priorityScore >= 60) priorityLevel = 'High';
            else if (priorityScore >= 40) priorityLevel = 'Medium';

            return {
                id: task.id,
                priorityScore: Math.round(priorityScore * 100) / 100,
                priorityLevel
            };
        }).sort((a, b) => b.priorityScore - a.priorityScore);
    }
}
