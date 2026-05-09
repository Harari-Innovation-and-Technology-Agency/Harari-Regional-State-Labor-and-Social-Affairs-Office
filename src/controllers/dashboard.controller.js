const News = require("../models/News.model");
const Service = require("../models/Service.model");
const Gallery = require("../models/Gallery.model");
const Contact = require("../models/Contact.model");

/**
 * GET /api/admin/stats
 */
exports.getDashboardStats = async (req, res) => {
  console.log("📊 [DASHBOARD] Stats request received");

  try {
    console.log("🔍 Counting documents...");

    const [
      newsCount,
      servicesCount,
      galleryCount,
      contactsCount
    ] = await Promise.all([
      News.countDocuments(),
      Service.countDocuments(),
      Gallery.countDocuments(),
      Contact.countDocuments({ status: "new" })
    ]);

    console.log("✅ Counts fetched:", {
      newsCount,
      servicesCount,
      galleryCount,
      contactsCount
    });

    const responsePayload = {
      news: newsCount,
      services: servicesCount,
      gallery: galleryCount,
      contacts: contactsCount
    };

    console.log("📤 Sending dashboard stats response:", responsePayload);

    return res.status(200).json(responsePayload);

  } catch (err) {
    console.error("❌ [DASHBOARD] Stats error:", err);

    return res.status(500).json({
      message: "Failed to load dashboard stats",
      error: process.env.NODE_ENV === "development" ? err.message : undefined
    });
  }
};

/**
 * GET /api/admin/activity
 */
exports.getRecentActivity = async (req, res) => {
  console.log("🕒 [DASHBOARD] Activity request received");

  try {
    console.log("🔍 Fetching recent news...");
    const recentNews = await News.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title createdAt");

    console.log(`📰 Found ${recentNews.length} recent news items`);

    console.log("📨 Fetching recent contacts...");
    const recentContacts = await Contact.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name subject createdAt status");

    console.log(`✉️ Found ${recentContacts.length} recent messages`);

    const activity = [
      ...recentNews.map(n => ({
        type: "News",
        description: `New article: ${n.title}`,
        date: n.createdAt,
        status: "Published"
      })),
      ...recentContacts.map(c => ({
        type: "Message",
        description: `Message from ${c.name}: ${c.subject}`,
        date: c.createdAt,
        status: c.status
      }))
    ]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    console.log(`📋 Compiled ${activity.length} activity items`);
    console.log("📤 Sending activity response");

    return res.status(200).json(activity);

  } catch (err) {
    console.error("❌ [DASHBOARD] Activity error:", err);

    return res.status(500).json({
      message: "Failed to load activity",
      error: process.env.NODE_ENV === "development" ? err.message : undefined
    });
  }
};
