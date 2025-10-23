require('dotenv').config();

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
const transporter = require('./utils/mailer');
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("Connected to MongoDB"))
.catch((err) => console.log("Error connecting to MongoDB:", err));

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
  // Check which model is logged in
  res.locals.user = req.user instanceof User ? req.user : null;
  res.locals.organisation = req.user instanceof Organisation ? req.user : null;
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
// passport.serializeUser((user, done) => done(null, user.id));
// passport.deserializeUser(async (id, done) => {
//   try {
//     const user = await User.findById(id);
//     done(null, user);
//   } catch (err) {
//     done(err);
//   }
// });


// Middleware

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(expressLayouts);


// EJS setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("layout", "./layouts/boilerplate");
app.use(express.static(path.join(__dirname, "public")));
app.get('/', (req, res) => {
  res.redirect('/home/main');
});

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

passport.use("organisation-local", new LocalStrategy({
  usernameField: "email",  // organisation logs in with email
  passwordField: "password"
}, async (email, password, done) => {
  try {
    const organisation = await Organisation.findOne({ email });

    if (!organisation) {
      return done(null, false, { message: "No organisation found with this email" });
    }

    // ⚠️ If you haven't hashed passwords yet:
    if (organisation.password !== password) {
      return done(null, false, { message: "Incorrect password" });
    }

    // If using bcrypt for hashed passwords, replace the line above with:
    // const isMatch = await bcrypt.compare(password, organisation.password);
    // if (!isMatch) return done(null, false, { message: "Incorrect password" });

    return done(null, organisation);
  } catch (err) {
    return done(err);
  }
}));

// Serialize: works for both users and organisations
passport.serializeUser((entity, done) => done(null, { id: entity.id, type: entity instanceof User ? 'User' : 'Organisation' }));

// Deserialize: detects which model to load
passport.deserializeUser(async (obj, done) => {
  try {
    if (obj.type === 'User') {
      const user = await User.findById(obj.id);
      return done(null, user);
    } else if (obj.type === 'Organisation') {
      const organisation = await Organisation.findById(obj.id);
      return done(null, organisation);
    } else {
      return done(null, false);
    }
  } catch (err) {
    done(err);
  }
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


// Organisation login page
app.get("/organisation/login", (req, res) => {
  res.render("organisation/login");
});

// POST route to login organisation
app.post("/organisation/login", (req, res, next) => {
  passport.authenticate("organisation-local", (err, organisation, info) => {
    if (err) return next(err);
    if (!organisation) {
      req.flash("error", info.message || "Invalid email or password");
      return res.redirect("/organisation/login");
    }

    req.logIn(organisation, (err) => {
      if (err) return next(err);
      req.flash("success", `Welcome back, ${organisation.name}!`);
      return res.redirect(`/organisation/dashboard/${organisation._id}`);
    });
  })(req, res, next);
});

// Organisation signup page
app.get("/organisation/signup", (req, res) => {
  res.render("organisation/signup");
});

// POST route to register new organisation
app.post("/organisation/signup", wrapAsync(async (req, res, next) => {
  const { name, email, location, password } = req.body;
  const newOrganisation = new Organisation({ name, email, location, password });
  await newOrganisation.save();

  // Auto-login after signup
  req.login(newOrganisation, err => {
    if (err) return next(err);

    req.flash('success', `Welcome, ${newOrganisation.name}! Organisation registered successfully.`);
    res.redirect(`/organisation/dashboard/${newOrganisation._id}`);
  });
}));

// Organisation logout
app.get("/organisation/logout", (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    req.flash("success", "Organisation logged out successfully");
    res.redirect("/organisation/login");
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
  
  const {subject, description, location, category,organisation } = req.body;
  const newComplaint = new Complaint({
    user: userId,
    organisation,
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
    const organisation = await Organisation.findById(orgId);
    const complaints = await Complaint.find({organisation: orgId})
      .populate("user", "name phone")
      res.render("organisation/dashboard", { complaints,organisation });
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

//About sectiopn
app.get("/home/about", (req, res) => {
  res.render("Home/about");
});

//Nodemailer


app.post("/contact", async (req, res) => {
  try {
    const { name, email, org } = req.body;

    const mailOptions = {
      from: `"Settler Demo" <${process.env.EMAIL_USER}>`,
      to: "sumitkumar963321@gmail.com", // your admin/receiver email
      subject: "New Demo Request",
      html: `
        <h3>New Demo Request Submitted</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Organisation:</strong> ${org || "N/A"}</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    req.flash("success", "Demo request sent successfully!");
    res.redirect("/home/main#connect");  // back to contact section

  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong. Please try again later.");
    res.redirect("/home/main#connect");
  }
});



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
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server listening on port 3000");
});
