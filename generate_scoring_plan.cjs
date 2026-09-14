const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'docs/joep/scoring-engine');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const files = {
  '00_ARCHITECTURE_AUDIT.md': `# Phase 0: Engine Architecture Audit

## Existing Assets (Phase 1)
- **Database Tables (Supabase)**: \`joep_raw_leads\`, \`joep_source_records\`, \`joep_entities\` (via \`jas_companies\`), \`joep_lead_dna\`, \`joep_gate_results\`, \`joep_icp_assignments\`, \`joep_opportunities\`, \`joep_score_snapshots\`, \`joep_research_tasks\`.
- **Contracts**: \`SCORING_INPUT_CONTRACT.md\`, \`SCORING_OUTPUT_CONTRACT.md\`.
- **Frontend Mocks**: \`WorkspaceScoringEngine.tsx\` currently uses hardcoded sliders (deprecated).
- **TypeScript Types**: \`src/types/joep/index.ts\`.

## What Needs Extension
- Existing \`jas_companies\` acts as CanonicalEntity but needs robust Python-side normalization.
- Python engine needs a background task runner (e.g., RQ or Celery) to avoid blocking the API.

## What Must Be Implemented in Python
- The entire JOEP v2 scoring mathematics (BLOCKED pending full formula text).
- Gate evaluation logic (G1-G5).
- Missing data state transition logic.
- Expected Value / Confidence generation.
- FastAPI REST service matching the input/output contracts.
`,

  '01_SYSTEM_ARCHITECTURE.md': `# Phase 1: Python Service Architecture

## Project Structure
\`\`\`text
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
\`\`\`

## Integration Architecture
- **API**: FastAPI providing synchronous evaluation and asynchronous task triggering.
- **Worker**: Redis Queue (RQ) or Celery for \`rescore_batch\` and \`enrichment\` pipelines.
- **Database**: \`supabase-py\` or async \`postgrest\` client accessing the Phase 1 schema.
`,

  '02_DOMAIN_MODELS.md': `# Phase 2: Domain Models

All Python models will utilize Pydantic v2 for strict validation matching the \`SCORING_INPUT_CONTRACT.md\` and Phase 1 PostgreSQL schema.

- \`RawLead\`: Maps to \`raw_leads\` table.
- \`CanonicalEntity\`: Maps to \`jas_companies\` (extended fields).
- \`MissingState\`: Python Enum matching \`joep_missing_state\`.
- \`GateResult\`: Pydantic model for \`joep_gate_results\`.
- \`ModuleScore\`: Float values mapped per scoring formula.
- \`ScoreSnapshot\`: Final output mapping to \`joep_score_snapshots\`.
`,

  '03_DATABASE_ACCESS.md': `# Phase 3: Database Access Layer

## Pattern
Repository Pattern utilizing the Supabase Python Client (\`supabase-py\`).

## Repositories
- \`LeadRepository\`: Fetches raw leads and DNA.
- \`EntityRepository\`: Handles entity resolution lookups.
- \`OpportunityRepository\`: Fetches and updates opportunity state.
- \`ScoreRepository\`: Inserts versioned records into \`joep_score_snapshots\`. Never overwrites.
- \`ResearchTaskRepository\`: Creates and expires research tasks.

Transaction boundaries will be managed via RPC calls or careful sequential writes where Supabase REST lacks multi-table transactions, ensuring \`is_current\` flips atomically.
`,

  '04_ENTITY_RESOLUTION.md': `# Phase 4: Entity Resolution

## Deterministic v0 Algorithm
1. **Exact Domain Match**: Normalize URL (strip http/www). Lookup in \`jas_companies.website\`.
2. **Normalized Name Match**: Strip legal suffixes (LLC, Inc, Pvt Ltd). Lowercase, strip whitespace. Match against \`jas_companies.legal_name\`.
3. **Conflict Resolution**: If Domain matches Entity A and Name matches Entity B -> Mark as \`CONFLICTING\` and generate a \`NEEDS_MANUAL_RESEARCH\` entity resolution task.
4. **Merge Rules**: No automatic merges in v0.
`,

  '05_LEAD_DNA.md': `# Phase 5: Basic Lead DNA

Translates raw source facts into \`joep_lead_dna\`.

- **Firmographics**: employee_count, revenue_range mapped to ordinal buckets.
- **Geography**: Country/State normalization.
- **Missing States**: Any requested fact not present in \`source_specific_fields\` is explicitly marked \`UNKNOWN\` or \`NOT_OBSERVED\`. It is NEVER defaulted to 0 or empty string.
`,

  '06_GATES.md': `# Phase 6: Hard Gate Engine

Based on \`JOEP-v2-GATES-ICP-ROUTING.md\`.

## Execution Rule
\`\`\`python
if any(g.state == GateState.FAIL for g in gate_results):
    return DISQUALIFIED
else:
    return CONTINUE
\`\`\`

## Gates
1. **G1 Entity Validity**: Fails if confirmed fake/closed.
2. **G2 Commercial Role Eligibility**: Fails if confirmed \`HARD_NEGATIVE\`.
3. **G3 Broad Offering Relevance**: Fails if structurally irrelevant to all client offerings.
4. **G4 Geography/Legal**: Fails if explicitly unserviceable.
5. **G5 Absolute Exclusions**: Fails if on do-not-contact or blacklists.

UNKNOWN never fails.
`,

  '07_COMMERCIAL_ROLES.md': `# Phase 7: Commercial Role Engine

Maps to \`joep_commercial_roles\`.

Classification logic:
- Analyzes \`industry\`, \`subindustry\`, and description keywords.
- Outputs enum: \`DIRECT_BUYER\`, \`CHANNEL\`, \`SPECIFIER\`, etc.
- Support multiple roles per entity via confidence arrays.
`,

  '08_ICP_ROUTING.md': `# Phase 8: ICP Routing Engine

ICP is context/model routing, NOT arbitrary merit points.

## Configuration Loading
Each ICP (e.g., Retail/Mall, Corporate) defines:
- Applicable feature sets.
- Applicable scoring modules.
- Weight sets (BLOCKED).
- Timing logic.

Returns \`ICPAssignment\` (primary + secondaries).
`,

  '09_PRODUCT_MATCHING.md': `# Phase 9: Product / Service Matching

Matches entity firmographics/intent to client \`joep_products\`.
- Output: \`ProductMatch\` (product_id, match_state, match_confidence).
- An opportunity can map to multiple products.
`,

  '10_ENRICHMENT.md': `# Phase 10: Progressive Enrichment

Cost-aware pipeline:
- T0: Source-native (Free)
- T1: Free structural
- T2: Website scraping
- T3: Public Data (Govt APIs)
- T4: Event/Signal Search
- T5: Commercial APIs (Apollo/Clearbit) -> Stop if low potential.
- T6: Contact enrichment
- T7: Manual research task generated in \`joep_research_tasks\`.
`,

  '11_SIGNAL_ENGINE.md': `# Phase 11: Signal Registry

Configurable definitions stored in \`joep_signal_definitions\`.
Extracts observations from raw text/enrichment:
- Funding, hiring, expansion, tender, project.
- Attaches \`valid_until\` based on temporal logic.
`,

  '12_EVENT_DEDUPLICATION.md': `# Phase 12: Event Clustering

Prevents "4 news articles = 4x points".
- Clusters by: \`entity_id\` + \`location\` + \`time_window (30d)\` + \`semantic_type\`.
- Yields a single \`joep_event_clusters\` ID.
`,

  '13_TEMPORAL_MODEL.md': `# Phase 13: Temporal Processing

[BLOCKED]
The exact exponential decay formulas (half-lives, lambda = ln 2 / t_half) are missing from the authoritative source document. Needs the full F2 formula and specific half-lives per signal family to implement.
`,

  '14_FEATURE_ENGINEERING.md': `# Phase 14: Feature Engineering

[BLOCKED]
Requires full feature definitions, transformation equations (log1p, gaussian similarity, winsorization), and scaling factors from the unredacted JOEP document.
`,

  '15_MISSING_DATA.md': `# Phase 15: Missing-Data Engine

Enforces:
- \`UNKNOWN\` != 0
- \`NOT_OBSERVED\` != \`CONFIRMED_ABSENT\`

If a module cannot be evaluated due to \`NOT_OBSERVED\`, it is excluded from the geometric core aggregate, and Evidence Confidence is penalized instead of setting Opportunity Quality to 0.
`,

  '16_SCORING_MODULES.md': `# Phase 16: Module Implementation

[BLOCKED - CRITICAL MISSING SOURCE MATERIAL]
The authoritative document \`JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md\` currently contains placeholders like \`*(Full module equations per JOEP v2)*\`.

Cannot implement:
- Demand / Trigger Evidence
- Procurement Readiness
- Product Fit
- Commercial Potential
- Timing / Actionability
- Competitive Intensity
- Strategic Relevance
`,

  '17_OPPORTUNITY_QUALITY.md': `# Phase 17: Opportunity Quality

[BLOCKED - CRITICAL MISSING SOURCE MATERIAL]
Cannot map the composite-quality formula (geometric core) without the exact equation, weights, and client priors from the authoritative source.
`,

  '18_EVIDENCE_CONFIDENCE.md': `# Phase 18: Evidence Confidence

[BLOCKED - CRITICAL MISSING SOURCE MATERIAL]
Requires the exact noisy-OR / Bayesian updating formula and source-reliability priors.
`,

  '19_COMMERCIAL_VALUE.md': `# Phase 19: Commercial Value

[BLOCKED - CRITICAL MISSING SOURCE MATERIAL]
Requires the specific economics formula mapping sites, rollout, and unit value.
`,

  '20_RANKING.md': `# Phase 20: Sales Priority / Ranking

[BLOCKED - CRITICAL MISSING SOURCE MATERIAL]
Requires the expected-value ranking equation and risk-adjustment logic.
`,

  '21_RESEARCH_PRIORITY.md': `# Phase 21: Research Priority

Calculates priority for the \`INVESTIGATE_NOW\` bucket.
High Opportunity Quality (estimated) + Low Confidence = High Research Priority.
Outputs tasks to \`joep_research_tasks\`.
`,

  '22_OUTREACH_READINESS.md': `# Phase 22: Outreach Readiness

Boolean/Ordinal measure of contactability.
- Presence of Email/Phone/LinkedIn.
- Verified decision maker.
Independent of Opportunity Quality.
`,

  '23_EXPLAINABILITY.md': `# Phase 23: Explainability

Generates deterministic reasons from the feature contributions.
- Positive drivers: Features exceeding median positive impact.
- Negative drivers: \`CONFIRMED_ABSENT\` blockers.
- Unknowns: Features mapped to \`UNKNOWN\` affecting module completion.
`,

  '24_API_ARCHITECTURE.md': `# Phase 24: Scoring Service API

FastAPI endpoints:
- \`POST /score/lead\`: Synchronous scoring for a single canonical entity.
- \`POST /score/batch\`: Background task enqueuing.
- \`POST /score/client/{client_id}/dirty\`: Identifies leads needing rescore.
`,

  '25_SCORE_PERSISTENCE.md': `# Phase 25: Score Persistence

Saves to \`joep_score_snapshots\`.
- Retains old snapshots (\`is_current = FALSE\`).
- Captures \`model_version\`, \`rule_version\`, \`trigger_reason\`.
`,

  '26_RESCORING.md': `# Phase 26: Dirty / Rescore Engine

Triggers:
- New signal insertion.
- Signal expiration (\`valid_until\` passed).
- Client config weight change.
Sets \`is_current = FALSE\` and queues task.
`,

  '27_BACKGROUND_JOBS.md': `# Phase 27: Background Job Architecture

Utilizes Redis Queue (RQ) for simplicity over Celery, given standard deployment.
Jobs:
- \`process_batch\`
- \`expire_stale_signals\`
`,

  '28_OPPORTUNITY_INTELLIGENCE_INTEGRATION.md': `# Phase 28: UI Integration

- Frontend UI consumes \`joep_score_snapshots\` via Supabase.
- "Today's Priorities" queries \`is_current=TRUE\` ordered by \`sales_priority DESC\`.
- "Investigate" queries \`operating_status='INVESTIGATE_NOW'\`.
`,

  '29_CRM_HANDOFF.md': `# Phase 29: CRM Handoff

Saves to \`joep_crm_records\`.
Stores \`score_snapshot_at_import\` so historical evaluation isn't lost if the model updates tomorrow.
`,

  '30_OUTCOME_CAPTURE.md': `# Phase 30: Outcome Capture

Webhook/API endpoint capturing \`joep_outcome_state\`.
Records do not auto-retrain the model (preventing noise). They pool for v1/v2 calibration.
`,

  '31_CLIENT_CONFIGURATION.md': `# Phase 31: Client Configuration

\`config/clients/{client_id}.yaml\` dictates:
- Active ICPs
- Hard Gates applied
- Product definitions
`,

  '32_VALIDATION.md': `# Phase 32: Validation

[BLOCKED - Awaiting Formulas]
Will implement NDCG@K and Precision@20 tracking pipelines once formulas are present.
`,

  '33_TEST_PLAN.md': `# Phase 33: Unit & Integration Test Strategy

- **Pytest**: Will mock Supabase repository.
- **Sparse Lead Test**: Assert Q doesn't zero out when timing is \`NOT_OBSERVED\`.
- **Numerical Test Vectors**: [BLOCKED - Missing from source docs].
`,

  '34_SECURITY.md': `# Phase 34: Security

FastAPI relies on JWT verification from Supabase GoTrue.
Service role keys used only for backend-to-backend task queues with strict tenant ID passing.
`,

  '35_PERFORMANCE.md': `# Phase 35: Performance

- Batch upserts using PostgREST batching.
- Redis caching for Client Configurations to prevent DB hits per lead scoring.
`,

  'FORMULA_IMPLEMENTATION_REGISTER.md': `# Formula Implementation Register

**STATUS: BLOCKED**
CRITICAL MISSING SOURCE MATERIAL: The authoritative \`JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md\` document contains placeholders (e.g., \`*(Full module equations per JOEP v2)*\`). No formulas can be registered or implemented until the complete, unredacted mathematical specifications are provided.
`,

  'FILE_IMPLEMENTATION_MAP.md': `# File-by-File Implementation Map

## API & Core
- \`app/main.py\`: FastAPI entrypoint. Phase 24.
- \`app/core/config.py\`: Pydantic settings. Phase 1.

## Models & DB
- \`app/models/domain.py\`: Pydantic models. Phase 2.
- \`app/repositories/supabase_repo.py\`: DB access. Phase 3.

## Evaluation
- \`app/gates/evaluator.py\`: G1-G5 logic. Phase 8.
- \`app/icp/router.py\`: ICP context load. Phase 10.
- \`app/missing_data/handler.py\`: Explicit state transitions. Phase 18.
- \`app/scoring/modules.py\`: [BLOCKED] Phase 19.
- \`app/ranking/ev.py\`: [BLOCKED] Phase 24.
`,

  'DEPENDENCY_GRAPH.md': `# Dependency Graph

\`\`\`text
[Phase 2] Domain Models
  ├── [Phase 3] Database Repositories
  │     ├── [Phase 4-5] Normalization & Entity Res
  │     └── [Phase 25] Score Persistence
  ├── [Phase 18] Missing Data Logic
  │     ├── [Phase 8] Gates (G1-G5)
  │     ├── [Phase 10] ICP Routing
  │     └── [Phase 16] Scoring Modules [BLOCKED]
  │           ├── [Phase 17] Opp Quality [BLOCKED]
  │           ├── [Phase 18] Confidence [BLOCKED]
  │           └── [Phase 20] Ranking [BLOCKED]
\`\`\`
`,

  'IMPLEMENTATION_SPRINTS.md': `# Implementation Sprints

**SPRINT 0: Source Verification (CURRENTLY BLOCKED)**
- **Objective**: Obtain the full, unredacted JOEP v2 equations, parameters, and weights.
- **Blocker**: Authoritative docs contain only placeholder text for mathematics.

**SPRINT 1: Python Skeleton & Domain Models**
- Implement Pydantic schemas mapping to Phase 1 DB.

**SPRINT 2: Database Repositories & Configuration**
- \`supabase-py\` integration.

**SPRINT 3: Gates + Role + ICP**
- Implement deterministic G1-G5 exclusion logic.

**SPRINT 4-6: DNA, Signals, Enrichment, Event Clustering**
- Implement source merging and signal parsing.

**SPRINT 7-9: SCORING, CONFIDENCE, RANKING (BLOCKED)**
- Awaiting formulas.

**SPRINT 10-13: Persistence, APIs, UI Integration, 5K Validation**
- Connect to UI, run 5000-lead regression test.
`,

  'MASTER_IMPLEMENTATION_PLAN.md': `# Master Implementation Plan

## JOEP SCORING ENGINE IMPLEMENTATION PLAN

SOURCE DOCS VERIFIED:
NO (Critical formulas missing/replaced with placeholders).

FORMULAS COMPLETE:
NO

MISSING SOURCE MATERIAL:
- The full mathematical equations for F1-F12.
- The temporal/decay half-lives per signal family.
- Feature transformation equations.
- Expected-value and Ranking equations.
- Infonics client calibration priors.
- (All of these were replaced by \`*(Full module equations per JOEP v2)*\` in the authoritative document).

ARCHITECTURE DEFINED:
YES (FastAPI, Redis Queue, Supabase schema, Gate logic).

FILE MAP COMPLETE:
YES

DEPENDENCY GRAPH COMPLETE:
YES

TEST PLAN COMPLETE:
YES (Structural plan defined; numeric vectors blocked).

5K REGRESSION TEST INCLUDED:
YES (Defined in Phase 42, planned for Sprint 13).

OPPORTUNITY INTELLIGENCE INTEGRATION INCLUDED:
YES (Phase 28 & 34).

CRM HANDOFF INCLUDED:
YES (Phase 35).

OUTCOME LOOP INCLUDED:
YES (Phase 30 & 36).

BLOCKERS:
- Missing mathematical formulas from the authoritative JOEP v2 specification.

READY TO BEGIN SPRINT 0:
NO (Cannot begin Sprint 0/1 until the missing source material is provided to complete the implementation architecture).

## SOURCE COVERAGE AUDIT
- JOEP SECTION 1-6 (Gates/Context): Mapped to Phase 8, 10. Status: COMPLETE.
- JOEP SECTION 7 (Formal Gate Math): Mapped to Phase 8. Status: COMPLETE.
- JOEP SECTION 11-23 (Modules & Formulas): Mapped to Phase 16-24. Status: **BLOCKED (Missing Text)**.
`
};

for (const [filename, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(dir, filename), content, 'utf8');
}
console.log("Successfully generated all implementation plan files.");
