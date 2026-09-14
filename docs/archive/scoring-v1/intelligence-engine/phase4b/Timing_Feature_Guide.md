# DEPRECATED

This document is superseded by JOEP v2.

Do not use this document for new scoring-engine implementation.

Authoritative sources:
- JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md
- JOEP-v2-GATES-ICP-ROUTING.md
- JOEP-v2-IMPLEMENTATION-PLAN.md

---

# Timing Feature Guide

This document outlines the raw features extracted by the `TimingFeatureExtractionService`.

| Feature Key | Type | Description |
| :--- | :--- | :--- |
| `rfp_present` | Boolean | True if an active RFP is detected |
| `rfq_present` | Boolean | True if an active RFQ is detected |
| `tender_present` | Boolean | True if an active Tender is detected |
| `funding_event` | JSON Array | List of recent funding rounds |
| `expansion_event` | JSON Array | List of physical expansion announcements |
| `facility_opening` | JSON Array | List of new facilities opened |
| `job_postings` | JSON Array | List of relevant job postings |
| `contract_renewal` | JSON Array | List of upcoming competitor contract renewals |
| `permit_activity` | JSON Array | List of relevant permits filed |
