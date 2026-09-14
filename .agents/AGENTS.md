# JAS CONNECT Execution Guidelines

Before implementing any phase, all agents MUST:
1. Audit existing implementation.
2. Reuse existing code.
3. Remove mock data.
4. Remove hardcoded logic.
5. Connect existing services.
6. Only build new services when absolutely necessary.

After every phase, the agent MUST generate a report covering:
- Changed files
- Database changes
- Services added
- Services modified
- Regression test report
- Broken functionality report

**CRITICAL**: No phase is considered complete until all existing functionality remains operational.
