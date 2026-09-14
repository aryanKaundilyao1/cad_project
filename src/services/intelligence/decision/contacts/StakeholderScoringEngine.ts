export interface ContactData {
    id: string;
    title?: string;
    department?: string;
    engagementMetrics?: {
        emailOpens?: number;
        proposalViews?: number;
        calls?: number;
        meetings?: number;
        downloads?: number;
        websiteVisits?: number;
    };
    archetypeMatch?: number; // 0-100
}

export class StakeholderScoringEngine {
    
    /**
     * Determines Seniority Score based on title matching.
     * CEO = 100, COO = 95, CFO = 90, VP = 85, Head = 80, Manager = 70, etc.
     */
    static calculateSeniorityScore(title: string | undefined): number {
        if (!title) return 10;
        const lowerTitle = title.toLowerCase();
        
        if (lowerTitle.includes('ceo') || lowerTitle.includes('chief executive')) return 100;
        if (lowerTitle.includes('coo') || lowerTitle.includes('president')) return 95;
        if (lowerTitle.includes('cfo') || lowerTitle.includes('chief financial')) return 90;
        if (lowerTitle.includes('c-level') || lowerTitle.includes('chief')) return 88;
        if (lowerTitle.includes('vp') || lowerTitle.includes('vice president')) return 85;
        if (lowerTitle.includes('director') || lowerTitle.includes('head')) return 80;
        if (lowerTitle.includes('manager')) return 70;
        if (lowerTitle.includes('engineer') || lowerTitle.includes('specialist')) return 50;
        if (lowerTitle.includes('coordinator') || lowerTitle.includes('analyst')) return 30;
        if (lowerTitle.includes('admin') || lowerTitle.includes('assistant')) return 10;
        
        return 30; // Default
    }

    /**
     * Determines Engagement Score based on weighted metrics.
     */
    static calculateEngagementScore(metrics: ContactData['engagementMetrics']): number {
        if (!metrics) return 0;
        
        let score = 0;
        score += (metrics.meetings || 0) * 20; // Meetings are very high engagement
        score += (metrics.calls || 0) * 15;
        score += (metrics.proposalViews || 0) * 10;
        score += (metrics.downloads || 0) * 5;
        score += (metrics.emailOpens || 0) * 2;
        score += (metrics.websiteVisits || 0) * 1;
        
        return Math.min(100, score);
    }
}
