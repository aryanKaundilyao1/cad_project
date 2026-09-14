# Jumbl Workspace — Core Data Model

The architecture guarantees that every lead, regardless of source (JAS, Apollo, CSV, HubSpot), normalizes into ONE Canonical Schema.

## Canonical Lead Schema (Conceptual)
- **Identity:** `lead_id`, `client_id`, `source`, `source_record_id`
- **Firmographics:** `company_name`, `website`, `domain`, `industry`, `location`
- **Context:** `commercial_role`, `primary_icp`, `product_matches`
- **Intelligence:** `lead_dna` (JSON), `signals` (JSON), `gate_results` (JSON)
- **Scores:** `module_scores` (JSON), `opportunity_quality`, `evidence_confidence`, `commercial_value`
- **Priorities:** `sales_priority`, `research_priority`, `outreach_readiness`, `priority_status`
- **Metadata:** `created_at`, `last_scored_at`

## Explicit Missing Data States
Never convert missing to zero. Use Enums:
- `CONFIRMED_PRESENT`
- `CONFIRMED_ABSENT`
- `UNKNOWN`
- `NOT_OBSERVED`
- `NOT_APPLICABLE`
- `CONFLICTING`
- `ENRICHMENT_FAILED`
- `NEEDS_MANUAL_RESEARCH`
