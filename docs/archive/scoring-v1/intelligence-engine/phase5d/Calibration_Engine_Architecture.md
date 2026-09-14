# DEPRECATED

This document is superseded by JOEP v2.

Do not use this document for new scoring-engine implementation.

Authoritative sources:
- JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md
- JOEP-v2-GATES-ICP-ROUTING.md
- JOEP-v2-IMPLEMENTATION-PLAN.md

---

# Probability Calibration Engine (Phase 5D)

## Philosophy
Without calibration, a "70% probability" is just an abstract score. It might actually mean the opportunity converts 50% of the time or 90% of the time, leading to disastrous revenue forecasting.
The Probability Calibration Engine mathematically guarantees that predicted probabilities map directly to real-world conversion rates.

## Calibration Methods

### 1. Platt Scaling
Uses Logistic Regression to fit a sigmoid curve over raw probabilities. 
Formula: `P_cal = 1 / (1 + exp(A * raw_prob + B))`
- **Best for:** Parametric calibration where the underlying model (e.g., Naive Bayes or SVM) produces S-shaped distortion.

### 2. Isotonic Regression
Uses a non-parametric, monotonic step-function (PAVA algorithm) to map probabilities.
- **Best for:** Complex non-linear models (like Random Forest or XGBoost) where Platt Scaling is too rigid.

## Evaluation Metrics (Reliability)

### Brier Score
Mean Squared Error for probability predictions. Range: `[0, 1]`.
- **0.00:** Perfect accuracy.
- **0.25:** Equivalent to random guessing for a 50/50 binary outcome.
- **Closer to 0 is better.**

### Log Loss (Cross Entropy)
Penalizes the system heavily for being extremely confident and wrong (e.g., predicting 99% probability, but losing the deal).

### ECE (Expected Calibration Error)
Buckets predictions (e.g., all predictions between 60%-70%) and compares the average predicted probability in that bucket to the actual conversion rate of that bucket.

## Target Leakage Prevention
Models are trained ONLY on `evidence_snapshots` and `probability_snapshot_archive`. Training a calibration model on a live `opportunity_score` is strictly prohibited, as the live score contains information from the future (Target Leakage).
