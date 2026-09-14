# File-by-File Implementation Map

## API & Core

PATH: `app/main.py`
PURPOSE: FastAPI application entrypoint.
PHASE: Phase 24 (API Architecture)
DEPENDENCIES: `app.api.router`, `app.core.config`
INPUTS: REST Requests
OUTPUTS: JSON Responses
TEST FILE: `tests/test_main.py`

PATH: `app/core/config.py`
PURPOSE: Central Pydantic settings management.
PHASE: Phase 1
DEPENDENCIES: None
INPUTS: Environment Variables
OUTPUTS: Settings Object
TEST FILE: `tests/core/test_config.py`

## Models & Database

PATH: `app/models/domain.py`
PURPOSE: Pydantic schemas mapping to JOEP canonical data.
PHASE: Phase 2
DEPENDENCIES: None
INPUTS: Dictionary/JSON payloads
OUTPUTS: Validated Pydantic objects
TEST FILE: `tests/models/test_domain.py`

PATH: `app/repositories/supabase_repo.py`
PURPOSE: Database access layer for Supabase/PostgreSQL.
PHASE: Phase 3
DEPENDENCIES: `supabase-py`, `app.models.domain`
INPUTS: Queries/Updates
OUTPUTS: Domain Models
TEST FILE: `tests/repositories/test_supabase_repo.py`

## Gates & Routing

PATH: `app/gates/evaluator.py`
PURPOSE: Implements G1-G5 logic. Ensures verified hard fails disqualify.
PHASE: Phase 8
DEPENDENCIES: `app.models.LeadDNA`, `app.config.ClientGateConfig`
INPUTS: `LeadDNA`, `CanonicalEntity`
OUTPUTS: `GateResult` array
TEST FILE: `tests/gates/test_evaluator.py`

PATH: `app/icp/router.py`
PURPOSE: Classifies leads into ICPs and loads context routing.
PHASE: Phase 10
DEPENDENCIES: `app.models.LeadDNA`
INPUTS: `LeadDNA`, `CommercialRole`
OUTPUTS: `ICPAssignment`
TEST FILE: `tests/icp/test_router.py`

## Scoring (BLOCKED)

PATH: `app/scoring/modules.py`
PURPOSE: Evaluates mathematical formulas for Quality, Demand, Fit.
PHASE: Phase 19
DEPENDENCIES: `app.features.FeatureRegistry`
INPUTS: [BLOCKED]
OUTPUTS: [BLOCKED]
TEST FILE: `tests/scoring/test_modules.py`

PATH: `app/ranking/ev.py`
PURPOSE: Computes Risk-Adjusted Expected Value (EV) and Sales Priority.
PHASE: Phase 24
DEPENDENCIES: `app.scoring.modules`, `app.confidence.calculator`
INPUTS: [BLOCKED]
OUTPUTS: [BLOCKED]
TEST FILE: `tests/ranking/test_ev.py`
