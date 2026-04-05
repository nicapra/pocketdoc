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
const SITE_PASSWORD = 'PLACEHOLDER_PASSWORD';

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
// NOTE: API key is client-exposed. Acceptable for a password-gated hobby
// site with a trusted audience. Do not use this pattern for a public app.
const ANTHROPIC_API_KEY = 'PLACEHOLDER_API_KEY';

const interpreterLoading = document.getElementById('interpreterLoading');
const interpreterResults = document.getElementById('interpreterResults');
const resultsGrid = document.getElementById('resultsGrid');
const urgentFlagsBlock = document.getElementById('urgentFlagsBlock');
const resultsFooter = document.getElementById('resultsFooter');
const resetBtn = document.getElementById('resetBtn');

const SYSTEM_PROMPT = `You are a functional medicine lab interpreter. Your job is to read lab results and interpret them through a functional medicine lens.

CRITICAL RULES:
1. Do NOT make medication recommendations
2. Do NOT make supplement recommendations
3. Do NOT diagnose conditions
4. ALWAYS end your interpretation with a reminder to bring findings to their doctor
5. Flag SEVERELY abnormal results urgently at the very top
6. Compare results against BOTH functional medicine optimal ranges AND standard lab ranges
7. Flag results that fall within standard "normal" range but are suboptimal by functional medicine standards
8. Note when the uploaded panel is incomplete compared to a comprehensive functional medicine panel

RESPONSE FORMAT — respond with valid JSON only, no markdown, no prose outside the JSON:

{
  "urgentFlags": [
    "Lab name: value — reason this is urgent"
  ],
  "markers": [
    {
      "name": "Lab name",
      "value": "Patient value with units",
      "functionalRange": "Optimal functional medicine range",
      "standardRange": "Standard lab reference range",
      "status": "optimal" | "borderline" | "flagged",
      "explanation": "1-3 sentence explanation of what this means for the patient"
    }
  ],
  "panelCompleteness": {
    "tested": 12,
    "recommended": 24,
    "missing": ["Lab A", "Lab B", "Lab C"]
  }
}

For status:
- "optimal": Within functional medicine optimal range
- "borderline": Outside functional medicine optimal but within standard normal, OR borderline low/high on functional range
- "flagged": Outside standard normal range, OR significantly outside functional range

Functional medicine ranges to apply (use these, not standard lab ranges, as your primary benchmark):
- Fasting glucose: 70–85 mg/dL (standard: 70–99)
- HbA1c: <5.3% (standard: <5.7%)
- Fasting insulin: 2–5 uIU/mL (standard: 2–25)
- TSH: 1.0–2.5 mIU/L (standard: 0.4–4.0)
- Free T4: 1.1–1.5 ng/dL (standard: 0.8–1.8)
- Free T3: 3.2–4.2 pg/mL (standard: 2.3–4.2)
- Vitamin D: 60–80 ng/mL (standard: 30–100)
- Ferritin (men): 70–150 ng/mL (standard: 24–336)
- Ferritin (women): 70–100 ng/mL (standard: 11–307)
- hs-CRP: <0.5 mg/L (standard: <3.0)
- Homocysteine: <7 µmol/L (standard: <15)
- RBC magnesium: 5.5–7.0 mg/dL (standard: 4.2–6.8)
- Vitamin B12: 600–900 pg/mL (standard: 200–900)
- ApoB: <80 mg/dL (standard: <100)
- Testosterone total (men): 600–900 ng/dL (standard: 264–916)
- Testosterone free (men): 15–25 pg/mL (standard: 8.7–25.1)
- GGT: <20 U/L (standard: 8–61)
- Omega-3 index: >8% (standard varies)

For any markers not listed above, apply general functional medicine principles: flag anything in the bottom or top quartile of the standard range as borderline, flag anything outside standard normal as flagged.`;

interpretBtn.addEventListener('click', async () => {
  if (!labFile.files[0]) return;

  // Read PDF as base64
  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64 = e.target.result.split(',')[1];

    // Show loading
    interpreterForm.classList.remove('visible');
    interpreterLoading.classList.add('visible');

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-opus-4-6',
          max_tokens: 4096,
          system: SYSTEM_PROMPT,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: base64
                }
              },
              {
                type: 'text',
                text: 'Please interpret these lab results through a functional medicine lens. Respond with JSON only as specified.'
              }
            ]
          }]
        })
      });

      if (!response.ok) {
        throw new Error('API request failed: ' + response.status);
      }

      const data = await response.json();
      const rawText = data.content[0].text.trim();

      // Strip markdown code fences if present
      const jsonText = rawText.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '');
      const result = JSON.parse(jsonText);

      renderResults(result);

    } catch (err) {
      interpreterLoading.classList.remove('visible');
      interpreterForm.classList.add('visible');
      alert('Something went wrong interpreting your results. Please try again.\n\nError: ' + err.message);
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

  // Marker cards
  resultsGrid.innerHTML = result.markers.map(marker => {
    const statusClass = marker.status === 'optimal' ? 'green'
      : marker.status === 'borderline' ? 'yellow' : 'red';
    const statusLabel = marker.status === 'optimal' ? 'Optimal'
      : marker.status === 'borderline' ? 'Borderline' : 'Flagged';

    return `
      <div class="result-card" data-status="${statusClass}">
        <div class="result-card-header" onclick="toggleResultCard(this.parentElement)">
          <div class="status-dot ${statusClass}"></div>
          <div class="result-name">${escapeHtml(marker.name)}</div>
          <div class="result-value ${statusClass}">${escapeHtml(marker.value)}</div>
          <div class="result-range">${escapeHtml(marker.functionalRange)}</div>
          <span class="status-badge ${statusClass}">${statusLabel}</span>
          <span class="accordion-arrow">▼</span>
        </div>
        <div class="result-card-body">
          <p>${escapeHtml(marker.explanation)}</p>
          <p style="margin-top:8px; font-size:13px; color: var(--text-muted);">
            Standard lab range: ${escapeHtml(marker.standardRange)}
          </p>
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

function toggleResultCard(card) {
  card.classList.toggle('open');
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
