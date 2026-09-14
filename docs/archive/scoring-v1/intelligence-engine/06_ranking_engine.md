# DEPRECATED

This document is superseded by JOEP v2.

Do not use this document for new scoring-engine implementation.

Authoritative sources:
- JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md
- JOEP-v2-GATES-ICP-ROUTING.md
- JOEP-v2-IMPLEMENTATION-PLAN.md

---

14.3 Identifying the Top 1%
Universe = all companies in target market/geography/industry for product p
Rank companies by P_final descending
Top1% = companies where P_final ≥ Percentile(P_final distribution, 99)
For go-to-market prioritization, also compute Expected Value rather than probability alone:
EV(company) = P_final(company) × EstimatedDealSize(company, product) × FitMultiplier
```//This re-ranks the top 1% by *revenue-weighted* likelihood, not just raw probability — a 60%-likely enterprise account can outrank a 90%-likely micro account.

---

*See 03_purchase_probability_engine.md for base probability scoring.*
