/* ============================================================
   PocketDoc — script.js
   Nav, labs accordion, view toggles, lab interpreter
   ============================================================ */

// ── Nav: hamburger ──────────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

hamburger.addEventListener('click', () => {
  const isOpen = hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open', isOpen);
  hamburger.setAttribute('aria-expanded', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
});

// Close mobile menu when a link is clicked
document.querySelectorAll('.mobile-nav-link').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  });
});

// ── Nav: active link on scroll ───────────────────────────────
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id);
      });
    }
  });
}, { rootMargin: '-60px 0px -80% 0px' });

sections.forEach(section => observer.observe(section));

// ── Labs: accordion ──────────────────────────────────────────
document.querySelectorAll('.accordion-trigger').forEach(trigger => {
  trigger.addEventListener('click', () => {
    const panel = trigger.dataset.panel;
    const body = document.getElementById('body-' + panel);
    const isOpen = !body.hidden;

    // Close all panels
    document.querySelectorAll('.accordion-body').forEach(b => b.hidden = true);
    document.querySelectorAll('.accordion-trigger').forEach(t => {
      t.setAttribute('aria-expanded', 'false');
      t.classList.remove('open');
    });

    // Open clicked panel if it was closed
    if (!isOpen) {
      body.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      trigger.classList.add('open');
    }
  });
});

// ── Labs: Full Guide / For Your Doctor view toggle ───────────
document.querySelectorAll('.toggle-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.target;  // 'male' or 'female'
    const view = btn.dataset.view;      // 'full' or 'doctor'

    // Update button active states within this group
    const group = btn.closest('.toggle-btn-group');
    group.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Show/hide the correct view
    const fullView = document.getElementById(target + '-full');
    const doctorView = document.getElementById(target + '-doctor');

    if (view === 'full') {
      fullView.hidden = false;
      doctorView.hidden = true;
    } else {
      fullView.hidden = true;
      doctorView.hidden = false;
    }
  });
});

// ── Lab Interpreter: password gate ───────────────────────────
// NOTE: Password is hardcoded client-side — intentionally simple for a
// trusted-audience hobby site. Change SITE_PASSWORD to whatever you want.
const SITE_PASSWORD = 'markhyman';

const unlockBtn = document.getElementById('unlockBtn');
const accessPassword = document.getElementById('accessPassword');
const passwordError = document.getElementById('passwordError');
const interpreterGate = document.getElementById('interpreterGate');
const interpreterForm = document.getElementById('interpreterForm');

function tryUnlock() {
  if (accessPassword.value === SITE_PASSWORD) {
    interpreterGate.style.display = 'none';
    interpreterForm.classList.add('visible');
    passwordError.classList.remove('visible');
  } else {
    passwordError.classList.add('visible');
    accessPassword.value = '';
    accessPassword.focus();
  }
}

unlockBtn.addEventListener('click', tryUnlock);
accessPassword.addEventListener('keydown', e => {
  if (e.key === 'Enter') tryUnlock();
});

// ── Lab Interpreter: file upload ─────────────────────────────
const labFile = document.getElementById('labFile');
const uploadFilename = document.getElementById('uploadFilename');
const interpretBtn = document.getElementById('interpretBtn');
const uploadArea = document.getElementById('uploadArea');

labFile.addEventListener('change', () => {
  if (labFile.files[0]) {
    uploadFilename.textContent = '✓ ' + labFile.files[0].name;
    uploadFilename.classList.add('visible');
    interpretBtn.disabled = false;
  }
});

// Drag and drop styling
uploadArea.addEventListener('dragover', e => {
  e.preventDefault();
  uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', e => {
  e.preventDefault();
  uploadArea.classList.remove('drag-over');
  if (e.dataTransfer.files[0]?.type === 'application/pdf') {
    labFile.files = e.dataTransfer.files;
    uploadFilename.textContent = '✓ ' + e.dataTransfer.files[0].name;
    uploadFilename.classList.add('visible');
    interpretBtn.disabled = false;
  }
});

// ── Lab Interpreter: API call ─────────────────────────────────
// API key lives in Vercel environment variables — never in this file.
// The /api/interpret serverless function handles the Anthropic call.

const interpreterLoading = document.getElementById('interpreterLoading');
const interpreterResults = document.getElementById('interpreterResults');
const resultsGrid = document.getElementById('resultsGrid');
const urgentFlagsBlock = document.getElementById('urgentFlagsBlock');
const resultsFooter = document.getElementById('resultsFooter');
const resetBtn = document.getElementById('resetBtn');

interpretBtn.addEventListener('click', () => {
  if (!labFile.files[0]) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64 = e.target.result.split(',')[1];
    interpreterForm.classList.remove('visible');
    interpreterLoading.classList.add('visible');
    try {
      const response = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfBase64: base64 })
      });
      if (!response.ok) throw new Error('Request failed: ' + response.status);
      const result = await response.json();
      renderResults(result);
    } catch (err) {
      interpreterLoading.classList.remove('visible');
      interpreterForm.classList.add('visible');
      alert('Something went wrong. Please try again.\n\nError: ' + err.message);
    }
  };
  reader.readAsDataURL(labFile.files[0]);
});

function renderResults(result) {
  interpreterLoading.classList.remove('visible');

  // Urgent flags
  if (result.urgentFlags && result.urgentFlags.length > 0) {
    urgentFlagsBlock.style.display = 'block';
    urgentFlagsBlock.innerHTML = `
      <div class="urgent-flags">
        <h4>⚠ Urgent — Review with your doctor promptly</h4>
        <ul>
          ${result.urgentFlags.map(f => `<li>${escapeHtml(f)}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  // Marker cards — store marker data on the element for lazy explanation loading
  resultsGrid.innerHTML = result.markers.map((marker, i) => {
    const statusClass = marker.status === 'optimal' ? 'green'
      : marker.status === 'borderline' ? 'yellow' : 'red';
    const statusLabel = marker.status === 'optimal' ? 'Optimal'
      : marker.status === 'borderline' ? 'Borderline' : 'Flagged';

    return `
      <div class="result-card"
        data-status="${statusClass}"
        data-name="${escapeHtml(marker.name)}"
        data-value="${escapeHtml(marker.value)}"
        data-functional="${escapeHtml(marker.functionalRange)}"
        data-standard="${escapeHtml(marker.standardRange)}"
        data-markerstatus="${escapeHtml(marker.status)}">
        <div class="result-card-header" onclick="toggleResultCard(this.parentElement)">
          <div class="status-dot ${statusClass}"></div>
          <div class="result-name">${escapeHtml(marker.name)}</div>
          <div class="result-value ${statusClass}">${escapeHtml(marker.value)}</div>
          <div class="result-range">${escapeHtml(marker.functionalRange)}</div>
          <span class="status-badge ${statusClass}">${statusLabel}</span>
          <span class="accordion-arrow">▼</span>
        </div>
        <div class="result-card-body">
          <p style="margin-bottom:8px; font-size:13px; color: var(--text-muted);">
            Standard lab range: ${escapeHtml(marker.standardRange)}
          </p>
          <div class="explanation-slot" data-loaded="false">
            <p class="explanation-text" style="color: var(--text-muted); font-style: italic; font-size:14px;">Click to load explanation...</p>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Panel completeness footer
  if (result.panelCompleteness) {
    const pc = result.panelCompleteness;
    if (pc.missing && pc.missing.length > 0) {
      resultsFooter.style.display = 'block';
      resultsFooter.innerHTML = `
        <strong>Your panel covered ${pc.tested} of ${pc.recommended} recommended markers.</strong>
        Consider asking your doctor to add: ${pc.missing.map(m => escapeHtml(m)).join(', ')}.
      `;
    }
  }

  interpreterResults.classList.add('visible');
}

async function toggleResultCard(card) {
  const wasOpen = card.classList.contains('open');
  card.classList.toggle('open');

  // Load explanation lazily on first open
  if (!wasOpen) {
    const slot = card.querySelector('.explanation-slot');
    if (slot && slot.dataset.loaded === 'false') {
      slot.dataset.loaded = 'loading';
      slot.querySelector('.explanation-text').textContent = 'Loading explanation...';

      try {
        const res = await fetch('/api/explain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: card.dataset.name,
            value: card.dataset.value,
            functionalRange: card.dataset.functional,
            standardRange: card.dataset.standard,
            status: card.dataset.markerstatus
          })
        });
        const data = await res.json();
        slot.querySelector('.explanation-text').style.cssText = 'color: var(--text-secondary); font-style: normal; font-size: 14px; line-height: 1.7;';
        slot.querySelector('.explanation-text').textContent = data.explanation;
        slot.dataset.loaded = 'true';
      } catch (e) {
        slot.querySelector('.explanation-text').textContent = 'Could not load explanation.';
        slot.dataset.loaded = 'false';
      }
    }
  }
}

// Reset button
resetBtn.addEventListener('click', () => {
  interpreterResults.classList.remove('visible');
  resultsGrid.innerHTML = '';
  urgentFlagsBlock.style.display = 'none';
  urgentFlagsBlock.innerHTML = '';
  resultsFooter.style.display = 'none';
  labFile.value = '';
  uploadFilename.classList.remove('visible');
  interpretBtn.disabled = true;
  interpreterForm.classList.add('visible');
});

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
