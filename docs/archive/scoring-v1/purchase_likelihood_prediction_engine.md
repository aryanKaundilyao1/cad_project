# DEPRECATED

This document is superseded by JOEP v2.

Do not use this document for new scoring-engine implementation.

Authoritative sources:
- JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md
- JOEP-v2-GATES-ICP-ROUTING.md
- JOEP-v2-IMPLEMENTATION-PLAN.md

---

JAS CONNECT — Purchase Likelihood Prediction Engine
Mathematical & Statistical Blueprint (Product-Agnostic)
Objective: given any product/service category as input (PEB Buildings, Homeopathy Products, Industrial Machinery, or anything else), output a calibrated Likelihood-to-Buy score (0–100%) per company, with a confidence interval, fully explainable, and capable of isolating the top 1% of companies in a target universe.

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

2. Public Signals That Correlate With Buying Intent
Organized by evidentiary strength (highest correlation with actual purchase → lowest), consistent with the taxonomy validated in enterprise intent platforms (6sense's multi-dimensional buying-stage model, Bombora's topic-surge thresholding):
Tier 1 — Direct/Explicit (near-deterministic)
* Published tender/RFP/RFQ naming the product category
* Vendor registration or "request quote" submission
* Import shipment record for the exact product or its direct substitute
* Government contract award requiring the product
* Building/industrial permit requiring the product category (e.g., PEB → industrial shed permit)
Tier 2 — Strong Behavioral
* Sustained multi-topic research surge (category + adjacent topics)
* Spec-sheet / technical datasheet downloads
* Comparison/competitor research activity
* Multiple stakeholders engaging (buying-committee formation)
* Trade-show attendance/exhibition in the relevant category
Tier 3 — Trigger Events
* Funding round with stated capex/expansion use-of-funds
* New facility, plant, or warehouse announcement
* Executive hire into a relevant function
* M&A activity
* Capacity-expansion or capex disclosure (earnings calls, press)
Tier 4 — Structural/Contextual (slow-moving, still predictive)
* Industry growth trend (sector-level demand growth)
* Regulatory change creating new compliance need
* Company growth trajectory (revenue, headcount)
* Geographic/regional demand cycle (e.g., monsoon-linked construction demand)
Tier 5 — Suppressors (negative evidence)
* Recently signed with a competitor
* Financial distress / layoffs in relevant function
* No signal recency (stale data)

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
4.3 Beta-Binomial Model for Confidence Intervals
Treat each observed signal as a weighted "vote" toward Buy/Not-Buy, and model uncertainty using the Beta distribution (the conjugate prior for a binomial/Bernoulli process):
Prior:      θ ~ Beta(α₀, β₀)             // α₀, β₀ derived from historical base rate
Update:     θ | data ~ Beta(α₀ + Σ successes, β₀ + Σ failures)
Point est.: P̂ = α / (α + β)
Credible
interval:   [Beta⁻¹(0.025; α, β),  Beta⁻¹(0.975; α, β)]   // 95% credible interval
The width of this interval is the natural confidence metric (Section "Confidence Calculations" below) — few signals observed → wide interval → low confidence; many corroborating signals → narrow interval → high confidence, independent of whether the point estimate is high or low.
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

5. Company Growth Indicators
* Revenue growth rate (YoY, QoQ where available)
* Headcount growth rate (3/6/12-month LinkedIn trend)
* Office/facility count growth
* Funding velocity (rounds per year, amount raised)
* Website traffic growth (proxy for demand growth)
* Social media follower/engagement growth
* Patent filing rate (R&D intensity trend)
* New market entry frequency
Feature transform: Growth_score = clip( (CurrentValue – TrailingAvg)/TrailingAvg , –1, 3) then min-max normalized. Growth indicators mainly move the prior (Layer 1) — fast-growing companies have structurally higher base purchase rates across almost every product category.

6. Procurement Indicators
* Published RFP/RFQ/tender history and frequency
* Vendor management system or e-procurement platform in use (technographic)
* Procurement team size/structure (LinkedIn org signals)
* Existence of a formal Head of Procurement / CPO role
* Historical multi-vendor sourcing pattern (vs. single-source loyalty — indicates openness to new vendors)
* Public sector: registration on government e-procurement portals (SAM.gov, GeM, TED)
* Payment terms/credit behavior (proxy for procurement process maturity)

7. Expansion Indicators
* New facility/plant/warehouse announcements
* Building permits (new construction, expansion of existing footprint)
* Land purchase/lease records
* New market/geography entry announcements
* Increased import volumes (signals rising operational scale)
* Capacity expansion statements in press/earnings calls
* Franchise/distributor network growth
* New product line launches requiring new inputs/equipment

8. Hiring Indicators
* Job postings for roles directly tied to product use (e.g., "Machine Operator," "Site Engineer," "Procurement Manager – Pharma")
* Hiring velocity in operations/production/procurement functions specifically (not company-wide, which is noisier)
* New executive appointment in a relevant function
* Job posting language signals (mentions of specific tools/equipment/certifications required — direct technographic proxy)
* Time-to-fill trend (urgent postings often signal operational pressure/new project)
Feature transform: Hiring_score = (relevant_open_roles / total_open_roles) × recency_weight, isolating function-specific signal from generic company-wide hiring noise.

9. Vendor Registration Indicators
* Company appears on a vendor/supplier marketplace as a buyer (posted a sourcing request)
* Vendor onboarding form completions on procurement portals
* Registration on B2B marketplaces (IndiaMART, Alibaba, ThomasNet, Global Sources) with "buying" intent flags
* New vendor code creation events (visible via some government/PSU procurement transparency portals)
* Trade credit application activity (D&B, credit bureaus) — companies applying for trade credit lines are often onboarding new suppliers

10. Industry-Specific Indicators
Rather than a fixed list, this should be a configurable industry signal library, since predictive signals differ structurally by sector:
Industry	High-value industry-specific signals
Manufacturing	Capacity utilization trend, capex-to-revenue ratio, equipment age/replacement cycle, PLI/subsidy scheme enrollment
Construction/Infra	Project pipeline value, contractor tender wins, government infra budget allocation to the region
Healthcare/Pharma	Facility licensing (hospital/clinic bed count), drug/AYUSH license registrations, insurance panel additions
Retail/Distribution	Store count growth, franchise agreements, e-commerce channel expansion
Agriculture/Agri-processing	Seasonal cycle (sowing/harvest calendar), storage capacity expansion, government agri-subsidy program enrollment
Export-oriented	Export license status, FTA/trade-agreement eligibility, historical export volume trend
Each industry gets its own small set of industry-specific WOE-scored features layered on top of the universal signal set from Section 2.

11. Product-Specific Indicators — The "Product Signal Mapping Engine"
This is the mechanism that makes the system genuinely product-agnostic. For any input product p, the engine performs:
Step 1: Classify product into a Buyer Archetype set
         BuyerArchetypes(p) = {industries/company-types that plausibly need this product}

Step 2: For each archetype, attach a weighted indicator set
         SignalSet(p) = ⋃ archetype_signals(a) for a in BuyerArchetypes(p)

Step 3: Re-weight the universal model (Sections 3, 5–10) using product-specific
         multipliers derived from IV analysis on historical buyers of p (if available)
         or expert-seeded priors (if p is new/no history yet)
Worked Example 1 — Product = PEB Buildings (Pre-Engineered Steel Buildings)
Buyer archetypes: manufacturing plants, warehouses/logistics parks, cold storage, agri-processing units, auto/EV plants, poultry/dairy sheds, aircraft hangars, retail big-box stores.
Signal	Why it matters for PEB	Weight tier
Industrial land purchase/lease	Direct precursor to any PEB project	Tier 1
Building/factory permit filed (industrial category)	Near-deterministic near-term signal	Tier 1
Environmental clearance filing for new facility	Required before large industrial construction	Tier 1
EPC contractor tender/RFQ mentioning steel structure	Explicit sourcing signal	Tier 1
Capex/expansion announcement (new plant)	Strong trigger	Tier 2
Government industrial park land allotment	Strong trigger, especially in India/SE Asia	Tier 2
Warehouse/logistics job postings at a new location	Corroborating signal	Tier 3
Steel price sensitivity/timing (macro)	Structural/contextual	Tier 4
Worked Example 2 — Product = Homeopathy Products
Buyer archetypes: pharmacy chains, hospitals/clinics with alternative-medicine offerings, wholesale distributors, e-pharmacy platforms, wellness retail chains, AYUSH-licensed practitioners (India-specific regulatory category).
Signal	Why it matters	Weight tier
AYUSH/homeopathic drug license registration (new or renewal)	Direct regulatory proof of eligibility to sell/use	Tier 1
New pharmacy/clinic opening in relevant category	Direct expansion signal	Tier 1
Distributor appointment announcement	Explicit channel-buying signal	Tier 1
Wellness/alternative-medicine retail chain store-count growth	Expansion indicator	Tier 2
E-pharmacy platform category expansion (adding homeopathy vertical)	Strong trigger	Tier 2
Import/export of homeopathic raw materials (customs HS codes)	Direct trade-data evidence	Tier 1
Healthcare provider network growth (insurance panel additions)	Structural	Tier 4
Worked Example 3 — Product = Industrial Machinery
Buyer archetypes: any manufacturing plant expanding/upgrading production, new factory setups, companies replacing aging equipment.
Signal	Why it matters	Weight tier
Capex disclosure / earnings-call capex guidance	Direct budget evidence	Tier 1
Machinery import records (customs, capital-goods HS codes)	Near-direct evidence of active sourcing	Tier 1
New production line/plant announcement	Strong trigger	Tier 1
Machine operator / maintenance engineer job postings	Corroborating operational signal	Tier 2
PLI (production-linked incentive) or similar subsidy enrollment	Strong government-verified expansion signal	Tier 2
Equipment age (if determinable via asset filings)	Replacement-cycle proxy	Tier 3
Industrial land purchase	Precursor to new production capacity	Tier 2
Generalization rule for any new product: run the same 3-step process — identify plausible buyer archetypes (can be LLM-assisted: "what kinds of companies buy [product]?"), pull the relevant Tier-1/2/3 signals from the universal library that map to those archetypes, and seed initial weights from domain expert input until enough labeled purchase data allows IV-based re-weighting (Section 3.3).

12. Geographic Indicators
* Regional demand-cycle alignment (e.g., construction seasonality, agri-harvest cycles)
* Proximity to raw material sources / ports / logistics hubs (relevant for distribution/export)
* Regional regulatory environment (industrial policy incentives, SEZ/industrial-park status)
* Local competitor density (market saturation vs. white-space)
* Regional economic growth rate (state/province-level GDP growth)
* Infrastructure quality/connectivity (affects delivery feasibility, weighted for logistics-sensitive products)
* Currency/trade-corridor stability (for export-oriented products)
Feature transform: Geo_score = RegionalDemandIndex(region, product_category) × ProximityScore(company_location, relevant_infra)

13. Budget Indicators
* Public company: capex-to-revenue ratio, disclosed budget line items (10-K/annual report)
* Funding round size and stated use-of-funds
* Credit rating / borrowing capacity
* Historical spend pattern in adjacent categories (if visible via trade/import data)
* Government budget allocation (for public-sector buyers — infrastructure/health budgets by fiscal year)
* Fiscal year timing (budget-cycle proximity — many B2B budgets are "use it or lose it" near fiscal year-end)
* Insurance/asset-value filings (proxy for balance-sheet capacity)
Feature transform: Budget_score = min(1, EstimatedAvailableBudget / TypicalDealSize(product)) — this directly answers "can they afford this" as distinct from "do they want this," and should gate rather than just weight the final score for high-ticket products.

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
14.2 Confidence Calculation (explicit formula)
Confidence should answer: "How much do I trust this probability, independent of whether it's high or low?"
Confidence = DataCompleteness × SourceReliability × RecencyFactor × (1 – IntervalWidthPenalty)

DataCompleteness   = (Σ weights of observed signals) / (Σ weights of all possible signals for this product)
SourceReliability  = weighted avg of per-source trust scores (e.g., government tender data = 0.98,
                      inferred technographic detection = 0.6, social engagement = 0.5)
RecencyFactor       = e^(–λ_conf × days_since_most_recent_signal)
IntervalWidthPenalty = (CI_upper – CI_lower) from the Beta-Binomial posterior (Section 4.3),
                        normalized to [0,1]
A company with a high point-probability but only 1–2 stale signals should show high probability, low confidence — this distinction is essential and is missing from most simplistic scoring tools.
14.3 Identifying the Top 1%
Universe = all companies in target market/geography/industry for product p
Rank companies by P_final descending
Top1% = companies where P_final ≥ Percentile(P_final distribution, 99)
For go-to-market prioritization, also compute Expected Value rather than probability alone:
EV(company) = P_final(company) × EstimatedDealSize(company, product) × FitMultiplier
```//This re-ranks the top 1% by *revenue-weighted* likelihood, not just raw probability — a 60%-likely enterprise account can outrank a 90%-likely micro account.

---

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

## 16. System Architecture

┌────────────────────────────────────────────────────────────────────┐ │ SIGNAL INGESTION LAYER │ │ Government portals · Customs/trade data · Job boards · Permits · │ │ Press/news APIs · Company websites · Review sites · Social · │ │ Funding databases · Credit bureaus │ └───────────────────────────────┬───────────────────────────────────┘ ▼ ┌────────────────────────────────────────────────────────────────────┐ │ ENTITY RESOLUTION & ENRICHMENT │ │ Company deduplication/matching · Firmographic enrichment · │ │ Event tagging (permit, hire, import, tender, etc.) · │ │ Timestamped, immutable signal event store │ └───────────────────────────────┬───────────────────────────────────┘ ▼ ┌────────────────────────────────────────────────────────────────────┐ │ PRODUCT SIGNAL MAPPING ENGINE (Sec. 11) │ │ Product → buyer archetypes → relevant signal set + weights │ │ (config-driven, expert-seeded + IV-refined per product) │ └───────────────────────────────┬───────────────────────────────────┘ ▼ ┌────────────────────────────────────────────────────────────────────┐ │ SCORING ENGINE │ │ Layer 1: Bayesian prior (base rate by industry/geo/product) │ │ Layer 2: Naive Bayes (WOE) + Logistic Regression + GBM ensemble │ │ Layer 3: Isotonic/Platt calibration against historical outcomes │ │ Confidence engine: Beta-Binomial credible intervals + data │ │ completeness/recency/source-reliability scoring │ └───────────────────────────────┬───────────────────────────────────┘ ▼ ┌────────────────────────────────────────────────────────────────────┐ │ EXPLAINABILITY & RANKING LAYER │ │ Top-driver attribution (per-signal contribution) · Tiering (T1/T2/ │ │ T3) · Top-1% percentile ranking · Expected-Value re-ranking │ └───────────────────────────────┬───────────────────────────────────┘ ▼ ┌────────────────────────────────────────────────────────────────────┐ │ FEEDBACK / RETRAINING LOOP │ │ Closed-won/lost outcomes logged → feed IV recalculation, logistic/ │ │ GBM retraining, and calibration curve updates (weekly/monthly job) │ └────────────────────────────────────────────────────────────────────┘
### Key Engineering Principles
1. **Signal events are immutable and timestamped** — scores are always computed on read from the raw event log, so any historical score can be reproduced and audited exactly.
2. **The Product Signal Mapping Engine is config, not code** — adding a new product category should never require a model redeploy, only a new mapping entry (seeded manually, refined by IV once data accumulates).
3. **Every probability ships with a confidence score and a driver list** — no bare number is ever returned by the API.
4. **Cold-start products use expert-seeded WOE values**; **mature products use empirically-derived WOE** from the growing outcome log — the system should flag which mode each product/score is currently operating in.
5. **Retraining is continuous, not one-time** — calibration curves, IV weights, and ensemble blend weights are versioned artifacts on a scheduled retraining job, with full rollback capability.
