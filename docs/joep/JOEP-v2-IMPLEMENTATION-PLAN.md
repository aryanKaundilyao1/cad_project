# JOEP v2 Implementation Package

This package contains the revised JAS / Infonics architecture after the 5,000-lead outbound test exposed the research-queue bottleneck.

## Files

### `JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md`
The full source-of-truth implementation document. It preserves the existing scoring formulas, literature review, evidence labels, calibration logic, ranking equations and learning roadmap from `JOEP-INFONICS-SCORING-v0.1`, while changing the gate/control-flow and missing-data rules so sparse outbound leads can be scored.

### `JOEP-v2-GATES-ICP-ROUTING.md`
Focused engineering specification for hard gates, commercial roles, ICP routing, progressive enrichment, sparse-data handling and research-queue behavior.

## Core migration rule

> A candidate may be disqualified only by verified hard incompatibility or a client-defined absolute exclusion. Missing soft evidence reduces certainty, triggers enrichment/research, or remains unknown; it does not automatically prevent scoring.

## Implementation order

1. Replace old G1–G10 mandatory-PASS control flow with JOEP v2 hard gates.
2. Add canonical missing-state enums.
3. Separate `commercial_role`, `icp_class`, `qualification_status`, `outreach_readiness` and `evidence_confidence`.
4. Allow candidates with missing procurement/demand/timing evidence to reach scoring.
5. Preserve the existing scoring formulas and module mathematics.
6. Make module evaluation missing-aware: measured low ≠ unobserved.
7. Add Sales Priority and Research Priority queues.
8. Re-run the 5K dataset and inspect Top-K quality, operational bucket distribution and research volume.
9. Validate with client calibration and Precision@20 / NDCG rather than global accuracy.

## Old behavior that must not remain in code

```text
if any gate is UNCERTAIN or NEEDS_MANUAL_RESEARCH:
    do not score
```

## New behavior

```text
if verified hard gate FAIL:
    disqualify
else:
    classify role + ICP
    progressively enrich
    score using observed/estimable evidence
    calculate confidence separately
    attach research tasks where useful
    rank for sales and research
```
