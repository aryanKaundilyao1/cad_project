# Phase 5: Basic Lead DNA

Translates raw source facts into `joep_lead_dna`.

- **Firmographics**: employee_count, revenue_range mapped to ordinal buckets.
- **Geography**: Country/State normalization.
- **Missing States**: Any requested fact not present in `source_specific_fields` is explicitly marked `UNKNOWN` or `NOT_OBSERVED`. It is NEVER defaulted to 0 or empty string.
