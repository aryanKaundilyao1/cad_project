JOEP V2 DOCUMENTATION MIGRATION

NEW SOURCE-OF-TRUTH FILES:
- docs/joep/JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md
- docs/joep/JOEP-v2-GATES-ICP-ROUTING.md
- docs/joep/JOEP-v2-IMPLEMENTATION-PLAN.md
- docs/joep/README.md

ARCHIVED FILES:
- Moved entire `docs/intelligence-engine/` and `docs/purchase_likelihood_prediction_engine.md` to `docs/archive/scoring-v1/`.
- Prepend `# DEPRECATED` headers to all archived Markdown files.

UPDATED REFERENCES:
- Validated existing markdown files (e.g. `docs/platform_validation/01_system_map.md` and `docs/crm_operational_workflow.md`) and verified they do not contradict the JOEP v2 gating and scoring rules. Any historical references are stored in the safe `docs/archive/` tree.

NEW FILES CREATED:
- docs/joep/CURRENT_SYSTEM_GAP_ANALYSIS.md
- docs/joep/NEXT_IMPLEMENTATION_STEPS.md

CONFLICTS FOUND:
- GAP-001: Fake scoring in the frontend UI (`WorkspaceScoringEngine.tsx`).
- GAP-002: Missing Python JOEP v2 backend scoring service.
- GAP-003: No Score versioning in `jas_scores`.
- GAP-004: Missing-value states (`NOT_OBSERVED`) ignored and defaulted to zero.
- GAP-005: Pre-scoring Hard Gate implementation completely missing from the existing React UI context.
- GAP-006: Dual Priorities (Sales vs Research) missing from the CRM.

CODE CHANGED:
- NO, unless required only for documentation links.

READY FOR IMPLEMENTATION:
- YES

NEXT STEP:
- Begin JOEP v2 implementation planning.
