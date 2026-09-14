from ..models import Company, ScoreComponent
from typing import Dict

def score(company: Company, max_score: float, product_compat: Dict[str, float]) -> ScoreComponent:
    reasons = []
    score = 0.0
    
    products_handled_str = company.evidence.get("products_handled", "")
    if not products_handled_str:
        return ScoreComponent("Product Fit", 0.0, max_score, ["No specific products identified"])
        
    handled_products = products_handled_str.split("|")
    matched_weight = 0.0
    
    for prod in handled_products:
        weight = product_compat.get(prod, 0.0)
        if weight > 0:
            matched_weight = max(matched_weight, weight)
            reasons.append(f"Product compatibility match: {prod}")
            
    score = max_score * matched_weight
    if score == 0.0:
        reasons.append(f"No priority products found in portfolio ({products_handled_str})")
        
    return ScoreComponent(
        name="Product Fit",
        score=min(score, max_score),
        max_score=max_score,
        reasons=reasons
    )
