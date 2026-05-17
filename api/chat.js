export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  // Common response headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error:
        'ANTHROPIC_API_KEY not configured. Go to Vercel → your project → Settings → Environment Variables and add it.'
    });
  }

  try {
    // Parse body safely (Vercel may provide string or object)
    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body || '{}');
    }
    if (!body || typeof body !== 'object') {
      body = {};
    }

    // Anthropic headers
    const anthropicHeaders = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    };

    // Include MCP beta header only when MCP servers are provided
    if (Array.isArray(body.mcp_servers) && body.mcp_servers.length > 0) {
      anthropicHeaders['anthropic-beta'] = 'mcp-client-2025-04-04';
    }

    // Normalize incoming model names from frontend
    const incomingModel = body.model || '';
    const normalizedModel =
      incomingModel === 'claude-3-5-sonnet-latest'
        ? 'claude-sonnet-4-5'
        : incomingModel || 'claude-sonnet-4-5';

    const FALLBACK_MODELS = ['claude-sonnet-4-5', 'claude-3-5-sonnet-latest', 'claude-3-haiku-20240307'];

    async function callAnthropic(model) {
      const payload = {
        ...body,
        model,
        max_tokens: body.max_tokens ?? 1000
      };

      return fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: anthropicHeaders,
        body: JSON.stringify(payload)
      });
    }

    const modelChain = [normalizedModel, ...FALLBACK_MODELS.filter((m) => m !== normalizedModel)];

    let response;
    let data;
    let usedModel = modelChain[0];

    for (const model of modelChain) {
      usedModel = model;
      response = await callAnthropic(model);
      data = await response.json();

      const errText = JSON.stringify(data || {}).toLowerCase();
      const modelError =
        response.status === 400 &&
        (errText.includes('model') ||
          errText.includes('unsupported') ||
          errText.includes('not found') ||
          errText.includes('invalid'));

      if (!modelError) break;
    }

    if (usedModel !== normalizedModel && data && typeof data === 'object') {
      data._fallback_used = usedModel;
    }

    return res.status(response.status).json(data);
  } catch (error) {
    console.error('OrbitCommand proxy error:', error);
    return res.status(500).json({
      error: error?.message || 'Unknown proxy error',
      hint: 'Check Vercel Function Logs for details'
    });
  }
}
