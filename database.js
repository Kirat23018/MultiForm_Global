/**
 * MultiForm Global (MFG) - Media, Inquiries & User Persistence Engine
 * Atomic JSON storage for public media showcase, lead generation inquiries, and owner authentication.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.VERCEL ? path.join('/tmp', 'data') : path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');
const ROOT_DB_FILE = path.join(__dirname, 'database.json');

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  // Ignore folder creation errors in read-only environment
}

// Default initial data for MultiForm Global luxury portfolio
const defaultSchema = {
  users: [
    {
      id: 'usr_admin_01',
      name: 'Hardeep Singh (Founder)',
      email: 'admin@multiformglobal.com',
      password: 'admin123',
      role: 'admin',
      phone: '+91 8198096370',
      createdAt: '2026-09-01T00:00:00.000Z'
    },
    {
      id: 'usr_admin_02',
      name: 'Prabhkirat Kaur (Co-Founder)',
      email: 'founder@multiformglobal.com',
      password: 'admin123',
      role: 'admin',
      phone: '+91 8847250820',
      createdAt: '2026-09-01T00:00:00.000Z'
    }
  ],
  media: [
    {
      id: 'media_101',
      title: 'Enterprise Freight & Telemetry Logistics Portal',
      caption: 'Full-stack cloud ERP with real-time GPS fleet tracking, automated freight bills, and dispatch management.',
      category: 'Web Development',
      mediaType: 'image',
      fileUrl: 'assets/images/mfg-hero-dark.png',
      originalName: 'Logistics_Portal_UI.png',
      createdAt: '2026-09-01T08:00:00.000Z'
    },
    {
      id: 'media_102',
      title: 'Haute Horlogerie Luxury Brand Identity & Packaging',
      caption: 'Complete luxury vector branding suite, 3D watch presentation renders, and typography design language.',
      category: 'Graphic Design',
      mediaType: 'image',
      fileUrl: 'assets/images/mfg-logo.png',
      originalName: 'Aura_Branding_Mockup.png',
      createdAt: '2026-08-28T14:30:00.000Z'
    },
    {
      id: 'media_103',
      title: 'Performance Marketing Growth Funnel & Ad Creatives',
      caption: 'High-conversion SaaS acquisition campaign, Meta ads creative variations, and real-time attribution analytics.',
      category: 'Digital Marketing',
      mediaType: 'image',
      fileUrl: 'assets/images/mfg-hero-dark.png',
      originalName: 'Growth_Funnel_Analytics.png',
      createdAt: '2026-08-22T10:15:00.000Z'
    },
    {
      id: 'media_104',
      title: 'Automated Academic Research & Office Pipeline',
      caption: 'End-to-end data synthesis, automated report compilation, and institutional data transformation system.',
      category: 'Academic / Office Solutions',
      mediaType: 'image',
      fileUrl: 'assets/images/mfg-logo.png',
      originalName: 'Academic_Automation_Suite.png',
      createdAt: '2026-08-15T18:45:00.000Z'
    }
  ],
  inquiries: []
};

let dbData = null;

function loadDatabase() {
  if (dbData) return dbData;
  try {
    let raw = null;
    if (fs.existsSync(DB_FILE)) {
      raw = fs.readFileSync(DB_FILE, 'utf8');
    } else if (fs.existsSync(ROOT_DB_FILE)) {
      raw = fs.readFileSync(ROOT_DB_FILE, 'utf8');
    }

    if (raw) {
      dbData = JSON.parse(raw);
      if (!Array.isArray(dbData.media)) {
        dbData.media = defaultSchema.media;
      }
      if (!Array.isArray(dbData.inquiries)) {
        dbData.inquiries = [];
      }
      if (!Array.isArray(dbData.users)) {
        dbData.users = defaultSchema.users;
      }
    } else {
      dbData = defaultSchema;
      saveDatabase();
    }
  } catch (err) {
    console.error('Error loading database file, initializing defaults:', err);
    dbData = defaultSchema;
  }
  return dbData;
}

function saveDatabase() {
  try {
    const jsonStr = JSON.stringify(dbData, null, 2);
    
    // Save to DB_FILE (which is /tmp/data/database.json on Vercel)
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, jsonStr, 'utf8');
    fs.renameSync(tempFile, DB_FILE);

    // Also sync to root database.json if not on Vercel
    if (!process.env.VERCEL && fs.existsSync(ROOT_DB_FILE)) {
      try {
        fs.writeFileSync(ROOT_DB_FILE, jsonStr, 'utf8');
      } catch (e) {
        // Ignore root sync error
      }
    }
  } catch (err) {
    console.warn('Database save warning (in-memory state preserved):', err.message);
  }
}

const db = {
  // --- AUTH ---
  findUserByEmail(email) {
    const data = loadDatabase();
    return (data.users || []).find(u => u.email.toLowerCase() === (email || '').toLowerCase());
  },

  // --- MEDIA ---
  getAllMedia(category) {
    const data = loadDatabase();
    let list = [...(data.media || [])];
    if (category && category !== 'All') {
      list = list.filter(m => m.category === category);
    }
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  getMediaById(id) {
    const data = loadDatabase();
    return (data.media || []).find(m => m.id === id);
  },

  createMedia(mediaObj) {
    const data = loadDatabase();
    const newItem = {
      id: 'media_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title: mediaObj.title || 'Untitled Work',
      caption: mediaObj.caption || '',
      category: mediaObj.category || 'Web Development',
      mediaType: mediaObj.mediaType || 'image',
      fileUrl: mediaObj.fileUrl,
      originalName: mediaObj.originalName || '',
      fileSize: mediaObj.fileSize || 0,
      createdAt: new Date().toISOString()
    };

    if (!Array.isArray(data.media)) {
      data.media = [];
    }
    data.media.unshift(newItem);
    saveDatabase();
    return newItem;
  },

  deleteMedia(id) {
    const data = loadDatabase();
    const idx = (data.media || []).findIndex(m => m.id === id);
    if (idx === -1) return null;

    const [deletedItem] = data.media.splice(idx, 1);
    saveDatabase();
    return deletedItem;
  },

  // --- INQUIRIES & LEADS ---
  createInquiry(inquiryObj) {
    const data = loadDatabase();
    const newInquiry = {
      id: inquiryObj.id || ('inq_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)),
      name: inquiryObj.name || '',
      email: inquiryObj.email || '',
      phone: inquiryObj.phone || '',
      organization: inquiryObj.organization || '',
      service: inquiryObj.service || 'General Project Inquiry',
      budget: inquiryObj.budget || 'Flexible',
      timeline: inquiryObj.timeline || 'Standard',
      message: inquiryObj.message || '',
      createdAt: inquiryObj.createdAt || new Date().toISOString()
    };

    if (!Array.isArray(data.inquiries)) {
      data.inquiries = [];
    }
    data.inquiries.unshift(newInquiry);
    saveDatabase();
    return newInquiry;
  },

  deleteInquiry(id) {
    const data = loadDatabase();
    const idx = (data.inquiries || []).findIndex(item => item.id === id);
    if (idx === -1) return false;
    data.inquiries.splice(idx, 1);
    saveDatabase();
    return true;
  },

  getAllInquiries() {
    const data = loadDatabase();
    return (data.inquiries || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
};

module.exports = { db };
