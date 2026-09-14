# DEPRECATED

This document is superseded by JOEP v2.

Do not use this document for new scoring-engine implementation.

Authoritative sources:
- JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md
- JOEP-v2-GATES-ICP-ROUTING.md
- JOEP-v2-IMPLEMENTATION-PLAN.md

---

# Alias Management Guide

## Why Aliases?
A real world company operates under many names (DBAs, legal names, subsidiaries). The `company_aliases` table acts as a lookup dictionary for the `EntityResolver`.

## How they are created
1. **Manual Entry**: An Admin can go to `/admin/entity/aliases` and manually force a string to map to a Company UUID.
2. **System Merges**: When the `EntityMergeEngine` merges Company A into Company B, Company A's primary name is automatically saved as an alias for Company B.
3. **Approved Reviews**: When an Admin approves a match in the `entity_review_queue`, the incoming payload string is saved as an alias for the target company (implementation of this specific detail is handled in the merge engine).
