import assert from "node:assert/strict";
import test from "node:test";
import { WORKED_EXAMPLE, earningAmount, sumAmounts } from "./money.ts";

test("worked example totals US$79.40 without float drift", () => {
  const amounts = WORKED_EXAMPLE.map((row) => earningAmount(row.views, row.rate));
  assert.deepEqual(amounts, ["17.40", "32.00", "30.00"]);
  assert.equal(sumAmounts(amounts), "79.40");
});

test("a later sync only prices the new views", () => {
  const first = earningAmount(58_000, "0.3000");
  const delta = earningAmount(2_000, "0.5000");
  assert.equal(first, "17.40");
  assert.equal(delta, "1.00");
  assert.equal(sumAmounts([first, delta]), "18.40");
  assert.notEqual(sumAmounts([first, delta]), earningAmount(60_000, "0.5000"));
});

test("negative adjustment claws back", () => {
  assert.equal(earningAmount(-1_000, "0.3000"), "-0.30");
});
