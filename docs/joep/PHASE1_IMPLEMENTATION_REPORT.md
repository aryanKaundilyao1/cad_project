# PHASE 1 — CANONICAL JOEP DATA CONTRACT

SCHEMA AUDITED:
YES. Documented in `docs/joep/PHASE1_SCHEMA_AUDIT.md`.

TABLES REUSED:
- `profiles` (auth/tenant context)
- `raw_leads` (extended)
- `jas_companies` (repurposed as canonical entity, extended)
- `jas_opportunities` (remains for legacy tenders, we opted to build `joep_opportunities` for clean isolation)
- `crm_leads` (to be extended when CRM phase begins)

TABLES CREATED:
- `joep_source_records`
- `joep_lead_dna`
- `joep_gate_definitions`
- `joep_gate_results`
- `joep_commercial_roles`
- `joep_icps`
- `joep_icp_assignments`
- `joep_products`
- `joep_product_matches`
- `joep_event_clusters`
- `joep_evidence`
- `joep_signal_definitions`
- `joep_signal_observations`
- `joep_opportunities`
- `joep_outreach_readiness`
- `joep_research_tasks`
- `joep_score_snapshots`
- `joep_crm_records`
- `joep_outcomes`

TABLES EXTENDED:
- `raw_leads` (added `client_id`, `source_provider`, `source_type`, `source_record_id`, `revenue_range`, `employee_count`, `source_specific_fields` JSONB)
- `jas_companies` (added `client_id`, `entity_type`, `identity_status`, `identity_confidence`)

ENUMS CREATED:
- `joep_missing_state` (CONFIRMED_PRESENT, CONFIRMED_ABSENT, UNKNOWN, NOT_OBSERVED, NOT_APPLICABLE, CONFLICTING, ENRICHMENT_FAILED, NEEDS_MANUAL_RESEARCH)
- `joep_gate_result_state`
- `joep_commercial_role_type`
- `joep_operational_status`
- `joep_outcome_state`

RLS:
Enabled RLS on all `joep_*` tables. Created standard `create_client_rls_policy` function binding `client_id` to `auth.uid()`. 

INDEXES:
Added `client_id` indexes on all new tables and extended legacy tables to optimize tenant filtering.

DOMAIN TYPES:
Created `src/types/joep/index.ts` mapping the TypeScript schema equivalent to the database. 

INPUT CONTRACT:
Created `docs/joep/SCORING_INPUT_CONTRACT.md` detailing the Python payload structure.

OUTPUT CONTRACT:
Created `docs/joep/SCORING_OUTPUT_CONTRACT.md` detailing the Python response structure (dual priorities, module_scores JSON, explicit drivers).

TESTS:
Created `supabase/tests/phase1_canonical_tests.sql` to verify:
- Sparse lead survival (missing values don't fail).
- Multi-source linkage (Google Maps + Apollo mapping to same entity).
- Score versioning (preserving snapshot history).

BUILD:
PASS. Run via `npm run build`.

DEMO BYPASSES REMOVED:
Removed unconditional `|| true` bypass in `src/contexts/ClientWorkspaceContext.tsx` ensuring strict `founder@jumbl.in` mapping for demo, and preserving RLS alignment. 

UNRESOLVED ARCHITECTURE QUESTIONS:
None blocking Phase 2. (Future resolution required on exact GeM/procurement configuration from Infonics).

BLOCKERS:
None.

READY FOR PHASE 2:
YES
