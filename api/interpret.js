// Step 1: Fast scan — returns marker names, values, and status only.
// Completes in ~5 seconds. Explanations are fetched on-demand via /api/explain.

const SYSTEM_PROMPT = `You are a functional medicine lab interpreter. Scan the uploaded lab results.

IMPORTANT: Report EVERY lab marker with a numeric result you can find in the image or document,
even a short/basic panel (e.g. just a lipid panel with Total Cholesterol, LDL, HDL, Triglycerides).
Never return an empty "markers" array if any lab values are visible — the recommended-panel list
below is only for the "missing" comparison, it is NOT a filter on what to report. If you are
genuinely unable to read any values (blank image, no lab data present), return an empty markers
array AND set "unreadable": true so the caller knows extraction failed rather than the panel being
sparse.

If the source shows the same marker across multiple dates/columns (a trend/history table), use
only the most recent (rightmost, latest-dated) value as "value", and ignore older columns.

RESPONSE: Valid JSON only. No markdown. No text outside JSON.

{
  "unreadable": false,
  "urgentFlags": ["Lab name: value — one sentence reason this is urgent"],
  "markers": [
    {
      "name": "exact lab name",
      "value": "patient value with units",
      "functionalRange": "optimal range",
      "standardRange": "lab reference range",
      "status": "optimal|borderline|flagged"
    }
  ],
  "panelCompleteness": {
    "tested": 0,
    "recommended": 24,
    "missing": ["Lab A", "Lab B"]
  }
}

Status rules:
- optimal: within functional medicine optimal range
- borderline: within standard normal but outside functional optimal, OR borderline high/low
- flagged: outside standard normal range, OR significantly outside functional range

Functional medicine optimal ranges:
Fasting glucose 70-85 mg/dL, HbA1c <5.3%, Fasting insulin 2-5 uIU/mL, TSH 1.0-2.5 mIU/L, Free T4 1.1-1.5 ng/dL, Free T3 3.2-4.2 pg/mL, Vitamin D 60-80 ng/mL, Ferritin (men) 70-150 ng/mL, Ferritin (women) 70-100 ng/mL, hs-CRP <0.5 mg/L, Homocysteine <7 umol/L, RBC magnesium 5.5-7.0 mg/dL, B12 600-900 pg/mL, ApoB <80 mg/dL, Testosterone total (men) 600-900 ng/dL, Testosterone free (men) 15-25 pg/mL, GGT <20 U/L, Omega-3 index >8%, Total cholesterol 150-200 mg/dL, LDL <100 mg/dL, HDL >55 mg/dL, Triglycerides <100 mg/dL, Non-HDL cholesterol <130 mg/dL, Cholesterol/HDL ratio <3.5.
For unlisted markers: bottom/top quartile of standard range = borderline; outside standard normal = flagged.

Do NOT include explanations. Status and ranges only.`;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

    // fileBase64/mediaType is current; pdfBase64 kept for back-compat with older clients.
    const { pdfBase64, fileBase64, mediaType } = req.body || {};
    const base64 = fileBase64 || pdfBase64;
    if (!base64) return res.status(400).json({ error: 'No file provided' });

    const resolvedMediaType = mediaType || 'application/pdf';
    const isImage = resolvedMediaType.startsWith('image/');
    const fileBlock = isImage
      ? { type: 'image', source: { type: 'base64', media_type: resolvedMediaType, data: base64 } }
      : { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } };

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 8000,
        // Sonnet 5 runs adaptive thinking by default, and thinking tokens count
        // against max_tokens. This is mechanical extraction against explicit
        // rules, not open-ended reasoning, so cap effort low — otherwise a
        // dense, multi-page panel burns the budget on thinking (returning no
        // visible text) or just takes too long and hits the function timeout.
        output_config: { effort: 'low' },
        system: SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: [
            fileBlock,
            { type: 'text', text: 'Scan these lab results. Return JSON only — no explanations.' }
          ]
        }]
      })
    });

    if (!anthropicRes.ok) {
      const err = await anthropicRes.text();
      console.error('Anthropic API error', anthropicRes.status, err);
      return res.status(502).json({ error: 'Anthropic API error', detail: err.slice(0, 500) });
    }

    const data = await anthropicRes.json();
    const textBlock = Array.isArray(data.content) ? data.content.find(c => c.type === 'text') : null;
    if (!textBlock) {
      const diag = `stop_reason=${data.stop_reason} content=${JSON.stringify(data.content).slice(0, 300)}`;
      console.error('Unexpected Anthropic response shape', diag);
      return res.status(500).json({ error: 'Unexpected AI response shape', detail: diag });
    }

    const rawText = textBlock.text.trim();
    const jsonText = rawText.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '');

    try {
      return res.status(200).json(JSON.parse(jsonText));
    } catch (e) {
      const diag = `stop_reason=${data.stop_reason} raw=${jsonText.slice(0, 400)}`;
      console.error('Failed to parse Anthropic JSON response', diag);
      return res.status(500).json({ error: 'Failed to parse response', detail: diag });
    }
  } catch (e) {
    console.error('interpret handler crashed', e);
    return res.status(500).json({ error: 'Server error', detail: e.message });
  }
};
