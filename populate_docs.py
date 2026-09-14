import os
import re

doc_a_raw = r"""JAS CONNECT — Opportunity Intelligence Platform
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
"""

doc_b_raw = r"""JAS CONNECT — Purchase Likelihood Prediction Engine
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
"""

def extract_sections(raw_text):
    lines = raw_text.split("\n")
    sections = {}
    current_title = "HEADER"
    current_content = []
    
    for line in lines:
        if re.match(r'^(\d+\.\s.*|##?\s.*)', line):
            if current_content:
                sections[current_title.strip()] = "\n".join(current_content).strip()
            current_title = line.strip()
            current_content = [line]
        else:
            current_content.append(line)
            
    if current_content:
        sections[current_title.strip()] = "\n".join(current_content).strip()
        
    return sections

doc_a_sections = extract_sections(doc_a_raw)
doc_b_sections = extract_sections(doc_b_raw)

def get_section_by_prefix(sections, prefix):
    for title, content in sections.items():
        if title.startswith(prefix):
            return content
    return ""

mappings = {
    "01_signal_library.md": [
        (doc_a_sections, "1. Buying Intent Signals"),
        (doc_a_sections, "2. Indicators a Company Is Actively Looking"),
        (doc_a_sections, "3. Enrichment Data Points to Collect"),
        (doc_a_sections, "4. Factors With the Strongest Correlation"),
        (doc_a_sections, "5. Time-to-Purchase Signal Mapping"),
        (doc_a_sections, "6. Signals of Low Purchase Probability"),
        (doc_b_sections, "2. Public Signals That Correlate"),
        (doc_b_sections, "5. Company Growth Indicators"),
        (doc_b_sections, "6. Procurement Indicators"),
        (doc_b_sections, "7. Expansion Indicators"),
        (doc_b_sections, "8. Hiring Indicators"),
        (doc_b_sections, "9. Vendor Registration Indicators"),
        (doc_b_sections, "12. Geographic Indicators"),
        (doc_b_sections, "13. Budget Indicators")
    ],
    "02_opportunity_scoring_engine.md": [
        (doc_a_sections, "7. How Enterprise Platforms Actually Score"),
        (doc_a_sections, "8. The JAS CONNECT 100-Point Opportunity Score")
    ],
    "03_purchase_probability_engine.md": [
        (doc_b_sections, "1. Mathematical Framework for Purchase Likelihood"),
        (doc_b_sections, "3. Weighted Scoring Model"),
        (doc_b_sections, "4. Bayesian and Probabilistic Methods"),  # Will strip 4.3 manually in script below
        (doc_b_sections, "14. Combining All Signals Into a Final"), # Will strip 14.2 and 14.3
        (doc_b_sections, "## 15. Worked Numerical Example")
    ],
    "04_confidence_engine.md": [
        # Explicit extractions below
    ],
    "05_tier_classification_engine.md": [
        (doc_a_sections, "10. T1 / T2 / T3 Classification Logic")
    ],
    "06_ranking_engine.md": [
        # 14.3 Explicit extraction below
    ],
    "07_vertical_weighting_profiles.md": [
        (doc_a_sections, "9. Vertical Weighting Systems")
    ],
    "08_product_signal_mapping.md": [
        (doc_b_sections, "10. Industry-Specific Indicators"),
        (doc_b_sections, "11. Product-Specific Indicators")
    ],
    "09_reason_codes_and_explainability.md": [
        (doc_a_sections, "11. Explainable Scoring Formulas")
    ],
    "10_intelligence_engine_architecture.md": [
        (doc_a_sections, "0. System Architecture Overview"),
        (doc_a_sections, "12. Calculating Purchase Likelihood Percentage"),
        (doc_b_sections, "## 16. System Architecture")
    ]
}

# Special extraction for nested sections to avoid duplication
def extract_subsection(content, sub_prefix, end_prefix=None):
    lines = content.split('\n')
    sub_content = []
    in_sub = False
    new_content = []
    
    for line in lines:
        if line.startswith(sub_prefix):
            in_sub = True
            sub_content.append(line)
        elif in_sub and (line.startswith(end_prefix) if end_prefix else (re.match(r'^\d+\.\d+\s', line) and not line.startswith(sub_prefix))):
            in_sub = False
            new_content.append(line)
        elif in_sub:
            sub_content.append(line)
        else:
            new_content.append(line)
            
    return "\n".join(new_content), "\n".join(sub_content)

# Process 4.3 from Bayesian methods
bayes_content = get_section_by_prefix(doc_b_sections, "4. Bayesian and Probabilistic")
bayes_content, conf_4_3 = extract_subsection(bayes_content, "4.3 Beta-Binomial Model")
doc_b_sections["4. Bayesian and Probabilistic Methods"] = bayes_content # Update without 4.3

# Process 14.2 and 14.3 from Combining All Signals
comb_content = get_section_by_prefix(doc_b_sections, "14. Combining All Signals")
comb_content, rank_14_3 = extract_subsection(comb_content, "14.3 Identifying the Top 1%")
comb_content, conf_14_2 = extract_subsection(comb_content, "14.2 Confidence Calculation")
doc_b_sections["14. Combining All Signals Into a Final Purchase Probability Score"] = comb_content # Update

# Also extract Implementation Notes from 12 in Doc A
calc_content = get_section_by_prefix(doc_a_sections, "12. Calculating Purchase")
if "Implementation Notes for Engineering" in calc_content:
    calc_parts = calc_content.split("Implementation Notes for Engineering")
    doc_a_sections["12. Calculating Purchase Likelihood Percentage"] = calc_parts[0].strip()
    impl_notes = "Implementation Notes for Engineering\n" + calc_parts[1].strip()
else:
    impl_notes = ""

for filename, sections in mappings.items():
    content_list = []
    for doc, prefix in sections:
        val = get_section_by_prefix(doc, prefix)
        if val:
            content_list.append(val)
            
    # Special injections
    if filename == "04_confidence_engine.md":
        content_list.extend([conf_4_3, conf_14_2])
    elif filename == "06_ranking_engine.md":
        content_list.extend([rank_14_3])
    elif filename == "10_intelligence_engine_architecture.md":
        if impl_notes:
            content_list.append(impl_notes)
            
    # Add cross references
    cross_refs = ""
    if filename == "04_confidence_engine.md":
        cross_refs = "\n\n*See 03_purchase_probability_engine.md for full probabilistic framework.*"
    elif filename == "06_ranking_engine.md":
        cross_refs = "\n\n*See 03_purchase_probability_engine.md for base probability scoring.*"
        
    final_content = "\n\n".join(content_list) + cross_refs
    
    path = os.path.join("docs", "intelligence-engine", filename)
    with open(path, "w") as f:
        f.write(final_content + "\n")

print("Files generated successfully.")
