# DEPRECATED

This document is superseded by JOEP v2.

Do not use this document for new scoring-engine implementation.

Authoritative sources:
- JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md
- JOEP-v2-GATES-ICP-ROUTING.md
- JOEP-v2-IMPLEMENTATION-PLAN.md

---

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
