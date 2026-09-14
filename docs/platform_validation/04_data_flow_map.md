# JAS CONNECT Data Flow Map

This document traces the exact path a piece of data takes from initial ingestion as a raw record through the complex intelligence layers, eventually terminating as a closed deal in the CRM.

---

## The Master Data Flow

### 1. Ingestion (The Top of the Funnel)
- **Source**: Raw CSV Upload, Government Tender API, Google Maps Scrape, or CRM Sync.
- **Service**: `InternalSignalGenerator` or `ExternalSignalGenerator`.
- **Database**: Inserted into the `signals` table as a raw event.

### 2. Normalization & Resolution (Cleaning)
- **Service**: `EventNormalizer` standardizes the event schema.
- **Service**: `EntityResolver` and `EntityMatchingEngine` check if the company/contact already exists.
- **Database**: If new, inserted into `companies` and `contacts`. If existing, merged via `EntityMergeEngine`.

### 3. Enrichment (Appending Data)
- **Service**: `CompanyEnrichmentService` fires out to Clearbit/Apollo (mocked).
- **Database**: Updates `companies` with Revenue, Employee Count, Technologies Used.

### 4. Component Scoring (Phase 4)
The system now evaluates the enriched data across four distinct pillars:
- **Fit Engine** (`FitScoreService`): Analyzes the company profile (Industry, Tech Stack) to generate a Fit Score (0-100).
- **Intent Engine** (`IntentScoreService`): Analyzes behavioral data (Website visits, Review site surges) to generate an Intent Score.
- **Timing Engine** (`TimingScoreService`): Analyzes trigger events (Funding rounds, Exec changes) to generate a Timing Score.
- **Engagement Engine** (`EngagementScoreService`): Analyzes sales activity (Emails, Calls) to generate an Engagement Score.
- **Database**: Stores discrete scores in `fit_scores`, `intent_scores`, `timing_scores`, `engagement_scores`.

### 5. Master Scoring (Phase 4 continued)
- **Service**: `MasterOpportunityScoreEngine`.
- **Process**: Blends the 4 component scores using industry-specific weights (managed by `VerticalWeightEngine`).
- **Database**: Stores the final 0-100 score in `opportunity_scores`.

### 6. Probability Prediction (Phase 5)
- **Service**: `ProbabilityDriverService`.
- **Process**: Takes the Opportunity Score and historical evidence (`WeightOfEvidenceService`) to predict the actual % chance this deal will close.
- **Service**: `IsotonicCalibrationService` or `PlattScalingService`.
- **Process**: Adjusts the raw probability to match real-world historical win rates (ensuring 80% means 8 out of 10 actually close).
- **Database**: Stores in `purchase_probabilities` and `calibration_metrics`.

### 7. Decision Intelligence (Phase 6)
Now the system asks "What should we do about this?"
- **Contact Prioritization**: `ContactPrioritizationEngine` decides *who* to call (e.g., The CFO).
- **Product Match**: `ProductMatchEngine` decides *what* to sell based on signals (e.g., Solar Package).
- **Playbook**: `PlaybookRecommendationEngine` selects the sales motion (e.g., "ROI Pitch").
- **Action Generation**: `NextBestActionEngine` generates the exact task (e.g., "Email CFO with ROI pitch for Solar Package").
- **Database**: Generates records in `decision_recommendations`.
- **Service**: `ActionCenterEngine` prioritizes this task against all others based on Urgency and Deal Value.
- **Database**: Inserts the task into `decision_action_center`.

### 8. User Execution (The UI)
- **Action**: User logs in and reviews the Action Center.
- **Action**: User clicks "Execute" on the task.
- **Database**: `decision_recommendation_adoption` logs the task as "Accepted".

### 9. CRM Sync & Outcome Tracking
- **Action**: The lead/opportunity is pushed to the CRM.
- **Time passes**: The User works the deal and marks it "Closed Won" in the CRM.
- **Service**: Webhook fires back to JAS CONNECT triggering the `RecommendationOutcomeEngine`.
- **Database**: Updates `decision_recommendation_outcomes` with Won = True and Revenue = $X.
- **Analytics**: The `RecommendationPerformanceEngine` recalculates the overall ROI and Win Rates to display on the Executive Dashboard.
