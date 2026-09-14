import { Signal } from "./BaseSignalExtractor";

export type ReadinessLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface ReadinessRule {
  id?: string;
  name: string;
  description?: string;
  conditions: Array<{
    signal_type: string;
    min_confidence?: number;
  }>;
  resulting_readiness: ReadinessLevel;
  is_active?: boolean;
}

export interface ReadinessResult {
  level: ReadinessLevel;
  matchedRules: string[];
  lastCalculated: Date;
}

/**
 * OpportunityReadinessEngine dynamically calculates the readiness momentum 
 * of a company/entity based on active rules and recent signals.
 * Purely deterministic logic layer, no AI scoring used.
 */
export class OpportunityReadinessEngine {
  private rules: ReadinessRule[] = [];

  constructor(rules?: ReadinessRule[]) {
    // Default fallback rules if DB fetch fails or isn't provided
    this.rules = rules || [
      {
        name: 'Tender High Confidence',
        conditions: [{ signal_type: 'Tender Published', min_confidence: 90 }],
        resulting_readiness: 'Critical'
      },
      {
        name: 'Project Expansion Momentum',
        conditions: [{ signal_type: 'Factory Expansion', min_confidence: 80 }],
        resulting_readiness: 'High'
      },
      {
        name: 'Vendor Pipeline',
        conditions: [{ signal_type: 'Vendor Selection' }],
        resulting_readiness: 'High'
      },
      {
        name: 'Company Growth',
        conditions: [{ signal_type: 'Business Expansion' }],
        resulting_readiness: 'Medium'
      },
      {
        name: 'Funding Secured',
        conditions: [{ signal_type: 'Capital Investment' }],
        resulting_readiness: 'Medium'
      }
    ];
  }

  public evaluateReadiness(signals: Signal[]): ReadinessResult {
    const matchedRules: string[] = [];
    
    // We determine the highest level of readiness met by the rules
    let currentMaxLevel: ReadinessLevel = 'Low';
    const levelWeight: Record<ReadinessLevel, number> = { 'Low': 0, 'Medium': 1, 'High': 2, 'Critical': 3 };

    if (!signals || signals.length === 0) {
      return { level: 'Low', matchedRules: [], lastCalculated: new Date() };
    }

    // Evaluate rules
    for (const rule of this.rules) {
      if (rule.is_active === false) continue;

      let ruleMatched = false;

      // Check if ANY condition in the rule matches (OR logic within rules for simplicity, 
      // or you can implement complex AND logic if required). Here we assume ALL conditions must be met (AND)
      let allConditionsMet = true;
      for (const cond of rule.conditions) {
        const hasMatchingSignal = signals.some(s => {
          const typeMatch = s.signal_type.toLowerCase() === cond.signal_type.toLowerCase();
          const confMatch = cond.min_confidence ? s.confidence_score >= cond.min_confidence : true;
          return typeMatch && confMatch;
        });

        if (!hasMatchingSignal) {
          allConditionsMet = false;
          break;
        }
      }

      if (allConditionsMet && rule.conditions.length > 0) {
        ruleMatched = true;
      }

      if (ruleMatched) {
        matchedRules.push(rule.name);
        if (levelWeight[rule.resulting_readiness] > levelWeight[currentMaxLevel]) {
          currentMaxLevel = rule.resulting_readiness;
        }
      }
    }

    // Fallback volume-based logic if no specific rules matched but activity exists
    if (matchedRules.length === 0 && signals.length > 0) {
      if (signals.length >= 5) {
        currentMaxLevel = levelWeight['High'] > levelWeight[currentMaxLevel] ? 'High' : currentMaxLevel;
        matchedRules.push('High Volume Activity');
      } else if (signals.length >= 2) {
        currentMaxLevel = levelWeight['Medium'] > levelWeight[currentMaxLevel] ? 'Medium' : currentMaxLevel;
        matchedRules.push('Sustained Activity');
      }
    }

    return {
      level: currentMaxLevel,
      matchedRules,
      lastCalculated: new Date()
    };
  }
}
