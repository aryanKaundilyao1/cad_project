# DEPRECATED

This document is superseded by JOEP v2.

Do not use this document for new scoring-engine implementation.

Authoritative sources:
- JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md
- JOEP-v2-GATES-ICP-ROUTING.md
- JOEP-v2-IMPLEMENTATION-PLAN.md

---

# Fit Scoring Engine

The Fit Score is one of the 4 pillars of the Opportunity Score. It maxes out at 25 points.

## Components
- **Industry Match (0-6)**: Does the company operate in a relevant sector?
- **Size Match (0-6)**: Is the company large/small enough to be a viable customer?
- **Geo Match (0-5)**: Are they in a serviceable region?
- **Tech Compat (0-5)**: Do they run complementary software/hardware?
- **Financial Health (0-3)**: Are they stable enough to buy?

Implemented via `FitScoreService.ts`.
