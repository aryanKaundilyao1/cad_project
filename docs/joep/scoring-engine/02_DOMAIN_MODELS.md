# Phase 2: Domain Models

All Python models will utilize Pydantic v2 for strict validation matching the `SCORING_INPUT_CONTRACT.md` and Phase 1 PostgreSQL schema.

- `RawLead`: Maps to `raw_leads` table.
- `CanonicalEntity`: Maps to `jas_companies` (extended fields).
- `MissingState`: Python Enum matching `joep_missing_state`.
- `GateResult`: Pydantic model for `joep_gate_results`.
- `ModuleScore`: Float values mapped per scoring formula.
- `ScoreSnapshot`: Final output mapping to `joep_score_snapshots`.
