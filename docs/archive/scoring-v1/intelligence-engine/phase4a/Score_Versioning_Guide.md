# DEPRECATED

This document is superseded by JOEP v2.

Do not use this document for new scoring-engine implementation.

Authoritative sources:
- JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md
- JOEP-v2-GATES-ICP-ROUTING.md
- JOEP-v2-IMPLEMENTATION-PLAN.md

---

# Score Versioning Guide

Formulas change over time as the business learns. 

## Tracking
Every score is tagged with a `score_version` (e.g., `v1.0-fit`) that references the `score_versions` table. This ensures that if the formula is updated to `v2.0` tomorrow, we know exactly which algorithm produced historical scores, preventing analytic drift.
