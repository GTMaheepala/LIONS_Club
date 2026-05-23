const jwt = require("jsonwebtoken");
const User = require("../models/User");

function getJwtSecret() {
  const s = process.env.JWT_SECRET;
  if (!s?.trim())
    throw new Error("JWT_SECRET is not configured (set JWT_SECRET in backend/.env)");
  return s;
}

function signToken(user) {
  const hasFullAccess =
    user.role === "admin" ||
    user.approvalStatus === "approved" ||
    user.isSuperAdministrator;
  const payload = {
    sub: String(user._id),
    role: user.role,
    hasFullAccess,
  };
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
}

async function attachUser(req, res, next) {
  const header = req.headers.authorization || "";
  const m = /^Bearer\s+(.+)$/i.exec(header);
  const token = m ? m[1].trim() : "";
  if (!token) return res.status(401).json({ message: "Authentication required." });

  let decoded;
  try {
    decoded = jwt.verify(token, getJwtSecret());
  } catch {
    return res.status(401).json({ message: "Invalid or expired session." });
  }

  const user = await User.findById(decoded.sub);
  if (!user) return res.status(401).json({ message: "User not found." });

  req.user = user;
  req.auth = decoded;
  next();
}

function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Administrators only." });
  }
  next();
}

function serializeUser(doc) {
  const hasFullAccess =
    doc.role === "admin" ||
    doc.approvalStatus === "approved" ||
    doc.isSuperAdministrator;
  return {
    id: String(doc._id),
    fullName: doc.fullName,
    email: doc.email,
    role: doc.role,
    approvalStatus: doc.approvalStatus,
    hasFullAccess,
    isSuperAdministrator: Boolean(doc.isSuperAdministrator),
    createdAt: doc.createdAt,
  };
}

module.exports = {
  attachUser,
  requireAdmin,
  signToken,
  serializeUser,
};
