# JOEP v2 Scoring Input Contract

This defines the future Python scoring payload. It represents the input expected by the scoring engine API. No scoring mathematics are performed here, this is strictly the data structure definition.

```json
{
  "client": {
    "client_id": "uuid",
    "configuration_version": "string",
    "active_products": ["uuid", "uuid"],
    "active_icps": ["uuid", "uuid"]
  },
  "entity": {
    "canonical_entity_id": "uuid",
    "canonical_name": "string",
    "domain": "string",
    "industry": "string",
    "subindustry": "string",
    "country": "string"
  },
  "raw_sources": [
    {
      "source_provider": "string",
      "source_type": "string",
      "source_record_id": "string",
      "raw_payload_hash": "string"
    }
  ],
  "lead_dna": {
    "firmographics": {},
    "commercial_role_hypotheses": [],
    "product_relevance": {},
    "icp_hypotheses": [],
    "evidence_references": [],
    "missing_states": {
      "revenue": "UNKNOWN",
      "employee_count": "NOT_OBSERVED"
    }
  },
  "commercial_role": {
    "role_type": "DIRECT_BUYER",
    "confidence": 0.95
  },
  "icp_assignments": [
    {
      "icp_id": "uuid",
      "is_primary": true,
      "confidence": 0.85
    }
  ],
  "product_matches": [
    {
      "product_id": "uuid",
      "match_state": "CONFIRMED_PRESENT",
      "match_confidence": 0.90
    }
  ],
  "gate_results": [
    {
      "gate_code": "G1",
      "state": "PASS",
      "reason_code": "VALID_ENTITY"
    },
    {
      "gate_code": "G2",
      "state": "UNKNOWN",
      "reason_code": "ROLE_UNCLEAR"
    }
  ],
  "signals": [
    {
      "signal_id": "uuid",
      "event_cluster_id": "uuid",
      "value": {},
      "evidence_state": "CONFIRMED_PRESENT",
      "confidence": 0.8,
      "observed_at": "iso_timestamp"
    }
  ],
  "evidence": [
    {
      "evidence_id": "uuid",
      "source_url": "string",
      "reliability_class": "string",
      "directness": 1.0,
      "published_at": "iso_timestamp"
    }
  ]
}
```
