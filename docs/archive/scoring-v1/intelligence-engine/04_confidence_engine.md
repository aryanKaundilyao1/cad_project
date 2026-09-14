# DEPRECATED

This document is superseded by JOEP v2.

Do not use this document for new scoring-engine implementation.

Authoritative sources:
- JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md
- JOEP-v2-GATES-ICP-ROUTING.md
- JOEP-v2-IMPLEMENTATION-PLAN.md

---

4.3 Beta-Binomial Model for Confidence Intervals
Treat each observed signal as a weighted "vote" toward Buy/Not-Buy, and model uncertainty using the Beta distribution (the conjugate prior for a binomial/Bernoulli process):
Prior:      θ ~ Beta(α₀, β₀)             // α₀, β₀ derived from historical base rate
Update:     θ | data ~ Beta(α₀ + Σ successes, β₀ + Σ failures)
Point est.: P̂ = α / (α + β)
Credible
interval:   [Beta⁻¹(0.025; α, β),  Beta⁻¹(0.975; α, β)]   // 95% credible interval
The width of this interval is the natural confidence metric (Section "Confidence Calculations" below) — few signals observed → wide interval → low confidence; many corroborating signals → narrow interval → high confidence, independent of whether the point estimate is high or low.

14.2 Confidence Calculation (explicit formula)
Confidence should answer: "How much do I trust this probability, independent of whether it's high or low?"
Confidence = DataCompleteness × SourceReliability × RecencyFactor × (1 – IntervalWidthPenalty)

DataCompleteness   = (Σ weights of observed signals) / (Σ weights of all possible signals for this product)
SourceReliability  = weighted avg of per-source trust scores (e.g., government tender data = 0.98,
                      inferred technographic detection = 0.6, social engagement = 0.5)
RecencyFactor       = e^(–λ_conf × days_since_most_recent_signal)
IntervalWidthPenalty = (CI_upper – CI_lower) from the Beta-Binomial posterior (Section 4.3),
                        normalized to [0,1]
A company with a high point-probability but only 1–2 stale signals should show high probability, low confidence — this distinction is essential and is missing from most simplistic scoring tools.

*See 03_purchase_probability_engine.md for full probabilistic framework.*
