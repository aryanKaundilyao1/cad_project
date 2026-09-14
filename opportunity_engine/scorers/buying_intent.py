from ..models import Company, ScoreComponent

def score(company: Company, max_score: float) -> ScoreComponent:
    reasons = []
    score = 0.0
    
    explicit_sourcing = company.evidence.get("explicit_sourcing", "")
    if explicit_sourcing:
        score += max_score * 0.4
        reasons.append(f"Explicit sourcing action ({explicit_sourcing})")
        
    topic_surge = int(company.evidence.get("topic_surge", 0))
    if topic_surge >= 3:
        score += max_score * 0.3
        reasons.append(f"Sustained topic surge ({topic_surge} topics)")
    elif topic_surge > 0:
        score += max_score * 0.1
        reasons.append(f"Minor topic surge ({topic_surge} topics)")
        
    pricing_visits = int(company.evidence.get("pricing_visits", 0))
    if pricing_visits > 5:
        score += max_score * 0.2
        reasons.append("High pricing page visits")
        
    review_visits = int(company.evidence.get("review_visits", 0))
    if review_visits > 0:
        score += max_score * 0.1
        reasons.append("Review site comparison activity")
        
    return ScoreComponent(
        name="Buying Intent",
        score=min(score, max_score),
        max_score=max_score,
        reasons=reasons
    )
