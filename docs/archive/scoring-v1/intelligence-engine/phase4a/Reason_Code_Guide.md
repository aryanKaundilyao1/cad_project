# DEPRECATED

This document is superseded by JOEP v2.

Do not use this document for new scoring-engine implementation.

Authoritative sources:
- JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md
- JOEP-v2-GATES-ICP-ROUTING.md
- JOEP-v2-IMPLEMENTATION-PLAN.md

---

# Reason Code Guide

Scores must be human-readable. `FitReasonCodeGenerator.ts` produces explicit text strings for every component evaluated.

## Structure
- `reason_type`: e.g., 'industry', 'size'
- `reason_category`: 'Positive', 'Neutral', 'Negative'
- `reason_text`: The human-readable string.
- `contribution_value`: The actual points added.

These are stored in `score_reason_codes` linked to the primary score.
