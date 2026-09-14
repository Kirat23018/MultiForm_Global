/**
 * MultiForm Global (MFG) - Dynamic Portfolio Gallery & Discreet Owner Uploader
 * Renders luxury media gallery with video player, lightbox, category filters, and owner upload controls.
 */

let currentPortfolioCategory = 'All';
let loadedMediaItems = [];

document.addEventListener('DOMContentLoaded', () => {
  initOwnerStatusUI();
  loadPortfolioMedia();
  setupUploadDropzone();
});

let loadedInquiries = [];

// 1. Check and Render Owner Floating Controls if Logged In
function initOwnerStatusUI() {
  const isOwner = mfgApi.isOwnerLoggedIn();
  const ownerBar = document.getElementById('owner-floating-bar');
  const ownerNavBadge = document.getElementById('owner-nav-badge');

  if (isOwner) {
    if (ownerBar) ownerBar.style.display = 'flex';
    if (ownerNavBadge) {
      ownerNavBadge.style.display = 'inline-flex';
      ownerNavBadge.style.cursor = 'pointer';
      ownerNavBadge.onclick = openInquiriesModal;
    }
    loadInquiries(false);
  } else {
    if (ownerBar) ownerBar.style.display = 'none';
    if (ownerNavBadge) ownerNavBadge.style.display = 'none';
  }
}

// 2. Fetch and Render Gallery
async function loadPortfolioMedia(showLoading = true) {
  const grid = document.getElementById('portfolio-gallery-grid');
  if (!grid) return;

  if (showLoading && loadedMediaItems.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
        <div style="font-size: 2.2rem; margin-bottom: 0.5rem; animation: spin 2s linear infinite;">⏳</div>
        <p style="font-size: 1rem;">Curating luxury showcase deliveries...</p>
      </div>
    `;
  }

  try {
    const res = await mfgApi.getMedia(currentPortfolioCategory);
    if (res.success) {
      loadedMediaItems = res.media || [];
      renderGalleryItems(loadedMediaItems);
    }
  } catch (err) {
    console.error('Portfolio load error:', err);
  }
}

function renderGalleryItems(items) {
  const grid = document.getElementById('portfolio-gallery-grid');
  if (!grid) return;

  if (!items || items.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; background: var(--bg-surface); border: 1px dashed var(--border-color); border-radius: var(--radius-lg);">
        <div style="font-size: 3rem; margin-bottom: 0.75rem;">🎨</div>
        <h3 style="font-size: 1.3rem; margin-bottom: 0.35rem;">No Works in this Category Yet</h3>
        <p style="color: var(--text-secondary); max-width: 420px; margin: 0 auto 1.5rem auto;">
          MultiForm Global is continuously shipping new digital products. Check back soon or select another category.
        </p>
        <button type="button" class="btn btn-outline" onclick="filterPortfolio('All', document.querySelector('.portfolio-tab-btn[data-category=\\'All\\']'))">
          View All Works
        </button>
      </div>
    `;
    return;
  }

  const isOwner = mfgApi.isOwnerLoggedIn();

  grid.innerHTML = items.map((item, index) => {
    const isVideo = item.mediaType === 'video' || (item.fileUrl && item.fileUrl.match(/\.(mp4|webm|mov|ogg)$/i));
    
    // Category label formatting
    const categoryIcons = {
      'Web Development': '💻',
      'Graphic Design': '🎨',
      'Digital Marketing': '📈',
      'Academic / Office Solutions': '📄'
    };
    const catIcon = categoryIcons[item.category] || '⚡';

    // Delete button (visible only for owner)
    const deleteBtn = isOwner ? `
      <button type="button" class="media-delete-btn" onclick="deletePortfolioItem(event, '${item.id}')" title="Delete work as owner">
        🗑️
      </button>
    ` : '';

    return `
      <div class="gallery-card" onclick="openLightbox(${index})" data-category="${escapeHtml(item.category)}">
        
        <!-- Media Frame -->
        <div class="gallery-media-wrap">
          ${isVideo ? `
            <video src="${item.fileUrl}" preload="metadata" muted playsinline></video>
            <div class="video-play-badge">▶ Video</div>
          ` : `
            <img src="${item.fileUrl}" alt="${escapeHtml(item.title)}" loading="lazy" onerror="this.onerror=null; this.src='assets/images/mfg-hero-dark.png';">
          `}
          
          <span class="gallery-cat-badge">
            <span>${catIcon}</span> ${escapeHtml(item.category)}
          </span>

          ${deleteBtn}
        </div>

        <!-- Content Info -->
        <div class="gallery-card-info">
          <div class="gallery-date">${formatRelativeTime(item.createdAt)}</div>
          <h3 class="gallery-card-title">${escapeHtml(item.title)}</h3>
          ${item.caption ? `<p class="gallery-card-caption">${escapeHtml(item.caption)}</p>` : ''}
        </div>

      </div>
    `;
  }).join('');
}

// 3. Category Filter
function filterPortfolio(category, btn) {
  currentPortfolioCategory = category;
  document.querySelectorAll('.portfolio-tab-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  loadPortfolioMedia(true);
}

// 4. Lightbox Full-Screen Viewer
let currentLightboxIndex = 0;

function openLightbox(index) {
  currentLightboxIndex = index;
  const item = loadedMediaItems[index];
  if (!item) return;

  const modal = document.getElementById('lightbox-modal');
  const mediaContainer = document.getElementById('lightbox-media-container');
  const titleElem = document.getElementById('lightbox-title');
  const captionElem = document.getElementById('lightbox-caption');
  const categoryElem = document.getElementById('lightbox-category');
  const dateElem = document.getElementById('lightbox-date');

  const isVideo = item.mediaType === 'video' || (item.fileUrl && item.fileUrl.match(/\.(mp4|webm|mov|ogg)$/i));

  if (mediaContainer) {
    if (isVideo) {
      mediaContainer.innerHTML = `
        <video src="${item.fileUrl}" controls autoplay style="max-width: 100%; max-height: 70vh; border-radius: 8px;"></video>
      `;
    } else {
      mediaContainer.innerHTML = `
        <img src="${item.fileUrl}" alt="${escapeHtml(item.title)}" style="max-width: 100%; max-height: 70vh; object-fit: contain; border-radius: 8px;">
      `;
    }
  }

  if (titleElem) titleElem.textContent = item.title;
  if (captionElem) captionElem.textContent = item.caption || '';
  if (categoryElem) categoryElem.textContent = item.category;
  if (dateElem) dateElem.textContent = formatRelativeTime(item.createdAt);

  if (modal) modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const modal = document.getElementById('lightbox-modal');
  if (modal) {
    modal.classList.remove('active');
    const mediaContainer = document.getElementById('lightbox-media-container');
    if (mediaContainer) mediaContainer.innerHTML = '';
  }
  document.body.style.overflow = '';
}

function prevLightbox() {
  if (loadedMediaItems.length === 0) return;
  currentLightboxIndex = (currentLightboxIndex - 1 + loadedMediaItems.length) % loadedMediaItems.length;
  openLightbox(currentLightboxIndex);
}

function nextLightbox() {
  if (loadedMediaItems.length === 0) return;
  currentLightboxIndex = (currentLightboxIndex + 1) % loadedMediaItems.length;
  openLightbox(currentLightboxIndex);
}

// 5. Owner Upload Modal & Actions
function openUploadModal() {
  const modal = document.getElementById('owner-upload-modal');
  if (modal) modal.classList.add('active');
}

function closeUploadModal() {
  const modal = document.getElementById('owner-upload-modal');
  if (modal) modal.classList.remove('active');
  const form = document.getElementById('owner-upload-form');
  if (form) form.reset();
  const preview = document.getElementById('upload-preview-container');
  if (preview) preview.innerHTML = '';
}

function setupUploadDropzone() {
  const dropzone = document.getElementById('upload-dropzone');
  const fileInput = document.getElementById('media-file-input');
  if (!dropzone || !fileInput) return;

  dropzone.addEventListener('click', () => fileInput.click());

  ['dragenter', 'dragover'].forEach(name => {
    dropzone.addEventListener(name, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(name => {
    dropzone.addEventListener(name, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      fileInput.files = files;
      handleFilePreview(files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilePreview(e.target.files[0]);
    }
  });
}

function handleFilePreview(file) {
  const container = document.getElementById('upload-preview-container');
  if (!container) return;

  const isVideo = file.type.startsWith('video/');
  const url = URL.createObjectURL(file);

  if (isVideo) {
    container.innerHTML = `
      <div style="margin-top: 1rem; border-radius: 8px; overflow: hidden; background: #000; text-align: center;">
        <video src="${url}" controls style="max-height: 180px; max-width: 100%;"></video>
        <div style="padding: 0.4rem; font-size: 0.75rem; color: var(--gold); font-weight: 600;">🎬 Video Selected: ${escapeHtml(file.name)}</div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div style="margin-top: 1rem; border-radius: 8px; overflow: hidden; text-align: center;">
        <img src="${url}" alt="Preview" style="max-height: 180px; max-width: 100%; object-fit: contain; border-radius: 6px;">
        <div style="padding: 0.4rem; font-size: 0.75rem; color: var(--gold); font-weight: 600;">🖼️ Image Selected: ${escapeHtml(file.name)}</div>
      </div>
    `;
  }
}

async function handleOwnerUploadSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const submitBtn = document.getElementById('btn-publish-media');
  const originalHtml = submitBtn.innerHTML;

  const fileInput = document.getElementById('media-file-input');
  if (!fileInput.files || fileInput.files.length === 0) {
    alert('Please select an image or video file to upload.');
    return;
  }

  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>⏳</span> Uploading to Showcase...';

    const formData = new FormData();
    formData.append('mediaFile', fileInput.files[0]);
    formData.append('title', form.title.value.trim());
    formData.append('category', form.category.value);
    formData.append('caption', form.caption.value.trim());

    const res = await mfgApi.uploadMedia(formData);
    if (res.success) {
      if (typeof showToast === 'function') {
        showToast('✨ Media successfully published to live portfolio!');
      } else {
        alert('Media successfully published!');
      }
      closeUploadModal();
      loadPortfolioMedia(true);
    } else {
      alert('Error: ' + (res.message || 'Upload failed'));
    }
  } catch (err) {
    console.error('Upload error:', err);
    alert('Upload failed: ' + err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalHtml;
  }
}

// 6. Owner Delete Item
async function deletePortfolioItem(event, mediaId) {
  event.stopPropagation(); // prevent lightbox opening
  if (!confirm('Are you sure you want to permanently delete this work from the live showcase?')) {
    return;
  }

  try {
    const res = await mfgApi.deleteMedia(mediaId);
    if (res.success) {
      if (typeof showToast === 'function') {
        showToast('🗑️ Work item removed from showcase.');
      }
      loadPortfolioMedia(true);
    }
  } catch (err) {
    alert('Failed to delete media item: ' + err.message);
  }
}

function formatRelativeTime(isoString) {
  if (!isoString) return 'Recent';
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ==========================================
// 7. OWNER INQUIRIES VIEWER CONTROLLER
// ==========================================

function openInquiriesModal() {
  const modal = document.getElementById('owner-inquiries-modal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    loadInquiries(true);
  }
}

function closeInquiriesModal() {
  const modal = document.getElementById('owner-inquiries-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

async function loadInquiries(showLoading = false) {
  const container = document.getElementById('inquiries-list-container');
  const countBadge = document.getElementById('inquiry-count-badge');
  const modalBadge = document.getElementById('modal-inquiries-count-badge');

  if (showLoading && container) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
        <div style="font-size: 2rem; margin-bottom: 0.5rem; animation: spin 2s linear infinite;">⏳</div>
        <p>Loading real-time client inquiries...</p>
      </div>
    `;
  }

  try {
    const list = await mfgApi.getInquiries();
    loadedInquiries = Array.isArray(list) ? list : (list.inquiries || []);
    
    // Update badge count
    const totalCount = loadedInquiries.length;
    if (countBadge) countBadge.textContent = totalCount;
    if (modalBadge) modalBadge.textContent = `${totalCount} Lead${totalCount === 1 ? '' : 's'}`;

    renderInquiriesList(loadedInquiries);
  } catch (err) {
    console.error('Failed to load inquiries:', err);
    if (container) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem; background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; border-radius: 8px; color: #ef4444;">
          <strong>Error Loading Inquiries:</strong> ${escapeHtml(err.message)}
        </div>
      `;
    }
  }
}

function renderInquiriesList(items) {
  const container = document.getElementById('inquiries-list-container');
  if (!container) return;

  if (!items || items.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3.5rem 1rem; background: var(--bg-surface); border: 1px dashed var(--border-color); border-radius: var(--radius-md);">
        <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📭</div>
        <h3 style="font-size: 1.2rem; margin-bottom: 0.25rem;">No Inquiries Yet</h3>
        <p style="font-size: 0.88rem; color: var(--text-secondary); margin: 0;">When clients submit quote requests from the website, they will appear here instantly.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map((inq) => {
    const cleanPhone = (inq.phone || inq.contact || '').replace(/[^0-9]/g, '');
    const clientEmail = inq.email || '';
    const dateFormatted = inq.createdAt ? new Date(inq.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'Recently';

    return `
      <div class="inquiry-lead-card" style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1.25rem 1.5rem; position: relative; box-shadow: var(--shadow-sm); transition: border-color var(--transition-fast);">
        
        <!-- Header: Client & Time -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-weight: 800; font-size: 1.15rem; color: var(--text-primary);">${escapeHtml(inq.name)}</span>
              ${inq.organization ? `<span style="font-size: 0.8rem; color: var(--text-muted); background: var(--bg-body); padding: 2px 8px; border-radius: 4px; border: 1px solid var(--border-color);">🏢 ${escapeHtml(inq.organization)}</span>` : ''}
            </div>
            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">
              Received: <strong style="color: var(--gold);">${formatRelativeTime(inq.createdAt)}</strong> (${dateFormatted})
            </div>
          </div>
          
          <!-- Delete button -->
          <button type="button" class="btn btn-outline" onclick="deleteInquiryItem('${inq.id}')" style="padding: 0.25rem 0.6rem; font-size: 0.75rem; color: #ef4444; border-color: rgba(239, 68, 68, 0.4);" title="Delete inquiry">
            🗑️ Delete
          </button>
        </div>

        <!-- Scope & Badges Row -->
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem;">
          <span class="badge-gold" style="font-size: 0.75rem; padding: 3px 8px;">💼 ${escapeHtml(inq.service || 'General Project')}</span>
          <span style="font-size: 0.75rem; padding: 3px 8px; background: rgba(37, 211, 102, 0.1); border: 1px solid rgba(37, 211, 102, 0.3); border-radius: 4px; color: #4ade80; font-weight: 600;">💰 ${escapeHtml(inq.budget || 'Flexible')}</span>
          ${inq.timeline ? `<span style="font-size: 0.75rem; padding: 3px 8px; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 4px; color: #60a5fa; font-weight: 600;">⏳ ${escapeHtml(inq.timeline)}</span>` : ''}
        </div>

        <!-- Project Message Box -->
        <div style="background: var(--bg-body); border-left: 3px solid var(--gold); padding: 0.85rem 1rem; border-radius: 4px; font-size: 0.88rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 1rem; white-space: pre-wrap;">${escapeHtml(inq.message || inq.details || 'No message provided.')}</div>

        <!-- Direct Contact Action Buttons -->
        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center; padding-top: 0.5rem; border-top: 1px solid var(--border-color);">
          ${cleanPhone ? `
            <a href="https://wa.me/${cleanPhone}?text=Hi%20${encodeURIComponent(inq.name)},%20I%20am%20reaching%20out%20from%20MultiForm%20Global%20regarding%20your%20project%20inquiry." target="_blank" class="btn btn-whatsapp" style="padding: 0.4rem 0.85rem; font-size: 0.8rem; font-weight: 700; text-decoration: none;">
              <span>💬</span> Chat on WhatsApp (${escapeHtml(inq.phone || inq.contact)})
            </a>
          ` : ''}
          ${clientEmail ? `
            <a href="mailto:${encodeURIComponent(clientEmail)}?subject=Regarding%20Your%20Project%20Inquiry%20-%20MultiForm%20Global" class="btn btn-outline" style="padding: 0.4rem 0.85rem; font-size: 0.8rem; font-weight: 700; text-decoration: none;">
              <span>✉️</span> Email (${escapeHtml(clientEmail)})
            </a>
          ` : ''}
        </div>

      </div>
    `;
  }).join('');
}

function filterInquiriesList(query) {
  if (!query || !query.trim()) {
    renderInquiriesList(loadedInquiries);
    return;
  }
  const q = query.toLowerCase().trim();
  const filtered = loadedInquiries.filter(item => {
    return (item.name && item.name.toLowerCase().includes(q)) ||
           (item.email && item.email.toLowerCase().includes(q)) ||
           (item.phone && item.phone.toLowerCase().includes(q)) ||
           (item.service && item.service.toLowerCase().includes(q)) ||
           (item.organization && item.organization.toLowerCase().includes(q)) ||
           (item.message && item.message.toLowerCase().includes(q));
  });
  renderInquiriesList(filtered);
}

async function deleteInquiryItem(id) {
  if (!confirm('Are you sure you want to delete this lead record?')) {
    return;
  }

  try {
    const res = await mfgApi.deleteInquiry(id);
    if (res.success) {
      if (typeof showToast === 'function') {
        showToast('🗑️ Lead deleted from database.');
      }
      loadInquiries(false);
    }
  } catch (err) {
    alert('Failed to delete inquiry: ' + err.message);
  }
}
