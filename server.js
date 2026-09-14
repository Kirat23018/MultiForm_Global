/**
 * MultiForm Global (MFG) - Enterprise Agency Backend Server
 * Express + Multer Media Upload + Nodemailer Lead Dispatch + SQLite/JSON Store + Public REST API
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const nodemailer = require('nodemailer');
const { db } = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure upload directory exists
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E6);
    cb(null, `${safeBase}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB max per media file
  },
  fileFilter: (req, file, cb) => {
    const isImage = file.mimetype.startsWith('image/');
    const isVideo = file.mimetype.startsWith('video/');
    if (isImage || isVideo) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are supported (PNG, JPG, WEBP, GIF, MP4, WEBM).'), false);
    }
  }
});

// Nodemailer Transporter Setup
function getEmailTransporter() {
  const emailPassword = (process.env.EMAIL_APP_PASSWORD || process.env.SMTP_PASS || '').trim();
  const teamEmail = (process.env.TEAM_EMAIL || process.env.SMTP_USER || 'multiformglobal@gmail.com').trim();

  if (emailPassword) {
    const cleanPass = emailPassword.replace(/\s+/g, '');
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: teamEmail,
        pass: cleanPass
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER.trim(),
        pass: process.env.SMTP_PASS.trim().replace(/\s+/g, '')
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  // Development / Stream transport fallback for local execution
  return nodemailer.createTransport({
    streamTransport: true,
    newline: 'windows'
  });
}

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Uploads Directory
app.use('/uploads', express.static(UPLOADS_DIR));

// Serve Frontend Static Files
app.use(express.static(__dirname));

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

// Owner Login
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = db.findUserByEmail(email);
    if (!user || user.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid owner credentials.' });
    }

    const { password: _, ...safeUser } = user;
    const token = 'mfg_owner_' + Buffer.from(safeUser.email + ':' + Date.now()).toString('base64');
    
    return res.json({
      success: true,
      message: `Welcome back, ${safeUser.name}!`,
      user: safeUser,
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// Verify Current Session
app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'No authorization header provided.' });
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = Buffer.from(token.replace('mfg_owner_', ''), 'base64').toString('utf8');
    const email = decoded.split(':')[0];
    const user = db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Owner session expired.' });
    }
    const { password: _, ...safeUser } = user;
    return res.json({ success: true, user: safeUser });
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Invalid session token.' });
  }
});

// ==========================================
// MEDIA SHOWCASE / PORTFOLIO ROUTES
// ==========================================

// GET /api/media - Public feed of all published works
app.get('/api/media', (req, res) => {
  try {
    const { category } = req.query;
    const mediaList = db.getAllMedia(category);
    return res.json({
      success: true,
      count: mediaList.length,
      media: mediaList
    });
  } catch (err) {
    console.error('Get media error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch media showcase.' });
  }
});

// POST /api/media/upload - Direct Media Upload (Owner)
app.post('/api/media/upload', upload.single('mediaFile'), (req, res) => {
  try {
    const { title, caption, category } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select an image or video file to upload.' });
    }
    if (!title || !category) {
      return res.status(400).json({ success: false, message: 'Title and category are required.' });
    }

    const isVideo = req.file.mimetype.startsWith('video/');
    const mediaType = isVideo ? 'video' : 'image';
    const fileUrl = `/uploads/${req.file.filename}`;

    const newMedia = db.createMedia({
      title: title.trim(),
      caption: caption ? caption.trim() : '',
      category,
      mediaType,
      fileUrl,
      originalName: req.file.originalname,
      fileSize: req.file.size
    });

    return res.status(201).json({
      success: true,
      message: 'Media published successfully to portfolio showcase!',
      media: newMedia
    });
  } catch (err) {
    console.error('Media upload error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to upload media.' });
  }
});

// DELETE /api/media/:id - Remove Media Item (Owner)
app.delete('/api/media/:id', (req, res) => {
  try {
    const deleted = db.deleteMedia(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Media item not found.' });
    }

    // Try deleting file from disk if in /uploads/
    if (deleted.fileUrl && deleted.fileUrl.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, deleted.fileUrl);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {}
      }
    }

    return res.json({
      success: true,
      message: 'Media item deleted from portfolio showcase.',
      deleted
    });
  } catch (err) {
    console.error('Delete media error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete media item.' });
  }
});

// ==========================================
// INQUIRIES & LEAD GENERATION API
// ==========================================

// GET All Inquiries (Owner / Admin Lead Viewer)
app.get('/api/inquiries', (req, res) => {
  try {
    const list = db.getAllInquiries();
    return res.json(list);
  } catch (err) {
    // Fallback direct read
    try {
      const dbPath = fs.existsSync(path.join(__dirname, 'database.json'))
        ? path.join(__dirname, 'database.json')
        : path.join(__dirname, 'data', 'database.json');
      const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      return res.json(data.inquiries || []);
    } catch (readErr) {
      console.error('Failed to read inquiries:', readErr);
      return res.status(500).json({ error: 'Failed to read inquiries' });
    }
  }
});

// DELETE Inquiry by ID
app.delete('/api/inquiries/:id', (req, res) => {
  try {
    const id = req.params.id;
    const deleted = db.deleteInquiry(id);
    
    // Also sync direct file if needed
    const dbPath = fs.existsSync(path.join(__dirname, 'database.json'))
      ? path.join(__dirname, 'database.json')
      : path.join(__dirname, 'data', 'database.json');
    if (fs.existsSync(dbPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        data.inquiries = (data.inquiries || []).filter(item => item.id !== id);
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
      } catch (e) {}
    }

    return res.json({ success: true, message: 'Inquiry deleted successfully' });
  } catch (err) {
    console.error('Failed to delete inquiry:', err);
    return res.status(500).json({ error: 'Failed to delete inquiry' });
  }
});

// POST /api/contact - Submit project inquiry, send Nodemailer emails, and persist
app.post('/api/contact', async (req, res) => {
  const { name, email, phone, organization, service, budget, timeline, message } = req.body;

  if (!name || (!email && !phone)) {
    return res.status(400).json({
      error: 'Name, and at least an email or WhatsApp number are required.',
      message: 'Please provide your name and contact details.'
    });
  }

  // 1. Save locally in database.json and data/database.json
  const newInquiry = db.createInquiry({
    id: `inq_${Date.now()}`,
    name,
    email: email || '',
    phone: phone || '',
    organization: organization || '',
    service: service || 'General Project Inquiry',
    budget: budget || 'Flexible',
    timeline: timeline || 'Standard',
    message: message || '',
    createdAt: new Date().toISOString()
  });

  console.log(`\n[MAIL] 🚀 Processing inquiry from: "${name}" <${email || 'No email'}> | Phone: ${phone || 'N/A'}`);

  // 2. Dispatch Email via Nodemailer
  const mailer = getEmailTransporter();
  const teamEmail = (process.env.TEAM_EMAIL || process.env.SMTP_USER || 'multiformglobal@gmail.com').trim();
  const recipientEmails = (process.env.NOTIFICATION_EMAILS || 'multiformglobal@gmail.com, founder@multiformglobal.com').trim();

  const teamEmailHtml = `
    <div style="font-family: Arial, sans-serif; background: #0f0f0f; color: #fff; padding: 25px; border: 1px solid #D4AF37; border-radius: 10px; max-width: 600px; margin: 0 auto;">
      <div style="border-bottom: 2px solid #D4AF37; padding-bottom: 12px; margin-bottom: 20px;">
        <h2 style="color: #D4AF37; margin: 0;">⚡ New Client Project Inquiry</h2>
        <span style="color: #888; font-size: 13px;">MultiForm Global (MFG) Executive Lead Dispatch</span>
      </div>
      <table style="width: 100%; font-size: 15px; border-collapse: collapse;">
        <tr><td style="padding: 6px 0; color: #D4AF37; font-weight: bold; width: 130px;">Name:</td><td style="color: #fff;">${name}</td></tr>
        <tr><td style="padding: 6px 0; color: #D4AF37; font-weight: bold;">Email:</td><td style="color: #fff;"><a href="mailto:${email}" style="color: #60a5fa;">${email || 'N/A'}</a></td></tr>
        <tr><td style="padding: 6px 0; color: #D4AF37; font-weight: bold;">WhatsApp / Phone:</td><td style="color: #fff;"><a href="https://wa.me/${(phone || '').replace(/[^0-9]/g, '')}" style="color: #4ade80;">${phone || 'N/A'}</a></td></tr>
        <tr><td style="padding: 6px 0; color: #D4AF37; font-weight: bold;">Organization:</td><td style="color: #fff;">${organization || 'Individual'}</td></tr>
        <tr><td style="padding: 6px 0; color: #D4AF37; font-weight: bold;">Service:</td><td style="color: #fff;">${service || 'General'}</td></tr>
        <tr><td style="padding: 6px 0; color: #D4AF37; font-weight: bold;">Budget:</td><td style="color: #fff;">${budget || 'Flexible'}</td></tr>
        <tr><td style="padding: 6px 0; color: #D4AF37; font-weight: bold;">Timeline:</td><td style="color: #fff;">${timeline || 'Standard'}</td></tr>
      </table>
      <div style="margin-top: 20px;">
        <strong style="color: #D4AF37; display: block; margin-bottom: 6px;">Project Message / Specifications:</strong>
        <div style="background: #1c1c1c; padding: 14px; border-radius: 6px; border-left: 3px solid #D4AF37; line-height: 1.6; white-space: pre-wrap;">${message || 'No additional notes provided.'}</div>
      </div>
      <div style="margin-top: 24px; text-align: center;">
        <a href="https://wa.me/${(phone || '').replace(/[^0-9]/g, '')}" style="display: inline-block; background: #25d366; color: #ffffff; padding: 10px 18px; border-radius: 6px; font-weight: bold; text-decoration: none; margin-right: 10px;">Chat on WhatsApp &rarr;</a>
        <a href="mailto:${email}?subject=Regarding%20Your%20Project%20Inquiry%20-%20MultiForm%20Global" style="display: inline-block; background: #3b82f6; color: #ffffff; padding: 10px 18px; border-radius: 6px; font-weight: bold; text-decoration: none;">Reply via Email &rarr;</a>
      </div>
    </div>
  `;

  // 2a. Mail to Team
  try {
    console.log(`[MAIL] Attempting to dispatch email alert to team (${recipientEmails})...`);
    const teamInfo = await mailer.sendMail({
      from: `"MultiForm Global" <${teamEmail}>`,
      to: recipientEmails,
      subject: `⚡ New Lead: ${service || 'Project'} from ${name}`,
      html: teamEmailHtml
    });
    console.log(`[MAIL] ✅ Team alert successfully dispatched! ID: ${teamInfo.messageId || 'OK'}`);
  } catch (teamMailErr) {
    console.error(`[MAIL] ❌ Team email dispatch failed: ${teamMailErr.message}`);
  }

  // 2b. Confirmation to Client (if valid email provided)
  if (email && email.includes('@')) {
    try {
      console.log(`[MAIL] Attempting to dispatch client acknowledgement to ${email}...`);
      const clientInfo = await mailer.sendMail({
        from: `"MultiForm Global" <${teamEmail}>`,
        to: email,
        subject: 'Thank You for Reaching Out | MultiForm Global',
        html: `
          <div style="font-family: Arial, sans-serif; background: #0b0b0b; color: #eee; padding: 25px; border-radius: 8px; border: 1px solid #D4AF37; max-width: 550px; margin: 0 auto;">
            <h2 style="color: #D4AF37; margin-top: 0;">Inquiry Received</h2>
            <p>Hi <strong>${name}</strong>,</p>
            <p>We received your inquiry regarding <strong>${service || 'your project'}</strong>. Our founders (<strong>Hardeep Singh</strong> & <strong>Prabhkirat Kaur</strong>) will review your specifications and get back to you within 2 to 4 hours with a custom proposal.</p>
            <div style="margin: 20px 0; padding: 12px; background: #181818; border-radius: 6px; text-align: center;">
              <span style="font-size: 13px; color: #D4AF37; font-weight: bold;">Direct WhatsApp Lines:</span><br>
              <a href="https://wa.me/8198096370" style="color: #4ade80; text-decoration: none; font-weight: bold; margin-right: 12px;">+91 8198096370 (Hardeep)</a>
              <a href="https://wa.me/8847250820" style="color: #4ade80; text-decoration: none; font-weight: bold;">+91 8847250820 (Prabhkirat)</a>
            </div>
            <p style="color: #888; font-size: 12px; margin-bottom: 0;">MultiForm Global Executive Team • <a href="mailto:multiformglobal@gmail.com" style="color: #D4AF37;">multiformglobal@gmail.com</a></p>
          </div>
        `
      });
      console.log(`[MAIL] ✅ Client acknowledgement successfully dispatched! ID: ${clientInfo.messageId || 'OK'}`);
    } catch (clientMailErr) {
      console.error(`[MAIL] ❌ Client acknowledgement failed: ${clientMailErr.message}`);
    }
  }

  return res.status(200).json({
    success: true,
    message: 'Your project inquiry has been received! Confirmation dispatched.',
    inquiry: newInquiry
  });
});

// Clean navigation fallback
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }
  const cleanPath = req.path.endsWith('.html') ? req.path : req.path === '/' ? 'index.html' : `${req.path}.html`;
  const target = path.join(__dirname, cleanPath);
  if (fs.existsSync(target)) {
    return res.sendFile(target);
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`\n=============================================================`);
  console.log(`  🌟 MultiForm Global (MFG) Agency Server Online!            `);
  console.log(`  🌐 Website Home:    http://localhost:${PORT}/index.html      `);
  console.log(`  💼 Portfolio:       http://localhost:${PORT}/portfolio.html  `);
  console.log(`  👥 Founders:        http://localhost:${PORT}/founders.html   `);
  console.log(`  🔒 Owner Login:     http://localhost:${PORT}/login.html      `);
  console.log(`  📡 Public Media API:http://localhost:${PORT}/api/media       `);
  console.log(`  ✉️ Lead Dispatch:  POST http://localhost:${PORT}/api/contact `);
  console.log(`=============================================================\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ [PORT CONFLICT] Port ${PORT} is already in use by another running server instance.`);
    console.error(`👉 Stop the existing process in terminal or run: npx kill-port ${PORT}\n`);
  } else {
    console.error('Server error:', err);
  }
});
