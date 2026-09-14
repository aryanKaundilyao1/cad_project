# DEPRECATED

This document is superseded by JOEP v2.

Do not use this document for new scoring-engine implementation.

Authoritative sources:
- JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md
- JOEP-v2-GATES-ICP-ROUTING.md
- JOEP-v2-IMPLEMENTATION-PLAN.md

---

# Score Audit Guide

The `score_audit_log` table tracks *why* a score was calculated.

Every time `ScorePersistenceService.saveFitScore()` is called, a log entry is written containing:
- The old score
- The new score
- The trigger source (e.g., "Manual Rebuild", "Nightly Cron", "Webhook Event")

This provides total observability into scoring volatility.
