# DEPRECATED

This document is superseded by JOEP v2.

Do not use this document for new scoring-engine implementation.

Authoritative sources:
- JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md
- JOEP-v2-GATES-ICP-ROUTING.md
- JOEP-v2-IMPLEMENTATION-PLAN.md

---

JAS CONNECT — Opportunity Intelligence Platform
Technical Blueprint: Buying-Intent & Opportunity Scoring Engine
Purpose of this document: a build-ready specification for an AI system that scores companies not on "are they a lead" but on "how likely, and how soon, will this company buy." It is written so an engineering team can implement it directly — data schema, signal taxonomy, weighting logic, formulas, and classification rules included.

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

1. Buying Intent Signals (Publicly Available)
1.1 Digital Research / Content Consumption Signals
Signal	Source	What it means
Third-party topic surge (content consumption spike vs. own baseline)	Bombora-style co-op networks, publisher partnerships	Company is actively researching a category
Review site activity (comparing vendors)	G2, Capterra, TrustRadius, GetApp, Gartner Peer Insights	High-intent — people don't browse review sites idly
Search/keyword surge on category or competitor terms	SEMrush/Ahrefs-style keyword tracking, SERP monitoring	Company or its employees are actively researching solutions
Website visits to pricing/demo/case study pages (first-party, de-anonymized via IP-to-company or reverse DNS)	Own site analytics + IP intelligence	Late-funnel behavior
Competitor website/comparison page visits	Same as above	Company is shortlisting vendors
Webinar/event registration & attendance for category topics	Event platforms, LinkedIn Events	Educational or evaluative stage
Whitepaper/case study downloads	Marketing automation	Early-to-mid funnel
Social engagement (LinkedIn posts about the problem space, comments on vendor posts)	LinkedIn, X, industry forums	Public signal of a live need
1.2 Business Event Signals (Trigger Events)
Signal	Source	Why it matters
Funding round (seed → Series A/B/C, debt raise)	Crunchbase, PitchBook, press releases	New capital = new budget
New executive hire (CPO, VP Ops, Head of Procurement, CTO)	LinkedIn, press releases	New leaders re-evaluate vendor stack in first 90–180 days
Job postings for roles related to the product category (e.g., "Procurement Manager," "Site Engineer," "Supply Chain Analyst")	LinkedIn Jobs, Indeed, company career pages	Direct proxy for expansion/need
Expansion announcements (new facility, new market entry, new plant)	Press releases, local business journals, government filings	Physical/operational growth = new sourcing needs
M&A activity (acquiring or being acquired)	SEC filings, Crunchbase, news	Consolidation triggers vendor re-evaluation
Government contract awards	SAM.gov (US), GeM (India), TED (EU), national procurement portals	Direct evidence of active project & budget
Public tenders / RFPs / RFQs issued	Government e-procurement portals, industry tender boards	Explicit "we are buying" signal
Building permits filed	Municipal permit databases	Construction/facility signal — precise timing
Import/export shipment records	Customs/trade data (Panjiva, ImportGenius, Volza)	Direct evidence of what a company is currently sourcing and from whom
Patent filings	USPTO, WIPO, national patent offices	R&D direction, future product needs
Regulatory filings / compliance deadlines	Industry regulators	Forces vendor decisions on a fixed timeline
Layoffs / restructuring	WARN Act notices (US), press	Negative signal (budget freeze) unless the layoff is in an unrelated department
New product launch announcements	Press releases, product pages	Downstream sourcing/component need
Executive statements on earnings calls about capex/expansion	Transcripts (Seeking Alpha, company IR pages)	Forward-looking budget commitment
1.3 Financial & Operational Signals
* Revenue growth trend (YoY, if public or estimated)
* Headcount growth rate (LinkedIn employee count trend)
* Capex trend (public companies — 10-K/10-Q filings)
* Credit rating changes (D&B, Experian Business)
* New office/warehouse/facility leases (commercial real estate data)
* Fleet/equipment registration changes
* Import volume trend (rising volume in a category = growing need)
1.4 Technographic Signals
* Technology stack detected (BuiltWith, Wappalyzer-style detection)
* Recent technology additions/removals (a company dropping a competitor's tool is a strong signal)
* ERP/CRM/procurement system in use (indicates integration compatibility and buying process maturity)
* Job postings mentioning specific tools/platforms
1.5 Direct "Actively Sourcing" Signals (Strongest Category — see Section 2)

2. Indicators a Company Is Actively Looking for Vendors/Suppliers/Contractors
These are distinct from general intent — they indicate an open buying process right now.
Tier A — Explicit (near-certain active sourcing):
* Published RFP/RFQ/RFI/tender on a procurement portal
* "Request a quote" or vendor registration form submitted on your site or a marketplace (IndiaMART, Alibaba, ThomasNet, Global Sources)
* Posting on a B2B sourcing marketplace looking for suppliers
* Job posting explicitly for "Vendor Manager," "Procurement Specialist for [category]"
* Public tender documents naming technical specifications matching your product category
* Press release announcing a project requiring your category of product/service
* Building permit filed for a project requiring your category (construction/MEP/materials)
* Import data showing a gap — company historically imported Product X from Country A, shipments stopped 3–6 months ago (supplier switch in progress)
* Trade show/exhibition attendee or exhibitor list matching your category
* LinkedIn post directly asking for supplier/vendor recommendations
Tier B — Strong Implicit:
* Competitor's customer is showing churn signals (contract renewal date approaching + negative reviews of incumbent)
* Multiple stakeholders from the same account engaging with content (buying-committee formation — the single strongest engagement signal per 6sense's own model)
* Repeated visits to spec sheets / technical documentation pages
* Sudden spike in searches for "[category] suppliers near me," "[category] manufacturers," "[category] distributors"
* Comparison-page visits (you vs. competitor)
* Downloaded pricing/quote template
Tier C — Contextual/Environmental:
* New regulation coming into effect requiring compliance products
* Seasonal/cyclical procurement windows (e.g., fiscal year-end budget flush, monsoon-prep in construction, harvest-cycle in agri-inputs)
* Industry-wide supply shock (e.g., raw material shortage forcing multi-sourcing)

3. Enrichment Data Points to Collect Per Company
Firmographic (Who they are)
Legal name, DBA, industry (NAICS/SIC/GICS code), sub-vertical, year founded, HQ location, all operating locations/facility addresses, legal entity structure, ownership (public/private/PE-backed/subsidiary), parent company, subsidiaries, revenue (actual or modeled), employee count (total + by department), employee growth rate (6/12/24-month trend), website, registration/business license IDs (CIN/GST in India, EIN in US, etc.).
Firmographic — Operational Depth
Number of manufacturing plants/warehouses/branches, production capacity (if disclosed), certifications held (ISO, CE, FDA, etc.), export/import license status, membership in trade bodies/associations.
Financial
Revenue trend, funding history (rounds, amounts, investors), credit score/rating, payment history where available, capex trend, profitability signals, recent financial distress indicators (late filings, litigation, tax liens).
Technographic
Full tech stack, ERP/CRM/procurement software in use, e-commerce platform, recent stack changes (adds/drops), cybersecurity posture (as a maturity proxy).
Intent & Behavioral
Website engagement history with your domain, content topics being researched (own + third-party surge), search keyword trends, review-site activity, social engagement, event/webinar attendance, competitor engagement.
Trigger Events
Funding, executive changes, hiring trends, expansion/facility news, M&A, tenders/RFPs won or issued, permits, patents, litigation, regulatory actions.
Trade & Supply Chain (critical for Export/Distribution verticals)
Import/export shipment history (HS codes, product descriptions, volumes, frequency, origin/destination countries, known suppliers and buyers), customs records, bill-of-lading data, port of entry/exit, shipping line used, incoterms where visible, tariff exposure.
Buying Committee / Contacts
Decision-makers by role (Procurement, Engineering, Operations, Finance, C-suite), org chart depth, tenure of key contacts, direct/verified email + phone, LinkedIn activity per contact, past vendor relationships of key contacts (career history signal — e.g., a new Head of Procurement who used a specific vendor at their last company).
Relationship & History (if existing account)
Past interactions, current contract status/renewal date, product usage data (if applicable), support ticket sentiment, expansion/upsell footprint.
Compliance & Risk
Sanctions list screening, adverse media, litigation history, regulatory compliance status — needed for procurement/export use cases where vendor risk gating happens before purchase.

4. Factors With the Strongest Correlation to Purchasing Decisions
Ranked by evidentiary strength, based on how the leading intent platforms weight their own models and observed B2B buying research:
1. Multi-stakeholder engagement (buying committee breadth) — the single strongest predictor across 6sense's own qualification model. One person researching is noise; three to five people from the same account engaging within a tight window is a buying process.
2. Sustained (not single-spike) topic surge across multiple related topics — Bombora's own threshold logic (3-week window vs. 12-week baseline, score ≥60, and requiring multiple simultaneous surging topics) exists precisely because single spikes are unreliable.
3. Explicit sourcing action (RFP issued, quote requested, tender published) — near-100% correlation but low frequency/coverage.
4. Trigger event + budget proxy combined (e.g., funding round + related job posting) — compound signals outperform single signals significantly.
5. Fit score (ICP match) — a perfect intent signal from a company outside your ICP (wrong size, wrong geography, wrong industry) rarely converts. Fit is a gate, not just a weight.
6. Recency/decay of signal — a surge 3 weeks old is worth far more than one 4 months old; most platforms decay intent scores on a rolling window (6sense refreshes daily, Bombora weekly).
7. First-party engagement depth (pricing page, demo request, spec sheet) outweighs third-party/aggregated intent, because it's a direct behavioral signal rather than an inferred one.
8. Competitor displacement signals (researching a competitor, competitor's contract renewal window, negative reviews of incumbent).
9. Category-specific trigger events (construction permit for construction-related products; import gap for distribution/export products) — vertical-specific signals consistently outperform generic firmographic scoring.
10. Executive/organizational change in a relevant function — moderately strong, especially combined with #3 or #4.
Weakest/noisiest on their own: company size alone, generic industry code alone, single content download, single anonymous website visit.

5. Time-to-Purchase Signal Mapping
30-Day Window (High-velocity, "hot")
* Live/open RFP, RFQ, or tender with a submission deadline inside 30 days
* Direct quote/pricing request submitted
* Multiple buying-committee members visiting pricing/demo pages in the same week
* Explicit "looking for supplier" post or marketplace inquiry
* Import gap detected (existing supplier relationship recently ceased) combined with active sourcing behavior
* Permit issued + contractor/material bidding phase confirmed (construction)
* Contract renewal/expiry of an incumbent vendor within 30 days, combined with negative sentiment or competitor research
* Government tender awarded needing immediate fulfillment
90-Day Window ("warm," 6sense's own predictive window benchmark)
* Sustained topic surge across 3+ related topics for 3+ consecutive weeks
* Comparison/vs.-competitor page engagement
* Case study, ROI calculator, or spec-sheet downloads from multiple stakeholders
* Job posting for a role tied to procurement/operations of this category, still open
* Funding round closed within the last 60–90 days, in a company whose stated use-of-funds includes expansion/operations
* Facility expansion or new-location announcement with a stated opening timeline of 3–6 months
* New executive hired into a relevant function within the last 60 days
180-Day Window ("developing," nurture-and-monitor)
* Single-topic surge, not yet sustained or clustered
* General educational content engagement (blog, top-of-funnel guide)
* Early-stage funding announcement with no explicit use-of-funds signal yet
* Company added to industry watchlists (new market entrant, early-stage expansion)
* Regulatory change announced with a compliance deadline 6+ months out
* Headcount growth trend positive but no specific role signal yet
* Patent filed suggesting future product needing your category (long lead time)

6. Signals of Low Purchase Probability (Negative/Suppressing Signals)
* Recent contract signed with a competitor (explicit — deprioritize for contract-length duration)
* Layoffs/hiring freeze in the relevant department (WARN notices, press)
* Declining headcount trend (6/12-month)
* Financial distress indicators: late filings, credit downgrade, tax liens, litigation for non-payment
* No engagement recency — last activity >180 days with no trigger event
* Wrong-fit firmographics (outside ICP on size, geography, industry, or regulatory profile)
* Single anonymous visit with no repeat behavior, no buying-committee breadth
* Import data showing a stable, long-tenured supplier relationship in the exact category with no disruption signal
* Company in active bankruptcy/insolvency proceedings
* Explicit unsubscribe/opt-out or "not interested" recorded response
* Facility closure or divestiture announcement in the relevant business unit
* Budget-cycle mismatch (e.g., fiscal year just closed, next budget cycle 9+ months away, no urgent trigger)
These should act as score suppressors/multipliers below 1.0, not just absence-of-points, because a negative signal is informationally stronger than a neutral absence of data.

7. How Enterprise Platforms Actually Score (Synthesis)
Platform	Core Mechanism	Key Design Choice
6sense	AI/ML model trained on historical won/lost opportunity patterns (not rule-based points). Produces an Intent Score (0–100) predicting likelihood of opening an opportunity in the next 90 days, plus a 5-stage Buying Stage classification: Target → Awareness → Consideration → Decision → Purchase.<cite index="1-1,3-1">6sense's metric is based on historical precedents of past behavior rather than front-end conjecture, modeled after the activities that actually led to other opened opportunities and closed deals, and the predictive buying stages indicate the likelihood of an account opening or progressing in the next 90 days.</cite> A "6QA" (qualified account) only fires when profile fit, buying stage, intent intensity, and buying-group breadth cross thresholds simultaneously — a multi-dimensional gate rather than a single score.	
Bombora	Pure topic-surge measurement: compares an account's content consumption over a trailing 3-week window against its own 12-week historical baseline per topic.<cite index="12-1">For a specific account, an Intent Topic is given a score of 0-100, and if the topic gets a score of 60 or above, it's considered a surging Intent Topic for that account</cite>, and <cite index="17-1">factors feeding the score include topic consumption by interaction volume, topic relevancy weight of the content, and depth of engagement such as dwell time and scroll behavior.</cite> Best-practice activation requires topic thresholding — multiple simultaneous surging topics, not one.	
ZoomInfo	Combines firmographic/technographic fit scoring with its own intent data (Intent+ / website visitor identification) and scoring rules configurable by the buyer — more rules-based/customizable than 6sense's ML-first approach, blended with real-time buying signals (funding, hiring, tech changes).	
Apollo	Lighter-weight fit + engagement scoring built into a prospecting workflow; intent data available as an add-on; heavier reliance on firmographic filters + direct engagement (email opens, replies) than deep third-party intent modeling.	
Demandbase	Similar to 6sense: an "Engagement Minutes" / Engagement Points model where different signal types (first-party site behavior, Bombora topics, G2 intent, ad engagement) are each assigned point values and summed, with explicit tiering of topic value (generic topics scored lower, competitor/high-value topics scored higher) so the model stays interpretable rather than a pure black box.	
Cross-cutting lessons for JAS CONNECT's design:
1. Combine fit (durable, slow-changing) with intent (volatile, fast-decaying) as separate axes, never one blended number only.
2. Require multi-signal clustering before declaring high intent (Bombora's topic-threshold rule; 6sense's 4-dimension 6QA gate) — this is the #1 defense against false positives.
3. Weight signals, don't just count them — a pricing-page visit from a well-fit, multi-stakeholder account is worth far more than the same visit from a poor-fit single visitor (6sense's explicit design principle).
4. Decay scores over time — freshness matters as much as magnitude.
5. Expose reason codes — every score should be explainable down to which signals produced it (JAS CONNECT's competitive edge over black-box incumbents).

8. The JAS CONNECT 100-Point Opportunity Score
8.1 Four-Pillar Structure
Pillar	Points	What it answers
A. Fit Score	25	Could this company ever be a good customer?
B. Intent Score	30	Are they actively researching/showing buying behavior?
C. Timing/Trigger Score	25	Is there a concrete event forcing a near-term decision?
D. Engagement & Buying-Committee Score	20	Are real decision-makers involved, and are they engaging with us specifically?
Total	100	
A negative-signal multiplier (0.4×–1.0×) is applied to the raw total after summation (see 8.3).
8.2 Pillar Breakdown
A. Fit Score (25 pts)
Sub-factor	Points
Industry/vertical match to ICP	6
Company size (revenue + headcount) in target range	6
Geography match (serviceable region)	5
Technographic/operational compatibility (relevant equipment, certifications, systems)	5
Financial health (credit, stability)	3
B. Intent Score (30 pts)
Sub-factor	Points
Third-party topic surge (sustained, multi-topic, threshold-gated as in Bombora's model)	10
First-party site/content engagement (pricing, spec sheets, demo requests)	8
Review-site / marketplace research activity	5
Search/competitor-comparison behavior	4
Social engagement on category topics	3
C. Timing / Trigger Score (25 pts)
Sub-factor	Points
Explicit sourcing action (RFP/RFQ/tender/quote request)	10
Business trigger event (funding, expansion, permit, new exec, M&A) matched to category	8
Relevant job posting open	4
Contract/renewal-cycle timing (incumbent expiring)	3
D. Engagement & Buying-Committee Score (20 pts)
Sub-factor	Points
Number of distinct stakeholders engaging (1=4pts, 2=9pts, 3+=14pts, capped)	14
Seniority/relevance of engaging stakeholders (decision-maker vs. researcher)	6
8.3 Formula
RawScore = FitScore + IntentScore + TimingScore + EngagementScore   (0–100)

DecayFactor(t) = e^(–λ × days_since_last_signal)     // λ tuned per signal type
                                                       // e.g. λ=0.05 for digital intent (≈14-day half-life)
                                                       //      λ=0.01 for trigger events (≈70-day half-life)

NegativeMultiplier = 1.0
  – 0.40 if active competitor contract signed (within term)
  – 0.25 if hiring freeze/layoffs in relevant department
  – 0.20 if financial distress indicator present
  – 0.15 if no engagement in >180 days with no open trigger
  (multipliers stack multiplicatively, floor = 0.10)

OpportunityScore = RawScore × DecayFactor(t) × NegativeMultiplier
This keeps every component auditable: a sales rep or the platform UI can always show "this score is 78 because Fit=22, Intent=25, Timing=20, Engagement=11, decayed 8% for signal age, no negative multipliers applied."

9. Vertical Weighting Systems
The 100-point ceiling stays fixed; pillar weights and sub-factor emphasis shift by vertical because what predicts purchase differs structurally by industry.
Construction
Pillar	Weight	Notes
Fit	20%	Geography and project-scale match dominate
Intent	20%	Less digital research-driven; more physical/document-driven
Timing/Trigger	40%	Permits, tender awards, project-start dates are the dominant predictor
Engagement	20%	Site engineer / procurement officer / GC relationship
Key trigger signals to overweight: building permits, tender awards, project financing announcements, contractor bidding windows, material-spec documents released.
Manufacturing
Pillar	Weight	Notes
Fit	30%	Production capacity, certifications, technographic compatibility matter heavily
Intent	25%	Spec sheet downloads, RFQ activity
Timing	25%	Capex announcements, capacity expansion, equipment-replacement cycles
Engagement	20%	Plant manager / procurement engineer involvement
Key signals to overweight: capex disclosures, new facility/line announcements, equipment-related job postings, certification renewals (ISO cycle triggers re-sourcing).
Procurement (selling into corporate procurement functions/software)
Pillar	Weight	Notes
Fit	20%	
Intent	30%	Digital research-heavy buying process (RFP platforms, review sites)
Timing	20%	Budget cycle, contract renewal dates dominate
Engagement	30%	Multi-stakeholder buying committees are largest here — procurement decisions are the most committee-driven of all verticals
Key signals to overweight: buying-committee breadth, RFP portal activity, incumbent contract renewal dates, budget-cycle timing (fiscal year-end).
Export
Pillar	Weight	Notes
Fit	25%	Regulatory/compliance eligibility (licenses, certifications, sanctions status) is a hard gate
Intent	20%	
Timing/Trigger	35%	Trade-data-driven: import gaps, shifting trade corridors, tariff changes, new trade agreements
Engagement	20%	
Key signals to overweight: import/export shipment data (HS-code level), supplier-switch gaps in customs records, tariff/regulatory changes, trade agreement announcements, currency/logistics disruption events.
Distribution
Pillar	Weight	Notes
Fit	25%	Territory and channel-conflict fit
Intent	25%	
Timing	25%	New product launches upstream, expansion into new territories
Engagement	25%	Balanced — relationship-driven but also trigger-driven
Key signals to overweight: upstream manufacturer product launches needing distribution, territory expansion announcements, competitor distributor losing a contract, new retail/channel partnerships announced.

10. T1 / T2 / T3 Classification Logic
Classification should combine OpportunityScore with the Timing Window (Section 5) so that "hot but wrong-fit" accounts don't get miscategorized as top-tier.
Tier	Score Range	Timing Requirement	Definition	Recommended Action
T1 — Priority / Sales-Ready	75–100	≥1 signal in the 30-day window OR explicit sourcing action present	Fit-qualified, high intent, active trigger, multi-stakeholder engagement	Immediate outbound / direct sales engagement, same-week SLA
T2 — Developing / Sales-Assist	45–74	Signals in 90-day window, no explicit sourcing action yet	Good fit, rising intent, trigger present but not urgent, engagement forming	Nurture sequence + light-touch outreach, monitor for stage transition
T3 — Monitor / Marketing-Qualified	20–44	Signals only in 180-day window or single-topic/no-trigger	Fit present but intent/timing/engagement thin	Long-cycle nurture, ABM awareness content, re-score monthly
Unqualified / Suppress	<20 or Fit <8/25 (hard fit gate)	—	Wrong ICP fit, negative multiplier active, or no signal in 180+ days	Exclude from active motion, re-check quarterly
Hard gates (override score-based tier placement):
* Fit sub-score <8/25 → cannot exceed T3 regardless of intent/timing (prevents chasing well-intended but wrong-fit accounts).
* Active negative multiplier ≤0.6 → cannot exceed T2 regardless of raw score.
* Explicit sourcing action (RFP/RFQ live) → automatic T1 floor regardless of computed score, since this is near-certain evidence and should never be buried by a modeling artifact.

11. Explainable Scoring Formulas
The core design principle: every number must decompose back into named, auditable inputs. No unexplained ML "vibes" score, unlike the common criticism of 6sense/Demandbase.
11.1 Master Formula
OpportunityScore = [ (Fit_raw/25)×W_fit + (Intent_raw/30)×W_intent
                    + (Timing_raw/25)×W_timing + (Engagement_raw/20)×W_engage ]
                    × 100 × DecayFactor(t) × NegativeMultiplier

where W_fit + W_intent + W_timing + W_engage = 1.0, set per vertical (Section 9)
11.2 Sub-Formulas
Fit Score:
Fit_raw = IndustryMatch(0–6) + SizeMatch(0–6) + GeoMatch(0–5)
        + TechCompat(0–5) + FinHealth(0–3)

IndustryMatch = 6 × (1 – |ICP_industry_vector – company_industry_vector|)   // cosine-similarity style
Intent Score (with Bombora-style thresholding built in):
TopicSurgeComponent = 10 × min(1, surging_topic_count / 3) × avg(surge_scores≥60)/100
   // requires ≥1 topic surging above 60; scales up to full credit at 3+ simultaneous topics
   // mirrors Bombora's own best-practice topic-threshold rule

FirstPartyComponent  = 8 × normalized(pricing_visits, demo_requests, spec_downloads)
ReviewComponent      = 5 × normalized(review_site_activity)
SearchComponent      = 4 × normalized(competitor_comparison_activity)
SocialComponent      = 3 × normalized(social_engagement)

Intent_raw = TopicSurgeComponent + FirstPartyComponent + ReviewComponent
           + SearchComponent + SocialComponent
Timing/Trigger Score:
Timing_raw = 10×HasExplicitSourcingAction
           + 8×TriggerEventRelevanceScore(0–1)
           + 4×HasRelevantOpenJobPosting
           + 3×ContractRenewalProximityScore(0–1)

TriggerEventRelevanceScore = CategoryMatchWeight × Recency(event_date)
Engagement / Buying-Committee Score:
StakeholderCount_pts = min(14, 4 + 5×(distinct_engaged_contacts – 1))   // 1→4, 2→9, 3+→14
SeniorityWeight_pts  = 6 × (Σ role_weight_i / n_contacts)
   // role_weight: C-suite/VP=1.0, Director/Manager=0.7, Individual contributor=0.4

Engagement_raw = StakeholderCount_pts + SeniorityWeight_pts
11.3 Reason Code Output (required in UI/API response)
Every score returned by the API must include a structured explanation object, e.g.:
{
  "opportunity_score": 78,
  "tier": "T1",
  "pillars": {"fit": 21, "intent": 24, "timing": 19, "engagement": 14},
  "decay_factor": 0.92,
  "negative_multiplier": 1.0,
  "top_reason_codes": [
    "Sustained surge on 3 related topics for 4 weeks",
    "RFP published on state procurement portal 6 days ago",
    "3 distinct stakeholders engaged (Procurement Mgr, Plant Head, CFO)",
    "New facility permit filed matching product category"
  ],
  "recommended_window": "30-day"
}

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

Implementation Notes for Engineering
1. Data model: store every signal as an immutable, timestamped event (signal_type, source, company_id, raw_value, observed_at, confidence), never overwrite — scores are computed on read from the event stream, enabling full historical backtesting.
2. Decay and thresholding logic (Bombora-style multi-topic gating, 6sense-style multi-dimension gating) must live in the scoring engine, not the UI, so the API and dashboard always agree.
3. Vertical weight tables (Section 9) should be config-driven (not hardcoded) so new verticals can be added without a code release.
4. Negative multipliers should be independently toggleable/auditable — a compliance or sales-ops user should be able to see exactly why an account was suppressed.
5. Explainability object (Section 11.3) should be a first-class API response field, not an afterthought — this is JAS CONNECT's core differentiation versus black-box incumbents.
6. Calibration model (Section 12) should be versioned and retrainable via a scheduled job, with old versions retained for audit/comparison.
