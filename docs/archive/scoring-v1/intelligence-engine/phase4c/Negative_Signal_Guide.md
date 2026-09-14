# DEPRECATED

This document is superseded by JOEP v2.

Do not use this document for new scoring-engine implementation.

Authoritative sources:
- JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md
- JOEP-v2-GATES-ICP-ROUTING.md
- JOEP-v2-IMPLEMENTATION-PLAN.md

---

# Negative Signal Guide

## Purpose
The Negative Signal Engine applies a cascading penalty multiplier when adverse events are detected for an account. Unlike standard decay (which drops smoothly over time), negative signals cause sharp, immediate drops in the final Opportunity Score.

## Multipliers

| Signal Type | Multiplier | Description |
|-------------|------------|-------------|
| Competitor Signed | `0.60` (-40%) | The company has recently signed a contract with an active competitor. |
| Layoffs / Hiring Freeze | `0.75` (-25%) | Detected layoffs or a hiring freeze in relevant departments. |
| Financial Distress | `0.80` (-20%) | Detected poor financial health, credit downgrades, or similar indicators. |
| Stagnant | `0.85` (-15%) | No engagement detected in over 180 days. |

## Application
Multipliers stack multiplicatively. For example, if a company has a hiring freeze (`0.75`) and has been stagnant for >180 days (`0.85`), the total multiplier applied is `0.75 × 0.85 = 0.6375`. 

The final penalty multiplier has a hard floor of `0.10`.
