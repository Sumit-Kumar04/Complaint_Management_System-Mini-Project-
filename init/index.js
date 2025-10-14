const mongoose = require("mongoose");
const User = require("../models/user");
const Organisation = require("../models/organisation");
const Complaint = require("../models/complaint");

const MONGO_URL = "mongodb://127.0.0.1:27017/settler";

main()
  .then(() => {
    console.log("✅ Connected to MongoDB");
    initDB();
  })
  .catch((err) => console.log("❌ MongoDB Connection Error:", err));

async function main() {
  await mongoose.connect(MONGO_URL);
}

async function initDB() {
  try {
    await User.deleteMany({});
    await Organisation.deleteMany({});
    await Complaint.deleteMany({});

    // 🏢 Organisations
    const organisations = await Organisation.insertMany([
      { name: "Municipal Corp Delhi", location: "Delhi" },
    ]);

    // 👤 Users
    const users = await User.insertMany([
      { name: "Sumit Kumar", phone: "9876543210", status: "active" },
      { name: "Amit Sharma", phone: "9876501234", status: "active" },
      { name: "Priya Singh", phone: "9811122233", status: "inactive" },
    ]);

    // 📝 Complaints
    await Complaint.insertMany([
      {
        user: users[0]._id,
        subject: "Streetlight not working",
        description: "The streetlight near my house is not functioning.",
        location: "Rohini, Delhi",
        category: "Electricity",
        status: "Pending",
        
      },
      {
        user: users[1]._id,
        subject: "Garbage not collected",
        description: "Garbage collection truck hasn't come for 3 days.",
        location: "Bandra, Mumbai",
        category: "Sanitation",
        status: "Active",
  
      },
      {
        user: users[2]._id,
        subject: "Water leakage on road",
        description: "Water pipe burst near market area.",
        location: "Hazratganj, Lucknow",
        category: "Water Supply",
        status: "Resolved",
      
      },
    ]);

    console.log("✅ Sample data inserted successfully!");
    mongoose.connection.close();
  } catch (err) {
    console.error("❌ Error inserting data:", err);
  }
}
