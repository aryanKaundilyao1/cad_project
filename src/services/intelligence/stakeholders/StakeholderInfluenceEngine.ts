import { StakeholderRoleDefinition, StakeholderProfile } from "./StakeholderTypes";

export interface ScoreResult {
  score: number;
  confidence: number;
  drivers: { factor: string; value: number; impact: string }[];
}

export class StakeholderInfluenceEngine {
  /**
   * Calculates influence based on role, seniority, and relationships.
   */
  static calculate(profile: StakeholderProfile, roles: StakeholderRoleDefinition[], title: string = ''): ScoreResult {
    let score = 0;
    let confidence = 50; // Base confidence
    const drivers = [];

    // 1. Role-based Influence (Highest Weight)
    if (roles.length > 0) {
      confidence += 20;
      let highestRoleScore = 0;
      let bestRole = '';

      for (const role of roles) {
        if (role.category === 'DECISION_MAKER') { highestRoleScore = Math.max(highestRoleScore, 90); bestRole = role.role_name; }
        else if (role.category === 'SPONSOR') { highestRoleScore = Math.max(highestRoleScore, 80); bestRole = role.role_name; }
        else if (role.category === 'EVALUATOR') { highestRoleScore = Math.max(highestRoleScore, 60); bestRole = role.role_name; }
        else if (role.category === 'INFLUENCER') { highestRoleScore = Math.max(highestRoleScore, 40); bestRole = role.role_name; }
        else if (role.category === 'BLOCKER') { highestRoleScore = Math.max(highestRoleScore, 70); bestRole = role.role_name; }
      }
      
      score += highestRoleScore;
      if (highestRoleScore > 0) {
        drivers.push({ factor: 'Role Influence', value: highestRoleScore, impact: `Role identified as ${bestRole}` });
      }
    }

    // 2. Title-based Bonus (If known)
    if (title) {
      confidence += 15;
      let titleBonus = 0;
      const lowerTitle = title.toLowerCase();
      
      if (lowerTitle.includes('chief') || lowerTitle.includes('ceo') || lowerTitle.includes('cfo')) {
        titleBonus = 20;
      } else if (lowerTitle.includes('vp') || lowerTitle.includes('president')) {
        titleBonus = 15;
      } else if (lowerTitle.includes('director')) {
        titleBonus = 10;
      }

      if (titleBonus > 0) {
        score += titleBonus;
        drivers.push({ factor: 'Seniority Bonus', value: titleBonus, impact: `Title: ${title}` });
      }
    }

    // Clamp score
    score = Math.min(Math.max(score, 0), 100);
    confidence = Math.min(confidence, 100);

    return { score, confidence, drivers };
  }
}
