# Evaluation evidence — 17 November 2026

Official mapping supplied by user: Code Quality and Problem Alignment high impact; Security and Efficiency medium; Testing and Accessibility low. No numerical weights assumed.

| Criterion | Implementation evidence | Verification method | Result |
|---|---|---|---|
| Code Quality | Shared pure rule module, separate Worker API and DOM view; one build tool | Node syntax checks, build and rule assertions | Verified for executed checks; no TypeScript/static type check |
| Security | Typed/bounded input, 8 KiB stream limit, same-origin API, safe DOM text, server-only credentials | API rejection tests, code review, npm production audit | Verified scoped checks; zero production dependency audit findings, no penetration-test claim |
| Efficiency | No model request by default; bounded history; shared local fallback | 10,000 pure engine calls, Node 22.19.0 Windows | Verified p50 0.0026 ms, p95 0.0052 ms; not network latency or production load |
| Testing | Unit/API and browser acceptance tests | `npm test`, `node tests/browser.mjs` | 29/29 Node tests; eight browser scenarios passed |
| Accessibility | Labels, landmarks, focus, skip link, status, responsive controls | axe WCAG A/AA tags on desktop 1440×1000 and mobile 390×844; keyboard workflow | Zero automated violations in tested plan state; no horizontal overflow; manual screen-reader review pending |
| Problem Alignment | Indian AQI family planner, access/budget constraints, indoor and low-emission alternatives, ambiguity | Sensitive member changes decision; unavailable transport changes action; conflict asks question | Verified sample acceptance; official judging remains external |

Node coverage: engine 100% lines, 98.18% branches; Worker 100% lines, 82.86% branches. Coverage includes mocked provider branches, not live paid-provider verification. Browser tests exercise real local HTTP calls. Syntax checks cover engine, API and view. Build succeeded. No browser console exceptions were observed.

Eight browser scenarios: first plan; context followup; reload continuity; conflicting AQI; invalid input; AI not configured fallback; context reset; keyboard completion. Actual external-provider outage is separately tested at API level with mocked fetch failure. Offline server fallback uses the same tested rules.

Initial automated audit found insufficient contrast in three decorative principle numbers; colour was darkened and the audit rerun successfully. Tests do not establish full WCAG compliance or complete natural-language understanding.

## Submission gates
Official vertical confirmed. Public GitHub remote, public visibility and fresh GitHub clone remain pending user authorization. Sites source synchronization is a separate service repository. No official submission attempted. Video and QA artifacts are ignored from Git. Repository history size and branch count are audited after source packaging.
