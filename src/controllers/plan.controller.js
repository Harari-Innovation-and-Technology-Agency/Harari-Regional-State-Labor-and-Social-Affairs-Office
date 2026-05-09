const Document = require('../models/Plan.model');
const path = require('path');
const fs = require('fs');

// ================= UPLOAD DOCUMENT =================
exports.uploadDocument = async (req, res) => {

  console.log("BODY:", req.body);
    console.log("FILE:", req.file);

  try {

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'File is required'
      });
    }

    const { title, type, year } = req.body;

    const doc = new Document({
      title,
      type,
      year,
      fileUrl: `/uploads/documents/${req.file.filename}`,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: req.user?._id
    });

    await doc.save();

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      data: doc
    });

  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({
      success: false,
      message: 'Upload failed'
    });
  }
};

// ================= GET DOCUMENTS =================
exports.getDocuments = async (req, res) => {
  try {

    const { type } = req.query;

    const query = {};
    if (type) query.type = type;

    const docs = await Document.find(query)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: docs
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false
    });
  }
};

// ================= DELETE DOCUMENT =================
exports.deleteDocument = async (req, res) => {
  try {

    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false });

    // delete file
    const filePath = path.join(__dirname, '..', doc.fileUrl);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await doc.deleteOne();

    res.json({
      success: true,
      message: 'Deleted successfully'
    });

  } catch (error) {
    res.status(500).json({ success: false });
  }
};

exports.getPublicDocuments = async (req, res) => {
  try {
    const documents = await Document.find()
      .select('-uploadedBy') 
      .sort({ createdAt: -1 });

    res.status(200).json(documents);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};