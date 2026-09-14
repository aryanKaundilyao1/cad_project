# Jumbl Workspace — Scoring Integration

## Contract Consumption
The UI consumes the `ScoringOutput` contract from the Python engine. 
It must accurately reflect:
1. **Qualification Status** (Eligible vs Disqualified).
2. **Aggregates** (Quality, Confidence, Value, Timing).
3. **Priorities** (Sales vs Research vs Outreach).

## Opportunity Intelligence Dashboard
The UI will map the `operating_status` into clear buckets:
- **CONTACT NOW:** High Quality, High Confidence, High Outreach Readiness.
- **INVESTIGATE NOW:** High Quality, Low Confidence, missing crucial facts (spawns Research Tasks).
- **NURTURE:** Lower timing/actionability.
- **LOW PRIORITY:** Poor fit or low commercial value.

## Explainability ("Why this lead?")
The UI must render the `positive_drivers`, `negative_drivers`, and `unknowns` arrays from the scoring output to explain the `LCB` (Lower Confidence Bound) rank to the Jumbl sales team.
