# JOEP v2 Current System Gap Analysis

## GAP-001: Fake Scoring in UI
**Current Behavior**: The `WorkspaceScoringEngine.tsx` uses hardcoded sliders (e.g., Intent: 35%, Fit: 40%) that are completely decoupled from actual data.
**JOEP v2 Required Behavior**: The UI must consume actual Python JOEP outputs rather than inventing frontend scores.
**Affected Files**: `src/pages/workspace/WorkspaceScoringEngine.tsx`
**Severity**: CRITICAL
**Implementation Phase**: PHASE 5, 6

## GAP-002: Missing Python Backend
**Current Behavior**: Scoring exists only as mock data in the React Context (`ClientWorkspaceContext`).
**JOEP v2 Required Behavior**: A dedicated Python scoring service (FastAPI/worker) must evaluate all leads natively.
**Affected Files**: `src/contexts/ClientWorkspaceContext.tsx`
**Severity**: CRITICAL
**Implementation Phase**: PHASE 5

## GAP-003: No Score History or Versioning
**Current Behavior**: Scores are static or overwritten.
**JOEP v2 Required Behavior**: Versioned score snapshots storing `model_version`, `rule_version`, and `scored_at`.
**Affected Files**: Database schema (`jas_scores` table).
**Severity**: HIGH
**Implementation Phase**: PHASE 8

## GAP-004: Missing-Value States Ignored
**Current Behavior**: Missing values default to 0 or are just missing.
**JOEP v2 Required Behavior**: Explicit missing-state architecture (`NOT_OBSERVED`, `UNKNOWN`, `CONFIRMED_ABSENT`).
**Affected Files**: Database schema, UI rendering components.
**Severity**: HIGH
**Implementation Phase**: PHASE 2

## GAP-005: Pre-scoring Hard Gate Implementation
**Current Behavior**: Hard gates are assumed to be 100% PASS for anything in the dashboard.
**JOEP v2 Required Behavior**: Only verified hard-gate FAIL blocks scoring. Candidates failing must be explicitly flagged `DISQUALIFIED` and handled via the engine.
**Affected Files**: Data ingestion pipelines, Opportunity Intelligence UI.
**Severity**: HIGH
**Implementation Phase**: PHASE 3

## GAP-006: Dual Priorities Missing
**Current Behavior**: Only "Today's Priorities" (sales) exist.
**JOEP v2 Required Behavior**: Needs both "Sales Priority" and "Research Priority" queues where sparse data lives.
**Affected Files**: `WorkspaceOverview.tsx`, Opportunity Lists.
**Severity**: MEDIUM
**Implementation Phase**: PHASE 10
