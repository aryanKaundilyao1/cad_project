# DEPRECATED

This document is superseded by JOEP v2.

Do not use this document for new scoring-engine implementation.

Authoritative sources:
- JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md
- JOEP-v2-GATES-ICP-ROUTING.md
- JOEP-v2-IMPLEMENTATION-PLAN.md

---

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
