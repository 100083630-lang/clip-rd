#!/usr/bin/env node
/**
 * Nitro bundles @electric-sql/pglite into the server function but leaves
 * `new URL("./pglite.data", import.meta.url)` unresolved. Copy the wasm/data
 * files next to that module so preview and Vercel can open the embedded DB.
 */
import { copyFileSync, existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "node_modules/@electric-sql/pglite/dist");
const names = ["pglite.data", "pglite.wasm", "initdb.wasm"];
const outRoot = join(root, ".vercel/output");

function walk(dir, found) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path, found);
    else if (entry.name.endsWith(".mjs")) found.push(path);
  }
}

if (!existsSync(outRoot)) {
  console.log("copy-pglite-assets: no build output, skipping");
  process.exit(0);
}

const files = [];
walk(outRoot, files);
let copied = 0;
for (const file of files) {
  const source = readFileSync(file, "utf8");
  if (!source.includes("pglite.data")) continue;
  const dir = dirname(file);
  for (const name of names) {
    copyFileSync(join(dist, name), join(dir, name));
    copied += 1;
  }
  console.log(`copy-pglite-assets: ${names.join(", ")} -> ${dir}`);
}

if (copied === 0) {
  console.error("copy-pglite-assets: server bundle references no pglite.data");
  process.exit(1);
}
