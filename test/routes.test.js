const test = require("node:test");
const assert = require("node:assert/strict");

const { FAKE_MAP_TOKEN } = require("./helpers.js");

process.env.MAP_TOKEN = process.env.MAP_TOKEN || FAKE_MAP_TOKEN;

const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const listingRouter = require("../routes/listing.js");
const userRouter = require("../routes/user.js");

function handlers(router, path, method) {
    const layer = router.stack.find((l) => l.route && l.route.path === path && l.route.methods[method]);
    assert.ok(layer, `${method.toUpperCase()} ${path} should exist`);
    return layer.route.stack.filter((s) => s.method === method).map((s) => s.handle);
}

test("creating a listing requires sign-in and validates the body", () => {
    const chain = handlers(listingRouter, "/", "post");
    assert.ok(chain.includes(isLoggedIn));
    assert.ok(chain.includes(validateListing));
});

test("every listing mutation checks sign-in, ownership and (for updates) the body", () => {
    const update = handlers(listingRouter, "/:id", "put");
    assert.ok(update.includes(isLoggedIn) && update.includes(isOwner) && update.includes(validateListing));
    assert.ok(update.indexOf(isOwner) < update.indexOf(validateListing), "ownership is checked before anything else runs");

    const destroy = handlers(listingRouter, "/:id", "delete");
    assert.ok(destroy.includes(isLoggedIn) && destroy.includes(isOwner));

    const edit = handlers(listingRouter, "/:id/edit", "get");
    assert.ok(edit.includes(isLoggedIn) && edit.includes(isOwner));
});

test("logging out requires a POST, so a link on another site can't sign users out", () => {
    handlers(userRouter, "/logout", "post");
    const get = userRouter.stack.find((l) => l.route && l.route.path === "/logout" && l.route.methods.get);
    assert.equal(get, undefined);
});
