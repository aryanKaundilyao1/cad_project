# DEPRECATED

This document is superseded by JOEP v2.

Do not use this document for new scoring-engine implementation.

Authoritative sources:
- JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md
- JOEP-v2-GATES-ICP-ROUTING.md
- JOEP-v2-IMPLEMENTATION-PLAN.md

---

# Engagement Scoring Engine

## Purpose
The Engagement Score is the 4th pillar of the JAS CONNECT Intelligence Engine. It determines "Are the right people involved?" by analyzing the breadth and seniority of the buying committee engaging with JAS CONNECT content, sales reps, or platform interfaces.

## Features Extracted
- `distinct_engaged_contacts`: Number of unique contacts matching the company who have had an interaction.
- `contact_seniority`: List of roles for the engaged contacts.
- `crm_interactions`: Volume of CRM-logged interactions (meetings, emails).
- `engagement_recency`: Days since the last interaction.

## Scoring Formula (Max 20 pts)
`Engagement_raw = StakeholderCount_pts + SeniorityWeight_pts`

1. **Stakeholder Count (Max 14 pts)**
   `min(14, 4 + 5×(distinct_engaged_contacts – 1))`
   - 1 Contact = 4 pts
   - 2 Contacts = 9 pts
   - 3+ Contacts = 14 pts

2. **Seniority Weight (Max 6 pts)**
   `6 × (Σ role_weight / n_contacts)`
   - C-suite/VP/Owner/Founder/Head = 1.0 weight
   - Director/Manager = 0.7 weight
   - Individual Contributor = 0.4 weight

## Reason Codes
The engine emits reason codes such as "Broad buying committee detected" or "High C-level executive involvement" based on the sub-scores.
