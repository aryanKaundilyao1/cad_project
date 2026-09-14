# DEPRECATED

This document is superseded by JOEP v2.

Do not use this document for new scoring-engine implementation.

Authoritative sources:
- JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md
- JOEP-v2-GATES-ICP-ROUTING.md
- JOEP-v2-IMPLEMENTATION-PLAN.md

---

# Signal Rebuild Guide

## Rebuilding the Signal History
Because all intelligence is extracted from raw JAS data (`leads`, `projects`, `crm_leads`), we can regenerate the entire history of intelligence if the signal definition logic ever changes.

## The Process
The `InternalSignalRebuilder` service exposes a `rebuildAll()` method.
When triggered:
1. It queries all existing leads, projects, and CRM activities.
2. Passes them through the current version of the `InternalSignalExtractor`.
3. Validates and generates events based on current logic.
4. Appends these to the `signal_event_store`.

## Caveats
- Since the event store is immutable, rebuilding does not delete old signals by default. A true "clean rebuild" would require clearing the event store first (which should be handled carefully via a DB administration route or an explicit "truncate" option passed to the rebuilder, omitted in Phase 3A.5 to protect data).
- The "Rebuild All Signals" button in the Admin Signal Explorer currently acts additively for demonstration purposes.
