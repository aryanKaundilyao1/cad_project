# DEPRECATED

This document is superseded by JOEP v2.

Do not use this document for new scoring-engine implementation.

Authoritative sources:
- JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md
- JOEP-v2-GATES-ICP-ROUTING.md
- JOEP-v2-IMPLEMENTATION-PLAN.md

---

0. System Architecture Overview
┌─────────────────┐   ┌──────────────────┐   ┌───────────────────┐
│  SIGNAL LAYER    │──▶│  ENRICHMENT LAYER │──▶│  SCORING ENGINE    │
│ (raw external    │   │ (normalized       │   │ (Fit × Intent ×    │
│  + first-party   │   │  company/contact  │   │  Timing × Engage-  │
│  data feeds)     │   │  profile objects) │   │  ment = Opp Score) │
└─────────────────┘   └──────────────────┘   └─────────┬─────────┘
                                                          ▼
                                              ┌───────────────────┐
                                              │ CLASSIFICATION &   │
                                              │ EXPLAINABILITY     │
                                              │ (T1/T2/T3, reason  │
                                              │  codes, % likeli-  │
                                              │  hood, window)     │
                                              └───────────────────┘
Every enterprise platform (6sense, Bombora, ZoomInfo, Apollo, Demandbase) is fundamentally computing the same equation in different clothing:
Opportunity Propensity = Fit (will they ever buy from us) × Intent (are they actively researching) × Timing (is it happening now) × Engagement (are the right people involved) — filtered through Recency/Decay
JAS CONNECT should compute all four dimensions separately and transparently, then combine them into one explainable 100-point score. Never collapse them into a single black-box number without exposing the sub-scores — this is the single biggest complaint enterprise buyers have about 6sense/Demandbase ("black box you can't audit").

12. Calculating Purchase Likelihood Percentage
The 100-point score is an ordinal ranking signal; converting it to a calibrated probability requires mapping it against historical outcomes — this is what separates a real predictive system from a scorecard.
12.1 Recommended Method: Logistic Calibration on Historical Won/Lost Data
P(purchase | Score, Vertical, Window) = 1 / (1 + e^(–(β0 + β1×OpportunityScore
                                          + β2×TimingWindowIndicator + β3×VerticalDummy)))
* Fit this logistic regression (or gradient-boosted calibration curve, e.g., isotonic regression) on your own closed-won/closed-lost historical accounts, using the OpportunityScore and its components as features.
* Re-calibrate quarterly as more outcome data accumulates (this is exactly why 6sense emphasizes training on "over 10 years" of observed win/loss patterns — calibration quality is a function of data volume and recency).
* Segment the calibration by vertical (Section 9) and by tier, since the same raw score of "65" may convert at a very different rate in Construction (trigger-driven, lumpy) vs. Procurement (committee-driven, slower but more predictable).
12.2 Cold-Start Method (before sufficient historical data exists)
Until sufficient labeled outcome data exists, use an expert-weighted heuristic mapping as a placeholder, then replace with the logistic model once ≥200–300 closed opportunities are logged:
Score Range	Heuristic Likelihood	Basis
90–100	65–80%	Explicit sourcing action + high fit + multi-stakeholder
75–89	45–65%	T1 without explicit sourcing action
60–74	25–45%	Strong T2
45–59	12–25%	Weak T2
30–44	5–12%	T3
Below 30	<5%	Unqualified
12.3 Window-Adjusted Probability
Because timing matters as much as magnitude, output probability per window, not just one number:
P_30day = P(purchase | Score) × P(window=30day | signals present)
P_90day = P(purchase | Score) × P(window=90day | signals present)
P_180day = P(purchase | Score) × P(window=180day | signals present)
where the window-conditional probabilities come from Section 5's signal mapping (e.g., presence of an explicit RFP shifts almost all probability mass into the 30-day bucket; a single early-stage topic surge shifts it into the 180-day bucket).
12.4 Continuous Recalibration Loop
Every closed deal (won or lost) → logged with its OpportunityScore snapshot at time of
first contact → feeds back into the logistic/isotonic calibration model →
model re-trained weekly/monthly → calibration curve updated →
Brier score / AUC tracked as the platform's own accuracy KPI
This closed feedback loop is what allows JAS CONNECT to eventually claim a measured, defensible accuracy percentage (e.g., "accounts scored 75+ convert at 58% within 90 days, validated across N=1,200 closed opportunities") rather than a marketing claim — this is precisely the credibility gap independent reviews point to when critiquing black-box intent platforms.

## 16. System Architecture

┌────────────────────────────────────────────────────────────────────┐ │ SIGNAL INGESTION LAYER │ │ Government portals · Customs/trade data · Job boards · Permits · │ │ Press/news APIs · Company websites · Review sites · Social · │ │ Funding databases · Credit bureaus │ └───────────────────────────────┬───────────────────────────────────┘ ▼ ┌────────────────────────────────────────────────────────────────────┐ │ ENTITY RESOLUTION & ENRICHMENT │ │ Company deduplication/matching · Firmographic enrichment · │ │ Event tagging (permit, hire, import, tender, etc.) · │ │ Timestamped, immutable signal event store │ └───────────────────────────────┬───────────────────────────────────┘ ▼ ┌────────────────────────────────────────────────────────────────────┐ │ PRODUCT SIGNAL MAPPING ENGINE (Sec. 11) │ │ Product → buyer archetypes → relevant signal set + weights │ │ (config-driven, expert-seeded + IV-refined per product) │ └───────────────────────────────┬───────────────────────────────────┘ ▼ ┌────────────────────────────────────────────────────────────────────┐ │ SCORING ENGINE │ │ Layer 1: Bayesian prior (base rate by industry/geo/product) │ │ Layer 2: Naive Bayes (WOE) + Logistic Regression + GBM ensemble │ │ Layer 3: Isotonic/Platt calibration against historical outcomes │ │ Confidence engine: Beta-Binomial credible intervals + data │ │ completeness/recency/source-reliability scoring │ └───────────────────────────────┬───────────────────────────────────┘ ▼ ┌────────────────────────────────────────────────────────────────────┐ │ EXPLAINABILITY & RANKING LAYER │ │ Top-driver attribution (per-signal contribution) · Tiering (T1/T2/ │ │ T3) · Top-1% percentile ranking · Expected-Value re-ranking │ └───────────────────────────────┬───────────────────────────────────┘ ▼ ┌────────────────────────────────────────────────────────────────────┐ │ FEEDBACK / RETRAINING LOOP │ │ Closed-won/lost outcomes logged → feed IV recalculation, logistic/ │ │ GBM retraining, and calibration curve updates (weekly/monthly job) │ └────────────────────────────────────────────────────────────────────┘
### Key Engineering Principles

Implementation Notes for Engineering

