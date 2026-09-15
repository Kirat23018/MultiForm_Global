/**
 * MultiForm Global (MFG) - Main JavaScript Engine
 * Theme Manager, Authentication System, Dual QR Modal, and Email Dispatcher
 */

// ==========================================
// 1. THEME MANAGEMENT SYSTEM (Light, Dark, System)
// ==========================================
const THEME_STORAGE_KEY = 'mfg-theme-preference';

function getStoredTheme() {
  return localStorage.getItem(THEME_STORAGE_KEY) || 'system';
}

function applyTheme(theme) {
  const root = document.documentElement;
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (theme === 'dark' || (theme === 'system' && systemPrefersDark)) {
    root.setAttribute('data-theme', 'dark');
  } else {
    root.removeAttribute('data-theme');
  }

  updateThemeUI(theme);
}

function setTheme(theme) {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  applyTheme(theme);
  
  const dropdown = document.getElementById('theme-dropdown');
  if (dropdown) dropdown.classList.remove('show');

  const themeName = theme.charAt(0).toUpperCase() + theme.slice(1);
  showToast(`Theme switched to ${themeName} Mode 🎨`);
}

function updateThemeUI(currentTheme) {
  const currentIcon = document.getElementById('theme-active-icon');
  if (currentIcon) {
    if (currentTheme === 'dark') {
      currentIcon.textContent = '🌙';
    } else if (currentTheme === 'light') {
      currentIcon.textContent = '☀️';
    } else {
      currentIcon.textContent = '💻';
    }
  }

  document.querySelectorAll('.theme-option-btn').forEach(btn => {
    const btnTheme = btn.getAttribute('data-theme-value');
    if (btnTheme === currentTheme) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function toggleThemeDropdown(e) {
  if (e) e.stopPropagation();
  const dropdown = document.getElementById('theme-dropdown');
  if (dropdown) {
    dropdown.classList.toggle('show');
  }
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (getStoredTheme() === 'system') {
    applyTheme('system');
  }
});

// ==========================================
// 2. AUTHENTICATION SYSTEM
// ==========================================
const USER_STORAGE_KEY = 'mfg_authenticated_user';

function checkAuthSession() {
  const userJson = localStorage.getItem(USER_STORAGE_KEY);
  const authNavBtn = document.getElementById('nav-auth-btn');
  const userProfileBadge = document.getElementById('user-profile-badge');
  const userAvatar = document.getElementById('nav-user-avatar');
  const userNameLabel = document.getElementById('nav-user-name');

  if (userJson) {
    try {
      const user = JSON.parse(userJson);
      if (authNavBtn) authNavBtn.style.display = 'none';
      if (userProfileBadge) {
        userProfileBadge.style.display = 'flex';
        if (userNameLabel) userNameLabel.textContent = user.name.split(' ')[0];
        if (userAvatar) userAvatar.textContent = user.initials || user.name.charAt(0).toUpperCase();
      }
    } catch (e) {
      console.error("Auth parse error", e);
    }
  } else {
    if (authNavBtn) authNavBtn.style.display = 'inline-flex';
    if (userProfileBadge) userProfileBadge.style.display = 'none';
  }
}

function openAuthModal(defaultTab = 'login') {
  const modal = document.getElementById('auth-modal-overlay');
  if (!modal) return;
  switchAuthTab(defaultTab);
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeAuthModal() {
  const modal = document.getElementById('auth-modal-overlay');
  if (!modal) return;
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

function switchAuthTab(tab) {
  const loginTabBtn = document.getElementById('tab-login-btn');
  const registerTabBtn = document.getElementById('tab-register-btn');
  const loginForm = document.getElementById('auth-login-form');
  const registerForm = document.getElementById('auth-register-form');
  const phoneForm = document.getElementById('auth-phone-form');
  const modalTitle = document.getElementById('auth-modal-title');
  const modalSubtitle = document.getElementById('auth-modal-subtitle');

  if (phoneForm) phoneForm.style.display = 'none';

  if (tab === 'login') {
    if (loginTabBtn) loginTabBtn.classList.add('active');
    if (registerTabBtn) registerTabBtn.classList.remove('active');
    if (loginForm) loginForm.style.display = 'block';
    if (registerForm) registerForm.style.display = 'none';
    if (modalTitle) modalTitle.textContent = 'Welcome Back';
    if (modalSubtitle) modalSubtitle.textContent = 'Access your MultiForm Global project dashboard';
  } else if (tab === 'register') {
    if (registerTabBtn) registerTabBtn.classList.add('active');
    if (loginTabBtn) loginTabBtn.classList.remove('active');
    if (loginForm) loginForm.style.display = 'none';
    if (registerForm) registerForm.style.display = 'block';
    if (modalTitle) modalTitle.textContent = 'Create an Account';
    if (modalSubtitle) modalSubtitle.textContent = 'Start your journey with MultiForm Global today';
  }
}

function showPhoneAuth() {
  const loginForm = document.getElementById('auth-login-form');
  const registerForm = document.getElementById('auth-register-form');
  const phoneForm = document.getElementById('auth-phone-form');
  const modalTitle = document.getElementById('auth-modal-title');
  const modalSubtitle = document.getElementById('auth-modal-subtitle');

  if (loginForm) loginForm.style.display = 'none';
  if (registerForm) registerForm.style.display = 'none';
  if (phoneForm) phoneForm.style.display = 'block';
  if (modalTitle) modalTitle.textContent = 'Phone / WhatsApp Login';
  if (modalSubtitle) modalSubtitle.textContent = 'Enter your mobile number to receive a secure OTP';
}

function handleSocialAuth(provider) {
  let userName = provider === 'google' ? 'Google User' : 'Apple Member';
  let userEmail = provider === 'google' ? 'google.user@gmail.com' : 'apple.id@icloud.com';
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase();
  const user = { name: userName, email: userEmail, initials, provider, loginTime: new Date().toISOString() };

  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  checkAuthSession();
  closeAuthModal();
  showToast(`Signed in successfully via ${provider.toUpperCase()}! 🎉`);
  
  if (window.location.pathname.includes('auth.html')) {
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 600);
  }
}

function handleEmailLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-password').value;

  if (!email || !pass) {
    showToast('Please enter your email and password', 'error');
    return;
  }

  const namePart = email.split('@')[0];
  const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
  const initials = formattedName.substring(0, 2).toUpperCase();

  const user = { name: formattedName, email: email, initials, provider: 'email', loginTime: new Date().toISOString() };
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  checkAuthSession();
  closeAuthModal();
  showToast(`Welcome back, ${formattedName}! Redirecting to Dashboard 🚀`);

  setTimeout(() => {
    window.location.href = 'dashboard.html';
  }, 700);
}

function handleEmailRegister(e) {
  e.preventDefault();
  const name = document.getElementById('register-name').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const pass = document.getElementById('register-password').value;

  if (!name || !email || !pass) {
    showToast('Please fill in all registration fields', 'error');
    return;
  }

  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  const user = { name, email, initials, provider: 'email', loginTime: new Date().toISOString() };
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  checkAuthSession();
  closeAuthModal();
  showToast(`Account created for ${name}! Welcome to Dashboard 🌟`);

  setTimeout(() => {
    window.location.href = 'dashboard.html';
  }, 700);
}

function handlePhoneOtpSubmit(e) {
  e.preventDefault();
  const phone = document.getElementById('phone-number-input').value.trim();
  const otp = document.getElementById('phone-otp-input').value.trim();

  if (!phone) {
    showToast('Please enter a valid phone number', 'error');
    return;
  }

  if (document.getElementById('otp-group').style.display === 'none') {
    document.getElementById('otp-group').style.display = 'block';
    document.getElementById('phone-submit-btn').textContent = 'Verify OTP & Continue';
    showToast(`OTP sent to ${phone} (Use 1234 to verify) 📲`);
    return;
  }

  if (otp === '1234' || otp.length === 4) {
    const user = { name: `Client (${phone.slice(-4)})`, email: `${phone}@mfg.client`, initials: 'PH', provider: 'phone', phone };
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    checkAuthSession();
    closeAuthModal();
    showToast('Phone verified! Opening Dashboard 🎉');
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 700);
  } else {
    showToast('Invalid OTP! Please enter 1234', 'error');
  }
}

function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '👁️‍🗨️';
  } else {
    input.type = 'password';
    btn.textContent = '👁️';
  }
}

function handleLogout() {
  localStorage.removeItem(USER_STORAGE_KEY);
  checkAuthSession();
  const userMenu = document.getElementById('user-menu-dropdown');
  if (userMenu) userMenu.classList.remove('show');
  showToast('You have signed out successfully 👋');
}

function toggleUserMenu(e) {
  if (e) e.stopPropagation();
  const userMenu = document.getElementById('user-menu-dropdown');
  if (userMenu) {
    userMenu.classList.toggle('show');
  }
}

// ==========================================
// 3. DUAL WHATSAPP QR MODAL CONTROLLER
// ==========================================
function openQRModal(selectedLine = '1') {
  const modal = document.getElementById('qr-modal-overlay');
  if (modal) {
    switchQRTab(selectedLine);
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeQRModal() {
  const modal = document.getElementById('qr-modal-overlay');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function switchQRTab(line) {
  const tab1 = document.getElementById('qr-tab-1');
  const tab2 = document.getElementById('qr-tab-2');
  const img = document.getElementById('modal-qr-image');
  const numberText = document.getElementById('modal-qr-number');
  const chatBtn = document.getElementById('modal-qr-chat-btn');

  if (line === '1' || line === '8198096370') {
    if (tab1) tab1.classList.add('active');
    if (tab2) tab2.classList.remove('active');
    if (img) img.src = 'assets/images/whatsapp-qr-8198096370.png';
    if (numberText) numberText.innerHTML = 'Line 1: <strong style="color: var(--accent-green);">+91 8198096370</strong> (Hardeep Singh)';
    if (chatBtn) {
      chatBtn.href = 'https://wa.me/8198096370?text=Hi%20MultiForm%20Global,%20I%20am%20connecting%20via%20QR%20Code';
      chatBtn.textContent = '💬 Chat on +91 8198096370';
    }
  } else {
    if (tab2) tab2.classList.add('active');
    if (tab1) tab1.classList.remove('active');
    if (img) img.src = 'assets/images/whatsapp-qr-8847250820.png';
    if (numberText) numberText.innerHTML = 'Line 2: <strong style="color: var(--accent-green);">+91 8847250820</strong> (Prabhkirat Kaur)';
    if (chatBtn) {
      chatBtn.href = 'https://wa.me/8847250820?text=Hi%20MultiForm%20Global,%20I%20am%20connecting%20via%20QR%20Code';
      chatBtn.textContent = '💬 Chat on +91 8847250820';
    }
  }
}

// ==========================================
// 4. EMAIL INTEGRATION & HELPERS
// ==========================================
const OFFICIAL_EMAIL = 'multiformglobal@gmail.com';

function copyEmailAddress(e) {
  if (e) e.preventDefault();
  navigator.clipboard.writeText(OFFICIAL_EMAIL).then(() => {
    showToast(`Copied ${OFFICIAL_EMAIL} to clipboard! 📋`);
  }).catch(() => {
    showToast(`Email: ${OFFICIAL_EMAIL}`, 'info');
  });
}

function composeEmail(subject = 'Project Inquiry - MultiForm Global', body = 'Hi MultiForm Global,\n\nI want to discuss a project requirement:\n\n') {
  const encSubject = encodeURIComponent(subject);
  const encBody = encodeURIComponent(body);
  
  // Try opening mailto, and offer webmail options
  const mailtoUrl = `mailto:${OFFICIAL_EMAIL}?subject=${encSubject}&body=${encBody}`;
  const gmailWebUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${OFFICIAL_EMAIL}&su=${encSubject}&body=${encBody}`;

  // Check if mobile or desktop and open
  window.open(mailtoUrl, '_self');
  
  setTimeout(() => {
    showToast(`Opening Email to ${OFFICIAL_EMAIL} ✉️`);
  }, 300);
}

function openGmailDirect(subject = 'Project Inquiry - MultiForm Global', body = '') {
  const encSubject = encodeURIComponent(subject);
  const encBody = encodeURIComponent(body);
  const gmailWebUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${OFFICIAL_EMAIL}&su=${encSubject}&body=${encBody}`;
  window.open(gmailWebUrl, '_blank');
  showToast(`Opening Gmail Web addressed to ${OFFICIAL_EMAIL} ✉️`);
}

function sendInquiryViaEmail() {
  const service = document.getElementById("service-type")?.value || "General Project Inquiry";
  const details = document.getElementById("project-details")?.value || "No additional notes provided";
  const budget = document.getElementById("budget-range")?.value || "To Be Discussed";
  const timeline = document.getElementById("timeline-scope")?.value || "Flexible";
  const clientName = document.getElementById("client-name")?.value.trim() || "Prospective Client";
  const clientContact = document.getElementById("client-contact")?.value.trim() || "Not provided";
  const organization = document.getElementById("client-org")?.value.trim() || "N/A";

  const subject = `New Project Inquiry: ${service} - ${clientName}`;
  const body = `Dear MultiForm Global Team,\n\nI would like to discuss a project with your team.\n\nHere are my details:\n- Name: ${clientName}\n- Organization/College: ${organization}\n- Contact Number: ${clientContact}\n- Service Vertical: ${service}\n- Estimated Budget Scope: ${budget}\n- Target Timeline: ${timeline}\n\nProject Scope & Requirements:\n${details}\n\nLooking forward to hearing from you.\n\nBest regards,\n${clientName}`;

  openGmailDirect(subject, body);
}

// ==========================================
// 5. TOAST NOTIFICATION HELPER
// ==========================================
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast-msg';
  toast.innerHTML = `<span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'all 0.3s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ==========================================
// 6. REAL USER ACTIVITY TRACKING ENGINE
// ==========================================
const REAL_ACTIVITIES_KEY = 'mfg_real_user_activities';

function recordRealActivity(type, title, description, meta = {}) {
  try {
    const raw = localStorage.getItem(REAL_ACTIVITIES_KEY);
    let activities = raw ? JSON.parse(raw) : [];

    const now = new Date();
    const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' on ' + now.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });

    const newActivity = {
      id: 'act_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      type: type || 'GENERAL',
      title: title || 'User Activity',
      description: description || '',
      timestamp: now.toISOString(),
      displayTime: formattedTime,
      meta: meta
    };

    // Prepend new activity (newest first)
    activities.unshift(newActivity);

    // Keep last 100 activities
    if (activities.length > 100) activities = activities.slice(0, 100);

    localStorage.setItem(REAL_ACTIVITIES_KEY, JSON.stringify(activities));
  } catch (err) {
    console.error('Error logging real activity:', err);
  }
}

function getRealActivities() {
  try {
    const raw = localStorage.getItem(REAL_ACTIVITIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

// Track WhatsApp Clicks as Real Activities
function trackWhatsAppClick(phone, personName = '') {
  const label = personName ? `${personName} (+91 ${phone})` : `+91 ${phone}`;
  recordRealActivity('WHATSAPP', 'WhatsApp Direct Connect Initiated', `Clicked to start WhatsApp chat with ${label}`, { phone, personName });
}

// Track Email Clicks as Real Activities
function trackEmailClick(action = 'Email Composed') {
  recordRealActivity('EMAIL', 'Email Communication Initiated', `Opened email composer addressed to multiformglobal@gmail.com (${action})`, { email: 'multiformglobal@gmail.com' });
}

// Expose globally
window.recordRealActivity = recordRealActivity;
window.getRealActivities = getRealActivities;
window.trackWhatsAppClick = trackWhatsAppClick;
window.trackEmailClick = trackEmailClick;

// ==========================================
// 7. MOBILE MENU & GLOBAL LISTENERS
// ==========================================
function toggleMobileMenu() {
  const navMenu = document.querySelector('.nav-menu');
  if (navMenu) {
    navMenu.classList.toggle('show');
    const toggleBtn = document.querySelector('.mobile-nav-toggle');
    if (toggleBtn) {
      toggleBtn.setAttribute('aria-expanded', navMenu.classList.contains('show'));
    }
  }
}

function handleNewsletterSubmit(e) {
  e.preventDefault();
  const emailInput = e.target.querySelector('input[type="email"]');
  if (emailInput && emailInput.value) {
    recordRealActivity('NEWSLETTER', 'Newsletter Subscribed', `Subscribed email ${emailInput.value} to MFG updates`);
    showToast(`Subscribed ${emailInput.value} to MFG Intelligence 🚀`);
    emailInput.value = '';
  }
}

document.addEventListener('click', (e) => {
  const themeDropdown = document.getElementById('theme-dropdown');
  if (themeDropdown && !e.target.closest('.theme-selector')) {
    themeDropdown.classList.remove('show');
  }

  const userMenu = document.getElementById('user-menu-dropdown');
  if (userMenu && !e.target.closest('.user-profile-badge')) {
    userMenu.classList.remove('show');
  }

  // Close mobile nav when clicking outside or clicking a nav link
  const navMenu = document.querySelector('.nav-menu');
  const toggleBtn = document.querySelector('.mobile-nav-toggle');
  if (navMenu && navMenu.classList.contains('show')) {
    if (e.target.closest('.nav-link') || (!navMenu.contains(e.target) && (!toggleBtn || !toggleBtn.contains(e.target)))) {
      navMenu.classList.remove('show');
    }
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeAuthModal();
    closeQRModal();
    const navMenu = document.querySelector('.nav-menu');
    if (navMenu) navMenu.classList.remove('show');
  }
});

document.addEventListener('DOMContentLoaded', () => {
  applyTheme(getStoredTheme());
  checkAuthSession();
  initScrollReveal();
});

// ==========================================
// 8. LUXURY SCROLL REVEAL & MICRO-ANIMATIONS
// ==========================================
function initScrollReveal() {
  const elementsToReveal = document.querySelectorAll('.reveal-on-scroll, .card, .founder-card, .gallery-card, .service-vertical-card');
  
  if (!('IntersectionObserver' in window)) {
    elementsToReveal.forEach(el => el.classList.add('is-revealed'));
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry, idx) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('is-revealed');
        }, idx * 60);
        obs.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  elementsToReveal.forEach(el => {
    el.classList.add('reveal-on-scroll');
    observer.observe(el);
  });
}

