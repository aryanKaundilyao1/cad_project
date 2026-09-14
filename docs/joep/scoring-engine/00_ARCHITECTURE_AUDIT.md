# Phase 0: Engine Architecture Audit

## Existing Assets (Phase 1)
- **Database Tables (Supabase)**: `joep_raw_leads`, `joep_source_records`, `joep_entities` (via `jas_companies`), `joep_lead_dna`, `joep_gate_results`, `joep_icp_assignments`, `joep_opportunities`, `joep_score_snapshots`, `joep_research_tasks`.
- **Contracts**: `SCORING_INPUT_CONTRACT.md`, `SCORING_OUTPUT_CONTRACT.md`.
- **Frontend Mocks**: `WorkspaceScoringEngine.tsx` currently uses hardcoded sliders (deprecated).
- **TypeScript Types**: `src/types/joep/index.ts`.

## What Needs Extension
- Existing `jas_companies` acts as CanonicalEntity but needs robust Python-side normalization.
- Python engine needs a background task runner (e.g., RQ or Celery) to avoid blocking the API.

## What Must Be Implemented in Python
- The entire JOEP v2 scoring mathematics (BLOCKED pending full formula text).
- Gate evaluation logic (G1-G5).
- Missing data state transition logic.
- Expected Value / Confidence generation.
- FastAPI REST service matching the input/output contracts.
