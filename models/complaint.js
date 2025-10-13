const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ComplaintSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  subject: String,
  description: String,
  location:String,
  category:String,
  status: { type: String, default: "Pending" }, // e.g., Pending, Active, Resolved
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Complaint", ComplaintSchema);
