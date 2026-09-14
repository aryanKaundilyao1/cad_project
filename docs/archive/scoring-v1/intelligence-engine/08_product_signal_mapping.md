# DEPRECATED

This document is superseded by JOEP v2.

Do not use this document for new scoring-engine implementation.

Authoritative sources:
- JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md
- JOEP-v2-GATES-ICP-ROUTING.md
- JOEP-v2-IMPLEMENTATION-PLAN.md

---

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
