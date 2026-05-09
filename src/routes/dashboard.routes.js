const express = require("express");
const router = express.Router();
const { auth,adminAuth } = require("../middleware/auth.middleware");
const {
  getDashboardStats,
  getRecentActivity
} = require("../controllers/dashboard.controller");

// ✅ ROUTES
router.get("/stats", auth,adminAuth, getDashboardStats);
router.get("/activity",auth, adminAuth, getRecentActivity);
module.exports = router;
