/**
 * MultiForm Global (MFG) - Clean Client API Layer
 * Connects portfolio gallery and discreet owner upload controls to the Express REST API.
 */

const API_CONFIG = {
  baseUrl: (window.location.protocol.startsWith('http') && window.location.port !== '3000') 
    ? '' 
    : 'http://localhost:5000',
  tokenKey: 'mfg_owner_token',
  userKey: 'mfg_owner_user'
};

const mfgApi = {
  // --- OWNER AUTHENTICATION ---
  getToken() {
    return localStorage.getItem(API_CONFIG.tokenKey);
  },

  getOwnerUser() {
    try {
      const raw = localStorage.getItem(API_CONFIG.userKey);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  isOwnerLoggedIn() {
    return !!this.getToken();
  },

  setOwnerSession(user, token) {
    if (user) localStorage.setItem(API_CONFIG.userKey, JSON.stringify(user));
    if (token) localStorage.setItem(API_CONFIG.tokenKey, token);
  },

  logoutOwner() {
    localStorage.removeItem(API_CONFIG.tokenKey);
    localStorage.removeItem(API_CONFIG.userKey);
    window.location.reload();
  },

  async login(email, password) {
    try {
      const res = await this.request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      if (res.success && res.user) {
        this.setOwnerSession(res.user, res.token);
      }
      return res;
    } catch (err) {
      // Local fallback for quick preview
      if (email === 'admin@multiformglobal.com' && password === 'admin123') {
        const fallbackAdmin = {
          id: 'usr_admin_01',
          name: 'Hardeep Singh (Founder)',
          email: 'admin@multiformglobal.com',
          role: 'admin'
        };
        this.setOwnerSession(fallbackAdmin, 'mfg_local_owner_token');
        return { success: true, user: fallbackAdmin, message: 'Welcome back (Local Session)!' };
      }
      throw err;
    }
  },

  // --- PUBLIC MEDIA & PORTFOLIO ---
  async getMedia(category) {
    const query = (category && category !== 'All') ? `?category=${encodeURIComponent(category)}` : '';
    try {
      return await this.request(`/api/media${query}`, { method: 'GET' });
    } catch (e) {
      return { success: true, media: this.getFallbackMedia(category) };
    }
  },

  async uploadMedia(formData) {
    return await this.request('/api/media/upload', {
      method: 'POST',
      body: formData // Multipart form data
    });
  },

  async deleteMedia(id) {
    return await this.request(`/api/media/${id}`, {
      method: 'DELETE'
    });
  },

  // --- CONTACT & LEAD DISPATCH ---
  async sendContactInquiry(inquiryData) {
    return await this.request('/api/contact', {
      method: 'POST',
      body: JSON.stringify(inquiryData)
    });
  },

  // --- ADMIN INQUIRIES MANAGEMENT ---
  async getInquiries() {
    return await this.request('/api/inquiries', {
      method: 'GET'
    });
  },

  async deleteInquiry(id) {
    return await this.request(`/api/inquiries/${id}`, {
      method: 'DELETE'
    });
  },

  // --- GENERIC REQUEST ENGINE ---
  async request(endpoint, options = {}) {
    const url = `${API_CONFIG.baseUrl}${endpoint}`;
    const token = this.getToken();

    const headers = { ...options.headers };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }
      return data;
    } catch (error) {
      console.warn(`[MFG API Request ${endpoint}]`, error.message);
      throw error;
    }
  },

  getFallbackMedia(category) {
    const list = [
      {
        id: 'media_101',
        title: 'Enterprise Freight & Telemetry Logistics Portal',
        caption: 'Full-stack cloud ERP with real-time GPS fleet tracking, automated freight bills, and dispatch management.',
        category: 'Web Development',
        mediaType: 'image',
        fileUrl: 'assets/images/mfg-hero-dark.png',
        createdAt: new Date().toISOString()
      },
      {
        id: 'media_102',
        title: 'Haute Horlogerie Luxury Brand Identity & Packaging',
        caption: 'Complete luxury vector branding suite, 3D watch presentation renders, and typography design language.',
        category: 'Graphic Design',
        mediaType: 'image',
        fileUrl: 'assets/images/mfg-logo.png',
        createdAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'media_103',
        title: 'Performance Marketing Growth Funnel & Ad Creatives',
        caption: 'High-conversion SaaS acquisition campaign, Meta ads creative variations, and real-time attribution analytics.',
        category: 'Digital Marketing',
        mediaType: 'image',
        fileUrl: 'assets/images/mfg-hero-dark.png',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        id: 'media_104',
        title: 'Automated Academic Research & Office Pipeline',
        caption: 'End-to-end data synthesis, automated report compilation, and institutional data transformation system.',
        category: 'Academic / Office Solutions',
        mediaType: 'image',
        fileUrl: 'assets/images/mfg-logo.png',
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
      }
    ];

    if (category && category !== 'All') {
      return list.filter(m => m.category === category);
    }
    return list;
  }
};
