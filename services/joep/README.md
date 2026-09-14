# JOEP Scoring Engine

This service implements the JAS Opportunity Engine (JOEP) v2. 

## Current Status
**SPRINT 1 IMPLEMENTATION ONLY.**
This sprint implements the architecture, domain models, and Pydantic schema contracts. **No JOEP scoring mathematics or Supabase connectivity are active yet.**

## Setup
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
```

## Running the Service
```bash
uvicorn app.main:app --reload
```

## Testing
```bash
pytest
```

## Directory Structure
- `app/api/`: FastAPI route handlers (Health, Validation)
- `app/core/`: Configuration, settings, and custom exceptions
- `app/models/`: Internal domain structures (Enums, Evidence, DNA, Signals, Gates, ICP)
- `app/schemas/`: API payload contracts (ScoringInput, ScoringOutput)
- `tests/`: Pytest suite verifying contract states and error conditions
