const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Organisation = require("./organisation");
const User = require("./user");


const ComplaintSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  subject: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  organisation: { type: Schema.Types.ObjectId, ref: "Organisation" },
  status: { type: String, enum: ["Pending", "Active", "Resolved"], default: "Pending" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Complaint", ComplaintSchema);
