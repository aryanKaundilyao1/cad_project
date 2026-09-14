# DEPRECATED

This document is superseded by JOEP v2.

Do not use this document for new scoring-engine implementation.

Authoritative sources:
- JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md
- JOEP-v2-GATES-ICP-ROUTING.md
- JOEP-v2-IMPLEMENTATION-PLAN.md

---

# Feature Registry Guide

The `feature_registry` table acts as a data dictionary for all inputs the scoring engine can consume.

## Required Fit Features
1. `company_industry`: Core vertical.
2. `company_revenue`: Firmographic size proxy.
3. `company_headcount`: Firmographic size proxy.
4. `company_location`: Geographic compatibility.
5. `company_tech_stack`: Technographic compatibility.
6. `company_financial_health`: Credit risk or financial stability indicators.
