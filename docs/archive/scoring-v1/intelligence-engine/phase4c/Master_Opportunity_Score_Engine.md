# DEPRECATED

This document is superseded by JOEP v2.

Do not use this document for new scoring-engine implementation.

Authoritative sources:
- JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md
- JOEP-v2-GATES-ICP-ROUTING.md
- JOEP-v2-IMPLEMENTATION-PLAN.md

---

# Master Opportunity Score Engine

## Purpose
The Master Opportunity Score Engine is the final orchestrator. It aggregates the 4 pillar scores (Fit, Intent, Timing, Engagement), applies vertical industry weights, and then scales the output by a Decay Factor and Negative Multipliers.

## Architecture
1. **Vertical Weight Engine**: Adjusts the importance of each pillar based on the target company's industry.
2. **Decay Engine**: Reduces the final score as signals age over time.
3. **Negative Signal Engine**: Applies a penalty multiplier when negative events occur (competitor signed, layoffs, etc).

## Master Formula
`OpportunityScore = [ (Fit_raw/25)×W_fit + (Intent_raw/30)×W_intent + (Timing_raw/25)×W_timing + (Engagement_raw/20)×W_engage ] × 100 × DecayFactor × NegativeMultiplier`

The base sum computes to a raw score out of 100 before decay and negative multipliers are applied.

## Auditability
Every run of the engine is stored in `opportunity_score_history` for full tracking, and an entry is placed in `opportunity_audit_log` noting the delta and the trigger source (e.g., 'Manual Rebuild', 'Nightly Cron').
