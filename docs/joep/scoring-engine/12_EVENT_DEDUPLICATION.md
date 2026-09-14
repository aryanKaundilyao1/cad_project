# Phase 12: Event Clustering

Prevents "4 news articles = 4x points".
- Clusters by: `entity_id` + `location` + `time_window (30d)` + `semantic_type`.
- Yields a single `joep_event_clusters` ID.
