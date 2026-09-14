# DEPRECATED

This document is superseded by JOEP v2.

Do not use this document for new scoring-engine implementation.

Authoritative sources:
- JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md
- JOEP-v2-GATES-ICP-ROUTING.md
- JOEP-v2-IMPLEMENTATION-PLAN.md

---

# Intent Feature Guide

This document outlines the raw features extracted by the `IntentFeatureExtractionService`.

| Feature Key | Type | Description |
| :--- | :--- | :--- |
| `surging_topic_count` | Number | Count of relevant topics with surge score >= 60 |
| `surge_scores` | JSON | Array of topic surge objects (topic, score) |
| `pricing_page_visits` | Number | Count of visits to /pricing |
| `demo_requests` | Number | Count of demo request forms submitted |
| `spec_sheet_downloads` | Number | Count of spec sheets downloaded |
| `review_site_activity` | Number | Count of G2/Capterra page views |
| `competitor_comparison_activity` | Number | Count of competitor comparison actions |
| `social_engagement` | Number | Count of interactions with social media posts |
