# DEPRECATED

This document is superseded by JOEP v2.

Do not use this document for new scoring-engine implementation.

Authoritative sources:
- JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md
- JOEP-v2-GATES-ICP-ROUTING.md
- JOEP-v2-IMPLEMENTATION-PLAN.md

---

# Opportunity Explorer Guide (Phase 4D)

## Overview
The Opportunity Explorer provides a "glass box" view into the internal workings of the JAS CONNECT Intelligence Engine. This allows administrators to audit, understand, and explain every generated score.

## Key Views

### 1. Analytics Dashboard (`/admin/scoring/analytics`)
Provides macro-level aggregations:
- Average scores across all 4 pillars.
- Average Master Opportunity Score.
- Top Opportunities Leaderboard.

### 2. Opportunity Profile (`/admin/scoring/company/:id`)
The micro-level deep dive for a single company:
- **Opportunity Timeline:** A line chart plotting historical score changes from the `opportunity_score_history` table.
- **Score Breakdown:** A matrix of Fit, Intent, Timing, and Engagement scores per product.
- **Reason Code Explorer:** A flattened, consolidated list of explainability points, categorized as Positive (Green), Negative (Red), or Neutral (Blue).

### 3. Rebuild Center (`/admin/scoring/rebuild`)
Provides manual controls to trigger the `MasterOpportunityScoreEngine.calculateOpportunityScore()` pipeline.
- Bulk triggers regenerate feature snapshots and push updates to the historical timelines.

### 4. Audit Center (`/admin/scoring/audit`)
Tracks the `old_score` to `new_score` deltas, isolating exactly what trigger (e.g., "Fit Recalculation", "Intent Signal Detected") caused the change.
