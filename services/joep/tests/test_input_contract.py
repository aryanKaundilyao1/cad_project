import json
import pytest
from pathlib import Path
from pydantic import ValidationError
from app.schemas.scoring_input import ScoringInput

FIXTURES_DIR = Path(__file__).parent / "fixtures"

def load_fixture(name: str) -> dict:
    with open(FIXTURES_DIR / name, "r") as f:
        return json.load(f)

def test_sparse_lead_validates():
    data = load_fixture("sparse_lead.json")
    model = ScoringInput(**data)
    assert model.entity.canonical_name == "Sparse Test Corp"
    assert model.lead_dna.missing_states["demand"].value == "NOT_OBSERVED"
    assert model.lead_dna.missing_states["procurement"].value == "UNKNOWN"

def test_multi_icp_validates():
    data = load_fixture("multi_icp_lead.json")
    model = ScoringInput(**data)
    assert len(model.icp_assignments) == 3
    assert model.icp_assignments[0].is_primary is True
    assert model.icp_assignments[1].is_primary is False

def test_multi_product_validates():
    data = load_fixture("multi_product_lead.json")
    model = ScoringInput(**data)
    assert len(model.product_matches) == 2
    assert model.product_matches[0].match_state.value == "CONFIRMED_PRESENT"
    assert model.product_matches[1].match_state.value == "UNKNOWN"

def test_hard_fail_gate_validates():
    data = load_fixture("hard_fail_lead.json")
    model = ScoringInput(**data)
    assert len(model.gate_results) == 1
    assert model.gate_results[0].state.value == "FAIL"

def test_unknown_gate_validates():
    data = load_fixture("unknown_gate_lead.json")
    model = ScoringInput(**data)
    assert len(model.gate_results) == 1
    assert model.gate_results[0].state.value == "UNKNOWN"
