const express = require("express");
const { attachUser, requireAdmin } = require("../middleware/auth");
const contributions = require("../controllers/contributions.controller");

const router = express.Router();

router.use(attachUser, requireAdmin);

router.get("/count", contributions.countLedger);
router.get("/stats/top-club", contributions.topClubByMembers);
router.get("/stats/clubs", contributions.clubLeaderboard);
router.get("/stats/districts", contributions.districtLeaderboard);
router.get("/", contributions.list);
router.post("/", contributions.create);
router.patch("/:id", contributions.update);
router.delete("/:id", contributions.remove);

module.exports = router;
