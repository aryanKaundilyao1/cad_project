# DEPRECATED

This document is superseded by JOEP v2.

Do not use this document for new scoring-engine implementation.

Authoritative sources:
- JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md
- JOEP-v2-GATES-ICP-ROUTING.md
- JOEP-v2-IMPLEMENTATION-PLAN.md

---

# Outcome Tracking Architecture (Phase 5A)

## Philosophy
To build a mathematically defensible Machine Learning model, you need two things:
1. What you predicted (`X`)
2. What actually happened (`y`)

Most CRM scoring systems fail because they suffer from **Target Leakage**. They look back at closed-won deals, but the data attached to the company *at the time of the query* has been contaminated by the deal itself (e.g., "Contract Signed" signals are present).

Phase 5A's Outcome Tracking architecture solves this by freezing **Score Snapshots** exactly at the moment an opportunity transitions states.

## The Data Model

1. **`crm_outcomes`**: The canonical tracker. A single record per deal/opportunity linking a company to a product with a current status (`Lead`, `Negotiation`, etc.) and a final outcome (`WON`, `LOST`, `IN_PROGRESS`).
2. **`outcome_history`**: The audit log of how an opportunity progressed through its lifecycle.
3. **`score_snapshot_archive`**: The frozen ledger. Every time a deal is created or transitions to a new major stage, the `OpportunityScore` and its underlying pillars (Fit, Intent, Timing, Engagement) are copied here and rendered immutable.
4. **`pipeline_metrics`**: Analytical features like "days in stage" to support future models.

## Usage in Future Phases
In Phases 5B and 5C, the `TrainingDatasetBuilder` joins `crm_outcomes` with the EARLIEST `score_snapshot_archive` for that deal. This provides an exact `X -> y` matrix where `X` is guaranteed to contain only data available *before* the deal closed.
