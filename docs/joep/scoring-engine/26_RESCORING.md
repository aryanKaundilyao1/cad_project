# Phase 26: Dirty / Rescore Engine

Triggers:
- New signal insertion.
- Signal expiration (`valid_until` passed).
- Client config weight change.
Sets `is_current = FALSE` and queues task.
