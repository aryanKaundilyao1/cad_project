from typing import List
from .models import FinalScore

def rank_companies(scored_companies: List[FinalScore], top_n: int = 20) -> List[FinalScore]:
    """Sorts companies by total score descending and returns the top N."""
    return sorted(scored_companies, key=lambda x: x.total_score, reverse=True)[:top_n]
