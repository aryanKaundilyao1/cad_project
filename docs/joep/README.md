# JAS Opportunity Engine — JOEP v2

JOEP v2 is the authoritative architecture for JAS Opportunity Intelligence.

Implementation lifecycle:

RAW LEAD
→ NORMALIZATION
→ ENTITY RESOLUTION
→ HARD GATES
→ COMMERCIAL ROLE
→ ICP ROUTING
→ PROGRESSIVE ENRICHMENT
→ SIGNAL EXTRACTION
→ SCORING
→ EVIDENCE CONFIDENCE
→ COMMERCIAL VALUE
→ SALES PRIORITY
→ RESEARCH PRIORITY
→ OUTREACH READINESS
→ OPPORTUNITY INTELLIGENCE
→ CRM
→ OUTCOME CAPTURE
→ RECALIBRATION

## Authoritative Files

FILE 1:
`JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md`
Purpose:
Complete scoring architecture and formula source of truth.

FILE 2:
`JOEP-v2-GATES-ICP-ROUTING.md`
Purpose:
Pre-scoring routing, gates, ICP, sparse-data and research behavior.

FILE 3:
`JOEP-v2-IMPLEMENTATION-PLAN.md`
Purpose:
Technical implementation architecture and phased build plan.

## Source-of-truth precedence

If documentation conflicts:

1. `JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md` governs scoring mathematics, formulas, calibration, validation and ranking.

2. `JOEP-v2-GATES-ICP-ROUTING.md` governs gates, disqualification, ICP routing, missing evidence and research-queue behavior.

3. `JOEP-v2-IMPLEMENTATION-PLAN.md` governs integration, service architecture, APIs, background jobs, persistence and implementation sequencing.

4. Deprecated v1 documents must not override JOEP v2.

## Non-Negotiable Rules

1. A candidate may be disqualified only by verified hard incompatibility or a client-defined absolute exclusion.

2. Missing soft evidence does not equal negative evidence.

3. Missing procurement does not disqualify a lead.

4. Missing contact details do not reduce opportunity quality.

5. ICP is routing/context, not arbitrary merit.

6. Commercial role, ICP, qualification status, evidence confidence and outreach readiness are separate.

7. Research may coexist with scoring.

8. UNKNOWN must never silently become zero.

9. Existing JOEP scoring formulas are authoritative.

10. The UI must consume actual JOEP outputs rather than inventing frontend scores.
