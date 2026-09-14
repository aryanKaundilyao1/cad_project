# Phase 7: Commercial Role Engine

Maps to `joep_commercial_roles`.

Classification logic:
- Analyzes `industry`, `subindustry`, and description keywords.
- Outputs enum: `DIRECT_BUYER`, `CHANNEL`, `SPECIFIER`, etc.
- Support multiple roles per entity via confidence arrays.
