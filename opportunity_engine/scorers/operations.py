from ..models import Company, ScoreComponent

def score(company: Company, max_score: float) -> ScoreComponent:
    reasons = []
    score = 0.0
    
    certifications = company.evidence.get("certifications", "")
    if "WHO-GMP" in certifications or "ISO" in certifications or "FDA" in certifications:
        score += max_score * 0.7
        reasons.append("Strong operational certifications (WHO-GMP/ISO/FDA)")
    elif certifications:
        score += max_score * 0.3
        reasons.append("Basic operational certifications present")
        
    # Proxy for operations/manufacturing
    job_postings = company.evidence.get("job_postings", "")
    if "Logistics" in job_postings or "Procurement" in job_postings:
        score += max_score * 0.3
        reasons.append("Active hiring in operations/logistics")
        
    return ScoreComponent(
        name="Operations",
        score=min(score, max_score),
        max_score=max_score,
        reasons=reasons
    )
