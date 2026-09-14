# JOEP v2 Formula Source of Truth

This document contains the exact, unredacted mathematical formulas for the JOEP v2 scoring engine, acting as the ultimate authority for implementation.

## 1. Formula Registry (F1-F12)

| ID | Formula (schematic) | Purpose | Status |
|---|---|---|---|
| F1 | `P(y=1|x)=1/(1+e^−(β₀+βᵀx))` | Logistic regression log-odds (v1/v2 core) | ESTABLISHED |
| F2 | `D(t)=e^−λt,  λ=ln2/t½` | Exponential decay for signals | ADAPTED |
| F3 | `h(t)=h₀(t)·e^(βᵀx)` | Cox proportional hazards | ADAPTED |
| F4 | `EV=P(SAQO|x)·E[value|x]` | Expected value ranking driver | JAS-DERIVED |
| F5 | `Conf=1−∏ᵢ(1−rᵢ)` | Noisy-OR evidence corroboration | ADAPTED |
| F6 | `w = AHP eigenvector / entropy / CRITIC` | Cold-start weight initialization | ESTABLISHED |
| F7 | `score=Σ wᵢ·WoEᵢ(xᵢ)` | Weight-of-evidence scorecard | ADAPTED |
| F8 | `Demand = g(stage) · [ 1 − ∏ⱼ (1 − rⱼ · D(tⱼ)) ]` | Demand module score | JAS-DERIVED |
| F9 | `LCB = EV·(1−κ(1−Conf))` | Confidence-discounted ranking value | JAS-DERIVED |
| F10 | `Platt: p=1/(1+e^(Af+B)); Isotonic` | Probability calibration | ESTABLISHED |
| F11 | `NDCG@K, Precision@K` | Ranking evaluation | ESTABLISHED |
| F12 | `LambdaMART ranking objective` | Learning-to-rank endpoint | ESTABLISHED |

## 2. Master Aggregations

### Layer 2 - Opportunity Quality (Geometric Core)
```
Q(o) = [ ∏ₖ Mₖ(o)^{wₖ} ] · (1 + Strategic(o)) − CompetitivePenalty(o)
```
**Rule:** Only observed/estimable modules enter the geometric core. A verified low module value depresses Q; an unobserved module is handled by missing-data policies (not silently set to zero).

### Layer 3 - Evidence Confidence
```
Conf(o) = 1 − ∏ᵢ ( 1 − rᵢ · D(tᵢ) · δᵢ )
```
Where `rᵢ` = source reliability, `D(tᵢ)` = recency decay, `δᵢ` = directness.

### Layer 4 - Expected Value & Ranking
```
EV(o) = Q(o) · E[value|x] · P(downstream funnel)
LCB(o) = EV(o) · ( 1 − κ·(1 − Conf(o)) )
```

## 3. Sub-Modules
- **Product Fit:** `Fit(o) = max over p [ compat(p, need_o) ]` (Gaussian spec similarity: `exp( − ( (pitch_need − pitch_capable) / σ_pitch )² )`)
- **Procurement:** `ProcReady(o) = a(stage) · access(route, o)`
- **Commercial Value:** `E[value|x] = unit_value × n_sites × rollout_factor + service/AMC_potential`
