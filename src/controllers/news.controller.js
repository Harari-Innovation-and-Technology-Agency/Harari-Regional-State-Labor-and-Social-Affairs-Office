const News = require('../models/News.model');
const { validationResult } = require('express-validator');

/* ===============================
   PUBLIC: GET PUBLISHED NEWS
=================================*/
exports.getAllNews = async (req, res) => {
  try {
    const news = await News.find({ status: 'Published' })
      .sort({ date: -1 })
      .populate('author', 'username')
      .select('-__v');

    res.json(news);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

/* ===============================
   PUBLIC: GET BY SLUG
=================================*/
exports.getNewsBySlug = async (req, res) => {
  try {
    const news = await News.findOne({
      slug: req.params.slug,
      status: 'Published'
    }).populate('author', 'username');

    if (!news) {
      return res.status(404).json({ message: 'News not found' });
    }

    news.views += 1;
    await news.save();

    res.json(news);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

/* ===============================
   ADMIN: GET ALL (ALL STATUS)
=================================*/
exports.getAllAdminNews = async (req, res) => {
  try {
    const news = await News.find()
      .sort({ date: -1 })
      .populate('author', 'username');

    res.json(news);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

/* ===============================
   ADMIN: CREATE
=================================*/
exports.createNews = async (req, res) => {
  console.log("REQ.FILE:", req.file);
  console.log("USER:", req.user);
  

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      date,
      summary,
      content,
      category,
      status
    } = req.body;

    const coverPath = req.file
      ? `/uploads/news/${req.file.filename}`
      : '';

    const news = new News({
      title,
      date,
      summary,
      content,
      category,
      status,
      cover: coverPath,
      author: req.user._id
    });

    await news.save();

    res.status(201).json(news);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

/* ===============================
   ADMIN: UPDATE
=================================*/
exports.updateNews = async (req, res) => {
  try {
    const { id } = req.params;

    const updateData = {
      title: req.body.title,
      content: req.body.content,
      summary: req.body.summary,
      category: req.body.category,
      status: req.body.status,
      date: req.body.date
    };

    // ✅ If new cover uploaded, replace it
    if (req.file) {
      updateData.cover = req.file.path.replace(/\\/g, "/");
    }

    const updatedNews = await News.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedNews) {
      return res.status(404).json({ message: "News not found" });
    }

    res.json(updatedNews);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};



/* ===============================
   ADMIN: DELETE
=================================*/
exports.deleteNews = async (req, res) => {
  try {
    const news = await News.findById(req.params.id);

    if (!news) {
      return res.status(404).json({ message: 'News not found' });
    }

    await news.deleteOne();

    res.json({ message: 'News deleted successfully' });

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

/* ===============================
   ADMIN: GET BY ID
=================================*/
exports.getNewsById = async (req, res) => {
  try {
    const news = await News.findById(req.params.id)
      .populate('author', 'username');

    if (!news) {
      return res.status(404).json({ message: 'News not found' });
    }

    res.json(news);

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
