# DEPRECATED

This document is superseded by JOEP v2.

Do not use this document for new scoring-engine implementation.

Authoritative sources:
- JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md
- JOEP-v2-GATES-ICP-ROUTING.md
- JOEP-v2-IMPLEMENTATION-PLAN.md

---

# Eligibility Framework

## Concept
Eligibility determines if a company should be evaluated for a specific product. This is *not* lead scoring; it is simply categorical relevance.

## Service (`ProductEligibilityService.ts`)
1. Checks `archetype_matches` for the company.
2. Finds all products mapped to those archetypes via `product_archetype_mapping`.
3. Upserts records into `company_product_matches` with a reason code (e.g., `ARCHETYPE_MATCH`).

This allows the UI (`AdminProductIntelligence.tsx`) to quickly query which companies qualify for a specific product and then overlay the relevant signal timeline.
