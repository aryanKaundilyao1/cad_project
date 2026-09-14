# Phase 17: Opportunity Quality
STATUS: UNBLOCKED

Implements the Geometric Core:
`Q(o) = [ ∏ₖ Mₖ(o)^{wₖ} ] · (1 + Strategic(o)) − CompetitivePenalty(o)`

Unobserved modules are cleanly excluded from the `∏` operation rather than evaluated as 0.
