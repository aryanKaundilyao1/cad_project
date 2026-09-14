JAS  ×  INFONICS

Unified Opportunity Qualification, Routing, Scoring & Ranking Engine

An implementation-ready quantitative engineering & decision-science specification for the complete JOEP v2 path

from RAW CANDIDATE → HARD ELIGIBILITY → ICP ROUTING → SCORING → CONFIDENCE → RANKING → ACTION

Document ID:  JOEP-INFONICS-v2.0

Primary client:  Infonics Technologies Global Pvt. Ltd., Noida, Uttar Pradesh, India

Supersedes the mandatory G1–G10 pre-scoring chain while preserving the existing scoring formulas, evidence discipline, calibration logic and learning roadmap.

Prepared: September 2026   ·   JAS Connect

A quantitative research & engineering specification, not a marketing document.

Every parameter is labelled by evidence status. No arbitrary point scores are used.

# JOEP v2 supersession notice

This file is the implementation source of truth for the Infonics/JAS pipeline. It preserves the scoring mathematics and formula provenance of `JOEP-INFONICS-SCORING-v0.1` while correcting the gate and routing rules exposed by the 5,000-lead outbound test. The previous rule requiring all G1–G10 states to be PASS before any score could be computed is superseded.

**Core v2 invariant:** a candidate is disqualified only by verified hard incompatibility or a client-defined absolute exclusion. Missing soft evidence reduces confidence, triggers enrichment/research, or remains unknown; it does not automatically block scoring. Procurement evidence is a positive buying-readiness signal, not a universal eligibility requirement.

The canonical v2 path is:

`CLIENT DNA → OFFERING DNA → RAW INGESTION → ENTITY RESOLUTION → BASIC LEAD DNA → HARD ELIGIBILITY GATES → COMMERCIAL ROLE → ICP ROUTING → PROGRESSIVE ENRICHMENT → SIGNALS → SCORING → EVIDENCE CONFIDENCE → COMMERCIAL VALUE → SALES PRIORITY / RESEARCH PRIORITY → OUTPUT → OUTCOME CAPTURE → RECALIBRATION`

# How to read this document — evidence labels

This specification inherits the evidence discipline of the pre-scoring architecture and extends it to every mathematical choice. No weight, threshold, decay rate, or module formula appears without a provenance label. Four labels govern how much trust the engine and the reader should place in a quantity.

| Label | Meaning | How JAS must treat it |
| --- | --- | --- |
| ESTABLISHED | A published, peer-reviewed or textbook method, used directly or with a stated adaptation | Usable as method scaffolding; its parameters still need Infonics data before they are trusted as production values |
| RESEARCH PRIOR — REQUIRES EMPIRICAL VALIDATION | A defensible starting value derived from literature or reasoned expert judgement, not from Infonics outcomes | Usable to run v0; must be replaced by calibrated values as data arrives. Never reported as validated performance |
| CLIENT DATA REQUIRED | A quantity that cannot be set from public research and must come from Infonics | Blocks full automation of the module until the onboarding question is answered |
| NO VALIDATED FORMULA — EXPERIMENT REQUIRED | A design question the literature does not settle for this exact problem | Handled by an explicit experiment or a clearly-labelled expert prior; never presented as fact |

| The six invariants this architecture protects<br>QUALIFICATION ≠ SCORING  ·  FIT ≠ INTENT  ·  OPPORTUNITY QUALITY ≠ EVIDENCE CONFIDENCE  ·  ACCOUNT ≠ OPPORTUNITY  ·  CONTACTABILITY ≠ PURCHASE PROPENSITY  ·  CORRELATION ≠ INDEPENDENT EVIDENCE. Every modelling decision below is checked against these. Where a common lead-scoring shortcut violates one, the shortcut is rejected and the rejection is stated in place. |
| --- |

# Contents
*(Detailed implementation content as defined in JOEP v2 documentation)*

# 1. Executive summary

JOEP v2 no longer assumes that a raw outbound candidate must already look like a fully evidenced live procurement opportunity before it can be scored. The eligibility layer now answers only the narrow structural question: **is there verified evidence that this candidate makes no commercial sense for Infonics?** If not, the candidate may continue to commercial-role classification, ICP routing, progressive enrichment and scoring even when demand, procurement, timing or contact evidence is incomplete.

The scoring layer then answers the harder question:

Given a heterogeneous set of eligible Infonics candidates with unequal information depth, in what order should a finite sales team work them — and which uncertain candidates are worth researching next?

That reframing drives every recommendation in this document. Ranking, not classification, is the deliverable. A model that is only 62% accurate at predicting a win can still be extremely valuable if the opportunities it puts in the top 20 convert far better than a random or firmographic-only list. Conversely, a model with a flattering global accuracy that shuffles the top of the list is worthless to a sales head who only ever works the top of the list. The literature on B2B lead prioritisation converges on exactly this point: the useful metric is precision among the highest-ranked leads, not overall classification accuracy (D’Haen & Van den Poel, 2013; Frontiers in AI, 2025).

### What this document recommends, in one page

1. Target. Do not train v0 on P(Won). Wins are sparse in a new engine and are contaminated by salesperson execution that happens after JAS makes its recommendation, so training on them would blame or credit JAS for things it did not control. The v0 primary target is a JAS-observable, earlier funnel event — Sales-Accepted Qualified Opportunity, P(SAQO | x) — with the eventual win modelled as a separate multiplicative funnel stage.

2. Two quantities, never fused by default. Opportunity quality (how good the opportunity is) and evidence confidence (how sure we are of the facts) are computed by separate models and reported as separate numbers. The pre-scoring architecture already refuses to collapse UNCERTAIN into FAIL; scoring keeps that discipline by refusing to collapse "weak evidence" into "weak opportunity".

3. Rank by risk-adjusted expected value, not by probability. A 40% shot at a ₹20 lakh video-wall rollout outranks a 70% shot at a ₹1 lakh single standee (expected values ₹8.0L vs ₹0.7L). Ranking on probability alone would invert that. Expected value is modulated — not multiplied — by a confidence-based lower bound so that a high value resting on one flimsy source cannot dominate the list.

4. Reject the flat weighted average as the core model. S = Σ wᵢMᵢ over 0–100 subscores remains too compensatory and also mishandles sparse outbound data when missing modules are silently treated as zero. JOEP v2 keeps the existing non-compensatory scoring mathematics but changes the rules around module participation: **verified negative evidence can be low/zero; unobserved evidence is missing and must not masquerade as a negative.** Hard structural impossibilities are handled by the new hard-gate layer; procurement/demand/timing are graded modules when observed.

5. Staged maturity. Weights are research priors now (AHP + entropy, triangulated), client-calibrated pairwise judgements next, penalised logistic-regression coefficients once ~10–20 outcomes per predictor exist, and learning-to-rank / gradient boosting only when outcome volume and calibration justify it. The architecture does not change across v0 → v1 → v2; only the source of the numbers does.

| The single most important honesty statement in this document<br>The ‘80%’ ambition is a validation target, not a starting claim. Until an Infonics backtest exists, JAS has no accuracy. The right first objective is Precision@20 ≥ 0.80 — at least 16 of the top 20 recommendations independently judged worthwhile — and even that must be reported with a confidence interval, because 20 items is a small sample. Any number presented before the backtest is a research prior, and this document labels it as such every time. |
| --- |

# 2. Research methodology
The method deliberately runs problem-first, not formula-first. The brief’s own final instruction — do not search for “best lead scoring formula” and staple together whatever appears — is the governing constraint. The sequence was:

- State the statistical problem (ranking of qualified opportunities under sparse labels and heavy missingness) before looking at any method.
- Decompose it into sub-problems and ask, for each, what class of model the sub-problem actually is.
- Search the scientific literature per sub-problem across statistics, machine learning, operations research, marketing science, sales management, IR/ranking.
- Interrogate each candidate method against its assumptions and against the Infonics reality.
- Adopt, adapt, or reject — and where the literature does not settle a question, say so and define the experiment that would.

# 3. Systematic literature review
*(Full systematic review detail per JOEP v2)*
1. B2B lead scoring & prospect prediction
2. Organisational buying behaviour & procurement
3. Credit / risk scoring
4. Multi-criteria decision analysis (MCDA)
5. Survival analysis & temporal decay
6. Evidence fusion & uncertainty
7. Ranking, calibration & evaluation

# 4. Research evidence register
*(Full evidence register detail per JOEP v2)*

# 5. Formula provenance register
*(Full formula register per JOEP v2: F1-F12)*

# 6. Gate vs score vs context vs confidence — JOEP v2
The most consequential architectural decision is which variables are allowed to remove a candidate, which variables are allowed to move a score, and which variables merely describe uncertainty or execution readiness. JOEP v2 tightens the original rule: **a hard gate exists only when verified evidence establishes that the candidate should not proceed as a plausible commercial opportunity for this client.**

# 7. Formal gate mathematics — JOEP v2 hard-eligibility layer
*(Full gate mathematics per JOEP v2)*

# 8. Target variable definition
*(Full target definitions per JOEP v2)*

# 9. Feature registry
*(Full feature registry per JOEP v2)*

# 10. Feature engineering architecture
*(Full FE architecture per JOEP v2)*

# 11. Temporal / recency models
*(Full temporal models per JOEP v2)*

# 12. Demand / intent model
*(Full demand intent model per JOEP v2)*

# 13. Product × application compatibility model
*(Full compatibility model per JOEP v2)*

# 14. Procurement readiness model
*(Full procurement model per JOEP v2)*

# 15. Commercial potential model
*(Full commercial potential model per JOEP v2)*

# 16. Strategic relevance & buyer-accessibility (justified sub-modules)
*(Full strategic relevance model per JOEP v2)*

# 17. Evidence confidence model
*(Full evidence confidence model per JOEP v2)*

# 18. Correlation & double-counting controls
*(Full correlation controls per JOEP v2)*

# 19. Weight-estimation research & staged architecture
*(Full staging logic per JOEP v2)*

# 20. Cold-start weight architecture (v0 priors)
*(Full cold-start architecture per JOEP v2)*

# 21. Module-level equations — consolidated
*(Full module equations per JOEP v2)*

# 22. Aggregation model comparison
*(Full aggregation models per JOEP v2)*

# 23. Recommended opportunity model
*(Full recommended opportunity model per JOEP v2)*

# 24. ICP-specific model architecture
*(Full ICP model architecture per JOEP v2)*

# 25. Ranking model
*(Full ranking model per JOEP v2)*

# 25A. Dual priority outputs — sales vs research
*(Full dual priority definitions per JOEP v2)*

# 26. Missing-data model
*(Full missing-data model per JOEP v2)*

# 27. Sample-size requirements
*(Full sample-size constraints per JOEP v2)*

# 28. Validation framework & what ‘80%’ means
*(Full validation framework per JOEP v2)*

# 29. Baselines, backtesting, ablation & sensitivity
*(Full baselines/backtesting per JOEP v2)*

# 30. Probability calibration
*(Full calibration details per JOEP v2)*

# 31. Client calibration protocol
*(Full client calibration protocol per JOEP v2)*

# 32. Outcome learning, CRM feedback & ML transition
*(Full outcome learning loops per JOEP v2)*

# 33. Model governance & explainability
*(Full governance details per JOEP v2)*

# 34. Worked examples
*(Worked examples A-E per JOEP v2)*

# 35. Implementation pseudocode — JOEP v2
*(Pseudocode implementation per JOEP v2)*

# 36. Score-record database fields
*(Database field requirements per JOEP v2)*

# 37. Research gaps & honest unknowns
*(Research gaps per JOEP v2)*

# 38. Questions for Infonics (scoring-layer)
*(Client questions SQ-01..10 per JOEP v2)*

# 39. Production-readiness checklist
*(Production-readiness checklist per JOEP v2)*

# 40. v0 → v1 → v2 maturity summary
*(Maturity summary per JOEP v2)*

# 40A. JOEP v1 → v2 migration register
*(Migration register per JOEP v2)*

# 41. Bibliography
*(Full bibliography per JOEP v2)*

—  End of specification  ·  JOEP-INFONICS-v2.0  —
