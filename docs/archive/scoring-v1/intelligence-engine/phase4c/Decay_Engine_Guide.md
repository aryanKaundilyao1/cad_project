# DEPRECATED

This document is superseded by JOEP v2.

Do not use this document for new scoring-engine implementation.

Authoritative sources:
- JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md
- JOEP-v2-GATES-ICP-ROUTING.md
- JOEP-v2-IMPLEMENTATION-PLAN.md

---

# Decay Engine Guide

## Purpose
The Decay Engine ensures that the Opportunity Score remains relevant by penalizing accounts where signals have aged and no new activity has been recorded. This prevents a "high intent" account from remaining high indefinitely without fresh engagement.

## Formula
`DecayFactor(t) = max(0.1, e^(–λ × days_since_last_signal))`

- **λ (Lambda)** is the decay rate. We default to `0.01` for general master scoring, which equates to a half-life of approximately 70 days.
- **days_since_last_signal** is calculated by looking at the most recent interaction or trigger event.
- **Floor**: The multiplier floors at `0.10` so that previously high-scoring accounts do not decay completely to 0, ensuring they are still ranked appropriately amongst "cold" accounts.
