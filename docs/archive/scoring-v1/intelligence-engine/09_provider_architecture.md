# DEPRECATED

This document is superseded by JOEP v2.

Do not use this document for new scoring-engine implementation.

Authoritative sources:
- JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md
- JOEP-v2-GATES-ICP-ROUTING.md
- JOEP-v2-IMPLEMENTATION-PLAN.md

---

# External Provider Architecture

## Overview
Phase 3B introduces the External Signal Ingestion Framework, a modular, provider-agnostic system designed to pull, process, and normalize data from third-party APIs (like government tenders, trade data, and hiring sources).

## Key Components

1. **Provider Registry (`signal_providers`)**
   A dynamic database table acting as a catalog for all external providers. It stores authentication details, rate limits, sync frequency, and health status, allowing the admin to toggle providers without code deploys.

2. **Connector Framework (`BaseConnector` & `ConnectorManager`)**
   - `BaseConnector`: An abstract class ensuring every provider implementation adheres to standard authentication, fetching, and formatting methods.
   - `ConnectorManager`: Instantiates the correct connector based on the provider type and orchestrates the synchronization run.

3. **Raw Event Store (`raw_external_events`)**
   An immutable storage layer for *every* payload received from an external API. This ensures we never lose data and can replay or debug the ingestion pipeline if the normalization logic fails.

4. **Ingestion Pipeline**
   - **EventNormalizer**: Converts custom API payloads into a `StandardExternalEvent`.
   - **EntityResolver**: Maps the external company name/domain to a JAS CONNECT company record.
   - **ExternalSignalGenerator**: Maps the standardized event to the `SignalRegistry` and pushes the final product into the `signal_event_store`.

5. **Audit Logging (`provider_sync_logs`)**
   Tracks every sync attempt, duration, success count, and failure count for observability.
