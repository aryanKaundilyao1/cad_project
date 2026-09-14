# DEPRECATED

This document is superseded by JOEP v2.

Do not use this document for new scoring-engine implementation.

Authoritative sources:
- JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md
- JOEP-v2-GATES-ICP-ROUTING.md
- JOEP-v2-IMPLEMENTATION-PLAN.md

---

# Matching Framework

## Heuristics (Phase 3C)
To adhere to the requirement of NOT using machine learning, the matching framework relies on deterministic logic:

1. **Exact Match (100% Confidence)**: The incoming string exactly matches the primary `name` or a known `alias_name`.
2. **Substring Match (80% Confidence)**: The incoming string is a substring of the candidate, or the candidate is a substring of the incoming string (e.g. "ABC Steel" vs "ABC Steel Pvt Ltd").
3. **Loose Match (50% Confidence)**: Fallback for basic SQL `ILIKE` matches that don't satisfy the substring constraints.

## Thresholds
- **> 95%**: Auto-merge to the candidate.
- **70 - 95%**: Create a temporary placeholder company (with 50% confidence status) and send the record to the `entity_review_queue`.
- **< 70%**: Create a brand new canonical company.
