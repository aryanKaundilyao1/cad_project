# JAS Opportunity Engine — JOEP v2 Gates × ICP Routing Architecture

**Status:** Implementation architecture  
**Purpose:** Replace the pre-scoring gate chain that caused sparse outbound leads to be trapped in research queues.  
**Companion:** `JOEP-INFONICS-v2.0-UNIFIED-IMPLEMENTATION.md`

---

## 1. Why this file exists

The previous JAS gate design was logically strong for known projects, tenders, inbound requirements and procurement events, but too strict for raw outbound lead universes. In the 5,000-lead Google Maps test, roughly 80 candidates were disqualified while almost every other candidate went to research because procurement, project, timing or technical evidence was not publicly observable.

That behavior is not compatible with the JAS commercial promise:

> take a large candidate universe, remove what makes no commercial sense, then prioritize the opportunities most worth a client's sales effort.

A Google Maps row, IndiaMART supplier record, CRM account or directory listing should not need to contain an RFQ, budget, tender, decision maker and purchase timeline before JAS is willing to rank it.

### v2 rule

> **A candidate is disqualified only by verified hard incompatibility or a client-defined absolute exclusion. Missing soft evidence does not equal negative evidence.**

Procurement evidence, demand events, timing signals, technical details, competitive information and contactability remain valuable—but they are no longer universal permission slips for entering the scoring engine.

---

## 2. End-to-end routing flow

```text
CLIENT COMMERCIAL DNA
        ↓
PRODUCT / OFFERING DNA
        ↓
PRODUCT × MARKET CONFIGURATION
        ↓
RAW CANDIDATE INGESTION
        ↓
NORMALIZATION + ENTITY RESOLUTION + DEDUPLICATION
        ↓
BASIC LEAD DNA
        ↓
HARD ELIGIBILITY GATES
        ↓
COMMERCIAL ROLE CLASSIFICATION
        ↓
ICP ROUTING
        ↓
PROGRESSIVE ENRICHMENT
        ↓
FULL LEAD DNA
        ↓
SIGNAL EXTRACTION
        ↓
SCORING MODULES
        ↓
OPPORTUNITY QUALITY
        +
EVIDENCE CONFIDENCE
        +
COMMERCIAL VALUE
        +
TIMING / ACTIONABILITY
        +
OUTREACH READINESS
        ↓
SALES PRIORITY + RESEARCH PRIORITY
        ↓
CONTACT NOW / INVESTIGATE / NURTURE-WATCH / LOW PRIORITY / DISQUALIFIED
```

The critical change is that **ICP and scoring now happen for eligible outbound leads even when procurement evidence is missing**.

---

## 3. Canonical lead states

Every relevant field must support explicit evidence-state semantics.

| State | Meaning | May disqualify? | Scoring behavior |
| --- | --- | --- | --- |
| `CONFIRMED_PRESENT` | credible evidence confirms the fact | only if presence itself triggers a hard exclusion | evaluate normally |
| `CONFIRMED_ABSENT` | credible evidence confirms absence | only if absence violates an absolute condition | may lower a module or trigger hard fail if configured |
| `UNKNOWN` | cannot currently determine | no | remain missing; reduce confidence / create research task |
| `NOT_OBSERVED` | current sources do not reveal it | no | never convert to zero automatically |
| `NOT_APPLICABLE` | field does not apply to this ICP/offering | no | exclude from applicable model |
| `CONFLICTING` | sources disagree | no | lower confidence; research if material |
| `ENRICHMENT_FAILED` | collection process failed | no | retry/alternate source; do not punish opportunity |
| `NEEDS_MANUAL_RESEARCH` | important fact requires human work | no | candidate can still have a score and priority |

This prevents a source-poor lead from being mistaken for a commercially weak lead.

---

## 4. Hard eligibility gates

JOEP v2 uses the minimum sufficient gate set.

### G1 — Entity Validity

**Question:** Is this a legitimate, resolvable commercial entity/opportunity object?

**PASS when:**
- entity can be resolved with reasonable confidence; and
- no verified invalidity condition applies.

**FAIL only when:**
- confirmed nonexistent/fake entity;
- permanently closed/inactive where active operation is necessary;
- duplicate already merged into another canonical entity;
- consumer/non-business where configuration strictly requires B2B;
- invalid/corrupt source record with no recoverable entity.

**Unknown handling:** retain candidate and create entity-resolution/enrichment task where appropriate.

---

### G2 — Commercial Role Eligibility

**Question:** Could this entity plausibly create commercial value for this client?

Allowed role taxonomy is client-configurable. Typical roles:

- `DIRECT_BUYER`
- `CHANNEL`
- `DISTRIBUTOR`
- `RESELLER`
- `SYSTEM_INTEGRATOR`
- `SPECIFIER`
- `CONSULTANT`
- `INFLUENCER`
- `PROJECT_OWNER`
- `PROCUREMENT_BODY`
- `PARTNER`
- `OTHER_RELEVANT_ROLE`
- `ROLE_UNRESOLVED`
- `HARD_NEGATIVE`

**PASS:** any plausible relevant role.

**FAIL:** verified `HARD_NEGATIVE` with no plausible client-configured commercial role.

**Important:** “not a direct buyer” is not equivalent to “negative ICP”. An AV integrator, EPC, architect, consultant, distributor or channel may be valuable even when not an end buyer.

---

### G3 — Broad Offering Relevance

**Question:** Is there at least one plausible relationship between the entity/application and a client offering?

Conceptually:

`∃ p ∈ P_client : plausibleCompatibility(p, entity) = TRUE`

**PASS:** at least one plausible offering/application path.

**FAIL:** verified structural irrelevance to all client offerings.

**UNKNOWN / NOT_OBSERVED:** candidate continues; offering research may be scheduled. Do not demand proof of current intent at this stage.

---

### G4 — Hard Geography / Legal / Serviceability

**Question:** Is there a verified geographic, legal or serviceability reason this client cannot pursue the opportunity?

**FAIL only when:**
- client explicitly excludes geography;
- law/regulation prohibits transaction;
- service/install/delivery is confirmed impossible;
- other client-configured hard territorial rule applies.

“Serviceability not yet known” is not a fail.

---

### G5 — Client-Specific Absolute Exclusions

**Question:** Does a verified client absolute-exclusion rule apply?

Typical examples:
- account blacklist / do-not-contact;
- prohibited sector;
- explicitly impossible product requirement;
- legally impossible customer class;
- confirmed order type client refuses in all circumstances;
- verified minimum rule that the client declares truly absolute;
- active conflict/client restriction.

A rule belongs here only if the client can honestly say:

> “Even if every other signal were excellent, we would never pursue this opportunity.”

If not, it belongs in scoring, value, timing, confidence or research.

---

## 5. Former gates migrated into scoring/signals

| Old concept | v2 location | Reason |
| --- | --- | --- |
| Demand Reality | Demand / Trigger module | outbound leads often have no publicly observed project yet |
| Procurement Accessibility | Buying / Procurement Readiness | live tender/RFQ is strong positive evidence, not mandatory eligibility |
| Technical Feasibility | hard exception + Product Fit | confirmed impossible spec can fail; unavailable specs remain unknown |
| Commercial Feasibility | hard exception + Commercial Potential | deal value often unknown pre-outreach |
| Timing / Stage | Timing / Actionability | no observed timing signal ≠ impossible sale |
| Competitive Constraint | hard exception + Competitive Intensity | verified exclusive lock may fail; competitor presence alone is graded |
| Contact availability | Outreach Readiness | reachability is not propensity |
| Evidence quantity | Evidence Confidence | more public data is not inherently more opportunity quality |

---

## 6. Commercial role × ICP × offering model

Store these dimensions independently:

```text
commercial_role
primary_icp
secondary_icps[]
icp_confidence
offering_matches[]
market_application
qualification_status
```

Example:

```yaml
company: XYZ Malls
commercial_role: DIRECT_BUYER
primary_icp: RETAIL_COMMERCIAL
offering_matches:
  - DIGITAL_SIGNAGE
  - LED_VIDEO_WALL
qualification_status: ELIGIBLE_FOR_SCORING
```

Channel example:

```yaml
company: ABC AV Systems
commercial_role: SYSTEM_INTEGRATOR
primary_icp: AV_CHANNEL
offering_matches:
  - MULTIPLE
qualification_status: ELIGIBLE_FOR_SCORING
```

Hard negative example:

```yaml
company: Irrelevant Consumer Entity
commercial_role: HARD_NEGATIVE
primary_icp: null
qualification_status: DISQUALIFIED
```

---

## 7. ICP as model routing

ICP does not mean “good” or “bad”. It selects which commercial logic applies.

For Infonics, the existing ICP structure can continue to include families such as:

- Retail / Mall
- Government / PSU / Institutions
- Transport / Infrastructure
- Corporate
- Media / Broadcast
- Events / Sports
- Channel / AV / System Integrator where configured

Each ICP may load different:

- feature families;
- signal families;
- relevance priors;
- commercial-value model;
- temporal rules;
- procurement-route interpretation;
- weight set;
- later learned coefficients.

A lead may have one primary ICP and multiple secondary ICPs when the evidence supports more than one commercial path.

---

## 8. Example ICP feature routing

### Retail / Commercial
Potentially relevant:
- store count;
- new stores;
- refurbishments;
- mall presence;
- premium brand positioning;
- digital customer-experience investment;
- rollout scale;
- advertising/branding intensity;
- multi-location footprint.

### Infrastructure / Transport
Potentially relevant:
- project announcement;
- project scope;
- EPC appointment;
- authority/project owner;
- tender/RFQ when present;
- technical specification when present;
- deadline;
- capital expenditure;
- procurement route.

### Corporate
Potentially relevant:
- new office;
- relocation;
- HQ refurbishment;
- AV modernization;
- control room / auditorium / boardroom requirements;
- facilities / IT / projects activity.

These are routing examples, not arbitrary point rules.

---

## 9. Progressive enrichment

Different sources have different schemas. JAS must not require source parity.

```text
RAW SOURCE
↓
CANONICAL NORMALIZATION
↓
FREE/CHEAP ENTITY ENRICHMENT
↓
WEBSITE / DOMAIN RESEARCH
↓
ICP / OFFERING HYPOTHESIS
↓
LOW-COST SIGNAL SEARCH
↓
INITIAL QUALITY + CONFIDENCE ESTIMATE
↓
HIGH-POTENTIAL / LOW-CONFIDENCE?
    YES → deeper API / research
    NO  → stop enrichment at economical depth
↓
MANUAL RESEARCH only where expected information value justifies cost
```

A 5,000-lead dataset should not trigger 5,000 identical research workflows.

---

## 10. Google Maps / directory fields: how to treat them

Example fields:

| Field | Primary use | Not automatically |
| --- | --- | --- |
| company/category | entity + structural fit | purchase intent |
| website | enrichment/evidence source | quality boost by itself |
| phone | outreach readiness | opportunity quality |
| rating/reviews | contextual evidence where relevant | commercial value |
| location | geography/context | high or low score by default |
| competitors / similar businesses | entity context / sector clues | competitive lock-in |
| `is_spending_on_ads` | candidate contextual signal; hypothesis to validate | +10 / buying intent |
| description | entity classification / offering relevance | verified demand |

Any field becomes a production scoring feature only when there is a defensible commercial hypothesis and later empirical validation.

---

## 11. Sparse candidate behavior

A candidate such as:

```text
Fit: strong
Commercial scale: strong
Demand: NOT_OBSERVED
Procurement: NOT_OBSERVED
Timing: NOT_OBSERVED
Contacts: missing
```

must not be converted into:

```text
Demand = 0
Procurement = 0
Timing = 0
Contactability = 0
→ terrible opportunity
```

Instead:

```text
Opportunity potential: estimated from observed/estimable evidence
Evidence confidence: lower
Outreach readiness: lower
Research priority: potentially high
Sales priority: depends on Q/Conf/EV rules
```

By contrast, if research establishes:

```text
Demand = CONFIRMED_ABSENT
or
Procurement route = CONFIRMED STRUCTURALLY CLOSED
```

that is genuine negative evidence and is handled accordingly.

---

## 12. Operational queues

JOEP v2 outputs at least five states:

### CONTACT NOW
High opportunity potential + sufficient confidence/actionability.

### INVESTIGATE NOW
High estimated potential + important missing evidence. Research or light outreach is justified.

### NURTURE / WATCH
Plausible fit, but current actionability is low or no live signal is observed.

### LOW PRIORITY
Valid and relevant, but comparatively weak relative to the rest of the client universe.

### DISQUALIFIED
Verified structural irrelevance/impossibility or client absolute exclusion.

No predetermined percentages are imposed. The distribution must emerge from data and client configuration.

---

## 13. Research queue rules

Research task schema:

```yaml
research_task_id:
opportunity_id:
missing_fact:
affected_module:
why_it_matters:
recommended_source:
estimated_cost:
estimated_time:
priority:
resolution_values:
expiry:
evidence_returned:
```

A candidate may simultaneously have:

- a valid opportunity score;
- low/medium evidence confidence;
- active research tasks;
- an outreach-readiness state.

Research no longer blocks scoring by default.

---

## 14. Control-flow pseudocode

```text
function qualify_and_route(raw_candidate, client_config):
    entity = resolve_entity(raw_candidate)
    lead = build_basic_lead_dna(entity, raw_candidate)

    gates = evaluate_hard_gates(lead, client_config)

    if any(g.state == FAIL for g in gates):
        return DISQUALIFIED

    role = classify_commercial_role(lead, client_config)
    icp = classify_icp(lead, role, client_config)

    lead = progressive_enrichment(lead, icp, client_config)

    return ELIGIBLE_FOR_SCORING(
        lead=lead,
        role=role,
        icp=icp,
        gate_trace=gates
    )
```

The companion scoring file then performs feature extraction, existing module formulas, evidence confidence, expected value and ranking.

---

## 15. Acceptance tests

- [ ] Missing procurement evidence does not FAIL an otherwise eligible cold outbound lead.
- [ ] Active tender/RFQ increases procurement readiness when present.
- [ ] Phone/email missing does not decrease opportunity quality.
- [ ] Phone/email present increases Outreach Readiness only.
- [ ] `is_spending_on_ads=true` does not create arbitrary opportunity points.
- [ ] Hard-negative entity is disqualified with evidence/reason code.
- [ ] AV integrator can survive as a channel even when not a direct buyer.
- [ ] Architect/specifier can survive as an influencer/specifier role.
- [ ] Unknown technical requirements remain unknown instead of failing.
- [ ] Confirmed incompatible specification can trigger a hard exclusion.
- [ ] Unknown deal value remains missing instead of zero.
- [ ] Confirmed below an absolute client-defined minimum can fail if configured as truly absolute.
- [ ] ICP selects feature/model configuration rather than arbitrary merit points.
- [ ] Candidate can hold multiple ICP assignments.
- [ ] Sparse high-potential candidate can become `INVESTIGATE`.
- [ ] High-potential well-evidenced candidate can become `CONTACT NOW`.
- [ ] Every hard FAIL has an evidence trace and reason code.
- [ ] Every research task names the fact it is trying to resolve.
- [ ] Every scored opportunity remains traceable to source records and versions.

---

## 16. Migration summary

**Retire:** `all G1..G10 must PASS before scoring`.

**Keep:** deterministic disqualification for genuine structural impossibilities.

**Move:** procurement, demand, timing and competition into graded scoring/signal layers except where a verified hard exception exists.

**Separate:** ICP, commercial role, qualification status, confidence and outreach readiness.

**Allow:** scoring + research task at the same time.

**Goal:** only candidates that make no plausible commercial sense are removed before scoring; all other candidates are compared using the scoring architecture with explicit uncertainty.
