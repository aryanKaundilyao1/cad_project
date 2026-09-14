# DEPRECATED

This document is superseded by JOEP v2.

Do not use this document for new scoring-engine implementation.

Authoritative sources:
- JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md
- JOEP-v2-GATES-ICP-ROUTING.md
- JOEP-v2-IMPLEMENTATION-PLAN.md

---

# Phase 5B: Cold Start Probability Engine

## Overview
Phase 5B transitions JAS CONNECT from abstract "Opportunity Scores" to tangible "Purchase Probabilities". Because we do not yet have enough closed outcomes (started in Phase 5A) to run ML calibration, we use a deterministic **Cold Start Engine**.

## Architecture
1. **Cold Start Mapping**: A linear interpolation algorithm in `ColdStartProbabilityService` that securely maps an Opportunity Score to a base Probability Percentage.
2. **Window Engine**: Distributes the base probability across 30, 90, and 180-day buckets by looking at the underlying *Timing Score*.
3. **Driver Engine**: Converts mathematical heuristics into human-readable text (e.g. "Immediate Trigger Event Detected").
4. **Data Persistence**: 
   - `purchase_probabilities`: The live table.
   - `probability_history`: An immutable ledger of all probability changes.
   - `probability_snapshot_archive`: Frozen ML target snapshots.
   - `probability_versions`: Allows future seamless swapping from `v1.0 Cold Start` to `v2.0 Logistic Regression`.

## Why Deterministic?
We must prevent the system from returning undefined or heavily biased predictions while building the Truth Dataset. By codifying human intuition (heuristic mapping) first, the business receives immediate value, and the data pipeline is primed exactly as if an ML model were already driving it.
