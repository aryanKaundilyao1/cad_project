# DEPRECATED

This document is superseded by JOEP v2.

Do not use this document for new scoring-engine implementation.

Authoritative sources:
- JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md
- JOEP-v2-GATES-ICP-ROUTING.md
- JOEP-v2-IMPLEMENTATION-PLAN.md

---

# Evidence Extraction Framework (Phase 5C)

## Philosophy
In earlier phases, JAS CONNECT treated all signals ("Tender Released", "Website Visit") as heuristic weights assigned by a human administrator. The Evidence Extraction framework mathematically proves *which* signals actually correlate with closed-won revenue, removing human bias.

## Core Metrics

### 1. Weight of Evidence (WOE)
WOE measures the predictive power of an independent variable in relation to the dependent variable.
`WOE = ln( P(signal | Won) / P(signal | Lost) )`

- **WOE > 0**: The signal is more prevalent in Won outcomes (Positive Buying Signal).
- **WOE < 0**: The signal is more prevalent in Lost outcomes (Negative Buying Signal).
- **WOE ≈ 0**: The signal occurs equally in both, providing no predictive value.

*Laplace Smoothing (+0.5)* is used to prevent zero-division errors for new signals.

### 2. Information Value (IV)
While WOE tells us the direction of the signal, IV tells us the absolute strength of the signal across the entire dataset.
`IV = (P(signal | Won) - P(signal | Lost)) * WOE`

**Classifications:**
- `< 0.02`: Not Predictive
- `0.02 - 0.1`: Weak
- `0.1 - 0.3`: Medium
- `0.3 - 0.5`: Strong
- `> 0.5`: Very Strong

### 3. Bayes Factor
The Bayes Factor is the raw odds ratio without logarithmic transformation, which is heavily utilized in true Bayesian updating engines (planned for Phase 5D).
`BF = P(signal | Won) / P(signal | Lost)`

## Data Persistence
- `signal_performance_metrics`: The live aggregated state.
- `evidence_snapshots`: An immutable archive. ML models must NEVER train on the live `signal_performance_metrics` table because it causes "Target Leakage". They must train on the `evidence_snapshots` that existed at the exact moment the prediction was made.
