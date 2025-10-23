# Settler - Complaint Management System

Settler is a web-based platform designed to streamline the process of filing and tracking civic complaints. It provides citizens with a transparent way to submit complaints and authorities with an organized dashboard to manage and resolve them


## Features
- User signup/login
- Organisation signup/login
- File, track, and resolve complaints
- Real-time status updates
- Admin dashboards with analytics
- Contact/demo request form
- Responsive UI using Bootstrap and EJS

## Technologies Used
- Node.js
- Express.js
- MongoDB (Mongoose)
- EJS (Embedded JavaScript Templates)
- Bootstrap 5
- Passport.js (Authentication)
- Nodemailer (Email integration)
- dotenv (Environment Variables)



## Project Structure
/settler
├─ /models # Mongoose schemas
├─ /routes # Express routes (optional)
├─ /views # EJS templates
├─ /public # Static files (CSS, JS, images)
├─ /utils # Helper functions
├─ /middlewares # Middleware functions
├─ app.js # Main server file
├─ package.json
└─ README.md


## Setup & Installation

1. **Clone the repository**
2. npm install
3. Create a .env file in the root directory:
PORT=5000
MONGO_URI=mongodb://localhost:27017/settler
JWT_SECRET=your_secret_key
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password

4.nodemon app.js
