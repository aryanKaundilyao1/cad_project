# DEPRECATED

This document is superseded by JOEP v2.

Do not use this document for new scoring-engine implementation.

Authoritative sources:
- JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md
- JOEP-v2-GATES-ICP-ROUTING.md
- JOEP-v2-IMPLEMENTATION-PLAN.md

---

# Event Normalization Guide

## The Need for Normalization
Every external provider has a completely different JSON schema. For example, a Government Tender API might return `{ "awarded_to": "Company A" }`, while a Trade API might return `{ "consignee": "Company A" }`. 

The `EventNormalizer` acts as the translation layer between these disparate APIs and the JAS CONNECT signal engine.

## `StandardExternalEvent` Structure
All payloads must be mapped to this interface:
```typescript
export interface StandardExternalEvent {
  event_id: string; // The UUID from the raw_external_events table
  provider_id: string;
  signal_type: string; // The human readable name of the signal
  company_name: string; // Used by EntityResolver
  event_date: string;
  confidence: number;
  metadata: any; // The sanitized properties we care about
}
```

## Adding Normalization Logic
When a new connector is added, you must update `EventNormalizer.normalize()`.

1. Add a `case` for the new `providerType`.
2. Write a private static method (e.g. `normalizeTradeApi(payload)`) to parse the JSON and map it to the `StandardExternalEvent`.
3. If the translation logic fails (e.g., missing required fields), throw an error. The `ConnectorManager` will catch this error, update the `raw_external_events.status` to `failed`, and save the error message for debugging in the Raw Event Explorer UI.
