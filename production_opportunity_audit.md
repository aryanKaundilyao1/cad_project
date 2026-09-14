# JAS CONNECT 3.0: PRODUCTION DATA FLOW AUDIT

## 1. NULL DISTRIBUTION (Data Loss Points)
**INDUSTRY**
- jas_companies: 0.0% Missing
- accounts: 0.0% Missing
- opportunities: 0.0% Missing

**WEBSITE**
- jas_companies: 0.0% Missing
- accounts: 0.0% Missing

**PHONE**
- jas_companies: 0.0% Missing
- accounts: 0.0% Missing

**EMAIL**
- jas_companies: 0.0% Missing
- accounts: 0.0% Missing

**CITY**
- jas_companies: 0.0% Missing
- accounts: 0.0% Missing

**COUNTRY**
- jas_companies: 0.0% Missing
- accounts: 0.0% Missing

## 2. SIGNAL DISTRIBUTION
- 0 signals: 50 companies
- 1 signals: 0 companies
- 2 signals: 0 companies
- 3 signals: 0 companies
- 4+ signals: 0 companies

## 3. SIGNAL FREQUENCY (Most Common)
*No signals found.*

## 4. SCORE COMPRESSION (Order Probability Histogram)
- 0-10%: 0 companies
- 11-20%: 0 companies
- 21-30%: 34 companies
- 31-40%: 0 companies
- 41-50%: 0 companies
- 51-60%: 0 companies
- 61-70%: 0 companies
- 71-80%: 0 companies
- 81-90%: 0 companies
- 91-100%: 0 companies
- 1-10%: 16 companies

## 5. RULE TABLE USAGE & SAMPLE DATA
### signal_registry: 8 rows
*Sample:* `{"id":"14c81fea-9fef-46b9-bb78-81c85bde4584","category_id":"727fd358-c683-4cb7-aaf4-2aa6d96a0e0a","name":"Tender Published","description":"A new public tender has been published","created_at":"2026-07-16T04:35:09.312142+00:00","updated_at":"2026-07-16T04:35:09.312142+00:00"}`
### signal_instances: 0 rows
*No records exist in this table.*
### signal_weights: 3 rows
*Sample:* `{"id":"353560e8-9550-4a0a-b13d-294da0bcc931","signal_type_id":"51821519-72fc-4206-afaf-39196a0b0b1b","weight":1,"created_at":"2026-07-16T10:39:23.301759+00:00","updated_at":"2026-07-16T10:39:23.301759+00:00"}`
### industry_profiles: 5 rows
*Sample:* `{"id":"5be32b41-1368-4934-ba6b-e33d01ff77f4","industry_name":"Real Estate","weight_modifier":1.2,"created_at":"2026-07-16T10:39:23.301759+00:00","updated_at":"2026-07-16T10:39:23.301759+00:00"}`
### procurement_rules: 0 rows
*No records exist in this table.*
### contactability_rules: 0 rows
*No records exist in this table.*

## TOP 5 ROOT CAUSES (Evidence-Based)
1. **Missing Contact Data Mapping (Trigger Drop):** email and phone are completely lost across all accounts because the `sync_company_to_account` trigger fails to map them.
2. **Missing Google Maps Fields (Schema Rejection):** category, rating, reviews do not exist in jas_companies.
3. **Signal Starvation:** The engine only generates High Growth Indicators because website and industry are often missing.
4. **Score Compression:** With only 1 signal, the rigid 50/30/20 formula guarantees an Order Probability around 18-22%.
5. **Rule Table Fallback:** procurement_rules and contactability_rules have 0 records configured for Google Maps, forcing generic fallback scores.
