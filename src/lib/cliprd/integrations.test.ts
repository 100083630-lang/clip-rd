import assert from "node:assert/strict";
import test from "node:test";
import { extractTikTokPlayCount, secretState } from "./integrations.ts";

test("a placeholder YouTube key is not treated as configured", () => {
  assert.equal(secretState(undefined), "missing");
  assert.equal(secretState("   "), "missing");
  assert.equal(secretState("MI_CLAVE_DE_YOUTUBE"), "placeholder");
  assert.equal(secretState("AIzaSyRealEnoughForTheCheck123456789"), "ready");
});

test("reads a public TikTok play count without treating it as verified", () => {
  assert.equal(extractTikTokPlayCount('{"stats":{"playCount":58000}}'), 58000);
  assert.equal(extractTikTokPlayCount('{"play_count":"40"}'), 40);
  assert.equal(extractTikTokPlayCount("<html>no stats</html>"), null);
});
