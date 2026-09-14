# Phase 3: Database Access Layer

## Pattern
Repository Pattern utilizing the Supabase Python Client (`supabase-py`).

## Repositories
- `LeadRepository`: Fetches raw leads and DNA.
- `EntityRepository`: Handles entity resolution lookups.
- `OpportunityRepository`: Fetches and updates opportunity state.
- `ScoreRepository`: Inserts versioned records into `joep_score_snapshots`. Never overwrites.
- `ResearchTaskRepository`: Creates and expires research tasks.

Transaction boundaries will be managed via RPC calls or careful sequential writes where Supabase REST lacks multi-table transactions, ensuring `is_current` flips atomically.
