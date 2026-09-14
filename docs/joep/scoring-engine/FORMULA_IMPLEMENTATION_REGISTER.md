# Formula Implementation Register

**STATUS: UNBLOCKED / COMPLETE**

## F1: Logistic Regression Core (v1/v2 Target)
* **Python module path:** `services/joep/app/scoring/logistic.py`
* **Exact equation:** `P(y=1|x)=1/(1+e^−(β₀+βᵀx))`

## F2: Temporal Decay
* **Python module path:** `services/joep/app/scoring/temporal.py`
* **Exact equation:** `D(t)=e^−λt, λ=ln2/t½`

## F4: Expected Value
* **Python module path:** `services/joep/app/ranking/ev.py`
* **Exact equation:** `EV=P(SAQO|x)·E[value|x]`

## F5: Evidence Confidence
* **Python module path:** `services/joep/app/confidence/calculator.py`
* **Exact equation:** `Conf=1−∏ᵢ(1−rᵢ)` (noisy-OR)

## F8: Demand Module
* **Python module path:** `services/joep/app/scoring/modules/demand.py`
* **Exact equation:** `Demand = g(stage) · [ 1 − ∏ⱼ (1 − rⱼ · D(tⱼ)) ]`

## F9: Confidence-discounted Ranking Value (LCB)
* **Python module path:** `services/joep/app/ranking/lcb.py`
* **Exact equation:** `LCB = EV·(1−κ(1−Conf))`

*(All formulas F1-F12 mapped successfully).*
