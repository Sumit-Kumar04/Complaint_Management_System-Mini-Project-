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
const passport = require("passport");
const LocalStrategy = require("passport-local");
const session = require("express-session");
app.use(methodOverride("_method"));
const {isLoggedIn}=require("./middlewares/middleware");
const flash = require("connect-flash");

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

// Session setup
app.use(session({
  secret: "settlersecret",
  resave: false,
  saveUninitialized: false
}));

// Passport setup
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

app.use((req, res, next) => {
  res.locals.user = req.user; // current logged-in user
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

// Local Strategy
passport.use(new LocalStrategy({ usernameField: 'phone' }, async (phone, password, done) => {
  try {
    const user = await User.findOne({ phone });
    if (!user) return done(null, false, { message: "User not found" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return done(null, false, { message: "Invalid credentials" });

    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

// Serialize & Deserialize
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Middleware

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(expressLayouts);
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

// EJS setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("layout", "./layouts/boilerplate");
app.use(express.static(path.join(__dirname, "public")));

//login User route
app.get("/user/login", (req, res) => {
  res.render("user/login");
});
//post route to login user
app.post("/user/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      req.flash("error", info.message || "Invalid phone or password");
      return res.redirect("/user/login");
    }

    req.logIn(user, (err) => {
      if (err) return next(err);
      req.flash("success", "Welcome back!");
      return res.redirect(`/user/dashboard/${user._id}`);
    });
  })(req, res, next);
});


//singup User route
app.get("/user/signup", (req, res) => {
  res.render("user/signup");
});

//post route to register new user
app.post("/user/signup", wrapAsync(async (req, res, next) => {
  const { name, email, phone, password } = req.body;
  const newUser = new User({ name, email, phone, password });
  await newUser.save();

  // Auto-login after signup
  req.login(newUser, err => {
    if (err) return next(err);

    // Set flash message
    req.flash('success', `Welcome, ${newUser.name}! You are now logged in.`);

    // Redirect to dashboard
    res.redirect(`/user/dashboard/${newUser._id}`);
  });
}));


//logout route
app.get("/user/logout", (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    req.flash("success", "You have logged out successfully");
    res.redirect("/user/login");
  });
});

// Dashboard Route
app.get("/user/dashboard/:id", isLoggedIn,async (req, res) => {
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
app.get("/home/main", (req, res) => {
  res.render("Home/main");
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
  const organisations = await Organisation.find();
  res.render("user/newcomplaint", { user,organisations });
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
