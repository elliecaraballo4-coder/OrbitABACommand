export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'ANTHROPIC_API_KEY not configured. Go to Vercel → your project → Settings → Environment Variables and add it.' 
    });
  }

  try {
    // Parse body — Vercel may send it as a string or object
    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }

    // Build headers — only add mcp-client beta if mcp_servers are present
    const anthropicHeaders = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    };

    if (body.mcp_servers && body.mcp_servers.length > 0) {
      anthropicHeaders['anthropic-beta'] = 'mcp-client-2025-04-04';
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: anthropicHeaders,
      body: JSON.stringify(body)
    });

    const data = await response.json();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    return res.status(response.status).json(data);

  } catch (error) {
    console.error('OrbitCommand proxy error:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({ 
      error: error.message,
      hint: 'Check Vercel Function Logs for details'
    });
  }
}
