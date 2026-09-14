# DEPRECATED

This document is superseded by JOEP v2.

Do not use this document for new scoring-engine implementation.

Authoritative sources:
- JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md
- JOEP-v2-GATES-ICP-ROUTING.md
- JOEP-v2-IMPLEMENTATION-PLAN.md

---

# Vertical Weighting Guide

## Purpose
Vertical weights dynamically alter the importance of Fit, Intent, Timing, and Engagement based on the specific industry of the target company. For instance, Construction companies are more heavily driven by triggers (Timing) like permits, whereas Procurement functions are highly driven by Intent and Engagement.

## Configured Weights

| Industry       | Fit | Intent | Timing | Engagement |
|----------------|-----|--------|--------|------------|
| Construction   | 20% | 20%    | 40%    | 20%        |
| Manufacturing  | 30% | 25%    | 25%    | 20%        |
| Procurement    | 20% | 30%    | 20%    | 30%        |
| Export         | 25% | 20%    | 35%    | 20%        |
| Distribution   | 25% | 25%    | 25%    | 25%        |
| Default/Other  | 25% | 30%    | 25%    | 20%        |

*Note: The sum of weights always equals 1.0 (100%).*
