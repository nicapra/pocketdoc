// Step 2: On-demand explanation for a single lab marker.
// Called when user clicks a result accordion. Returns in ~2 seconds.

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  const { name, value, functionalRange, standardRange, status } = req.body;
  if (!name) return res.status(400).json({ error: 'Missing marker name' });

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Lab marker: ${name}
Patient value: ${value}
Functional medicine optimal range: ${functionalRange}
Standard lab reference range: ${standardRange}
Status: ${status}

Write 2-3 sentences explaining what this marker measures, what the patient's result means for their health, and (if suboptimal) what direction to consider discussing with their doctor. Do not recommend specific supplements or medications. End with no disclaimer — the site already has one.`
      }]
    })
  });

  if (!anthropicRes.ok) {
    const err = await anthropicRes.text();
    return res.status(502).json({ error: 'Anthropic API error', detail: err });
  }

  const data = await anthropicRes.json();
  return res.status(200).json({ explanation: data.content[0].text.trim() });
};
