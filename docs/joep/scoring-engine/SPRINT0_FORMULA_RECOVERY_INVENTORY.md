# Sprint 0: Formula Recovery Inventory

This document catalogs every mathematical formula found in the repository archive and maps its compatibility with JOEP v2.

## Found Formulas (from `scoring-v1` archive)

### 1. Master Opportunity Score (v1)
* **SOURCE FILE:** `docs/archive/scoring-v1/intelligence-engine/opportunity_intelligence_platform.md`
* **SECTION:** 8.3 Formula
* **EXACT EQUATION:** `OpportunityScore = RawScore × DecayFactor(t) × NegativeMultiplier`
  * `RawScore = FitScore + IntentScore + TimingScore + EngagementScore` (0-100)
* **PURPOSE:** Original linear 100-point score.
* **STATUS:** DEPRECATED / OLDER VERSION
* **JOEP V2 COMPATIBILITY:** **REQUIRES V2 ADAPTATION**. JOEP v2 separates Opportunity Quality from Evidence Confidence, and does not use a linear compensatory 100-point sum for completely different pillars.

### 2. Exponential Decay (v1)
* **SOURCE FILE:** `docs/archive/scoring-v1/intelligence-engine/opportunity_intelligence_platform.md`
* **SECTION:** 8.3 Formula
* **EXACT EQUATION:** `DecayFactor(t) = e^(–λ × days_since_last_signal)`
* **PARAMETERS:** `λ = 0.05` (14-day half-life), `λ = 0.01` (70-day half-life).
* **STATUS:** VERIFIED ORIGINAL (Math conceptually aligns with v2).
* **JOEP V2 COMPATIBILITY:** PASS. Needs signal-family specific `λ` parameters which are missing.

### 3. Log-Odds Naive Bayes (v1 ML approach)
* **SOURCE FILE:** `docs/archive/scoring-v1/purchase_likelihood_prediction_engine.md`
* **SECTION:** 4.1 Naive Bayes Formulation
* **EXACT EQUATION:** `logit(P) = logit(P₀) + Σᵢ ln( P(Sᵢ|Buy=1) / P(Sᵢ|Buy=0) )`
* **PURPOSE:** Probability engine for likelihood to buy.
* **STATUS:** OLDER VERSION (Predictive ML model).
* **JOEP V2 COMPATIBILITY:** This is a statistical model (v2 maturity), not the deterministic JOEP v2 heuristic engine (v0).

### 4. Beta-Binomial Confidence (v1)
* **SOURCE FILE:** `docs/archive/scoring-v1/purchase_likelihood_prediction_engine.md`
* **SECTION:** 14.2 Confidence Calculation
* **EXACT EQUATION:** `Confidence = DataCompleteness × SourceReliability × RecencyFactor × (1 – IntervalWidthPenalty)`
* **STATUS:** VERIFIED ORIGINAL.
* **JOEP V2 COMPATIBILITY:** **PASS**. This correctly separates Confidence from Probability/Quality.

## Missing Formulas (JOEP v2 Specific)
The authoritative JOEP v2 documentation references `F1` through `F12` and specific missing-data handling logic. **None of these F1-F12 equations exist in the repository.**

* **F1-F12:** NOT FOUND.
* **Expected Value (Commercial Value):** NOT FOUND.
* **Risk-Adjusted Sales Priority Ranking:** NOT FOUND.
