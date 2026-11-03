import assert from "node:assert/strict";
import test from "node:test";
import { classifyYoutube, parseClipUrl, parseIsoDuration } from "./urls.ts";

test("parses youtube and tiktok links", () => {
  const short = parseClipUrl("https://www.youtube.com/shorts/abcdefghijk");
  assert.equal(short.ok && short.provider === "youtube" && short.shortsPath, true);
  const watch = parseClipUrl("https://youtu.be/abcdefghijk?t=3");
  assert.equal(watch.ok && watch.provider === "youtube" && watch.videoId, "abcdefghijk");
  const tiktok = parseClipUrl("https://www.tiktok.com/@origen/video/1234567890123456789");
  assert.equal(tiktok.ok && tiktok.provider === "tiktok" && tiktok.videoId, "1234567890123456789");
  assert.equal(parseClipUrl("https://example.com/a").ok, false);
});

test("does not treat every short duration as a long video or a short", () => {
  assert.equal(classifyYoutube({ shortsPath: false, durationSeconds: 90 }), "unknown");
  assert.equal(classifyYoutube({ shortsPath: true, durationSeconds: 90 }), "youtube_shorts");
  assert.equal(classifyYoutube({ shortsPath: false, durationSeconds: 181 }), "youtube_video");
  assert.equal(classifyYoutube({ shortsPath: true, durationSeconds: 181 }), "youtube_video");
  assert.equal(parseIsoDuration("PT1M30S"), 90);
});
