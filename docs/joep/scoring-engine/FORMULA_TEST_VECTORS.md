# Formula Test Vectors

**STATUS: PARTIAL / BLOCKED**

## Temporal Decay (v1 Baseline)
**INPUTS:**
* `days_since_last_signal` = 14
* `lambda_val` = 0.05 (14-day half-life)

**EXPECTED OUTPUT:**
* `e^(-0.05 * 14)` = `e^(-0.7)` ≈ `0.496`

**BOUNDARY CASE:**
* `days_since_last_signal` = 0 -> Output: `1.0`
* `days_since_last_signal` = 1000 -> Output: `~0.0`

*(No test vectors can be generated for JOEP v2 F1-F12 as the formulas are missing).*
