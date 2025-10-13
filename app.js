const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require("path");
const expressLayouts = require("express-ejs-layouts");
const User = require("./models/user");
const Complaint = require("./models/complaint");

const methodOverride = require("method-override");
app.use(methodOverride("_method"));

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

// Middleware

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(expressLayouts);

// EJS setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("layout", "./layouts/boilerplate");
app.use(express.static(path.join(__dirname, "public")));

// Dashboard Route
app.get("/user/dashboard/:id", async (req, res) => {
  const userId = req.params.id;
  const user = await User.findById(userId);
  const complaints=await Complaint.find({user:userId});
  const activeCount = complaints.filter(c => c.status === "Active").length;
  const resolvedCount = complaints.filter(c => c.status === "Resolved").length;
  const pendingCount = complaints.filter(c => c.status === "Pending").length;
  res.render("user/dashboard", { user,complaints,stats:{
    active:activeCount,
    resolved:resolvedCount,
    pending:pendingCount
    

  } });
});
//home route
app.get("/", (req, res) => {
  res.send("home");
});
//edit profile route
app.get("/user/:id/edit", async (req, res) => {
  const userId = req.params.id;
  const user = await User.findById(userId);
  res.render("user/editprofile", { user });
});

//post route to update profile
app.post("/user/:id/edit", async (req, res) => {
  const userId = req.params.id;
  const { name,phone} = req.body;
  await User.findByIdAndUpdate(userId, { name,phone });
  res.redirect(`/user/dashboard/${userId}`);
}); 

//get route to delete user
app.get("/user/:id/delete", async (req, res) => {
  const userId = req.params.id;
  const user = await User.findById(userId);
  res.render("user/delete", { user });
});

//post route to delete user
app.delete("/user/:id/delete", async (req, res) => {
  const userId = req.params.id;
  await User.findByIdAndDelete(userId);
  await Complaint.deleteMany({user:userId});
  res.redirect(`/goodbye`);
});

//get route for goodbye page
app.get("/goodbye", (req, res) => {
  res.render("user/goodbye");
});

//get route to create complaint
app.get("/user/:id/complaint/new", async (req, res) => {
  const userId = req.params.id;
  const user = await User.findById(userId);
  res.render("user/newcomplaint", { user });
});

//post route to register new complaint
app.post("/user/:id/complaint/new",async(req,res)=>{
  const userId=req.params.id;
  const {subject, description, location, category } = req.body;
  const newComplaint = new Complaint({
    user: userId,
    subject,
    description,
    location,
    category,
    status: "Pending",
  });
  await newComplaint.save();
  res.redirect(`/user/dashboard/${userId}`);

});


// Start server
app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
