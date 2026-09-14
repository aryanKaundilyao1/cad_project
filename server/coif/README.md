# Client Opportunity Intelligence Framework (COIF) - Phase 1

This is the standalone module for the Client Opportunity Intelligence Framework (COIF). This module operates entirely independently of the UI and existing OIE infrastructure to validate architecture, logic, ranking, and explainability (Reason Codes & Confidence).

## Folder Structure

```
coif/
├── src/
│   ├── cli.ts                # Terminal execution and output formatter
│   └── engine/
│       ├── COIFEngine.ts       # Orchestrator combining all sub-analyzers
│       ├── SourceAnalyzer.ts   # Evaluates source reliability and completeness
│       ├── IndustryAnalyzer.ts # Matches lead industry with client context
│       ├── ProductAnalyzer.ts  # Matches catalog/keywords to client products
│       ├── BuyerAnalyzer.ts    # Evaluates buyer type (Importer, OEM, etc.)
│       ├── ClientAnalyzer.ts   # Evaluates constraints (Geo, Certifications)
│       ├── ConfidenceEngine.ts # Outputs a 0-100% confidence score
│       ├── ReasonEngine.ts     # Generates human-readable score explanations
│       ├── RankingEngine.ts    # Sorts leads by Final Score and Confidence
│       ├── FusionEngine.ts     # Combines baseline OIE score with COIF score
│       └── types.ts            # Interfaces (Lead, ClientContext, etc.)
├── test/
│   └── dataset.ts            # Synthetic test data representing various sources/profiles
├── package.json
└── tsconfig.json
```

## Engine Architecture

The architecture is highly modular. It takes a raw `Lead` (which contains `ObservableMetrics` and a `baselineOIEScore`) and a `ClientContext`, and processes them through the following pipeline:
1.  **Analyzers (Fit & Intent):** Source, Industry, Product, Buyer, and Client analyzers generate raw scores and multipliers, appending `ReasonCodes` for every decision.
2.  **Confidence:** The `ConfidenceEngine` evaluates data completeness, source tier, and agreement.
3.  **Fusion:** The `FusionEngine` merges the external OIE Score with the computed COIF Score using a "Confidence-Weighted" approach (if data is missing/stale, rely more on OIE; if data is rich, rely more on COIF).
4.  **Ranking:** The `RankingEngine` performs a deterministic sort (Score -> Confidence).

## Execution Commands

Ensure you have `npm` installed.

```bash
# Install dependencies
npm install

# Run the test suite (displays the output dashboard)
npm run test-coif
```

*Note: We use `tsx` (installed as a devDependency) for seamless TypeScript execution.*

## Test Data Structure

The `test/dataset.ts` contains:
-   **3 Google Maps Leads**: All from the same source and industry with the same OIE score (78), but differing observable metrics (e.g., has export page, certifications, product match). This proves the COIF engine differentiates leads that OIE treats equally.
-   **Government, Trade, Marketplace, Apollo, and Web Leads**: Demonstrates how `SourceAnalyzer` impacts confidence and the resulting fusion weight.

## Integration with Existing OIE (Without Modifying It)

This engine is designed to sit *downstream* of the OIE. 
1.  The existing OIE pipeline runs as normal, assigning a global `OIEScore` based on generic fit, intent, and timing.
2.  When a Client creates a Workspace or runs a Campaign, the COIF engine fetches the OIE scores and raw lead metrics.
3.  COIF computes the client-specific delta without modifying the underlying database tables of the OIE.

## Future Integration Points

-   **Admin Panel:** 
    -   *Data Import*: Admins will map CSV/Scraped fields to `ObservableMetrics`.
    -   *Review*: The CLI output will map directly to React tooltips (Reason Codes) in the Admin verification tab.
    -   *Publish*: Only Top N ranked leads are published to the client.
-   **Client Workspace:** 
    -   Clients will only see leads that pass a minimum COIF threshold, categorized strictly by the `targetProducts` they have subscribed to (e.g., the "Ashwagandha Dashboard").
-   **Machine Learning (Fusion & Multipliers):** 
    -   Future updates will replace the deterministic `BuyerAnalyzer` multipliers with an XGBoost/Logistic Regression model trained on CRM outcomes (Email Opens/Replies).
