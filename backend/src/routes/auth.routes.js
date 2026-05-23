const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { attachUser, requireAdmin, signToken, serializeUser } = require("../middleware/auth");

const router = express.Router();

router.post("/register", async (req, res) => {
  const { fullName, email, password } = req.body || {};
  if (!fullName || !email || !password) {
    return res.status(400).json({ message: "fullName, email, and password are required." });
  }
  if (String(password).length < 8) {
    return res.status(400).json({ message: "Password needs at least 8 characters." });
  }
  const em = String(email).trim().toLowerCase();
  const existing = await User.findOne({ email: em });
  if (existing) {
    return res.status(409).json({ message: "An account already exists with this email." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    fullName: String(fullName).trim(),
    email: em,
    passwordHash,
    role: "member",
    approvalStatus: "pending",
  });

  const token = signToken(user);
  res.status(201).json({ token, user: serializeUser(user) });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: "email and password required." });
  }
  const em = String(email).trim().toLowerCase();
  const user = await User.findOne({ email: em });
  if (!user) {
    return res.status(401).json({ message: "Invalid email or password." });
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const token = signToken(user);
  res.json({ token, user: serializeUser(user) });
});

router.get("/me", attachUser, (req, res) => {
  res.json({ user: serializeUser(req.user) });
});

router.get("/admin/pending-members", attachUser, requireAdmin, async (_req, res) => {
  const users = await User.find({
    role: "member",
    approvalStatus: "pending",
  }).sort({ createdAt: -1 });

  res.json({ users: users.map(serializeUser) });
});

router.get("/admin/members", attachUser, requireAdmin, async (req, res) => {
  const status = req.query.status;
  /** @type {import('mongoose').FilterQuery<unknown>} */
  let q = {};
  if (status === "pending") {
    q = { role: "member", approvalStatus: "pending" };
  } else if (status === "approved") {
    q = { role: "member", approvalStatus: "approved" };
  } else if (status === "admin") {
    q = { role: "admin" };
  }

  const users = await User.find(q).sort({ createdAt: -1 });
  res.json({ users: users.map(serializeUser) });
});

router.patch("/admin/members/:id/approve", attachUser, requireAdmin, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found." });
  if (user.role !== "member") {
    return res.status(400).json({ message: "Only Lion members use the approval queue." });
  }
  user.approvalStatus = "approved";
  await user.save();
  res.json({ message: "Member approved.", user: serializeUser(user) });
});

async function updateAdminMember(req, res) {
  const rawId = String(req.params.id || "").trim();
  if (!mongoose.Types.ObjectId.isValid(rawId)) {
    return res.status(400).json({ message: "Invalid user id." });
  }

  const { fullName, email, role, approvalStatus, password } = req.body || {};
  const user = await User.findById(rawId);
  if (!user) return res.status(404).json({ message: "User not found." });

  if (user.isSuperAdministrator) {
    return res.status(403).json({
      message: "The bootstrap super administrator cannot be edited from the console.",
    });
  }

  const wantsRole = role !== undefined;
  const wantsApproval = approvalStatus !== undefined;

  if (wantsRole && !["member", "admin"].includes(role)) {
    return res.status(400).json({ message: "Invalid role." });
  }

  const nextRole = wantsRole ? role : user.role;
  if (user.role === "admin" && nextRole === "member") {
    const adminCount = await User.countDocuments({ role: "admin" });
    if (adminCount <= 1) {
      return res.status(400).json({ message: "Cannot demote the last administrator." });
    }
  }

  if (fullName !== undefined) {
    const next = String(fullName).trim();
    if (!next) return res.status(400).json({ message: "fullName cannot be empty." });
    user.fullName = next;
  }

  if (email !== undefined) {
    const em = String(email).trim().toLowerCase();
    if (!em) return res.status(400).json({ message: "email cannot be empty." });
    const clash = await User.findOne({ email: em, _id: { $ne: user._id } });
    if (clash) return res.status(409).json({ message: "Email already registered." });
    user.email = em;
  }

  if (wantsRole) {
    user.role = role;
  }

  if (wantsApproval) {
    if (!["pending", "approved"].includes(approvalStatus)) {
      return res.status(400).json({ message: "Invalid approval status." });
    }
    user.approvalStatus = approvalStatus;
  }

  if (user.role === "admin") {
    user.approvalStatus = "approved";
  }

  if (password !== undefined && String(password).trim() !== "") {
    if (String(password).length < 8) {
      return res.status(400).json({ message: "Password needs at least 8 characters." });
    }
    user.passwordHash = await bcrypt.hash(password, 10);
  }

  await user.save();
  res.json({ message: "User updated.", user: serializeUser(user) });
}

router.patch("/admin/members/:id", attachUser, requireAdmin, updateAdminMember);

router.put("/admin/members/:id", attachUser, requireAdmin, updateAdminMember);

router.delete("/admin/members/:id", attachUser, requireAdmin, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "Invalid user id." });
  }

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found." });
  if (String(user._id) === String(req.user._id)) {
    return res.status(400).json({ message: "You cannot delete your own account while signed in." });
  }
  if (user.isSuperAdministrator) {
    return res.status(403).json({ message: "The bootstrap super administrator cannot be deleted." });
  }
  if (user.role === "admin") {
    const adminCount = await User.countDocuments({ role: "admin" });
    if (adminCount <= 1) {
      return res.status(400).json({ message: "Cannot delete the last administrator." });
    }
  }

  await User.deleteOne({ _id: user._id });
  res.json({ message: "User deleted." });
});

router.post("/admin/users", attachUser, requireAdmin, async (req, res) => {
  const { firstName, lastName, email, password, isAdministrator, grantFullAccess } =
    req.body || {};

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ message: "firstName, lastName, email, and password required." });
  }
  if (String(password).length < 8) {
    return res.status(400).json({ message: "Password needs at least 8 characters." });
  }

  const em = String(email).trim().toLowerCase();
  const existing = await User.findOne({ email: em });
  if (existing) {
    return res.status(409).json({ message: "Email already registered." });
  }

  const fullName = `${String(firstName).trim()} ${String(lastName).trim()}`.trim();
  const role = isAdministrator ? "admin" : "member";
  const grant = Boolean(grantFullAccess);
  /** @type {'pending' | 'approved'} */
  let approvalStatus;
  if (role === "admin") {
    approvalStatus = "approved";
  } else if (grant) {
    approvalStatus = "approved";
  } else {
    approvalStatus = "pending";
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    fullName,
    email: em,
    passwordHash,
    role,
    approvalStatus,
    isSuperAdministrator: false,
  });

  res.status(201).json({
    message:
      approvalStatus === "pending"
        ? "User created; they appear under Pending approvals until approved."
        : "User created with full access.",
    user: serializeUser(user),
  });
});

module.exports = router;
