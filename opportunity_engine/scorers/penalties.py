from ..models import Company
from typing import Dict, Tuple, List

def calculate_multipliers(company: Company, penalties_config: Dict[str, float]) -> Tuple[float, List[str]]:
    multiplier = 1.0
    reasons = []
    
    if company.evidence.get("active_contract", "No") == "Yes":
        penalty = penalties_config.get("active_competitor_contract", 0.40)
        multiplier -= penalty
        reasons.append(f"Active competitor contract (–{int(penalty*100)}%)")
        
    if company.evidence.get("hiring_freeze", "No") == "Yes":
        penalty = penalties_config.get("hiring_freeze", 0.25)
        multiplier -= penalty
        reasons.append(f"Hiring freeze/layoffs (–{int(penalty*100)}%)")
        
    if company.evidence.get("financial_distress", "No") == "Yes":
        penalty = penalties_config.get("financial_distress", 0.20)
        multiplier -= penalty
        reasons.append(f"Financial distress (–{int(penalty*100)}%)")
        
    if int(company.evidence.get("days_since_last_signal", 0)) > 180:
        penalty = penalties_config.get("no_engagement_180_days", 0.15)
        multiplier -= penalty
        reasons.append(f"No engagement in >180 days (–{int(penalty*100)}%)")
        
    return max(multiplier, 0.10), reasons
