# DEPRECATED

This document is superseded by JOEP v2.

Do not use this document for new scoring-engine implementation.

Authoritative sources:
- JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md
- JOEP-v2-GATES-ICP-ROUTING.md
- JOEP-v2-IMPLEMENTATION-PLAN.md

---

7. How Enterprise Platforms Actually Score (Synthesis)
Platform	Core Mechanism	Key Design Choice
6sense	AI/ML model trained on historical won/lost opportunity patterns (not rule-based points). Produces an Intent Score (0–100) predicting likelihood of opening an opportunity in the next 90 days, plus a 5-stage Buying Stage classification: Target → Awareness → Consideration → Decision → Purchase.<cite index="1-1,3-1">6sense's metric is based on historical precedents of past behavior rather than front-end conjecture, modeled after the activities that actually led to other opened opportunities and closed deals, and the predictive buying stages indicate the likelihood of an account opening or progressing in the next 90 days.</cite> A "6QA" (qualified account) only fires when profile fit, buying stage, intent intensity, and buying-group breadth cross thresholds simultaneously — a multi-dimensional gate rather than a single score.	
Bombora	Pure topic-surge measurement: compares an account's content consumption over a trailing 3-week window against its own 12-week historical baseline per topic.<cite index="12-1">For a specific account, an Intent Topic is given a score of 0-100, and if the topic gets a score of 60 or above, it's considered a surging Intent Topic for that account</cite>, and <cite index="17-1">factors feeding the score include topic consumption by interaction volume, topic relevancy weight of the content, and depth of engagement such as dwell time and scroll behavior.</cite> Best-practice activation requires topic thresholding — multiple simultaneous surging topics, not one.	
ZoomInfo	Combines firmographic/technographic fit scoring with its own intent data (Intent+ / website visitor identification) and scoring rules configurable by the buyer — more rules-based/customizable than 6sense's ML-first approach, blended with real-time buying signals (funding, hiring, tech changes).	
Apollo	Lighter-weight fit + engagement scoring built into a prospecting workflow; intent data available as an add-on; heavier reliance on firmographic filters + direct engagement (email opens, replies) than deep third-party intent modeling.	
Demandbase	Similar to 6sense: an "Engagement Minutes" / Engagement Points model where different signal types (first-party site behavior, Bombora topics, G2 intent, ad engagement) are each assigned point values and summed, with explicit tiering of topic value (generic topics scored lower, competitor/high-value topics scored higher) so the model stays interpretable rather than a pure black box.	
Cross-cutting lessons for JAS CONNECT's design:

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
