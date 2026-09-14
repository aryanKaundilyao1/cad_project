# Phase 1: Python Service Architecture

## Project Structure
```text
scoring_engine/
├── app/
│   ├── main.py                 # FastAPI application entrypoint
│   ├── api/                    # REST endpoints (POST /score/lead, etc.)
│   ├── core/                   # Config, security, exceptions
│   ├── models/                 # Pydantic domain models
│   ├── schemas/                # API request/response schemas
│   ├── gates/                  # G1-G5 Evaluators
│   ├── icp/                    # ICP Routing & Classification
│   ├── roles/                  # Commercial Role assignment
│   ├── products/               # Product matching algorithms
│   ├── enrichment/             # T0-T7 enrichment orchestration
│   ├── signals/                # Signal definition & extraction
│   ├── events/                 # Event clustering / deduplication
│   ├── features/               # Feature engineering
│   ├── missing_data/           # Missing-state transition rules
│   ├── scoring/                # [BLOCKED] Scoring modules
│   ├── confidence/             # [BLOCKED] Evidence confidence formulas
│   ├── value/                  # [BLOCKED] Commercial value math
│   ├── ranking/                # [BLOCKED] EV/Sales Priority calculation
│   ├── explainability/         # Deterministic reason generation
│   ├── research/               # Research task generation
│   ├── calibration/            # Baseline and feedback calibration
│   ├── validation/             # NDCG, Precision@K metrics
│   ├── repositories/           # Supabase database access layer
│   ├── services/               # Orchestration services
│   ├── workers/                # Celery/RQ task definitions
│   ├── config/                 # Client configurations (Infonics, etc.)
│   └── tests/                  # Pytest suite
```

## Integration Architecture
- **API**: FastAPI providing synchronous evaluation and asynchronous task triggering.
- **Worker**: Redis Queue (RQ) or Celery for `rescore_batch` and `enrichment` pipelines.
- **Database**: `supabase-py` or async `postgrest` client accessing the Phase 1 schema.

## FINAL ARCHITECTURE QUESTIONS ANSWERED

**What happens the instant a raw lead enters JAS?**
It hits the REST API (`POST /score/lead`) or worker queue, is saved to `joep_raw_leads`, and begins the pipeline.

**How is a lead normalized?**
Standard lowercasing, domain extraction (stripping www/http), and string sanitization applied during `app/features/normalization.py`.

**How is entity identity resolved?**
Deterministic matching against `joep_entities` via domain first, then normalized legal name. Conflicting sources create a manual resolution task instead of merging.

**What is actually allowed to disqualify it?**
Only a verified hard incompatibility (G1-G4) or absolute client exclusion (G5) can result in a `FAIL` GateState.

**How is commercial role determined?**
Via firmographic keyword heuristics and industry mapping defined in `joep_commercial_roles` config.

**How is ICP determined?**
Matched via role and firmographics, acting as a context router for specific feature weights.

**How are products matched?**
Entity firmographics are mapped against target profiles in `joep_products`.

**How is enrichment prioritized?**
Cost-aware T0 to T7 pipeline. Stops at T4 (Event Search) if potential is too low to justify commercial API (T5) costs.

**How are signals stored?**
In `joep_signal_observations`, tied to a canonical entity and an event cluster.

**How are duplicate signals prevented?**
Clustered by `entity_id` + `location` + `time_window` + `semantic_type` in `joep_event_clusters`.

**How is recency handled?**
[BLOCKED] Will use Exponential Decay (D(t) = e^-λt), but exact half-lives are missing from the source documentation.

**How are missing fields represented?**
As explicit Enum states (`NOT_OBSERVED`, `UNKNOWN`, `CONFIRMED_ABSENT`). Never as `0` or empty string.

**How does every scoring module work?**
[BLOCKED] Detailed logic missing from authoritative source.

**Which exact formula implements every module?**
[BLOCKED] Formulas F1-F12 missing from authoritative source.

**How are scores aggregated?**
[BLOCKED] Geometric core / non-compensatory aggregate, but exact math missing.

**How is Opportunity Quality different from Confidence?**
Quality measures potential; Confidence measures evidence reliability. They are computed and stored as separate variables.

**How is Commercial Value calculated?**
[BLOCKED] Expected to be based on sites, unit value, and rollout factor, but exact equation is missing.

**How is Sales Priority determined?**
[BLOCKED] Risk-adjusted Expected Value equation is missing.

**How is Research Priority determined?**
High estimated Quality + Low Confidence drives tasks into `INVESTIGATE_NOW`.

**How is Outreach Readiness determined?**
Presence of verified contact details (Email/Phone/LinkedIn) and decision-makers.

**Why does Lead A rank above Lead B?**
Because its Risk-Adjusted Expected Value (Sales Priority) is higher, based on the confidence-adjusted quality and commercial value.

**What happens when a score fails?**
Status becomes `SCORING_ERROR`. Retries up to 3 times before requiring manual intervention. Old snapshot remains active.

**What triggers rescoring?**
New signal, signal expiration, config change, or manual dirty flag.

**How does refresh behave?**
Asynchronous. Frontend fetches current snapshot -> checks dirty flag -> queues rescore if needed -> displays "UPDATING" -> polls via websocket/rest for new snapshot.

**How do scores reach Opportunity Intelligence?**
UI directly queries `joep_score_snapshots` filtering by `is_current = TRUE`.

**How does a lead enter CRM?**
User triggers "Add to CRM", API copies `current_score_snapshot` ID into `joep_crm_records` alongside external CRM ID.

**How are outcomes fed back?**
Webhooks/API endpoints capture funnel state changes into `joep_outcomes` without immediately retraining the model.

**How will the engine later learn?**
Through batch calibration scripts running against collected `joep_outcomes` (SAQO events).

**Which components are universal?**
The core FastAPI framework, gate evaluation logic, missing data handling, and normalization logic.

**Which components are client-specific?**
Products, ICP definitions, Gate thresholds, and Event weights.

**Which components are Infonics-specific?**
Currently, Infonics serves as the reference implementation via `config/clients/infonics.yaml`.

**What exact files must developers build?**
Mapped exactly in `FILE_IMPLEMENTATION_MAP.md`.
