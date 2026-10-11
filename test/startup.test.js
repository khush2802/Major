const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const { FAKE_MAP_TOKEN } = require("./helpers.js");

const root = path.join(__dirname, "..");

// Everything the app needs except the session secret. NODE_ENV=production stops
// dotenv from filling the gap from a local .env file.
const baseEnv = {
    PATH: process.env.PATH,
    NODE_ENV: "production",
    ATLASDB_URL: "mongodb://127.0.0.1:9/test",
    MAP_TOKEN: FAKE_MAP_TOKEN,
    CLOUD_NAME: "test",
    CLOUD_API_KEY: "test",
    CLOUD_API_SECRET: "test",
};

function start(env) {
    return spawnSync(process.execPath, ["app.js"], { cwd: root, env, encoding: "utf8", timeout: 8000 });
}

test("the app refuses to start without SECRET", () => {
    const run = start(baseEnv);
    assert.equal(run.status, 1, "expected a clean exit with status 1, not a running server");
    assert.match(run.stderr, /SECRET/);
});

test("the app refuses to start with a short SECRET", () => {
    const run = start({ ...baseEnv, SECRET: "too-short" });
    assert.equal(run.status, 1);
    assert.match(run.stderr, /at least 32 characters/);
    assert.doesNotMatch(run.stderr, /too-short/, "the secret itself must never be printed");
});
