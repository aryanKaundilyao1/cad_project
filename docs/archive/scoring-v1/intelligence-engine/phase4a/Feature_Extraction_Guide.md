# DEPRECATED

This document is superseded by JOEP v2.

Do not use this document for new scoring-engine implementation.

Authoritative sources:
- JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md
- JOEP-v2-GATES-ICP-ROUTING.md
- JOEP-v2-IMPLEMENTATION-PLAN.md

---

# Feature Extraction Guide

The `FeatureExtractionService` reads from live operational tables (`companies`, `company_enrichments`) and converts them into standardized key-value pairs (`feature_snapshots`).

## Immutability Rule
Once a snapshot is generated and a score is calculated, that snapshot represents the frozen state of the company at the exact time of scoring. This guarantees that historical scores can always be perfectly audited against the exact data used to generate them, avoiding retroactive data corruption.
