const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["member", "admin"], default: "member" },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved"],
      default: "pending",
    },
    isSuperAdministrator: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
