const bcrypt = require("bcryptjs");
const User = require("../models/User");

const SUPER_EMAIL =
  process.env.SUPERADMIN_EMAIL?.trim().toLowerCase() || "superadmin@gmail.com";
const SUPER_PASSWORD = process.env.SUPERADMIN_PASSWORD || "superadmin@123";

/**
 * Runs once Mongo is connected — keeps a bootstrap super-admin in sync with env/password.
 */
async function ensureSuperAdmin() {
  let user = await User.findOne({
    email: SUPER_EMAIL,
  });

  const passwordHash = await bcrypt.hash(SUPER_PASSWORD, 10);

  if (!user) {
    await User.create({
      fullName: "Super Administrator",
      email: SUPER_EMAIL,
      passwordHash,
      role: "admin",
      approvalStatus: "approved",
      isSuperAdministrator: true,
    });
    console.log("Created super-admin:", SUPER_EMAIL);
    return;
  }

  user.fullName = user.fullName || "Super Administrator";
  user.role = "admin";
  user.approvalStatus = "approved";
  user.isSuperAdministrator = true;
  user.passwordHash = passwordHash;
  await user.save();
}

module.exports = { ensureSuperAdmin };
