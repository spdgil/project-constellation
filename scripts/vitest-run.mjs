#!/usr/bin/env node
/**
 * Wrapper that spawns `vitest run` as a child process and force-kills it
 * once all tests have finished.
 *
 * Vitest 4.x on Node 24 has a known bug where the process hangs after all
 * tests complete (lingering handles in the Vite server / signal-exit patches).
 * Neither `process.exit()`, `vitest.close()`, nor `forceExit` config work.
 *
 * Strategy: monitor stdout for the test results summary line. Once we see it
 * (or once output goes silent for a grace period after seeing test results),
 * we kill the child and exit with the right code.
 */
import { spawn } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const child = spawn(
  process.execPath,
  [
    resolve(root, "node_modules/vitest/vitest.mjs"),
    "run",
    ...process.argv.slice(2),
  ],
  {
    stdio: ["inherit", "pipe", "pipe"],
    cwd: root,
    env: process.env,
  },
);

let hasFailed = false;
let lastOutputTime = Date.now();
let sawTestResult = false;

function onData(target, chunk) {
  target.write(chunk);
  lastOutputTime = Date.now();

  const text = chunk.toString();

  // Detect individual test file results (✓ or ✗ lines)
  if (/[✓✗×]/.test(text)) {
    sawTestResult = true;
  }

  // Detect the summary line: "Test Files  N passed" or "N failed"
  if (/Test Files\s+.*(?:passed|failed)/.test(text)) {
    // Give 1 second for remaining output to flush, then exit
    setTimeout(() => finish(), 1000);
  }

  // Detect failures
  if (/FAIL|failed/.test(text) && !/0 failed/.test(text)) {
    hasFailed = true;
  }
}

child.stdout.on("data", (chunk) => onData(process.stdout, chunk));
child.stderr.on("data", (chunk) => onData(process.stderr, chunk));

child.on("close", (code) => {
  // If child exits naturally, use its exit code
  process.exit(code ?? (hasFailed ? 1 : 0));
});

function finish() {
  child.kill("SIGKILL");
  // Give a moment for the kill to take effect before the 'close' handler fires
  setTimeout(() => {
    process.exit(hasFailed ? 1 : 0);
  }, 500);
}

// Safety net: if we've seen test results and no output for 5 seconds,
// assume Vitest is done but hanging.
const watchdog = setInterval(() => {
  if (sawTestResult && Date.now() - lastOutputTime > 5000) {
    finish();
  }
}, 1000);
watchdog.unref();
