# DEPRECATED

This document is superseded by JOEP v2.

Do not use this document for new scoring-engine implementation.

Authoritative sources:
- JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md
- JOEP-v2-GATES-ICP-ROUTING.md
- JOEP-v2-IMPLEMENTATION-PLAN.md

---

# Internal Signal Engine Architecture

## Overview
The Internal Signal Engine is responsible for extracting intelligence from data already existing within JAS CONNECT (e.g., leads, projects, CRM activities). It acts as the internal enrichment layer that populates the Signal Event Store before any external data providers or probability models are applied.

## Core Components

1. **InternalSignalExtractor**
   Takes a raw database record (like a lead or project), normalizes it into a generic `RawEntity` format, and passes it through the extraction pipeline.
   
2. **InternalSignalGenerator**
   Contains the business logic mapping fields to predefined signals. For example, if `website` exists on a company record, it yields a "Website Present" signal with a 100% confidence score.

3. **InternalSignalValidator**
   Intercepts generated signals and maps them to canonical `signal_definitions` in the database. If an internal definition is missing, the validator will automatically register it into the Signal Registry.

4. **SignalTimelineBuilder**
   Aggregates the immutable log of events for a given company into a chronologically formatted timeline object for the UI.

5. **InternalSignalRebuilder**
   A utility service that iterates over the entire historical database of leads, CRM activities, and projects, running them through the extractor to backfill or rebuild the entire signal history from scratch.

## Confidence & Reliability
Instead of utilizing a dynamic Probability Engine, the Phase 3A.5 framework assigns static `confidence` scores (e.g. 100 for explicit data, 70 for inferred) and `reliability` flags (high/medium/low based on the data source origin). These are stored immutably alongside the event payload in the `signal_event_store`.
