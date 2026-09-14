# Phase 6: Hard Gate Engine

Based on `JOEP-v2-GATES-ICP-ROUTING.md`.

## Execution Rule
```python
if any(g.state == GateState.FAIL for g in gate_results):
    return DISQUALIFIED
else:
    return CONTINUE
```

## Gates
1. **G1 Entity Validity**: Fails if confirmed fake/closed.
2. **G2 Commercial Role Eligibility**: Fails if confirmed `HARD_NEGATIVE`.
3. **G3 Broad Offering Relevance**: Fails if structurally irrelevant to all client offerings.
4. **G4 Geography/Legal**: Fails if explicitly unserviceable.
5. **G5 Absolute Exclusions**: Fails if on do-not-contact or blacklists.

UNKNOWN never fails.
