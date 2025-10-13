const mongoose = require("mongoose");
const User=require("../models/user");
const Complaint=require("../models/complaint");

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
    await Complaint.deleteMany({});

    const users = await User.insertMany([
      { name: "Sumit Kumar", phone: "9876543210", status: "active" },
      { name: "Amit Sharma", phone: "9876501234", status: "active" },
      { name: "Priya Singh", phone: "9811122233", status: "inactive" }
    ]);

    await Complaint.insertMany([
      { user: users[0]._id, subject: "Streetlight not working", description: "The streetlight near my house is not functioning.", status: "Pending" },
      { user: users[0]._id, subject: "Garbage not collected", description: "Garbage collection hasn’t come for 2 days.", status: "Resolved" },
      { user: users[1]._id, subject: "Water leakage", description: "There is a water leak near the road.", status: "Active" },
      { user: users[2]._id, subject: "Road damaged", description: "The road near market is broken.", status: "Pending" }
    ]);

    console.log("Sample data inserted successfully!");
   
}
initDB();