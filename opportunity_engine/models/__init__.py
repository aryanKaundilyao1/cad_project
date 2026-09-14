from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional

@dataclass
class CompanyEvidence:
    """Holds metadata and evidence for scoring a company."""
    raw_data: Dict[str, Any]

    def get(self, key: str, default: Any = None) -> Any:
        return self.raw_data.get(key, default)

@dataclass
class ScoreComponent:
    """Represents a component of the total score."""
    name: str
    score: float
    max_score: float
    reasons: List[str] = field(default_factory=list)

@dataclass
class Explanation:
    """Explanation of the score logic."""
    fit: float
    intent: float
    timing: float
    engagement: float
    negative_multiplier: float
    decay_factor: float
    reasons: List[str]

@dataclass
class FinalScore:
    """Final calculated score for a company."""
    company_id: str
    company_name: str
    total_score: float
    tier: str
    confidence: str
    explanation: Explanation
    components: Dict[str, ScoreComponent]

@dataclass
class Company:
    """Represents a company entity."""
    id: str
    name: str
    evidence: CompanyEvidence
