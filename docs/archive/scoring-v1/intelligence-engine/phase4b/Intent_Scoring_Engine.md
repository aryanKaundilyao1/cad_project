# DEPRECATED

This document is superseded by JOEP v2.

Do not use this document for new scoring-engine implementation.

Authoritative sources:
- JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md
- JOEP-v2-GATES-ICP-ROUTING.md
- JOEP-v2-IMPLEMENTATION-PLAN.md

---

# Intent Scoring Engine Architecture

The Intent Scoring Engine is the second pillar of the Opportunity Scoring Framework. It calculates a maximum of 30 points indicating whether a company is actively researching a solution.

## Core Components
1. **Feature Registry**: Defines the known intent signals (e.g., surging topics, demo requests).
2. **Feature Snapshot Engine**: Takes a point-in-time snapshot of these features.
3. **Scoring Sub-Engines**:
   - **TopicSurgeEngine (10 pts)**: Evaluates third-party B2B topic surge (e.g., Bombora).
   - **FirstPartyIntentEngine (8 pts)**: High-value actions on our own properties (pricing, demo).
   - **ReviewActivityEngine (5 pts)**: Activity on software review sites.
   - **SearchIntentEngine (4 pts)**: Competitor comparisons.
   - **SocialIntentEngine (3 pts)**: Engagement on social media.
4. **Reason Code Generator**: Explains exactly why the score was assigned.
5. **Persistence Service**: Saves the score, versions it, logs history, and generates audit trails.
