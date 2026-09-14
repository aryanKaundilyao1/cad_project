# DEPRECATED

This document is superseded by JOEP v2.

Do not use this document for new scoring-engine implementation.

Authoritative sources:
- JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md
- JOEP-v2-GATES-ICP-ROUTING.md
- JOEP-v2-IMPLEMENTATION-PLAN.md

---

# Decision Intelligence Engine Architecture (Phase 6)

## 1. Philosophy
### Decision Intelligence Principles
JAS CONNECT’s Intelligence Engine has mastered **Predictive Intelligence** ("What will happen?"). The Decision Intelligence Engine represents the shift to **Prescriptive Intelligence** ("What should the user do next?").

1. **No Black Boxes:** Every recommendation must be fully explainable and mathematically traceable back to its origin (Signals → Opportunity Score → Probability → Confidence → Recommendation).
2. **Context-Aware:** Recommendations must synthesize who to contact, what to sell, and how fast to act into a unified strategy.
3. **Confidence-Gated:** High-risk actions (e.g., executive outreach) are only recommended when the underlying predictive Confidence Score is sufficiently high.

## 2. Decision Engine Architecture
The Decision Engine sits atop the Phase 5 Predictive Engine. It consumes the mathematical outputs (Probability, Confidence, Scores) and raw inputs (Signals, Contacts) to generate actionable directives.

**Inputs:**
- Predictive Outputs: Purchase Probability, Confidence Score
- Scoring Outputs: Fit, Intent, Timing, Engagement
- Raw Data: Signal History, Buyer Archetypes, Contact Data, CRM Activities

**Outputs:**
- Next Best Action, Ranked Contacts, Product Recommendations, Urgency Scores, Playbooks.

---

## 3. Next Best Action Engine
**Purpose:** Recommends the single most effective action a sales rep should take immediately.
- **Inputs:** Active Signals, Timing Score, Confidence Score.
- **Outputs:** Specific action type (e.g., Call, Email, LinkedIn message) and target.
- **Formula:** 
  `ActionScore = max(Signal_Urgency_Weight) * Confidence_Multiplier`
  *(If ActionScore > Threshold, output Action mapped to the highest urgency signal).*
- **Dependencies:** Signal Registry, Confidence Engine.
- **Reason Codes:** "Recommended [Call] because [Tender Released] signal was detected with [89%] confidence."
- **Examples:** Call Procurement Head within 24 hours.
- **Edge Cases:** If Confidence is <50%, the Next Best Action defaults to "Research Account" rather than direct outreach.

---

## 4. Contact Prioritization Engine
**Purpose:** Ranks all known contacts at an account to identify the optimal person to reach out to.
- **Inputs:** Engagement Score, Contact Seniority, Signal Origin (e.g., who downloaded the whitepaper?).
- **Outputs:** Ranked array of Contact IDs.
- **Formula:** 
  `ContactRank = (Seniority_Weight * 0.4) + (Recent_Engagement_Weight * 0.4) + (Archetype_Match * 0.2)`
- **Dependencies:** Entity Resolution, Buyer Archetypes.
- **Reason Codes:** "Ranked #1 because they are the [VP of Operations] and [downloaded a spec sheet] 2 days ago."
- **Examples:** #1 VP Operations, #2 Procurement Manager.
- **Edge Cases:** If multiple contacts have identical scores, rank by tenure or data completeness (e.g., has direct phone number).

---

## 5. Product Recommendation Engine
**Purpose:** Determines exactly which product or service package to pitch.
- **Inputs:** Product Signal Mappings, Active Intent Signals, Industry Profile.
- **Outputs:** Recommended Product ID and Match Score.
- **Formula:**
  `ProductMatchScore = sum(Signal_Weight * Product_Relevance_Factor)`
- **Dependencies:** Product Signal Mapping (Phase 3D).
- **Reason Codes:** "Recommended [PEB Warehouse Package] because [Facility Expansion] and [Logistics Zoning] signals were detected."
- **Examples:** PEB Warehouse Package, Solar Grid Installation.
- **Edge Cases:** If signals point to conflicting products, recommend the broader "Enterprise Assessment" playbook.

---

## 6. Urgency Scoring Engine
**Purpose:** Defines the time-sensitivity of the opportunity.
- **Inputs:** Timing Score, Recency of highest-weighted signal.
- **Outputs:** Urgency Level (`Low`, `Medium`, `High`, `Critical`) and Best Contact Window.
- **Formula:**
  `UrgencyScore = Base_Timing_Score + (Trigger_Multiplier * Decay_Factor)`
- **Dependencies:** Timing Engine.
- **Reason Codes:** "Urgency is [Critical] because [RFP Deadline] is in 14 days."
- **Examples:** Critical (Action required <24h).
- **Edge Cases:** "Critical" urgency forces an immediate notification/alert to the assigned rep.

---

## 7. Follow-Up Recommendation Engine
**Purpose:** Recommends cadences for nurturing or chasing.
- **Inputs:** CRM Activities, Previous Actions, Engagement Score.
- **Outputs:** Wait time (days), Next Action.
- **Formula:** 
  `DaysToWait = base_cadence - (Engagement_Score * 0.1)`
- **Dependencies:** CRM Activity Integration.
- **Reason Codes:** "Wait 48 hours for email reply before triggering LinkedIn touch."
- **Examples:** "Follow up via LinkedIn in 2 days."

---

## 8. Sales Playbook Engine
**Purpose:** Surfaces a comprehensive strategic approach rather than just a single action.
- **Inputs:** Urgency, Suggested Product, Intent Category.
- **Outputs:** Playbook ID (e.g., "Tender Playbook", "Expansion Playbook").
- **Formula:** Decision Matrix (e.g., IF `Intent = Tender` AND `Urgency = High` THEN `Playbook = Tender Response`).
- **Dependencies:** Internal Playbook Library.
- **Reason Codes:** "Loaded [Expansion Playbook] based on [New Facility] signals."
- **Examples:** Tender Response Playbook, Competitor Displacement Playbook.
- **Edge Cases:** If no specific playbook matches, load the "General Discovery" playbook.

---

## 9. Deal Acceleration Engine
**Purpose:** Unblocks stalled opportunities.
- **Inputs:** Days in Current Stage, Engagement Decay, Blocker Signals (e.g., "Budget Freeze").
- **Outputs:** Acceleration tactics (e.g., "Offer Pilot", "Multi-thread to CFO").
- **Formula:** 
  `StallRisk = Days_in_Stage / Avg_Days_For_Stage * 100`
  *If StallRisk > 120%, trigger Acceleration Engine.*
- **Dependencies:** CRM Pipeline Stages.
- **Reason Codes:** "Opportunity stalled for 45 days; recommend multi-threading to CFO."

---

## 10. Decision Explainability
No black boxes. The system must render a clear trace:
- **Action:** Call Procurement Head
- **Because:** Contact Score is 95 (Decision Maker).
- **About:** PEB Warehousing (Product Score 88).
- **Now:** Urgency is Critical (Tender released 5 days ago).
- **Backed by:** Purchase Probability 74%, Confidence 89%.

---

## 11. Recommendation History
**Purpose:** Immutable log of what the system recommended and when. Essential for auditing whether sales reps are following the system.

## 12. Recommendation Versioning
**Purpose:** As decision matrices and formulas are refined (e.g., tweaking the ContactRank formula), the system versions the logic so historical recommendations can be understood in the context of the rules active at that time.

---

## 13. Decision Analytics
**Purpose:** Measure the effectiveness of the Decision Engine.
- **Metrics Tracked:**
  - Recommendation Adoption Rate (Did the rep do it?).
  - Win Rate of Followed vs. Ignored recommendations.
  - Playbook conversion rates.

---

## 14. Formula Definitions
1. **ContactRank** = `(Seniority_Weight * 0.4) + (Recent_Engagement_Weight * 0.4) + (Archetype_Match * 0.2)`
2. **ProductMatchScore** = `sum(Signal_Weight * Product_Relevance_Factor)`
3. **UrgencyScore** = `Base_Timing_Score + (Trigger_Multiplier * Decay_Factor(Days_Since_Signal))`
4. **ActionScore** = `max(Signal_Urgency_Weight) * Confidence_Multiplier`
5. **StallRisk** = `(Days_in_Stage / Avg_Days_For_Stage) * 100`

---

## 15. Database Entities
- `decision_playbook_catalog`: Definitions of available playbooks.
- `decision_action_catalog`: Definitions of specific actions (Call, Email, etc.).
- `decision_recommendations`: The actual recommendations generated for an opportunity.
- `decision_contact_rankings`: Point-in-time rankings of contacts for an opportunity.
- `decision_audit_logs`: Tracking changes to decision matrix logic.

---

## 16. APIs
- `GET /api/decision/recommendations/:company_id`
- `GET /api/decision/playbooks`
- `GET /api/decision/contacts/ranked/:company_id`
- `POST /api/decision/evaluate/:company_id` (Forces a run of the Decision Engine)
- `GET /api/decision/analytics`

---

## 17. UI Components
- **Decision Intelligence Dashboard:** Admin view of global recommendation adoption.
- **Action Center:** Sales rep view showing their prioritized tasks for the day.
- **Playbook Viewer:** UI to read and execute the recommended playbook.
- **Contact Ranking Module:** Embedded in the Company Profile, showing exactly who to call.

---

## 18. Success Metrics
- **Primary:** Lift in Win Rate when system recommendations are adopted vs ignored.
- **Secondary:** Sales Rep adoption rate of recommended Next Best Actions (>70% target).
- **Tertiary:** Reduction in average sales cycle length (Days to Close).

---

## 19. Future Expansion (Out of Scope for Phase 6)
- **Generative AI Integration:** Automatically drafting the exact email to send based on the Next Best Action and Product Recommendation.
- **Autonomous Agents:** The system autonomously executing the Next Best Action (e.g., auto-enrolling a contact in a marketing cadence without human intervention).
- **Revenue/Demand Forecasting:** Predicting macro pipeline metrics.

---

## Implementation Phasing Strategy
The architecture is designed to be implemented sequentially:
- **Phase 6A:** Database Foundation & Recommendation History
- **Phase 6B:** Next Best Action & Urgency Engine
- **Phase 6C:** Contact Prioritization Engine
- **Phase 6D:** Product Recommendation & Playbook Engine
- **Phase 6E:** Deal Acceleration & Follow-up Engine
- **Phase 6F:** Decision Explainability, Analytics, & UI Layer
