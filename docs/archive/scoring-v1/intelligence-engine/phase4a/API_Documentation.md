# DEPRECATED

This document is superseded by JOEP v2.

Do not use this document for new scoring-engine implementation.

Authoritative sources:
- JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md
- JOEP-v2-GATES-ICP-ROUTING.md
- JOEP-v2-IMPLEMENTATION-PLAN.md

---

# API Documentation (Services)

In Phase 4A, we utilize TypeScript Service classes to act as our APIs for the frontend.

## FitScoreService
- `calculateFitScore(companyId, productId, triggerSource)`: Acts as `POST /api/scoring/fit/calculate`. Extracts features, runs engines, persists score.
- `getFitScore(companyId, productId)`: Acts as `GET /api/scoring/company/:companyId/fit`. Fetches current score and reason codes.
- `getFitHistory(companyId, productId)`: Acts as `GET /api/scoring/company/:companyId/history`. Fetches time-series data.
- `getAuditLog(companyId, productId)`: Fetches the audit trail.

## FeatureSnapshotService
- `getSnapshots(companyId, productId)`: Acts as `GET /api/scoring/company/:companyId/features`. Returns frozen feature states.
