# Jumbl Client Workspace — Master Implementation Plan

**Client:** Jumbl (https://jumbl.in/)
**Status:** Planning / Phase 0
**Theme:** Premium Editorial (Primary: #F1ECCA, Accent: #203C7F)

## Architecture Overview
The JAS frontend will act as the operational workspace for Jumbl, consuming the Python JOEP Scoring Engine's intelligence and converting it into a structured workflow:
`DATA → INTELLIGENCE → PRIORITY → ACTION → CRM → OUTCOME → LEARNING`

## Phased Rollout

### PHASE 0: Repository and Architecture Audit
- **Objective:** Map existing React/Vite/Supabase architecture, routing, and UI components.
- **Rules:** Do not duplicate functionality; preserve existing behaviors; map environment variables.

### PHASE 1: Canonical Data Model + Scoring Contract (DONE)
- **Objective:** Extend Supabase schema to support the Canonical Lead Model, explicit Missing States (UNKNOWN, NOT_OBSERVED, etc.), and multi-tenant isolation.
- **Focus:** `RawLead`, `Opportunity`, `LeadDNA`, `ModuleScore`.

### PHASE 2: Jumbl Tenant ### PHASE 2: Jumbl Tenant & Authentication Authentication (DONE)
- **Objective:** Create the isolated Jumbl workspace and secure login.
- **Security:** Do NOT hardcode passwords. Use Supabase Auth. 
- **Setup:** Client profile for Jumbl (Design Partner).

### PHASE 3: Product & Service Catalogue
- **Objective:** Build `/products`.
- **Features:** Add, Edit, Archive, Deactivate. Map products to ICPs, signals, and deal ranges. Intelligence must be filterable by product.

### PHASE 4: Dashboard Shell & Raw Data Layer
- **Objective:** Build the Main Dashboard and `/leads` (Raw Data) views.
- **Features:** Analytics (Total leads, disqualified, pipeline). `Lead Detail Page` preserving source provenance and showing Gate Traces.

### PHASE 5: Python Scoring Engine Integration
- **Objective:** Connect the frontend to the backend scoring output.
- **Status:** Backend contract (Sprint 1) complete. UI will consume the JSON schema.

### PHASE 6: Opportunity Intelligence UI
- **Objective:** Build the core `TODAY'S PRIORITIES` view.
- **Features:** "Why this lead? Why now? What evidence?". Split by `CONTACT NOW`, `INVESTIGATE`, `NURTURE`.

### PHASE 7: JAS CRM
- **Objective:** Build a Kanban-style CRM with configurable stages.
- **Features:** "Add to CRM" flow preserving all JOEP scoring provenance. Full Opportunity timeline.

### PHASE 8: External Data & Connectors
- **Objective:** Build `SETTINGS → INTEGRATIONS`.
- **Features:** Generic connector interface (OAuth). Show Connected, Available, Coming Soon. Map external CRM/Apollo data to JAS Canonical Schema.

### PHASE 9: GTM Activation
- **Objective:** Turn intelligence into campaigns.
- **Features:** Audience export, campaign planning, creative briefs. (Demo/Draft mode for V1).

### PHASE 10: Outcome Tracking & Calibration
- **Objective:** Close the loop. Record SAQO, meetings, wins, losses, and loss reasons to feed the Python engine's learning loop.

### PHASE 11: Polish & Deployment
- **Objective:** Security sweep, theme enforcement (#F1ECCA / #203C7F), and Vercel/production deployment.

## Priorities
- **P0 (Demo Readiness):** Auth, Tenant Profile, Product Catalogue, Raw Data, Lead Detail, Opportunity Intelligence (Today), Explainability, CRM Kanban.
- **P1:** Deeper enrichment, external CRM import (HubSpot/Apollo), saved searches, campaign drafts.
- **P2:** Two-way CRM sync, ads integrations, automated recalibration, full campaign execution.
