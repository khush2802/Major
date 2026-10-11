const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const Listing = require("../models/listing.js");
const Review = require("../models/review.js");
const { isOwner, isReviewAuthor } = require("../middleware.js");
const { fakeRequest } = require("./helpers.js");

const ownerId = new mongoose.Types.ObjectId();
const otherId = new mongoose.Types.ObjectId();

async function run(middleware, req, res) {
    const calls = [];
    await middleware(req, res, (err) => calls.push(err));
    return calls;
}

test("isOwner lets the listing's owner through", async (t) => {
    t.mock.method(Listing, "findById", async () => ({ owner: ownerId }));
    const { req, res } = fakeRequest({ user: { _id: ownerId }, params: { id: "l1" } });
    const calls = await run(isOwner, req, res);
    assert.deepEqual(calls, [undefined]);
    assert.equal(res.redirectedTo, null);
});

test("isOwner stops a signed-in user who doesn't own the listing", async (t) => {
    t.mock.method(Listing, "findById", async () => ({ owner: ownerId }));
    const { req, res, flashes } = fakeRequest({ user: { _id: otherId }, params: { id: "l1" } });
    const calls = await run(isOwner, req, res);
    assert.deepEqual(calls, [], "next() must not run for a non-owner");
    assert.equal(res.redirectedTo, "/listings/l1");
    assert.equal(flashes[0][0], "error");
});

test("isOwner stops a request with no signed-in user", async (t) => {
    t.mock.method(Listing, "findById", async () => ({ owner: ownerId }));
    const { req, res } = fakeRequest({ params: { id: "l1" } });
    const calls = await run(isOwner, req, res);
    assert.deepEqual(calls, []);
    assert.ok(res.redirectedTo);
});

test("isOwner handles a listing that doesn't exist", async (t) => {
    t.mock.method(Listing, "findById", async () => null);
    const { req, res } = fakeRequest({ user: { _id: ownerId }, params: { id: "missing" } });
    const calls = await run(isOwner, req, res);
    assert.deepEqual(calls, []);
    assert.equal(res.redirectedTo, "/listings");
});

test("isOwner passes database errors to the error handler", async (t) => {
    t.mock.method(Listing, "findById", async () => {
        throw new Error("database unavailable");
    });
    const { req, res } = fakeRequest({ user: { _id: ownerId }, params: { id: "l1" } });
    const calls = await run(isOwner, req, res);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].message, "database unavailable");
});

test("isReviewAuthor lets the review's author through", async (t) => {
    t.mock.method(Review, "findById", async () => ({ author: ownerId }));
    const { req, res } = fakeRequest({ user: { _id: ownerId }, params: { id: "l1", reviewId: "r1" } });
    const calls = await run(isReviewAuthor, req, res);
    assert.deepEqual(calls, [undefined]);
});

test("isReviewAuthor stops someone else", async (t) => {
    t.mock.method(Review, "findById", async () => ({ author: ownerId }));
    const { req, res } = fakeRequest({ user: { _id: otherId }, params: { id: "l1", reviewId: "r1" } });
    const calls = await run(isReviewAuthor, req, res);
    assert.deepEqual(calls, []);
    assert.equal(res.redirectedTo, "/listings/l1");
});

test("isReviewAuthor handles a review that doesn't exist", async (t) => {
    t.mock.method(Review, "findById", async () => null);
    const { req, res } = fakeRequest({ user: { _id: ownerId }, params: { id: "l1", reviewId: "gone" } });
    const calls = await run(isReviewAuthor, req, res);
    assert.deepEqual(calls, []);
    assert.equal(res.redirectedTo, "/listings/l1");
});
