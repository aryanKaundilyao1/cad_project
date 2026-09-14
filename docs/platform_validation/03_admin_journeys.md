# JAS CONNECT Admin Journeys

This document outlines the workflows of the System Administrators managing JAS CONNECT. The Admin is responsible for keeping the "Brain" fed with data and monitoring the performance of the Intelligence Engines.

---

## Journey 1: Data Ingestion & Enrichment

**1. Raw Data Import**
- Admin receives a bulk CSV (e.g., from Google Maps scraping or a purchased list).
- Admin uploads the CSV or connects a Connector API (e.g., `MockGovernmentTenderConnector`).
- *Expected Outcome*: Raw data is stored in the `signals` and staging tables.

**2. Normalization & Entity Resolution**
- The system automatically triggers the `EntityResolver` and `EntityMergeEngine`.
- Admin reviews the **Entity Dashboard** (`/admin/entities`) to handle any edge-case merges (e.g., two variations of "Acme Corp").
- *Expected Outcome*: Clean, deduplicated Company and Contact records.

**3. External Enrichment (Optional)**
- Admin activates a provider like Clearbit.
- `CompanyEnrichmentService` fires to pull in employee counts, revenue, and missing technographics.

---

## Journey 2: Scoring Engine Configuration

**1. Master Weight Management**
- Admin navigates to the **Vertical Weight Manager** (`/admin/scoring/weights`).
- They adjust the importance of Fit vs Intent for specific industries. (e.g., "Intent matters more in SaaS, Fit matters more in Construction").

**2. Tuning the Probability Engine**
- Admin reviews the **Calibration Dashboard** (`/admin/intelligence/calibration`).
- They notice that the raw probabilities (e.g., 85%) are overconfident compared to reality (only 50% are actually closing).
- Admin uses `IsotonicCalibrationService` to apply a calibration curve, forcing the system's probabilities to match real-world outcomes.

---

## Journey 3: Monitoring & Executive Reporting

**1. Recommendation Performance**
- Admin logs in and checks the **Executive Dashboard** (`/admin/decision/executive`).
- They see a high-level view of:
  - Total Revenue Influenced by AI.
  - The Win Rate lift (AI vs Baseline).

**2. Investigating Adoption**
- The Admin notices that while the engine generates a lot of "Follow Up" actions, the Adoption Rate is low.
- They check the **Adoption Dashboard** (`/admin/decision/adoption`) to see *who* is ignoring the AI.
- They check the **Explainability Center** (`/admin/decision/explainability-center`) to see *why* the AI made those recommendations, discovering perhaps the AI is too aggressive with follow-ups.

**3. A/B Testing Engines**
- The Admin rolls out an update to the `PlaybookRecommendationEngine` (Version 2).
- They use the **Engine Performance Dashboard** (`/admin/decision/engine-performance`) to compare Win Rates of Version 1 vs Version 2.
