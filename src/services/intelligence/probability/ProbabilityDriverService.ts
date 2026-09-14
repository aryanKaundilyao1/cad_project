export interface ProbabilityDriver {
    driver_name: string;
    driver_type: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    driver_contribution: number;
}

export class ProbabilityDriverService {
    /**
     * Extracts human-readable drivers based on the components of the Opportunity Score.
     * In the cold-start phase, this uses heuristic thresholds. In ML phases, this will use WOE directly.
     */
    static extractDrivers(fit: number, intent: number, timing: number, engagement: number): ProbabilityDriver[] {
        const drivers: ProbabilityDriver[] = [];

        // Fit Drivers
        if (fit >= 20) {
            drivers.push({ driver_name: 'Exceptional ICP Fit', driver_type: 'POSITIVE', driver_contribution: fit });
        } else if (fit <= 10) {
            drivers.push({ driver_name: 'Poor Firmographic Fit', driver_type: 'NEGATIVE', driver_contribution: fit });
        }

        // Intent Drivers
        if (intent >= 25) {
            drivers.push({ driver_name: 'Intense Active Research', driver_type: 'POSITIVE', driver_contribution: intent });
        } else if (intent >= 15) {
            drivers.push({ driver_name: 'Moderate Interest Signals', driver_type: 'POSITIVE', driver_contribution: intent });
        }

        // Timing Drivers
        if (timing >= 20) {
            drivers.push({ driver_name: 'Immediate Trigger Event Detected', driver_type: 'POSITIVE', driver_contribution: timing });
        } else if (timing <= 5) {
            drivers.push({ driver_name: 'No Urgent Trigger Events', driver_type: 'NEUTRAL', driver_contribution: timing });
        }

        // Engagement Drivers
        if (engagement >= 15) {
            drivers.push({ driver_name: 'Broad Buying Committee Engaged', driver_type: 'POSITIVE', driver_contribution: engagement });
        } else if (engagement > 0 && engagement <= 5) {
            drivers.push({ driver_name: 'Single Stakeholder (Low Engagement)', driver_type: 'NEGATIVE', driver_contribution: engagement });
        }

        // Sort by magnitude of contribution
        return drivers.sort((a, b) => b.driver_contribution - a.driver_contribution);
    }
}
