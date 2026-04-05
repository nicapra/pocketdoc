// Vercel Edge Function — runs closer to the user, 30s timeout on hobby plan.
// API key lives in Vercel environment variables, never in client code.

export const config = { runtime: 'edge' };

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
      "status": "optimal",
      "explanation": "1-3 sentence explanation of what this means for the patient"
    }
  ],
  "panelCompleteness": {
    "tested": 12,
    "recommended": 24,
    "missing": ["Lab A", "Lab B"]
  }
}

Status values: "optimal" | "borderline" | "flagged"
- "optimal": Within functional medicine optimal range
- "borderline": Outside functional medicine optimal but within standard normal, OR borderline low/high
- "flagged": Outside standard normal range, OR significantly outside functional range

Functional medicine ranges (use as primary benchmark):
- Fasting glucose: 70-85 mg/dL (standard: 70-99)
- HbA1c: <5.3% (standard: <5.7%)
- Fasting insulin: 2-5 uIU/mL (standard: 2-25)
- TSH: 1.0-2.5 mIU/L (standard: 0.4-4.0)
- Free T4: 1.1-1.5 ng/dL (standard: 0.8-1.8)
- Free T3: 3.2-4.2 pg/mL (standard: 2.3-4.2)
- Vitamin D: 60-80 ng/mL (standard: 30-100)
- Ferritin (men): 70-150 ng/mL (standard: 24-336)
- Ferritin (women): 70-100 ng/mL (standard: 11-307)
- hs-CRP: <0.5 mg/L (standard: <3.0)
- Homocysteine: <7 umol/L (standard: <15)
- RBC magnesium: 5.5-7.0 mg/dL (standard: 4.2-6.8)
- Vitamin B12: 600-900 pg/mL (standard: 200-900)
- ApoB: <80 mg/dL (standard: <100)
- Testosterone total (men): 600-900 ng/dL (standard: 264-916)
- Testosterone free (men): 15-25 pg/mL (standard: 8.7-25.1)
- GGT: <20 U/L (standard: 8-61)
- Omega-3 index: >8% (standard varies)

For unlisted markers: flag bottom/top quartile of standard range as borderline, outside standard normal as flagged.`;

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const body = await req.json();
  const { pdfBase64 } = body;

  if (!pdfBase64) {
    return new Response(JSON.stringify({ error: 'No PDF provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: pdfBase64
            }
          },
          {
            type: 'text',
            text: 'Interpret these lab results. Respond with JSON only as specified. Be concise in explanations (1-2 sentences each).'
          }
        ]
      }]
    })
  });

  if (!anthropicRes.ok) {
    const err = await anthropicRes.text();
    return new Response(JSON.stringify({ error: 'Anthropic API error', detail: err }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const data = await anthropicRes.json();
  const rawText = data.content[0].text.trim();
  const jsonText = rawText.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '');

  return new Response(jsonText, {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
