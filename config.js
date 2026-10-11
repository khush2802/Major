// Required settings, read from the environment (or a local .env file in development).
// The app refuses to start when any of them is missing, instead of silently falling
// back to a value that anyone reading this repository would know.

const REQUIRED = ["SECRET", "ATLASDB_URL", "MAP_TOKEN", "CLOUD_NAME", "CLOUD_API_KEY", "CLOUD_API_SECRET"];
const MIN_SECRET_LENGTH = 32;

function loadConfig(env = process.env) {
    const missing = REQUIRED.filter((name) => !env[name] || !String(env[name]).trim());
    if (missing.length) {
        throw new Error(
            `Missing required environment variables: ${missing.join(", ")}. ` +
            "Set them in your hosting provider's settings, or copy .env.example to .env for local development."
        );
    }
    if (env.SECRET.length < MIN_SECRET_LENGTH) {
        throw new Error(
            `SECRET must be at least ${MIN_SECRET_LENGTH} characters. Generate one with: ` +
            "node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
        );
    }
    return {
        sessionSecret: env.SECRET,
        dbUrl: env.ATLASDB_URL,
        isProduction: env.NODE_ENV === "production",
    };
}

module.exports = { loadConfig, REQUIRED, MIN_SECRET_LENGTH };
