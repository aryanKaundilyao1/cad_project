# DEPRECATED

This document is superseded by JOEP v2.

Do not use this document for new scoring-engine implementation.

Authoritative sources:
- JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md
- JOEP-v2-GATES-ICP-ROUTING.md
- JOEP-v2-IMPLEMENTATION-PLAN.md

---

# Entity Resolution Architecture

## Concept
The Entity Resolution layer ensures that no matter where data comes from (a CRM, a Government Tender API, a CSV upload), it attaches to a single "Canonical Company".

## Core Components
1. **`EntityResolver`**: The entry point for incoming records. It calls the Matching Engine to get candidates.
2. **`EntityCandidateService`**: Uses ILIKE/Text search across the `companies` table and the `company_aliases` table to fetch possible candidates.
3. **`EntityMatchingEngine`**: Scores the candidates against the incoming record.
4. **`EntityReviewQueue`**: Stores records that scored between 70-95% confidence for manual human review.
5. **`EntityMergeEngine`**: Handles consolidating two company IDs by migrating all child records (contacts, aliases, signals, enrichments) to the target ID and logging the action.
