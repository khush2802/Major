const mongoose=require("mongoose");
const initData=require("./data.js");
const Listing=require("../models/listing.js");

const MONGO_URL="mongodb://127.0.0.1:27017/travelbug";

main().then(()=>{
    console.log("connected to DB");
}).catch((err)=>{
    console.log(err);
});
//creation of db
async function main(){
    await mongoose.connect(MONGO_URL);
}

const initDB=async()=>{
    await Listing.deleteMany({});
    initData.data=initData.data.map((obj)=>({...obj, owner:"679f53b657e567b372b3a100"}));
    await Listing.insertMany(initData.data);
    console.log("data is initialized");
};

initDB();