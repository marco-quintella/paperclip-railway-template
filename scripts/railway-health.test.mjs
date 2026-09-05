import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { railwayHealthResponse } from "../src/railway-health.js";

describe("railwayHealthResponse", () => {
  it("returns 503 while Paperclip is unreachable", () => {
    assert.deepEqual(railwayHealthResponse(null), {
      status: 503,
      json: { status: "starting", wrapper: "ready", paperclipReady: false },
    });
  });

  it("passes through a successful loopback health body", () => {
    const mapped = railwayHealthResponse({
      ok: true,
      status: 200,
      body: '{"status":"ok"}',
      contentType: "application/json",
    });
    assert.deepEqual(mapped, {
      status: 200,
      body: '{"status":"ok"}',
      contentType: "application/json",
    });
  });

  it("treats a reachable non-2xx loopback as healthy for Railway", () => {
    const mapped = railwayHealthResponse({
      ok: false,
      status: 403,
      body: '{"error":"forbidden"}',
      contentType: "application/json",
    });
    assert.equal(mapped.status, 200);
    assert.equal(mapped.json.status, "ok");
    assert.equal(mapped.json.upstreamStatus, 403);
  });
});
