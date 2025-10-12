const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require("path");
const expressLayouts = require("express-ejs-layouts");
const User = require("./models/user");

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
  res.render("user/dashboard", { user });
});
// Start server
app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
