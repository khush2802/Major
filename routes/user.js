const express=require("express");
const router=express.Router();
const User=require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync.js");
const passport = require("passport");
const { saveRedirectUrl } = require("../middleware.js");
const userControllers=require("../controllers/user.js");
// const { redirectUrl } = require("../middleware.js");

router.route("/signup")
.get(userControllers.renderSignupForm)
.post(wrapAsync(userControllers.signup));


router.route("/login")
.get(userControllers.renderLogin)
.post(saveRedirectUrl,passport.authenticate("local",{
    failureRedirect:"/login",
    failureFlash:true,
}),
userControllers.login
);



router.post("/logout",userControllers.logout);
module.exports=router;