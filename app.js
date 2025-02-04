if(process.env.NODE_ENV!="production"){
    require('dotenv').config();
}


// console.log(process.env.SECRET) ;


const express=require("express");
const app=express();
const mongoose=require("mongoose");
// const Listing=require("./models/listing.js");/
const path=require("path");
const methodOverride=require("method-override");
const ejsMate=require("ejs-mate");
const ExpressError=require("./utils/ExpressError.js");
const flash=require("connect-flash");
const passport=require("passport");
const LocalStrategy=require("passport-local");
const User=require("./models/user.js");
const session=require("express-session");
const MongoStore = require('connect-mongo');


const listingRouter=require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

const dbUrl=process.env.ATLASDB_URL;
// const MONGO_URL="mongodb://127.0.0.1:27017/travelbug";





main().then(()=>{
    console.log("connected to DB");
}).catch((err)=>{
    console.log(err);
});

async function main(){
    await mongoose.connect(dbUrl);
}

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname,"/public")));



const store=MongoStore.create({
    mongoUrl:dbUrl,
    crypto:{
        secret:process.env.SECRET,
    },
    touchAfter:24*3600,
});
store.on("error",()=>{
    console.log("ERROR IN SESSION",err);
});

const sessionOptions={store,secret:"mysecretstr",resave:false,saveUninitialized:true,
cookie:{
    expires:Date.now()+7*24*60*60*1000,
    maxAge:7*24*60*60*1000,
    httpOnly:true,
},};

// app.get("/",(req,res)=>{
//     res.send("hii i am root");
// });



app.use(session(sessionOptions));

app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use((req,res,next)=>{
    res.locals.success=req.flash("success");
    res.locals.error=req.flash("error");
    // res.locals.currUser=req.user;
    // res.locals.currUser=req.user;
    // console.log(res.locals.success);
    next();
});
app.use((req, res, next) => {
    res.locals.currUser = req.user; // Assuming `req.user` is set after authentication
    next();
});

// app.get("/demouser",async(req,res)=>{
//     let fakeUser=new User({
//         email: "std@gmail.com",
//         username:"mkc",
//     });

//     let registerUser=await User.register(fakeUser,"HelloWorld!!");
//     res.send(registerUser);
// });




app.use("/listings",listingRouter);
//reviews post route 
app.use("/listings/:id/reviews",reviewRouter);
app.use("/",userRouter);


app.all("*",(req,res,next)=>{
    next(new ExpressError(404,"page not found..!"));
});

app.use((err,req,res,next)=>{
    // res.send("something went wrong..!");
    let {statusCode=500,message="wrong "}=err;
    // res.status(statusCode).send(message);
    res.status(statusCode).render("error.ejs",{message});
});

app.listen(8080,()=>{
    console.log("server is listening on port 8080");
});