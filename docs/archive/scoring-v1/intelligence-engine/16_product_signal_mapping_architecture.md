# DEPRECATED

This document is superseded by JOEP v2.

Do not use this document for new scoring-engine implementation.

Authoritative sources:
- JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md
- JOEP-v2-GATES-ICP-ROUTING.md
- JOEP-v2-IMPLEMENTATION-PLAN.md

---

# Product Signal Mapping Architecture

## Concept
Signals are universal (e.g. "Building Permit"), whereas Products are specific (e.g. "PEB Warehouse"). We do not map signals directly to companies with weights. We map signals to *products*.

## Core Tables
1. **`products`**: Master catalog of offerings.
2. **`product_signal_mapping`**: Junction table tying a product to a universal signal definition, alongside a deterministic `weight` (High, Medium, Low).
3. **`mapping_versions`**: Audit log ensuring we never lose track of when a signal's relevance to a product was changed.

## Logic Flow
When we want to know what a company is doing relevant to "PEB Warehouse", we:
1. Identify if the company matches a Buyer Archetype associated with PEB Warehouse.
2. Fetch the company's signal timeline.
3. Filter the timeline to *only* show signals that exist in `product_signal_mapping` for PEB Warehouse.
