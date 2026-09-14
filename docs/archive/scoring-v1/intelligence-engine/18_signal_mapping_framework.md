# DEPRECATED

This document is superseded by JOEP v2.

Do not use this document for new scoring-engine implementation.

Authoritative sources:
- JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md
- JOEP-v2-GATES-ICP-ROUTING.md
- JOEP-v2-IMPLEMENTATION-PLAN.md

---

# Signal Mapping Framework

## Engine
The `SignalWeightEngine` handles the creation and updates of `product_signal_mapping` rows.

## Weighting
Weights are deterministic enumerations, not floats or probability scores.
- **High**: Core indicator (e.g. Building Permit for PEB).
- **Medium**: Correlated indicator.
- **Low**: Contextual information.

## Audit Trail
Every time `SignalWeightEngine.mapSignalToProduct` is called, it explicitly writes the change to the `mapping_versions` table before returning, ensuring a complete historical record of how the intelligence engine has evolved.
