# Phase 4: Entity Resolution

## Deterministic v0 Algorithm
1. **Exact Domain Match**: Normalize URL (strip http/www). Lookup in `jas_companies.website`.
2. **Normalized Name Match**: Strip legal suffixes (LLC, Inc, Pvt Ltd). Lowercase, strip whitespace. Match against `jas_companies.legal_name`.
3. **Conflict Resolution**: If Domain matches Entity A and Name matches Entity B -> Mark as `CONFLICTING` and generate a `NEEDS_MANUAL_RESEARCH` entity resolution task.
4. **Merge Rules**: No automatic merges in v0.
