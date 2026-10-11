if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

// Refuse to start without the required secrets (see config.js and .env.example).
const { loadConfig } = require("./config.js");
let config;
try {
    config = loadConfig();
} catch (err) {
    console.error(`Configuration error: ${err.message}`);
    process.exit(1);
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const session = require("express-session");
const MongoStore = require('connect-mongo');

// Routers
const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

// MongoDB Connection
const dbUrl = config.dbUrl;

main().then(() => {
    console.log("Connected to DB");
}).catch((err) => {
    console.log(err);
});

async function main() {
    await mongoose.connect(dbUrl);
}

// EJS & Middleware Setup
app.engine('ejs', ejsMate);  // EJS-Mate before setting view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "/public")));

// Session Configuration
const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: config.sessionSecret,
    },
    touchAfter: 24 * 3600,  // Only update session once in 24 hours unless modified
});

store.on("error", (err) => {
    console.log("ERROR IN SESSION", err);
});

if (config.isProduction) {
    app.set("trust proxy", 1);
}

const sessionOptions = {
    store,
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,  // no session (or cookie) until there is something to store
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,  // 1 week
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "lax",                // not sent on cross-site form posts (CSRF protection)
        secure: config.isProduction,    // HTTPS-only cookies in production
    },
};

app.use(session(sessionOptions));
app.use(flash());

// Passport Authentication Setup
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Middleware to Pass Global Variables to Templates
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user || null;  // Ensure currUser is always defined
    next();
});

// Route Handlers
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

// 404 Error Handler (Ensure it doesn't cause recursive rendering)
app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Page not found..!"));
});

// General Error Handler (Prevent infinite rendering loop)
app.use((err, req, res, next) => {
    const { statusCode = 500, message = "Something went wrong" } = err;
    if (!res.headersSent) {
        res.status(statusCode).render("error.ejs", { message });
    } else {
        next(err);  // Prevent stack overflow if headers already sent
    }
});

// Server Initialization
app.listen(8080, () => {
    console.log("Server is listening on port 8080");
});
