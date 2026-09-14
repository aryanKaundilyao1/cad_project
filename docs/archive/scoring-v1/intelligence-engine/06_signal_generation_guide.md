# DEPRECATED

This document is superseded by JOEP v2.

Do not use this document for new scoring-engine implementation.

Authoritative sources:
- JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md
- JOEP-v2-GATES-ICP-ROUTING.md
- JOEP-v2-IMPLEMENTATION-PLAN.md

---

# Signal Generation Guide

## Generating Internal Signals
Internal signals are strictly generated from the system's own databases (`leads`, `projects`, `crm_leads`, `companies`, `contacts`).

### Example: Company Signals
When a company is created or processed, the `InternalSignalGenerator` maps fields directly:
- `website` -> "Website Present" (Confidence: 100)
- `phone` -> "Phone Present" (Confidence: 100)
- `industry` -> "Industry Assigned" (Confidence: 100)

### Example: Requirement / Project Signals
When a lead is ingested:
- A generic "Requirement Posted" signal is fired (Confidence: 100).
- If the requirement string contains keywords like 'PEB' or 'Infrastructure', an inferred signal like "PEB Requirement" is fired (Confidence: 70).

### Adding New Logic
To add new signal detection, modify `InternalSignalGenerator.ts`.
Do not manually insert `signal_definitions`. Let the `InternalSignalValidator` automatically register missing definitions with the Signal Registry.
