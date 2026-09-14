# Phase 15: Missing-Data Engine

Enforces:
- `UNKNOWN` != 0
- `NOT_OBSERVED` != `CONFIRMED_ABSENT`

If a module cannot be evaluated due to `NOT_OBSERVED`, it is excluded from the geometric core aggregate, and Evidence Confidence is penalized instead of setting Opportunity Quality to 0.
