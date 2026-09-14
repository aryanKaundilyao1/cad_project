# Phase 24: Scoring Service API

FastAPI endpoints:
- `POST /score/lead`: Synchronous scoring for a single canonical entity.
- `POST /score/batch`: Background task enqueuing.
- `POST /score/client/{client_id}/dirty`: Identifies leads needing rescore.
