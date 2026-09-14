# Jumbl Workspace — CRM Architecture

## Core Philosophy
The CRM is built on a modern B2B opportunity architecture. It is NOT just a contact book.

## Kanban View
Configurable stages. Default for Jumbl:
`New` → `Researching` → `Ready to Contact` → `Contacted` → `Responded` → `Qualified` → `Meeting` → `Proposal` → `Won` → `Lost` → `Nurture`

## Provenance Retention
When an Opportunity is added to the CRM via "Add to CRM", it MUST retain:
- Original Source
- Score at time of import
- Product Match
- ICP
- Evidence Trace

## Import Paths
1. JAS Opportunity Intelligence
2. Manual Entry
3. CSV
4. Connected Prospecting Provider (Apollo, Aimfox)
5. Connected CRM (HubSpot)
