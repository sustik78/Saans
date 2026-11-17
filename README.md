# Saans - clarity inside, when there is smog outside

Official vertical: **Urban Air Quality Assistant**. Target persona: urban Indian families and communities planning winter-smog routines, including households with sensitive members and limited budgets.

## Problem and approach
Families need feasible daily choices, not an unexplained chatbot answer. Saans combines supplied Indian AQI, city, household sensitivity, outdoor time, access to transport, remote work, purifier availability and budget. Its deterministic engine prioritises exposure precautions, filters impractical options, and explains each action’s reason and qualitative impact. Community members can demonstrate the same scenarios without an account.

## Features and intelligence
- Household form plus conversational followups; explicit changed-context display.
- Intent classification, AQI extraction, conflict clarification, urgent symptom override.
- Travel, exercise, indoor source control and ventilation plans with explanations.
- Three guided demos: daily commute; child with asthma and no budget/transit; conflicting readings.
- Tab-session continuity with eight bounded exchanges and a clear-session control.
- Offline decision engine; optional server-side generative explanation, with failure fallback.

## Architecture and decision logic
`public/app.js` renders safe text and calls `/api/assist`. `src/worker.js` validates requests and optionally calls the OpenAI Responses API. `src/engine.js` implements independently tested rules shared by server and browser. If the server fails, the same browser engine continues working.

Order: input → validation → intent/context extraction → conflict or urgency gate → constrained action selection → reasons/impact → user feedback. AQI >200 triggers precautionary travel/exertion rules; sensitive households trigger these at >100. These are application policy thresholds informed by NCDC guidance, not personalised medical advice. Remote work takes precedence when available; otherwise transport access decides whether transit or combined essential journeys is proposed. No numerical confidence, pollutant reduction or carbon saving is invented. Outdoor minutes are displayed as context, never a safe limit.

One JavaScript/ES module stack replaces the suggested React/Python stack to share rules, reduce runtime dependencies and fit Sites Workers hosting. Native forms, CSS and DOM APIs avoid framework overhead. esbuild is the build dependency; Playwright and axe are development-only. There is no database. No TypeScript type-checking claim is made; runtime validation and syntax checks cover this JavaScript implementation.

## Windows setup and running
Prerequisites: Node.js 22+, npm, Git. Python is needed only for optional video narration tooling.

```powershell
cd 'C:\Users\USER\Desktop\MISCELLANEOUS\Challenge 6_PromptWars\saans'
npm ci
npm run dev
```

Open http://localhost:4173. This single command starts both the local backend and frontend. No credentials required. Production output:

```powershell
npm run build
```

`dist/server/index.js` is the Worker entry point; `dist/client` contains assets. `.openai/hosting.json` identifies Sites hosting. Build output is ignored by Git and is packaged separately for deployment.

## Environment and optional GenAI
Default mode is rules-only. To enable real generated explanations locally, configure a server-side key before starting:

```powershell
$env:OPENAI_API_KEY = '<your-key>'
$env:OPENAI_MODEL = 'gpt-4.1-mini'
npm run dev
```

For hosting, configure these as server runtime secrets through Sites settings. Never put a key in frontend source. Check “Try optional AI explanation” to request it. Only the structured plan is sent; the generated text is visibly secondary and cannot replace actions. The provider request uses `store:false` and an eight-second timeout. Without configuration, the app explicitly retains the offline plan. Live paid provider access has not been verified; tests mock success and failure.

## Use and demo
Enter a city and an AQI on the **Indian scale**, set actual household constraints, and build the plan. Then update with “My child has asthma. No metro.” Context changes the actions. “AQI 180 and AQI 420” triggers clarification. Unknown requests ask which supported task is intended. Clear session removes tab storage and returns to the labeled default demonstration.

Air readings are manual/demo inputs, not live facts. Source links are visible in the interface:
- [CPCB AQI categories](https://app.cpcbccr.com/ccr_docs/About_AQI.pdf)
- [NCDC health precautions](https://ncdc.mohfw.gov.in/uploads/pdf/air6.pdf)
- [EPA indoor particle filtration](https://www.epa.gov/wildfires/indoor-air-filtration)

EPA smoke-particle guidance informs indoor particle control, not Indian AQI categorisation or a claim that all smog behaves like wildfire smoke.

## Validation
```powershell
npm test
npm run check
npm run build
# Keep npm run dev active in another terminal:
node tests/browser.mjs
```

If the Playwright browser is missing: `npx playwright install chromium`. Tests include engine boundaries, safety precedence, context continuity, input limits, API errors, provider failure/success and the eight browser acceptance scenarios. See `docs/EVALUATION.md` for actual results and remaining limits.

## Security and privacy
No authentication, persistent server sessions, tools, command execution, HTML injection, cross-origin API permission or model-authorised actions. API bodies are bounded at 8 KiB, field lengths and types are validated, and errors are generic. Secrets stay server-side. Context is stored only in this tab’s sessionStorage; eight exchanges are retained and clear removes them. Optional AI sends the plan to the provider, including city and household sensitivity; do not enter personal identifiers. Feedback only updates the local status message and is not sent anywhere. Hosted access policy controls who can open the Site. This is a limited demo, not security-certified or a multi-tenant production service; there is no distributed rate limiter.

## Accessibility and efficiency
Semantic landmarks, labels, native form validation, skip link, keyboard controls, visible focus, live status, responsive layout and reduced-motion support. Automated axe checks do not certify WCAG compliance; manual assistive-technology review remains needed. Rules avoid model calls unless requested. No telemetry or live data request is made. Session history is bounded; API requests and model time are bounded. Performance measurements are recorded in evaluation notes with conditions.

## Assumptions, limitations, improvements
English rules-based parsing supports the demonstrated vocabulary, not arbitrary language or complex negation. Users must verify extracted context in the form. City changes the plan’s label, not an invented geographic forecast or transit route. Indoor air is not measured; AQI cannot identify personal exposure. This is planning support, not diagnosis, treatment or emergency dispatch. Future work: official monitor integration with freshness/scale checks, multilingual validated extraction, route data, expert rule review, and broader assistive-technology tests. See `docs/ASSUMPTIONS.md`.

## Deployment and submission state
Site: https://saans-family-air-planner.sublimeskylark.chatgpt.site (owner-private). Sites deployment is separate from the public GitHub repository. Source is published with user authorization at https://github.com/sustik78/Saans on its only branch, main. Fresh-clone installation, 29 tests and build passed. Git history and metadata measured 59,082 bytes in the fresh clone. No official competition submission has been performed. Keep exactly one `main` branch and repository/history below 10 MB. Video files live in ignored local artifacts, outside the source submission.

