import { test } from "node:test";
import assert from "node:assert/strict";
import {
  defaults,
  validate,
  category,
  understand,
  decide,
  respond,
} from "../src/engine.js";
import { handle } from "../src/worker.js";
for (const [aqi, label] of [
  [0, "Good"],
  [50, "Good"],
  [51, "Satisfactory"],
  [100, "Satisfactory"],
  [101, "Moderate"],
  [200, "Moderate"],
  [201, "Poor"],
  [300, "Poor"],
  [301, "Very poor"],
  [400, "Very poor"],
  [401, "Severe"],
  [500, "Severe"],
])
  test(`AQI boundary ${aqi}`, () => assert.equal(category(aqi), label));
test("invalid contexts rejected", () => {
  for (const patch of [
    { aqi: -1 },
    { aqi: 501 },
    { aqi: 1.5 },
    { city: "" },
    { city: "x".repeat(81) },
    { minutes: 481 },
    { minutes: -1 },
    { transit: "yes" },
    { budget: "free" },
  ])
    assert.throws(() => validate({ ...defaults, ...patch }));
  assert.throws(() => validate(null));
});
test("sensitive member changes moderate-AQI travel decision", () => {
  const c = { ...defaults, aqi: 150 };
  assert.equal(decide(c).actions[0].id, "active");
  assert.equal(decide({ ...c, sensitive: true }).actions[0].id, "transit");
});
test("constraints remove inaccessible recommendations", () => {
  const d = decide({ ...defaults, transit: false });
  assert.equal(d.actions[0].id, "essential");
  assert.ok(d.actions.some((a) => a.id === "sources"));
  assert.ok(!d.actions.some((a) => a.id === "filter"));
});
test("remote takes priority and purifier context is used", () => {
  const d = decide({ ...defaults, remote: true, purifier: true });
  assert.equal(d.actions[0].id, "remote");
  assert.ok(d.actions.some((a) => a.id === "filter"));
});
test("indoor intent filters travel advice", () =>
  assert.deepEqual(
    decide(defaults, "indoor").actions.map((x) => x.id),
    ["sources", "ventilation"],
  ));
test("context updated and retained across followups", () => {
  const first = respond("My child has asthma, no metro, low budget", defaults);
  const next = respond("Why?", first.context);
  assert.equal(next.context.sensitive, true);
  assert.equal(next.context.transit, false);
  assert.equal(next.intent, "explain");
  assert.match(next.decision.actions[0].why, /unavailable/);
});
test("conflict does not mutate context", () => {
  const r = respond("AQI 180 and AQI 420", defaults);
  assert.equal(r.intent, "conflict");
  assert.equal(r.decision, null);
  assert.deepEqual(r.context, defaults);
});
test("unknown requests ask targeted question", () =>
  assert.match(respond("write a poem", defaults).question, /commute/));
test("urgent symptoms bypass ordinary plan", () =>
  assert.equal(
    respond("I cannot breathe", defaults).decision.status,
    "urgent",
  ));
test("context extraction boundaries", () => {
  assert.equal(
    understand(
      "AQI is 50, 20 minutes, have a purifier and work from home",
      defaults,
    ).context.aqi,
    50,
  );
  assert.equal(
    understand("no sensitive members; cannot work from home", defaults).context
      .sensitive,
    false,
  );
  assert.throws(() => understand("", defaults));
  assert.throws(() => understand("x".repeat(1201), defaults));
  assert.throws(() => understand("AQI 999", defaults));
});
test("every action has an explanation and impact", () => {
  for (const a of decide(defaults).actions) {
    assert.ok(a.why.length > 20);
    assert.ok(a.impact.length > 20);
  }
  assert.equal(decide(defaults).outdoorMinutes, 60);
});
const request = (body, extra = {}) =>
  new Request("https://saans.test/api/assist", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...extra },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
test("API validates malformed input", async () => {
  for (const body of [
    "{",
    {},
    { message: "plan", context: { ...defaults, aqi: 700 } },
  ])
    assert.equal((await handle(request(body))).status, 400);
});
test("API rejects large payload and foreign origin", async () => {
  assert.equal((await handle(request("x".repeat(9000)))).status, 413);
  assert.equal(
    (await handle(request({}, { origin: "https://evil.test" }))).status,
    403,
  );
});
test("API method health and missing routes", async () => {
  assert.equal(
    (await handle(new Request("https://saans.test/api/assist"))).status,
    405,
  );
  assert.equal(
    (await handle(new Request("https://saans.test/missing"))).status,
    404,
  );
  assert.equal(
    (await (await handle(new Request("https://saans.test/api/health"))).json())
      .ok,
    true,
  );
});
test("demo mode and AI not configured preserve decisions", async () => {
  const r = await (
    await handle(request({ message: "plan", context: defaults, enhance: true }))
  ).json();
  assert.match(r.provider, /not configured/);
  assert.equal(r.decision.actions[0].id, "transit");
});
test("provider failure retains deterministic plan", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => {
      throw Error("offline");
    };
    const r = await (
      await handle(
        request({ message: "plan", context: defaults, enhance: true }),
        { OPENAI_API_KEY: "test-only" },
      )
    ).json();
    assert.match(r.provider, /unavailable/);
    assert.equal(r.decision.status, "caution");
  } finally {
    globalThis.fetch = original;
  }
});
test("provider successful explanation cannot replace action list", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () =>
      Response.json({
        output: [
          {
            content: [
              {
                type: "output_text",
                text: "Your plan prioritises less outdoor exertion.",
              },
            ],
          },
        ],
      });
    const r = await (
      await handle(
        request({ message: "plan", context: defaults, enhance: true }),
        { OPENAI_API_KEY: "test-only" },
      )
    ).json();
    assert.ok(r.narrative);
    assert.equal(r.decision.actions.length, 4);
  } finally {
    globalThis.fetch = original;
  }
});
test("budget changes preserve equipment already owned", () => {
  const result = respond("Low budget this week", {
    ...defaults,
    purifier: true,
  });
  assert.equal(result.context.purifier, true);
  assert.ok(result.decision.actions.some((action) => action.id === "filter"));
});
test("mixed commute and indoor requests address both needs", () => {
  const result = respond("I must commute. No metro and no purifier.", defaults);
  const actions = result.decision.actions.map((action) => action.id);
  assert.ok(actions.includes("essential"));
  assert.ok(actions.includes("sources"));
});
