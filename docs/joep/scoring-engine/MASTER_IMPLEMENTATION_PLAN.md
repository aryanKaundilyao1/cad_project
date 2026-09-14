# Master Implementation Plan

## SPRINT 1: Python Service Skeleton + Domain Models (COMPLETE)
OBJECTIVE: Create FastAPI skeleton and Pydantic schemas mapping to Phase 1 DB.
FILES TO CREATE: `app/main.py`, `app/models/domain.py`

## SPRINT 2: Database Repositories & Configuration
OBJECTIVE: Implement Supabase repository access.
FILES TO CREATE: `app/repositories/supabase_repo.py`, `app/core/config.py`

## SPRINT 3: Hard Gates, Role + ICP
OBJECTIVE: Evaluate G1-G5, Role, and ICP Routing.
FILES TO CREATE: `app/gates/evaluator.py`, `app/icp/router.py`
ALGORITHMS: Deterministic IF/THEN exclusion checking.

## SPRINT 4: Lead DNA + Product Matching
OBJECTIVE: Map raw facts to Lead DNA and compute Product Fit.
ALGORITHMS: Gaussian spec similarity `exp( − ( (Δ) / σ )² )`.

## SPRINT 5: Signals + Event Model
OBJECTIVE: Deduplicate signals and apply temporal decay.
ALGORITHMS: F2 Exponential Decay (`D(t)=e^−λt`). Event clustering.

## SPRINT 6: Feature Engineering + Missing Data
OBJECTIVE: Safely handle sparse data without zeroing out unobserved facts.

## SPRINT 7: Scoring Modules
OBJECTIVE: Implement the 7 specific JOEP modules (Demand, Procurement, Fit, Value, Timing, Competitive, Strategic).
ALGORITHMS: F8 (Demand), F-Procurement, F-Commercial Value.
MISSING-DATA BEHAVIOR: `NOT_OBSERVED` modules are excluded from the geometric core calculation.

## SPRINT 8: Opportunity Quality & Confidence
OBJECTIVE: Implement the Geometric Core and Noisy-OR confidence.
ALGORITHMS: Geometric Core `Q(o) = [ ∏ₖ Mₖ^{wₖ} ] · (1 + Strategic) − CompetitivePenalty`. Noisy-OR F5 `Conf(o) = 1 − ∏ᵢ ( 1 − rᵢ · D(tᵢ) · δᵢ )`.

## SPRINT 9: Ranking (EV & LCB)
OBJECTIVE: Implement Risk-Adjusted Sales Priority.
ALGORITHMS: F4 Expected Value (`EV=Q·E[value]`), F9 Lower Confidence Bound (`LCB=EV·(1−κ(1−Conf))`).

## SPRINT 10-13: UI, Background Jobs, 5K Validation
OBJECTIVE: Complete system integration and validate ranking on 5000 leads.

==================================================
## SOURCE COVERAGE AUDIT
- JOEP SECTION 1-6 (Gates/Context): Mapped to Sprint 3. Status: COMPLETE.
- JOEP SECTION 7 (Formal Gate Math): Mapped to Sprint 3. Status: COMPLETE.
- JOEP SECTION 11-23 (Modules & Formulas): Mapped to Sprint 7-9. Status: **COMPLETE (Unblocked)**.
