# DEPRECATED

This document is superseded by JOEP v2.

Do not use this document for new scoring-engine implementation.

Authoritative sources:
- JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md
- JOEP-v2-GATES-ICP-ROUTING.md
- JOEP-v2-IMPLEMENTATION-PLAN.md

---

# Buyer Archetype Guide

## Concept
A Buyer Archetype represents an Ideal Customer Profile (ICP), such as "Warehouse Developer" or "Procurement Head". It bridges the gap between raw company firmographics and product eligibility.

## Core Table
- **`buyer_archetypes`**: Defines the persona (Industry, company size, etc).
- **`product_archetype_mapping`**: Connects a Product (e.g. "PEB Warehouse") to an Archetype (e.g. "Warehouse Developer").

## Resolution Engine (`ArchetypeResolver.ts`)
We match companies to archetypes deterministically without ML:
1. **Industry Match (+60%)**: If the company industry matches the archetype industry exactly.
2. **Signal Match (+40%)**: If the company has specific signals (like 'Warehouse Expansion') that align with the archetype's domain.
Matches over 50% are stored in `archetype_matches`.
