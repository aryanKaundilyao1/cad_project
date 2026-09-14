from ..models import Company, ScoreComponent

def score(company: Company, max_score: float) -> ScoreComponent:
    reasons = []
    score = 0.0
    
    import_gaps = company.evidence.get("import_gaps", "No")
    if import_gaps == "Yes":
        score += max_score * 0.5
        reasons.append("Import gap detected (supplier switch possible)")
        
    trigger_events = company.evidence.get("trigger_events", "")
    if trigger_events:
        score += max_score * 0.5
        reasons.append(f"Business trigger event ({trigger_events})")
        
    return ScoreComponent(
        name="Trade",
        score=min(score, max_score),
        max_score=max_score,
        reasons=reasons
    )
