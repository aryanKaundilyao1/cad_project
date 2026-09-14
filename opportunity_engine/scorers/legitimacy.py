from ..models import Company, ScoreComponent

def score(company: Company, max_score: float) -> ScoreComponent:
    reasons = []
    score = 0.0
    
    website = company.evidence.get("website", "")
    if website:
        score += max_score * 0.4
        reasons.append("Active website present")
        
    rating = float(company.evidence.get("rating", 0.0))
    if rating >= 4.0:
        score += max_score * 0.4
        reasons.append(f"Strong Google Maps rating ({rating})")
    elif rating >= 3.0:
        score += max_score * 0.2
        reasons.append(f"Average Google Maps rating ({rating})")
        
    reviews = int(company.evidence.get("reviews", 0))
    if reviews > 50:
        score += max_score * 0.2
        reasons.append("Significant number of reviews (>50)")
        
    return ScoreComponent(
        name="Legitimacy",
        score=min(score, max_score),
        max_score=max_score,
        reasons=reasons
    )
