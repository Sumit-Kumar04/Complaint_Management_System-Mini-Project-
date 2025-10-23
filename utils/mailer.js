const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",  // Gmail SMTP
  port: 465,
  secure: true,            // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,  // your email
    pass: process.env.EMAIL_PASS,  // your email password or app password
  },
});

module.exports = transporter;
