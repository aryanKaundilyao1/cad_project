# Raw Data Import Architecture (Google Maps CSV)

## The Canonical Model
Jumbl raw data sources (initially Google Maps) must be ingested while preserving source provenance.

## 1. JSONB Preservation
We preserve native fields like `is_spending_on_ads`, `review_count`, `business_category`, and raw provider JSON inside `source_specific_fields` and `raw_payload`. We do **NOT** discard them when mapping to Canonical Entities.

## 2. Source Record Flow
`CSV / API Source` → **Validation** → `raw_leads` & `joep_source_records` → **Entity Resolution** → `jas_companies` / `CanonicalEntity`.

## 3. Duplicate Prevention
A unique constraint enforces `(client_id, source_provider, source_record_id)` on the source tables, ensuring idempotent imports when running batches of Google Maps CSV extractions.

## 4. Import Readiness Status
The database foundation is now fully structurally prepared to accept `INSERT` queries for imported Google Maps data scoped strictly to `client_id` without breaking the future JOEP scoring engine.
