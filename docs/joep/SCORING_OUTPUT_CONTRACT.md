# JOEP v2 Scoring Output Contract

This defines the future Python scoring response payload. It must structure the output explicitly handling dual priorities, missing states, and driver explainability.

```json
{
  "opportunity_id": "uuid",
  "client_id": "uuid",
  
  "metadata": {
    "model_version": "string",
    "rule_version": "string",
    "client_configuration_version": "string",
    "scored_at": "iso_timestamp"
  },
  
  "qualification_status": "ELIGIBLE_FOR_SCORING",
  "commercial_role": "DIRECT_BUYER",
  "primary_icp": "uuid",
  "product_matches": ["uuid", "uuid"],
  
  "module_scores": {
    "demand": 0.85,
    "procurement_readiness": 0.40,
    "product_fit": 0.90,
    "commercial_value": 0.75,
    "timing": 0.60,
    "competitive_intensity": 0.20,
    "strategic_relevance": 0.10
  },
  
  "aggregates": {
    "opportunity_quality": 0.78,
    "evidence_confidence": 0.65,
    "commercial_value": 250000.00,
    "timing": 0.60
  },
  
  "priorities": {
    "sales_priority": 0.82,
    "research_priority": 0.95,
    "outreach_readiness": 0.40
  },
  
  "operating_status": "INVESTIGATE_NOW",
  
  "explainability": {
    "positive_drivers": [
      "Confirmed office expansion (High Impact)",
      "Strong ICP product fit"
    ],
    "negative_drivers": [
      "No procurement route identified"
    ],
    "unknowns": [
      "Deal size/budget unknown",
      "Decision maker contact missing"
    ]
  },
  
  "research_tasks": [
    {
      "missing_fact": "Procurement Route",
      "affected_module": "procurement_readiness",
      "why_it_matters": "Determines if tender or direct channel is required",
      "recommended_source": "GeM Portal Search",
      "priority": 0.9,
      "expected_information_value": 0.25,
      "estimated_cost": 2.50,
      "estimated_time": 15
    }
  ],
  
  "recommended_actions": [
    "Execute manual research task on GeM Portal",
    "Do not outreach until procurement route is confirmed"
  ]
}
```
