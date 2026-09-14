# DEPRECATED

This document is superseded by JOEP v2.

Do not use this document for new scoring-engine implementation.

Authoritative sources:
- JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md
- JOEP-v2-GATES-ICP-ROUTING.md
- JOEP-v2-IMPLEMENTATION-PLAN.md

---

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
