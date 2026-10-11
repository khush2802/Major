const test = require("node:test");
const assert = require("node:assert/strict");

const { listingSchema, reviewSchema } = require("../schema.js");

const validListing = {
    title: "Twin room near campus",
    description: "Ten minutes from the main gate",
    price: 4500,
    location: "Pune",
    country: "India",
};

test("listing schema accepts exactly what the new and edit forms send", () => {
    const { error } = listingSchema.validate({ listing: validListing });
    assert.equal(error, undefined);
});

test("listing schema rejects fields that only the server may set", () => {
    for (const field of ["owner", "reviews", "geometry", "image"]) {
        const { error } = listingSchema.validate({ listing: { ...validListing, [field]: "injected" } });
        assert.ok(error, `${field} should be rejected`);
    }
});

test("listing schema rejects a negative price", () => {
    const { error } = listingSchema.validate({ listing: { ...validListing, price: -1 } });
    assert.ok(error);
});

test("review schema rejects an author supplied by the client", () => {
    const { error } = reviewSchema.validate({ review: { rating: 4, comment: "Clean", author: "someone" } });
    assert.ok(error);
});
