# Phase 27: Background Job Architecture

Utilizes Redis Queue (RQ) for simplicity over Celery, given standard deployment.
Jobs:
- `process_batch`
- `expire_stale_signals`
