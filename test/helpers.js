// Small fakes for exercising Express middleware without a server or a database.

// A syntactically valid (but fake) Mapbox public token, so modules that create the
// geocoding client at import time can be loaded in tests.
const payload = Buffer.from(JSON.stringify({ u: "test", a: "test" })).toString("base64url");
const FAKE_MAP_TOKEN = `pk.${payload}.test`;

function fakeRequest({ user, params = {} } = {}) {
    const flashes = [];
    const req = {
        params,
        user,
        session: {},
        flash: (type, message) => flashes.push([type, message]),
    };
    const res = {
        locals: { currUser: user || null },
        redirectedTo: null,
        redirect(url) {
            this.redirectedTo = url;
            return this;
        },
    };
    return { req, res, flashes };
}

module.exports = { FAKE_MAP_TOKEN, fakeRequest };
