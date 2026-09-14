from .models import FinalScore

def explain(score: FinalScore) -> str:
    """Formats the score and its reasons for console output."""
    lines = []
    lines.append("-" * 48)
    lines.append("Score")
    lines.append(f"{score.total_score} (Tier: {score.tier})")
    lines.append("Confidence")
    lines.append(score.confidence)
    lines.append("Reasons")
    if not score.explanation.reasons:
        lines.append("• No specific positive indicators")
    for r in score.explanation.reasons:
        lines.append(f"• {r}")
    lines.append("-" * 48)
    return "\n".join(lines)
