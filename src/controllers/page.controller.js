const Page = require('../models/PageContent.model');
const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');

// Get page by type
exports.getPage = async (req, res) => {
  try {
    const { pageType } = req.params;
    const { lang = 'en' } = req.query;

    let page = await Page.findOne({ pageType }).populate('lastUpdatedBy', 'name email');
    
    if (!page) {
      // Create default page with new fields
      const defaultPage = new Page({
        pageType,
        heroTitle: pageType === 'about' ? 'About Our Office' : '',
        vision: '',
        mission: '',
        values: ['Integrity', 'Excellence', 'Transparency'], // Default values
        responsibilities: '',
        metaTitle: '',
        metaDescription: '',
        isPublished: false
      });
      page = await defaultPage.save();
    }

    // Return translated content if available
    if (lang !== 'en' && page.translations && page.translations[lang]) {
      const translatedPage = {
        ...page.toObject(),
        heroTitle: page.translations[lang].heroTitle || page.heroTitle,
        vision: page.translations[lang].vision || page.vision,
        mission: page.translations[lang].mission || page.mission,
        values: page.translations[lang].values || page.values,
        responsibilities: page.translations[lang].responsibilities || page.responsibilities,
        metaTitle: page.translations[lang].metaTitle || page.metaTitle,
        metaDescription: page.translations[lang].metaDescription || page.metaDescription
      };
      return res.json(translatedPage);
    }

    res.json(page);
  } catch (error) {
    console.error('Get page error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update page (admin)
exports.updatePage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { pageType } = req.params;
    const { 
      heroTitle, 
      vision, 
      mission, 
      values, 
      responsibilities,
      metaTitle,
      metaDescription,
      isPublished,
      translations 
    } = req.body;

    let page = await Page.findOne({ pageType });

    if (!page) {
      page = new Page({
        pageType,
        heroTitle,
        vision,
        mission,
        values: Array.isArray(values) ? values : values?.split('\n').filter(v => v.trim()) || [],
        responsibilities,
        metaTitle,
        metaDescription,
        isPublished: isPublished || false,
        publishedAt: isPublished ? new Date() : null,
        lastUpdatedBy: req.user._id
      });
    } else {
      // Save version history before updating
      page.versionHistory.push({
        version: page.version,
        data: {
          heroTitle: page.heroTitle,
          vision: page.vision,
          mission: page.mission,
          values: page.values,
          responsibilities: page.responsibilities,
          metaTitle: page.metaTitle,
          metaDescription: page.metaDescription,
          isPublished: page.isPublished,
          heroImage: page.heroImage
        },
        updatedBy: req.user._id,
        updatedAt: new Date()
      });

      // Update fields
      if (heroTitle !== undefined) page.heroTitle = heroTitle;
      if (vision !== undefined) page.vision = vision;
      if (mission !== undefined) page.mission = mission;
      
      // Handle values as array
      if (values !== undefined) {
        page.values = Array.isArray(values) 
          ? values 
          : values.split('\n').filter(v => v.trim());
      }
      
      if (responsibilities !== undefined) page.responsibilities = responsibilities;
      if (metaTitle !== undefined) page.metaTitle = metaTitle;
      if (metaDescription !== undefined) page.metaDescription = metaDescription;
      
      // Handle publishing
      if (isPublished !== undefined) {
        page.isPublished = isPublished;
        if (isPublished && !page.publishedAt) {
          page.publishedAt = new Date();
        }
      }
      
      if (translations) {
        page.translations = translations;
      }
      
      page.lastUpdatedBy = req.user._id;
      page.version += 1;
    }

    await page.save();

    // Return without version history to keep response size small
    const responsePage = page.toObject();
    delete responsePage.versionHistory;
    
    res.json(responsePage);
  } catch (error) {
    console.error('Update page error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Upload hero image
exports.uploadHeroImage = async (req, res) => {
  try {
    const { pageType } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const page = await Page.findOne({ pageType });
    
    if (!page) {
      // Delete uploaded file if page doesn't exist
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Page not found' });
    }

    // Delete old hero image if exists
    if (page.heroImage) {
      const oldImagePath = path.join(__dirname, '..', page.heroImage);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Save new image path
    const imageUrl = `/uploads/pages/${req.file.filename}`;
    page.heroImage = imageUrl;
    page.lastUpdatedBy = req.user._id;
    await page.save();

    res.json({ 
      success: true, 
      heroImage: imageUrl,
      message: 'Hero image uploaded successfully' 
    });
  } catch (error) {
    console.error('Upload hero image error:', error);
    // Delete uploaded file on error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Get version history
exports.getVersionHistory = async (req, res) => {
  try {
    const { pageType } = req.params;
    
    const page = await Page.findOne({ pageType })
      .select('versionHistory')
      .populate('versionHistory.updatedBy', 'name email');
    
    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }

    res.json(page.versionHistory.sort((a, b) => b.version - a.version));
  } catch (error) {
    console.error('Get version history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Restore version
exports.restoreVersion = async (req, res) => {
  try {
    const { pageType, version } = req.params;
    
    const page = await Page.findOne({ pageType });
    
    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }

    const historyItem = page.versionHistory.find(v => v.version === parseInt(version));
    
    if (!historyItem) {
      return res.status(404).json({ message: 'Version not found' });
    }

    // Restore data from version
    const restoredData = historyItem.data;
    
    page.heroTitle = restoredData.heroTitle || page.heroTitle;
    page.vision = restoredData.vision || page.vision;
    page.mission = restoredData.mission || page.mission;
    page.values = restoredData.values || page.values;
    page.responsibilities = restoredData.responsibilities || page.responsibilities;
    page.metaTitle = restoredData.metaTitle || page.metaTitle;
    page.metaDescription = restoredData.metaDescription || page.metaDescription;
    page.isPublished = restoredData.isPublished || false;
    page.heroImage = restoredData.heroImage || page.heroImage;
    
    page.lastUpdatedBy = req.user._id;
    page.version += 1;
    
    await page.save();

    res.json({ 
      success: true, 
      message: `Version ${version} restored successfully`,
      page 
    });
  } catch (error) {
    console.error('Restore version error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all pages (admin)
exports.getAllPages = async (req, res) => {
  try {
    const pages = await Page.find()
      .select('-versionHistory')
      .populate('lastUpdatedBy', 'name email')
      .sort({ pageType: 1 });
    
    res.json(pages);
  } catch (error) {
    console.error('Get all pages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};