# JOEP v2 Phase 1: Schema Audit

| JOEP OBJECT | CURRENT IMPLEMENTATION | TABLE/TYPE | REUSE? | EXTEND? | CREATE? | NOTES |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Tenant** | Client profiles using `profiles` / `jas_companies` | `profiles` / `jas_companies` | YES | YES | NO | We will ensure all new entities carry `client_id` pointing to `profiles.id`. |
| **Raw Lead** | `raw_leads`, `leads` | `raw_leads` | YES | YES | NO | Needs `client_id` and strict standard fields + JSONB `source_specific_fields`. |
| **Source Record** | `source_registry`, `jas_sources` | `jas_sources` | YES | YES | NO | Needs `client_id`, `canonical_entity_id`, and `raw_payload`. |
| **Canonical Entity** | Not fully formalized | N/A (was just `jas_companies` or `lead_entities`) | NO | NO | YES | Create `joep_entities` to store the deduped, normalized company identity. |
| **Missing Data States**| Ad-hoc or null | N/A | NO | NO | YES | Create global Postgres ENUM `joep_missing_state`. |
| **Lead DNA** | Distributed across `leads` | N/A | NO | NO | YES | Create `joep_lead_dna` to hold structured + JSONB derived intelligence separately. |
| **Hard Gates** | Old `jas_evidence_modules` or implicit | N/A | NO | NO | YES | Create `joep_gate_results` supporting explicit PASS/FAIL/UNKNOWN states. |
| **Commercial Role** | Mostly missing/hardcoded | N/A | NO | NO | YES | Create `joep_commercial_roles` linked to entity and client. |
| **ICP** | Hardcoded or missing | N/A | NO | NO | YES | Create `joep_icps` and `joep_icp_assignments`. |
| **Product Match** | Implicit in old architecture | N/A | NO | NO | YES | Create `joep_products` and `joep_product_matches`. |
| **Signals** | `jas_evidence_modules` somewhat | N/A | NO | NO | YES | Create `joep_signals` and `joep_event_clusters` to decouple from old G1-G10. |
| **Evidence** | Mixed in `jas_sources` | N/A | NO | NO | YES | Create `joep_evidence` as first-class entity (URL, publisher, directness). |
| **Opportunity** | `jas_opportunities` | `jas_opportunities` | YES | YES | NO | Extend to link to `canonical_entity_id`, `client_id`, and products. |
| **Research Task** | Implicit / Missing | N/A | NO | NO | YES | Create `joep_research_tasks`. |
| **Scoring Snapshot** | `jas_scores` | `jas_scores` | YES | YES | NO | Refactor completely to store `module_scores` JSONB, 3-part priority, and versioning. |
| **Outreach Readiness**| Mixed in contact fields | N/A | NO | NO | YES | Create `joep_outreach_readiness` or add to Opportunity/Entity. |
| **CRM Record** | `crm_leads` | `crm_leads` | YES | YES | NO | Ensure it captures `score_snapshot_at_import`. |
| **Outcome Capture** | Missing standard ENUMs | N/A | NO | NO | YES | Create `joep_outcomes` and enum for funnel states. |

**General Rule**: To avoid breaking existing un-migrated code while we build JOEP v2, we will create new `joep_*` tables for core architectural components that didn't exist or were fundamentally broken in v1, while extending reusable tables like `jas_opportunities` and `crm_leads`.
