# DEPRECATED

This document is superseded by JOEP v2.

Do not use this document for new scoring-engine implementation.

Authoritative sources:
- JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md
- JOEP-v2-GATES-ICP-ROUTING.md
- JOEP-v2-IMPLEMENTATION-PLAN.md

---

# Vertical Weight Manager (Phase 4D)

## Overview
Because different industries have different buying patterns, the Intelligence Engine uses **Vertical Weighting** to modify the impact of Fit, Intent, Timing, and Engagement on the final Master Score.

In Phase 4C, these were hardcoded. Phase 4D introduces a dynamic configuration layer stored in the database.

## Architecture

1. **Database Table (`vertical_weight_profiles`)**
   - `industry`: The target sector (e.g., "construction", "manufacturing")
   - `fit_weight`: 0.0 to 1.0
   - `intent_weight`: 0.0 to 1.0
   - `timing_weight`: 0.0 to 1.0
   - `engagement_weight`: 0.0 to 1.0
   - *Constraint:* The four weights MUST sum to exactly 1.00.

2. **WeightManagerService**
   - Handles fetching and validating profiles.

3. **Admin UI (`/admin/scoring/weights`)**
   - Provides a live editor to adjust these weights dynamically.
   - Includes validation to prevent saving if weights do not sum to 1.0.

## Fallback Mechanism
If the `vertical_weight_profiles` table is empty or missing (due to pending migrations), the `VerticalWeightEngine.ts` gracefully degrades to the hardcoded profiles defined in Phase 4C.
