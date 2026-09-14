from ..models import Company, ScoreComponent

def score(company: Company, max_score: float) -> ScoreComponent:
    reasons = []
    score = 0.0
    
    industry = company.evidence.get("industry", "")
    target_industries = ["Retail", "Wholesale", "Distribution"]
    
    if industry in target_industries:
        score += max_score * 0.6
        reasons.append(f"Strong industry match ({industry})")
    elif industry:
        score += max_score * 0.2
        reasons.append(f"Partial industry match ({industry})")
        
    region = company.evidence.get("region", "")
    if region in ["Germany", "UK", "France", "USA"]:
        score += max_score * 0.4
        reasons.append(f"High priority geography ({region})")
    elif region:
        score += max_score * 0.2
        reasons.append(f"Serviceable geography ({region})")
        
    return ScoreComponent(
        name="Market Fit",
        score=min(score, max_score),
        max_score=max_score,
        reasons=reasons
    )
