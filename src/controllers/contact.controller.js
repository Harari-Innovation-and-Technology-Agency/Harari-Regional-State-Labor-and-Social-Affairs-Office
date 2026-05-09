const Contact = require('../models/Contact.model');
const nodemailer = require('nodemailer');
const { validationResult } = require('express-validator');

// Submit contact form
exports.submitContact = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, subject, message } = req.body;

    const contact = new Contact({
      name,
      email,
      phone: phone || '',
      subject: subject || '',
      message,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    await contact.save();

    // Send email notification (optional)
    if (process.env.SMTP_HOST) {
      await sendContactNotification(contact);
    }

    // Send auto-reply (optional)
    if (process.env.SEND_AUTO_REPLY === 'true') {
      await sendAutoReply(contact);
    }

    res.status(201).json({ 
      message: 'Contact form submitted successfully', 
      contactId: contact._id 
    });
  } catch (error) {
    console.error('Submit contact error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all contacts (admin)
exports.getAllContacts = async (req, res) => {
  try {
    const { status, limit = 20, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (status) {
      query.status = status;
    }

    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    const total = await Contact.countDocuments(query);

    res.json({
      contacts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get contact by ID (admin)
exports.getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id).select('-__v');
    
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    // Mark as read if not already
    if (contact.status === 'new') {
      contact.status = 'read';
      await contact.save();
    }

    res.json(contact);
  } catch (error) {
    console.error('Get contact by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update contact status (admin)
exports.updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, replyMessage } = req.body;

    const contact = await Contact.findById(id);
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    contact.status = status || contact.status;
    
    if (status === 'replied' && replyMessage) {
      contact.replyMessage = replyMessage;
      contact.repliedAt = Date.now();
      contact.repliedBy = req.user._id;

      // Send reply email
      await sendContactReply(contact, replyMessage);
    }

    await contact.save();

    res.json(contact);
  } catch (error) {
    console.error('Update contact status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete contact (admin)
exports.deleteContact = async (req, res) => {
  try {
    const { id } = req.params;

    const contact = await Contact.findById(id);
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    await contact.deleteOne();

    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Email functions
const sendContactNotification = async (contact) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: process.env.ADMIN_EMAIL,
      subject: `New Contact Form Submission: ${contact.subject || 'No Subject'}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${contact.name}</p>
        <p><strong>Email:</strong> ${contact.email}</p>
        <p><strong>Phone:</strong> ${contact.phone || 'Not provided'}</p>
        <p><strong>Subject:</strong> ${contact.subject || 'No subject'}</p>
        <p><strong>Message:</strong></p>
        <p>${contact.message}</p>
        <p><strong>Submitted:</strong> ${new Date(contact.createdAt).toLocaleString()}</p>
        <p><strong>IP Address:</strong> ${contact.ipAddress}</p>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Send notification error:', error);
  }
};

const sendAutoReply = async (contact) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: contact.email,
      subject: 'Thank you for contacting Harari Labour and Social Affairs Office',
      html: `
        <h2>Thank You for Contacting Us</h2>
        <p>Dear ${contact.name},</p>
        <p>We have received your message and will get back to you as soon as possible.</p>
        <p><strong>Your Message:</strong> ${contact.subject || 'No subject'}</p>
        <p>We appreciate your interest in our services.</p>
        <br>
        <p>Best regards,</p>
        <p>Harari Regional State Labor and Social Affairs Office</p>
        <p>Harar, Ethiopia</p>
        <p>Phone: 025-666-46-66</p>
        <p>Email: harariregionsocialaffairs@gmail.com</p>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Send auto-reply error:', error);
  }
};

const sendContactReply = async (contact, replyMessage) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: contact.email,
      subject: `Re: ${contact.subject || 'Your Inquiry'}`,
      html: `
        <h2>Response to Your Inquiry</h2>
        <p>Dear ${contact.name},</p>
        <p>Thank you for contacting the Harari Regional State Labor and Social Affairs Office.</p>
        <p>Here is our response to your message:</p>
        <div style="background-color: #f5f5f5; padding: 15px; margin: 15px 0; border-left: 4px solid #007bff;">
          ${replyMessage.replace(/\n/g, '<br>')}
        </div>
        <p><strong>Your Original Message:</strong></p>
        <p>${contact.message}</p>
        <br>
        <p>If you have any further questions, please don't hesitate to contact us.</p>
        <br>
        <p>Best regards,</p>
        <p>Harari Regional State Labor and Social Affairs Office</p>
        <p>Harar, Ethiopia</p>
        <p>Phone: 025-666-46-66</p>
        <p>Email: harariregionsocialaffairs@gmail.com</p>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Send contact reply error:', error);
  }
};