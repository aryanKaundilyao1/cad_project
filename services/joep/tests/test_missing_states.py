import pytest
from app.models.enums import MissingState

def test_unknown_is_not_confirmed_absent():
    assert MissingState.UNKNOWN != MissingState.CONFIRMED_ABSENT
    assert MissingState.NOT_OBSERVED != MissingState.CONFIRMED_ABSENT
    
    # Verify all required JOEP missing states exist
    expected = [
        "CONFIRMED_PRESENT", "CONFIRMED_ABSENT", "UNKNOWN", "NOT_OBSERVED",
        "NOT_APPLICABLE", "CONFLICTING", "ENRICHMENT_FAILED", "NEEDS_MANUAL_RESEARCH"
    ]
    actual = [s.value for s in MissingState]
    for e in expected:
        assert e in actual
