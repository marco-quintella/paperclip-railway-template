import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { readCurrentRef, replaceRef } from "./paperclip-ref.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("paperclip-ref helpers", () => {
  it("reads and replaces PAPERCLIP_REF in a Dockerfile snippet", () => {
    const sample = "FROM node\nARG PAPERCLIP_REF=v2026.416.0\nRUN echo hi\n";
    assert.equal(readCurrentRef(sample), "v2026.416.0");
    assert.equal(
      replaceRef(sample, "v2026.722.0"),
      "FROM node\nARG PAPERCLIP_REF=v2026.722.0\nRUN echo hi\n",
    );
  });

  it("throws when PAPERCLIP_REF is missing", () => {
    assert.throws(() => replaceRef("FROM node\n", "v1"), /Could not find PAPERCLIP_REF/);
  });
});

describe("pinned Dockerfile", () => {
  it("pins a dated Paperclip release tag", () => {
    const dockerfile = fs.readFileSync(path.join(root, "Dockerfile"), "utf8");
    const ref = readCurrentRef(dockerfile);
    assert.ok(ref, "PAPERCLIP_REF must be present");
    assert.match(ref, /^v\d{4}\.\d+\.\d+$/);
    assert.equal(ref, "v2026.722.0");
  });

  it("sets Gemini sandbox parity with upstream", () => {
    const dockerfile = fs.readFileSync(path.join(root, "Dockerfile"), "utf8");
    assert.match(dockerfile, /GEMINI_SANDBOX=false/);
    assert.match(dockerfile, /@google\/gemini-cli@latest/);
  });
});
