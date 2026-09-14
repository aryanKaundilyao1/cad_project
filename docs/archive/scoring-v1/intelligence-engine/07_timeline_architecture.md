# DEPRECATED

This document is superseded by JOEP v2.

Do not use this document for new scoring-engine implementation.

Authoritative sources:
- JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md
- JOEP-v2-GATES-ICP-ROUTING.md
- JOEP-v2-IMPLEMENTATION-PLAN.md

---

# Timeline Architecture

## Concept
The Signal Timeline is not a standalone table. It is dynamically aggregated from the `signal_event_store`. 

## Build Process
The `SignalTimelineBuilder` service performs the following logic:
1. Queries all immutable events from `signal_event_store` filtered by a `company_id`.
2. Joins the events with `signal_definitions` to retrieve human-readable names and categories.
3. Groups the events by their `created_at` timestamp (YYYY-MM-DD).
4. Sorts groups descending, forming a reverse-chronological timeline of a company's evolution within JAS CONNECT.

## UI Representation
The `AdminCompanyIntelligence` UI visualizes this data structure, providing an audit trail. Because the underlying event store is append-only, the timeline represents a historically accurate log of when intelligence was gathered.
