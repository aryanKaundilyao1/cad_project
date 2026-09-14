# DEPRECATED

This document is superseded by JOEP v2.

Do not use this document for new scoring-engine implementation.

Authoritative sources:
- JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md
- JOEP-v2-GATES-ICP-ROUTING.md
- JOEP-v2-IMPLEMENTATION-PLAN.md

---

# Timing Scoring Engine Architecture

The Timing Scoring Engine is the third pillar of the Opportunity Scoring Framework. It calculates a maximum of 25 points indicating whether a company has a reason to buy *right now*.

## Core Components
1. **Feature Registry**: Defines the known timing signals (e.g., funding, RFPs).
2. **Feature Snapshot Engine**: Takes a point-in-time snapshot of these features.
3. **Scoring Sub-Engines**:
   - **ExplicitSourcingEngine (10 pts)**: Has the company issued an RFP, RFQ, or Tender?
   - **TriggerEventRelevanceEngine (8 pts)**: Evaluates funding, expansion, or permits with a recency decay.
   - **RelevantJobPostingEngine (4 pts)**: Are they hiring roles related to the product?
   - **ContractRenewalTimingEngine (3 pts)**: Is a competitor contract up for renewal soon?
4. **Reason Code Generator**: Explains exactly why the score was assigned.
5. **Persistence Service**: Saves the score, versions it, logs history, and generates audit trails.
