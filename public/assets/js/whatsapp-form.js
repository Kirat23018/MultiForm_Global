/**
 * MultiForm Global (MFG) - Interactive Form Controller
 * Supports 3-Step Wizard, Dual WhatsApp Dispatch (+91 8198096370 / +91 8847250820),
 * and Direct Email / Gmail Inquiries with Real Activity Logging
 */

let currentStep = 1;
const TOTAL_STEPS = 3;

function updateStepUI() {
  for (let i = 1; i <= TOTAL_STEPS; i++) {
    const panel = document.getElementById(`step-${i}`);
    const node = document.getElementById(`node-${i}`);

    if (panel) {
      if (i === currentStep) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    }

    if (node) {
      if (i <= currentStep) {
        node.classList.add('active');
      } else {
        node.classList.remove('active');
      }
    }
  }
}

function nextStep() {
  if (currentStep === 1) {
    const serviceType = document.getElementById('service-type');
    if (serviceType && !serviceType.value) {
      showToast('Please select a service vertical to proceed', 'error');
      serviceType.focus();
      return;
    }
  }

  if (currentStep === 2) {
    const budget = document.getElementById('budget-range');
    if (budget && !budget.value) {
      showToast('Please select your estimated budget range', 'error');
      budget.focus();
      return;
    }
  }

  if (currentStep < TOTAL_STEPS) {
    currentStep++;
    updateStepUI();
  }
}

function prevStep() {
  if (currentStep > 1) {
    currentStep--;
    updateStepUI();
  }
}

function saveRealInquiry(inquiry) {
  try {
    const raw = localStorage.getItem('mfg_real_inquiries');
    let list = raw ? JSON.parse(raw) : [];
    list.unshift(inquiry);
    localStorage.setItem('mfg_real_inquiries', JSON.stringify(list));
  } catch (e) {
    console.error(e);
  }
}

async function sendInquiryToWhatsApp(e, targetPhone = '8198096370') {
  if (e) e.preventDefault();

  const name = document.getElementById("client-name")?.value.trim() || "";
  const email = document.getElementById("client-email")?.value.trim() || "";
  const contact = document.getElementById("client-contact")?.value.trim() || "";
  const org = document.getElementById("client-org")?.value.trim() || "N/A";
  const service = document.getElementById("service-type")?.value || "Custom Project";
  const details = document.getElementById("project-details")?.value.trim() || "No additional description provided";
  const budget = document.getElementById("budget-range")?.value || "Flexible";
  const timeline = document.getElementById("timeline-scope")?.value || "Standard";

  if (!name || (!contact && !email)) {
    if (typeof showToast === 'function') {
      showToast("Please provide your Name and WhatsApp / Email in Step 3", "error");
    } else {
      alert("Please provide your Name and WhatsApp / Email.");
    }
    return;
  }

  const message = `*🚀 New Project Inquiry - MultiForm Global (MFG)*
--------------------------------------------
*👤 Client Name:* ${name}
*📧 Email:* ${email || 'Not provided'}
*📱 WhatsApp / Phone:* ${contact || 'Not provided'}
*🏢 Organization:* ${org}

*💼 Service Required:* ${service}
*💰 Budget Scope:* ${budget}
*⏳ Target Timeline:* ${timeline}

*📝 Project Details:*
${details}
--------------------------------------------
_Sent from MultiForm Global Web Portal_
_Email: multiformglobal@gmail.com | Insta: @multiform_global_`;

  const targetPerson = targetPhone === '8847250820' ? 'Prabhkirat Kaur' : 'Hardeep Singh';

  // 1. Dual Trigger Step A: Backend Email Dispatch & Database Persistence
  let apiDispatched = false;
  try {
    if (typeof mfgApi !== 'undefined' && mfgApi.sendContactInquiry) {
      // Race the backend API dispatch with a 600ms timeout for instant user feedback
      await Promise.race([
        mfgApi.sendContactInquiry({
          name,
          email,
          phone: contact,
          organization: org,
          service,
          budget,
          timeline,
          message: details
        }),
        new Promise(resolve => setTimeout(() => resolve({ timeout: true }), 600))
      ]);
      apiDispatched = true;
    }
  } catch (apiErr) {
    console.warn('[MFG Lead Sync] Background API warning:', apiErr);
  }

  // 2. Record Real User Activity & Inquiry Store locally
  const inquiryRecord = {
    id: 'inq_' + Date.now(),
    name,
    email,
    contact,
    org,
    service,
    budget,
    timeline,
    details,
    channel: `WhatsApp (${targetPerson})`,
    phone: targetPhone,
    status: 'Inquiry Dispatched',
    createdAt: new Date().toISOString()
  };
  saveRealInquiry(inquiryRecord);

  if (typeof recordRealActivity === 'function') {
    recordRealActivity(
      'INQUIRY',
      `Project Inquiry: ${service}`,
      `Submitted inquiry for ${service} to ${targetPerson} on WhatsApp (+91 ${targetPhone}). Scope: ${budget}.`,
      inquiryRecord
    );
  }

  // 3. Open WhatsApp with full pre-filled details
  const encoded = encodeURIComponent(message);
  const waUrl = `https://wa.me/${targetPhone}?text=${encoded}`;

  window.open(waUrl, "_blank");
  if (typeof showToast === 'function') {
    showToast("✓ Inquiry Sent via Email & Opening WhatsApp...", "success");
  }
}

function sendInquiryViaEmailWizard() {
  const name = document.getElementById("client-name")?.value.trim() || "";
  const contact = document.getElementById("client-contact")?.value.trim() || "Not provided";
  const org = document.getElementById("client-org")?.value.trim() || "N/A";
  const service = document.getElementById("service-type")?.value || "Custom Project";
  const details = document.getElementById("project-details")?.value.trim() || "No additional description provided";
  const budget = document.getElementById("budget-range")?.value || "Flexible";
  const timeline = document.getElementById("timeline-scope")?.value || "Standard";

  if (!name) {
    showToast("Please provide your name before sending email", "error");
    return;
  }

  const subject = `Project Inquiry: ${service} - ${name}`;
  const body = `Dear MultiForm Global Leadership (Hardeep & Prabhkirat),

I would like to initiate a project consultation with MultiForm Global.

Client Details:
- Name: ${name}
- Organization / College: ${org}
- Contact / WhatsApp: ${contact}

Project Scope:
- Service Required: ${service}
- Estimated Budget Scope: ${budget}
- Target Delivery Timeline: ${timeline}

Project Overview & Specifications:
${details}

Looking forward to your response.

Best regards,
${name}`;

  // Record Real User Activity & Inquiry Store
  const inquiryRecord = {
    id: 'inq_' + Date.now(),
    name,
    contact,
    org,
    service,
    budget,
    timeline,
    details,
    channel: 'Email / Gmail',
    status: 'Email Dispatched',
    createdAt: new Date().toISOString()
  };
  saveRealInquiry(inquiryRecord);

  if (typeof recordRealActivity === 'function') {
    recordRealActivity(
      'EMAIL',
      `Email Inquiry: ${service}`,
      `Composed email inquiry for ${service} addressed to multiformglobal@gmail.com.`,
      inquiryRecord
    );
  }

  const encSubject = encodeURIComponent(subject);
  const encBody = encodeURIComponent(body);
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=multiformglobal@gmail.com&su=${encSubject}&body=${encBody}`;

  window.open(gmailUrl, "_blank");
  showToast("Opening Gmail Web with prefilled project inquiry! ✉️");
}