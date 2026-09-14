# JAS CONNECT System Map

This document provides a comprehensive map of the JAS CONNECT platform, detailing all pages, APIs, database tables, and intelligence services.

## 1. User & Admin Pages (React/Vite)

### Public / User Facing Pages
| Page Name | URL | Purpose |
|---|---|---|
| Home | `/` | Marketing landing page |
| Pricing | `/pricing` | Subscription tiers |
| Book Demo | `/book-demo` | Lead generation |
| Sign In/Up | `/auth` | Authentication entry |
| Dashboard | `/dashboard` | User's main entry point and metrics |
| Opportunity Feed | `/dashboard/opportunities` | The primary Lead Database / Deal Feed |
| Tenders | `/dashboard/tenders` | Government and enterprise RFPs |
| Saved Leads | `/dashboard/saved` | Leads bookmarked by the user |
| CRM Integrations | `/dashboard/crm` | Connecting to Salesforce/HubSpot |
| Profile | `/dashboard/profile` | User settings |

### Admin Operational Dashboards (Phase 6F)
| Page Name | URL | Purpose |
|---|---|---|
| Executive Dashboard | `/admin/decision/executive` | Top-line ROI, Win Rate Lift, Influenced Revenue |
| Action Center | `/admin/decision/action-center` | The prioritized execution queue for reps |
| Recommendation Analytics | `/admin/decision/recommendation-analytics` | Conversion rates of AI recommendations |
| Adoption Dashboard | `/admin/decision/adoption` | Tracks Accepted vs Ignored recommendations |
| Playbook Performance | `/admin/decision/playbook-performance` | Win rates and cycle reductions per playbook |
| Explainability Center | `/admin/decision/explainability-center` | Immutable traces of AI decision logic |
| Outcome Tracking | `/admin/decision/outcomes` | Won/Lost pipeline connections |
| Engine Performance | `/admin/decision/engine-performance` | A/B Testing of intelligence models |

### Admin Intelligence Dashboards (Phases 3-5)
| Page Name | URL | Purpose |
|---|---|---|
| Signal Viewer | `/admin/signals` | Raw signals ingested into the system |
| Entity Dashboard | `/admin/entities` | Merged company and contact records |
| Fit Explorer | `/admin/scoring/fit` | Firmographic scoring analysis |
| Intent Explorer | `/admin/scoring/intent` | Behavioral intent tracking |
| Timing Explorer | `/admin/scoring/timing` | Trigger event scoring |
| Engagement Explorer | `/admin/scoring/engagement` | Sales touchpoint tracking |
| Probability Explorer | `/admin/intelligence/probability` | Core purchase prediction engine |
| Calibration Dashboard | `/admin/intelligence/calibration` | Platt scaling and isotonic regression metrics |
| Weight of Evidence | `/admin/evidence/woe` | WOE and Bayes Factor metrics |

---

## 2. Intelligence Services (Node/TypeScript)

The "Brain" of JAS CONNECT resides in `src/services/intelligence/`. It is divided into distinct engines:

### Phase 3: Signal Intelligence
- `ExternalSignalGenerator`, `InternalSignalGenerator`: Ingests and normalizes raw data.
- `EntityMergeEngine`, `EntityResolver`: Deduplicates and matches incoming data to known companies.
- `CompanyEnrichmentService`: Appends external firmographic data.

### Phase 4: Opportunity Intelligence (Scoring)
- `FitScoreService`: Analyzes industry, size, and tech compatibility.
- `IntentScoreService`: Analyzes search surge, social, and review activity.
- `TimingScoreService`: Analyzes trigger events (e.g., funding, leadership changes).
- `EngagementScoreService`: Analyzes stakeholder interaction and seniority.
- `MasterOpportunityScoreEngine`: Aggregates Fit, Intent, Timing, and Engagement into a unified 0-100 score.

### Phase 5: Purchase Intelligence
- `ProbabilityDriverService`: Predicts the raw percentage likelihood of a deal closing.
- `WeightOfEvidenceService`: Calculates predictive power (Information Value) of specific signals.
- `CalibrationEvaluationService`, `PlattScalingService`: Adjusts raw probabilities into reliable, calibrated predictions.

### Phase 6: Decision Intelligence
- `ContactPrioritizationEngine`: Identifies the true decision-makers and champions.
- `ProductRecommendationEngine`: Suggests the exact SKU/Package to sell.
- `PlaybookRecommendationEngine`: Recommends the specific sales motion (e.g., "Tender Response").
- `NextBestActionEngine`: Dictates the immediate next step (e.g., "Call Procurement").
- `DealRiskEngine`, `StallDetectionEngine`: Flags deals that are slipping past expected timelines.
- `ActionCenterEngine`: Prioritizes the execution queue based on Urgency and Deal Value.

---

## 3. Database Architecture (Supabase PostgreSQL)

The system relies on over 40 structured tables. Key tables include:

**Core Entities**
- `companies`, `contacts`, `users`, `subscriptions`

**Signals (Phase 3)**
- `signals`, `signal_reasons`, `product_signals`

**Scoring (Phase 4)**
- `opportunity_scores`, `fit_scores`, `intent_scores`, `timing_scores`, `engagement_scores`

**Predictive (Phase 5)**
- `purchase_probabilities`, `calibration_metrics`, `weight_of_evidence`

**Decision & Analytics (Phase 6)**
- `decision_recommendations`, `decision_action_center`, `decision_playbook_performance`, `decision_recommendation_adoption`, `decision_recommendation_outcomes`, `decision_explainability_logs`

---

## 4. External Integrations

- **Google Maps API**: Bulk lead extraction.
- **Clearbit / Apollo (Mocked)**: Company firmographic enrichment.
- **Salesforce / HubSpot**: Two-way sync for Contacts and Deals.
- **Stripe**: Subscription management.
