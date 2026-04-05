// Step 1: Fast scan — returns marker names, values, and status only.
// Completes in ~5 seconds. Explanations are fetched on-demand via /api/explain.

const SYSTEM_PROMPT = `You are a functional medicine lab interpreter. Scan the uploaded lab results.

RESPONSE: Valid JSON only. No markdown. No text outside JSON.

{
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
Fasting glucose 70-85 mg/dL, HbA1c <5.3%, Fasting insulin 2-5 uIU/mL, TSH 1.0-2.5 mIU/L, Free T4 1.1-1.5 ng/dL, Free T3 3.2-4.2 pg/mL, Vitamin D 60-80 ng/mL, Ferritin (men) 70-150 ng/mL, Ferritin (women) 70-100 ng/mL, hs-CRP <0.5 mg/L, Homocysteine <7 umol/L, RBC magnesium 5.5-7.0 mg/dL, B12 600-900 pg/mL, ApoB <80 mg/dL, Testosterone total (men) 600-900 ng/dL, Testosterone free (men) 15-25 pg/mL, GGT <20 U/L, Omega-3 index >8%.
For unlisted markers: bottom/top quartile of standard range = borderline; outside standard normal = flagged.

Do NOT include explanations. Status and ranges only.`;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  const { pdfBase64 } = req.body;
  if (!pdfBase64) return res.status(400).json({ error: 'No PDF provided' });

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 }
          },
          { type: 'text', text: 'Scan these lab results. Return JSON only — no explanations.' }
        ]
      }]
    })
  });

  if (!anthropicRes.ok) {
    const err = await anthropicRes.text();
    return res.status(502).json({ error: 'Anthropic API error', detail: err });
  }

  const data = await anthropicRes.json();
  const rawText = data.content[0].text.trim();
  const jsonText = rawText.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '');

  try {
    return res.status(200).json(JSON.parse(jsonText));
  } catch (e) {
    return res.status(500).json({ error: 'Failed to parse response', raw: jsonText.slice(0, 500) });
  }
};
