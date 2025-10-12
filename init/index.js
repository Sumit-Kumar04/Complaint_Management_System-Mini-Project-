const mongoose = require("mongoose");
const initData=require("./data");
const User=require("../models/user");

const MONGO_URL='mongodb://127.0.0.1:27017/settler';
main()
  .then(()=>{
    console.log("Connected to MongoDB");
  })
  .catch((err)=>{
    console.log("Error connecting to MongoDB:", err);
  });
async function main(){
  await mongoose.connect(MONGO_URL)
};

const initDB=async()=>{
    await User.deleteMany({});
    await User.insertMany(initData.data);
    console.log("Database Initialized with Sample Data");
   
}
initDB();