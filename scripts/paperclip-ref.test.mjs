import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { readCurrentRef, replaceRef } from "./paperclip-ref.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PINNED_REF = "v2026.831.1";

describe("paperclip-ref helpers", () => {
  it("reads and replaces PAPERCLIP_REF in a Dockerfile snippet", () => {
    const sample = "FROM node\nARG PAPERCLIP_REF=v2026.416.0\nRUN echo hi\n";
    assert.equal(readCurrentRef(sample), "v2026.416.0");
    assert.equal(
      replaceRef(sample, PINNED_REF),
      `FROM node\nARG PAPERCLIP_REF=${PINNED_REF}\nRUN echo hi\n`,
    );
  });

  it("throws when PAPERCLIP_REF is missing", () => {
    assert.throws(() => replaceRef("FROM node\n", "v1"), /Could not find PAPERCLIP_REF/);
  });
});

describe("pinned Dockerfile", () => {
  const dockerfile = fs.readFileSync(path.join(root, "Dockerfile"), "utf8");

  it("pins a dated Paperclip release tag", () => {
    const ref = readCurrentRef(dockerfile);
    assert.ok(ref, "PAPERCLIP_REF must be present");
    assert.match(ref, /^v\d{4}\.\d+\.\d+$/);
    assert.equal(ref, PINNED_REF);
  });

  it("uses Node 24 to match upstream engines (>=24.11.0)", () => {
    assert.match(dockerfile, /FROM node:24-/);
  });

  it("installs cargo/rustc in the build stage like upstream", () => {
    assert.match(dockerfile, /\bcargo\b/);
    assert.match(dockerfile, /\brustc\b/);
  });

  it("sets Gemini sandbox parity with upstream", () => {
    assert.match(dockerfile, /GEMINI_SANDBOX=false/);
    assert.match(dockerfile, /@google\/gemini-cli@latest/);
  });

  it("installs Kimi Code CLI and tini like upstream production", () => {
    assert.match(dockerfile, /@moonshot-ai\/kimi-code@latest/);
    assert.match(dockerfile, /tini/);
    assert.match(dockerfile, /ENTRYPOINT \["\/usr\/bin\/tini"/);
  });

  it("declares Railway TLS termination for in-app Claude login", () => {
    assert.match(dockerfile, /CLAUDE_LOGIN_EDGE_TLS_TERMINATED=true/);
  });
});

describe("docs stay in lockstep with the pin", () => {
  it("README Dockerfile snippet matches PAPERCLIP_REF", () => {
    const dockerfile = fs.readFileSync(path.join(root, "Dockerfile"), "utf8");
    const ref = readCurrentRef(dockerfile);
    const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
    assert.match(readme, new RegExp(`ARG PAPERCLIP_REF=${ref.replaceAll(".", "\\.")}`));
  });
});

describe("wrapper starts Paperclip like upstream production CMD", () => {
  it("loads tsx from the workspace instead of a global binary", () => {
    const server = fs.readFileSync(path.join(root, "src/server.js"), "utf8");
    assert.match(server, /--import["\s,]+.\/server\/node_modules\/tsx\/dist\/loader\.mjs/);
  });
});
