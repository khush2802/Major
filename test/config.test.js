const test = require("node:test");
const assert = require("node:assert/strict");

const { loadConfig, REQUIRED } = require("../config.js");

const complete = {
    SECRET: "x".repeat(40),
    ATLASDB_URL: "mongodb://127.0.0.1:27017/test",
    MAP_TOKEN: "pk.test",
    CLOUD_NAME: "test",
    CLOUD_API_KEY: "test",
    CLOUD_API_SECRET: "test",
};

test("loadConfig returns the settings when everything is present", () => {
    const config = loadConfig({ ...complete, NODE_ENV: "production" });
    assert.equal(config.sessionSecret, complete.SECRET);
    assert.equal(config.dbUrl, complete.ATLASDB_URL);
    assert.equal(config.isProduction, true);
});

test("loadConfig names every missing variable", () => {
    for (const name of REQUIRED) {
        const env = { ...complete };
        delete env[name];
        assert.throws(() => loadConfig(env), new RegExp(name));
    }
});

test("loadConfig treats blank values as missing", () => {
    assert.throws(() => loadConfig({ ...complete, SECRET: "   " }), /SECRET/);
});

test("loadConfig rejects a short SECRET without echoing it", () => {
    assert.throws(() => loadConfig({ ...complete, SECRET: "abc123" }), (err) => {
        assert.match(err.message, /at least 32 characters/);
        assert.doesNotMatch(err.message, /abc123/);
        return true;
    });
});
