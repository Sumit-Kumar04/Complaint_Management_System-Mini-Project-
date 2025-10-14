const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require("path");
const expressLayouts = require("express-ejs-layouts");
const User = require("./models/user");
const Complaint = require("./models/complaint");
const Organisation = require("./models/organisation");
const wrapAsync = require('./utils/wrapAsync');
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
app.get("/user/:id/edit", wrapAsync(async (req, res) => {
  const userId = req.params.id;
  const user = await User.findById(userId);
  res.render("user/editprofile", { user });
}));

//post route to update profile
app.post("/user/:id/edit", wrapAsync(async (req, res) => {
  const userId = req.params.id;
  const { name,phone} = req.body;
  await User.findByIdAndUpdate(userId, { name,phone });
  res.redirect(`/user/dashboard/${userId}`);
})); 

//get route to delete user
app.get("/user/:id/delete", wrapAsync(async (req, res) => {
  const userId = req.params.id;
  const user = await User.findById(userId);
  res.render("user/delete", { user });
}));

//post route to delete user
app.delete("/user/:id/delete", wrapAsync(async (req, res) => {
  const userId = req.params.id;
  await User.findByIdAndDelete(userId);
  await Complaint.deleteMany({user:userId});
  res.redirect(`/goodbye`);
}));

//get route for goodbye page
app.get("/goodbye", (req, res) => {
  res.render("user/goodbye");
});

//get route to create complaint
app.get("/user/:id/complaint/new", wrapAsync(async (req, res) => {
  const userId = req.params.id;
  const user = await User.findById(userId);
  res.render("user/newcomplaint", { user });
}));

//post route to register new complaint
app.post("/user/:id/complaint/new",wrapAsync(async(req,res)=>{
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

}));

//route for organisation dashboard
app.get("/organisation/dashboard/:id", wrapAsync(async (req, res) => {
  const orgId = req.params.id;
    const complaints = await Complaint.find({})
      .populate("user", "name phone")
      

    res.render("organisation/dashboard", { complaints, orgId });
}));

//post route to update complaint status
app.post("/organisation/complaint/:id/status",wrapAsync( async (req, res) => {
  const complaintId = req.params.id;
  const { status} = req.body;
  const complaint = await Complaint.findById(complaintId);
    if (!complaint) return res.status(404).send("Complaint not found");

    complaint.status = status;
    await complaint.save();

    res.redirect(`/organisation/dashboard/${complaint.organisation}`);
})); 


//Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Something went wrong!',
  });
});

// app.get("*", (req, res) => {
//   res.status(404).send("Page Not Found");
// });

// Start server
app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
