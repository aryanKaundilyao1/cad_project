# DEPRECATED

This document is superseded by JOEP v2.

Do not use this document for new scoring-engine implementation.

Authoritative sources:
- JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md
- JOEP-v2-GATES-ICP-ROUTING.md
- JOEP-v2-IMPLEMENTATION-PLAN.md

---

# Enrichment Architecture

## Concept
Enrichment data (e.g., employee count, revenue, technology stack) must never overwrite user-entered data silently. Instead, we use an append-only log.

## Tables
1. **`enrichment_sources`**: A registry of APIs/Providers (e.g., Clearbit, ZoomInfo, local Mock APIs).
2. **`company_enrichment_history`**: Every time we fetch data about a company, we insert a row here with the `field_name` (e.g., "annual_revenue") and the JSON `field_value`.

## Consumption
The `CompanyProfileService` aggregates this history so the UI (`AdminCompanyIntelligence.tsx`) can display a complete timeline of how a company's data has evolved, maintaining full provenance and auditability.
