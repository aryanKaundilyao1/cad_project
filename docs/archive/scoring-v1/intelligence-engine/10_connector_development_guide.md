# DEPRECATED

This document is superseded by JOEP v2.

Do not use this document for new scoring-engine implementation.

Authoritative sources:
- JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md
- JOEP-v2-GATES-ICP-ROUTING.md
- JOEP-v2-IMPLEMENTATION-PLAN.md

---

# Connector Development Guide

## Adding a New Provider
To integrate a new external API provider (e.g., ImportGenius, Panjiva), you must implement a new connector that extends the `BaseConnector` class.

### 1. Implement the Connector Class
Create a new file in `src/services/intelligence/providers/`.
Your class must implement three abstract methods:

```typescript
export class MyNewConnector extends BaseConnector {
  
  async authenticate(): Promise<void> {
    // Implement API key handling or OAuth here using this.config
  }

  async fetchRawEvents(since?: Date): Promise<any[]> {
    // Handle API requests, pagination, and rate limiting here.
    // Return an array of the raw JSON payloads from the provider.
  }

  protected determineEventType(payload: any): string {
    // Analyze the payload and return a string representing the event type.
  }

  protected formatRawEvent(payload: any, eventType: string): RawExternalEvent {
    return {
      provider_id: this.providerId,
      event_type: eventType,
      raw_payload: payload,
      status: 'pending'
    };
  }
}
```

### 2. Register the Connector
Update the `ConnectorManager.ts` factory method to recognize the new `provider_type` string (which will be stored in the DB registry) and return your new instance.

### 3. Add to the UI Registry
Administrators can now add the provider via the "Provider Registry" dashboard, entering the correct `provider_type` string and configuration JSON.
