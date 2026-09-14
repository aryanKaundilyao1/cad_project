# DEPRECATED

This document is superseded by JOEP v2.

Do not use this document for new scoring-engine implementation.

Authoritative sources:
- JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md
- JOEP-v2-GATES-ICP-ROUTING.md
- JOEP-v2-IMPLEMENTATION-PLAN.md

---

1. Mathematical Framework for Purchase Likelihood Prediction
1.1 The Core Object
For a company c and a product p, we want:
P(Buy_p = 1 | X_c, t)
where X_c is the full feature vector for company c (firmographic, behavioral, event-based) and t is the time horizon (30/90/180 days). This is a binary classification problem with a probabilistic (not just ordinal) output, which is what separates a real prediction engine from a scorecard.
1.2 Three Complementary Modeling Approaches (used together, not either/or)
Layer	Method	Role
Layer 1 — Prior	Base-rate / Bayesian prior	"Before looking at this specific company, what fraction of companies like it buy this product in a given period?"
Layer 2 — Evidence Aggregation	Naive Bayes log-odds (Weight-of-Evidence) OR Logistic Regression / Gradient-Boosted Trees	"Given everything we observe about this company, how much does it shift the probability up or down?"
Layer 3 — Calibration	Isotonic/Platt calibration against historical closed-won/lost outcomes	"Turn the model's raw output into a true probability that matches observed conversion rates."
This three-layer structure is exactly how modern credit-risk and marketing-propensity systems are built (the same mathematical family as FICO-style scorecards), and it is far more defensible than a single black-box score because each layer is independently auditable.
1.3 Master Equation
P(Buy | X, t) = Calibrate( σ( logit_prior(p, industry, t) + Σᵢ wᵢ · fᵢ(Xᵢ) ) )

where:
  σ(z) = 1 / (1 + e^(–z))                        // logistic (sigmoid) function
  logit_prior = ln( P₀ / (1 – P₀) )                // prior log-odds, P₀ = base purchase rate
  fᵢ(Xᵢ)      = transformed/normalized signal i    // e.g. Weight-of-Evidence transform
  wᵢ          = learned or expert-assigned weight for signal i
  Calibrate() = monotonic mapping fit on historical outcome data (Section 12 of the earlier
                 blueprint; repeated here in Section 14)
This is a generalized additive log-odds model. It is mathematically equivalent to logistic regression when fᵢ are linear transforms, and equivalent to a Naive Bayes classifier when fᵢ are Weight-of-Evidence transforms — both are special cases of the same equation, which is why we can run them in parallel and ensemble them (Section 4.4).
1.4 Why Log-Odds, Not Raw Probability, for Combination
Probabilities don't add linearly (0.6 + 0.6 ≠ 1.2, and doesn't mean anything). Log-odds do add linearly, which is the mathematical reason every serious scoring system (credit scoring, spam filtering, ad click-through prediction, 6sense-style intent scoring) works in log-odds space internally and only converts to probability at the very last step.
odds = P / (1 – P)
logit(P) = ln(odds)
Each new piece of evidence simply adds to the running log-odds total — this is the mechanism used in Section 4 (Bayesian updating) and Section 3 (weighted scoring).

3. Weighted Scoring Model
3.1 General Form
Score(0–100) = 100 × Σᵢ wᵢ · norm(xᵢ)         subject to  Σᵢ wᵢ = 1,  0 ≤ norm(xᵢ) ≤ 1

norm(xᵢ) = (xᵢ – min(xᵢ)) / (max(xᵢ) – min(xᵢ))      // min-max normalization, or
norm(xᵢ) = Φ((xᵢ – μᵢ)/σᵢ)                            // percentile-rank normalization via
                                                        // standard normal CDF (more robust to outliers)
3.2 Default Weight Structure (before product-specific tuning — see Section 11)
Category	Weight
Direct sourcing signals (Tier 1)	0.30
Behavioral/intent signals (Tier 2)	0.25
Trigger events (Tier 3)	0.20
Firmographic fit	0.15
Structural/contextual (Tier 4)	0.10
Weights are not arbitrary — Section 4.5 shows how to derive them empirically (Information Value / logistic coefficients) rather than guess them.
3.3 Deriving Weights Empirically — Information Value (IV)
For each candidate feature, compute its predictive power using the same Weight-of-Evidence framework used in credit scoring:
WOE_bin = ln( (%Good_bin) / (%Bad_bin) )     // "Good" = purchased, "Bad" = did not purchase

IV_feature = Σ_bins ( %Good_bin – %Bad_bin ) × WOE_bin
IV value	Interpretation
< 0.02	Not predictive — drop the feature
0.02 – 0.10	Weak predictor
0.10 – 0.30	Medium predictor
0.30 – 0.50	Strong predictor
> 0.50	Suspiciously strong — check for leakage
Feature weights wᵢ are then set proportional to each feature's IV (normalized to sum to 1), giving you a data-derived weighting scheme instead of a hand-tuned one, which should replace the default table in 3.2 once ~200+ labeled outcomes exist.

4. Bayesian and Probabilistic Methods
4.1 Naive Bayes Formulation
P(Buy=1 | S₁,...,Sₙ) = P(Buy=1) · Πᵢ P(Sᵢ|Buy=1)  /  P(S₁,...,Sₙ)

Equivalently, in log-odds form (this is the operational version):

logit(P) = logit(P₀) + Σᵢ ln( P(Sᵢ|Buy=1) / P(Sᵢ|Buy=0) )
                          └───────────────┬───────────────┘
                              Weight of Evidence for signal i (WOEᵢ)
Each signal independently pushes the log-odds up or down. This is fast, interpretable, and works well even with modest data — ideal for an MVP before you have enough volume for a full ML model.
4.2 Sequential Bayesian Updating
As new signals arrive over time (e.g., a company surges on a topic this week, then posts a relevant job next week), update the posterior sequentially rather than recomputing from scratch:
Posterior_odds(t) = Prior_odds × BF₁ × BF₂ × ... × BFₜ

where Bayes Factor  BFᵢ = P(Sᵢ | Buy=1) / P(Sᵢ | Buy=0)
This gives you a live, streaming probability that updates in real time as new events are ingested — exactly the pattern 6sense uses with its daily-refreshed intent scores.
4.4 Ensemble: Combining Naive Bayes + Logistic Regression/GBM
P_final = w_NB · P_NaiveBayes + w_LR · P_Logistic + w_GBM · P_GBM

weights (w_NB, w_LR, w_GBM) fit via stacked generalization (meta-learner logistic
regression trained on out-of-fold predictions of each base model)
* Naive Bayes handles sparse/early-stage data well and is fully interpretable.
* Logistic Regression captures linear interactions with L1/L2 regularization for feature selection.
* Gradient-Boosted Trees (XGBoost/LightGBM) capture non-linear interactions (e.g., "funding round AND relevant job posting together matter far more than either alone") once sufficient data volume exists (typically 500+ labeled outcomes).
Use Naive Bayes/logistic alone for the first 6–12 months (cold start), and introduce GBM once labeled data supports it, always keeping the interpretable models as an explainability fallback.
4.5 Hierarchical Bayesian Model (Industry/Geography Pooling)
For thin-data segments (e.g., a niche product in a small country), use partial pooling so that a specific industry/geography borrows statistical strength from the broader population instead of overfitting to a handful of examples:
θ_industry,geo ~ Beta(α_global, β_global)      // global prior
θ_c ~ Beta(α_industry,geo, β_industry,geo)      // company-level posterior shrinks toward
                                                  // its segment's estimate, which shrinks
                                                  // toward the global estimate
This prevents absurd swings (e.g., "100% likely to buy" from a single positive signal in a 3-company segment) — a known failure mode of naive segment-level scoring.

14. Combining All Signals Into a Final Purchase Probability Score
14.1 Full Pipeline
STEP 1 — Prior:
  P₀ = BaseRate(industry, product, geography, time_window)
  logit₀ = ln(P₀ / (1–P₀))

STEP 2 — Evidence aggregation (per company, per product):
  logit_raw = logit₀ + Σᵢ WOEᵢ(Xᵢ) × wᵢ(product)
     — wᵢ(product) pulled from the Product Signal Mapping Engine (Section 11)
     — WOEᵢ derived empirically (Section 3.3) or expert-seeded pre-launch

STEP 3 — Apply negative-signal suppressors (multiplicative, in probability space
          after converting back — see 14.2):
  P_raw = σ(logit_raw)
  P_suppressed = P_raw × NegativeMultiplier   (Section 6, prior blueprint)

STEP 4 — Ensemble blend (once ML models are trained):
  P_ensemble = w_NB·P_NaiveBayes + w_LR·P_Logistic + w_GBM·P_GBM

STEP 5 — Calibration:
  P_final = IsotonicCalibration(P_ensemble)   // fit on historical closed-won/lost outcomes
                                                // guarantees P_final matches true observed
                                                // conversion rates at each score band

STEP 6 — Confidence:
  Confidence = f(NumberOfCorroboratingSignals, SourceReliability, SignalRecency,
                  CredibleIntervalWidth from Beta-Binomial model, Section 4.3)

STEP 7 — Output:
  {
    "company": "...",
    "product": "...",
    "purchase_probability": 0.74,
    "confidence": 0.82,
    "credible_interval_95": [0.61, 0.85],
    "top_drivers": [...],           // ranked by |WOEᵢ × wᵢ| contribution
    "tier": "T1",
    "recommended_window": "90-day"
  }

## 15. Worked Numerical Example

**Product = Industrial Machinery. Company = "Company X," a mid-size auto-parts manufacturer.**

| Signal | Observed value | WOE | Weight (product-specific) | Contribution (WOE×w) |
|---|---|---|---|---|
| Capex guidance (recent earnings call: +18% capex YoY) | Yes | +1.8 | 0.20 | +0.36 |
| Machinery import record (capital goods HS code, last 60 days) | Yes | +2.1 | 0.25 | +0.53 |
| New production line announcement | Yes | +1.5 | 0.20 | +0.30 |
| Machine operator job postings (4 open roles) | Yes | +1.0 | 0.10 | +0.10 |
| PLI scheme enrollment | No | –0.3 | 0.10 | –0.03 |
| Industrial land purchase (last 12 months) | No | 0.0 | 0.10 | 0.00 |
| Equipment age proxy | Unknown | 0.0 | 0.05 | 0.00 |

Prior: P₀ = 0.06 (base rate for mid-size manufacturers buying industrial machinery in a 90-day window) logit₀ = ln(0.06/0.94) = –2.75
logit_raw = –2.75 + (0.36+0.53+0.30+0.10–0.03+0+0) = –2.75 + 1.26 = –1.49
P_raw = σ(–1.49) = 1/(1+e^1.49) = 0.184 → 18.4%
Negative multiplier: none triggered → ×1.0 P_suppressed = 18.4%
After ensemble + isotonic calibration (illustrative): P_final ≈ 21%
Confidence: 5 of 7 signals observed and fresh (<60 days), 2 unknown/missing DataCompleteness ≈ 0.78, SourceReliability ≈ 0.85, RecencyFactor ≈ 0.9 Confidence ≈ 0.78 × 0.85 × 0.9 ≈ 0.60 (moderate confidence)
Output: 21% purchase probability, 90-day window, moderate confidence, driven primarily by machinery import activity and capex guidance.
This company would land in **T2 (Developing)** per the tiering logic — real signal, real trigger, but not yet at explicit-sourcing-action strength; worth nurture and monitoring rather than immediate hard sales push.

---
