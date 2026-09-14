import json
from pathlib import Path
from app.schemas.scoring_output import ScoringOutput

FIXTURES_DIR = Path(__file__).parent / "fixtures"

def test_research_and_score_coexist():
    with open(FIXTURES_DIR / "research_score_output.json", "r") as f:
        data = json.load(f)
    model = ScoringOutput(**data)
    
    # Prove that Opportunity Quality exists
    assert model.aggregates.opportunity_quality == 0.85
    # Prove that Outreach Readiness is separate from Opportunity Quality
    assert model.priorities.outreach_readiness == 0.30
    assert model.priorities.sales_priority == 0.50
    # Prove Research task coexists
    assert len(model.research_tasks) == 1
    assert model.research_tasks[0].missing_fact == "Procurement Route"
