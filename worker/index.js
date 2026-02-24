// Cloudflare Worker — API proxy for NotSoRandyFine
// Endpoints:
//   GET  /api/lookup-reps?zip=XXXXX  — Google Civic Information API
//   POST /api/generate-email          — Claude API for email generation

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Rate limiting: 100 requests per IP per day
const RATE_LIMIT = 100;
const RATE_WINDOW = 86400; // 24 hours in seconds

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    // Rate limiting
    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    const rateLimitKey = `rate:${ip}:${new Date().toISOString().split('T')[0]}`;

    if (env.RATE_LIMIT_KV) {
      const count = parseInt(await env.RATE_LIMIT_KV.get(rateLimitKey) || '0');
      if (count >= RATE_LIMIT) {
        return jsonResponse({ error: 'Rate limit exceeded. Try again tomorrow.' }, 429);
      }
      await env.RATE_LIMIT_KV.put(rateLimitKey, String(count + 1), { expirationTtl: RATE_WINDOW });
    }

    try {
      if (url.pathname === '/api/lookup-reps' && request.method === 'GET') {
        return await handleRepLookup(url, env);
      }

      if (url.pathname === '/api/generate-email' && request.method === 'POST') {
        return await handleEmailGeneration(request, env);
      }

      return jsonResponse({ error: 'Not found' }, 404);
    } catch (error) {
      console.error('Worker error:', error);
      return jsonResponse({ error: 'Internal server error' }, 500);
    }
  },
};

async function handleRepLookup(url, env) {
  const zip = url.searchParams.get('zip');
  if (!zip || !/^\d{5}$/.test(zip)) {
    return jsonResponse({ error: 'Invalid zip code' }, 400);
  }

  const apiKey = env.GOOGLE_CIVIC_API_KEY;
  if (!apiKey) {
    return jsonResponse({ error: 'API key not configured' }, 500);
  }

  const civicUrl = `https://www.googleapis.com/civicinfo/v2/representatives?key=${apiKey}&address=${zip}&levels=country&levels=administrativeArea1`;

  const response = await fetch(civicUrl);
  if (!response.ok) {
    const err = await response.text();
    console.error('Civic API error:', err);
    return jsonResponse({ error: 'Failed to look up representatives' }, response.status);
  }

  const data = await response.json();

  // Transform into simpler format
  const officials = [];
  if (data.offices && data.officials) {
    for (const office of data.offices) {
      for (const index of office.officialIndices) {
        const official = data.officials[index];
        officials.push({
          name: official.name,
          office: office.name,
          party: official.party || '',
          phones: official.phones || [],
          emails: official.emails || [],
          urls: official.urls || [],
          photoUrl: official.photoUrl || null,
          channels: official.channels || [],
        });
      }
    }
  }

  return jsonResponse({ officials });
}

async function handleEmailGeneration(request, env) {
  const body = await request.json();
  const { senderName, tone, action, repName, repTitle, selectedEvidence } = body;

  if (!senderName || !tone || !action || !repName) {
    return jsonResponse({ error: 'Missing required fields' }, 400);
  }

  const apiKey = env.CLAUDE_API_KEY;
  if (!apiKey) {
    return jsonResponse({ error: 'API key not configured' }, 500);
  }

  const systemPrompt = buildSystemPrompt(tone, action, selectedEvidence);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Write an email from "${senderName}" to ${repTitle} ${repName}. Action: ${action}. Tone: ${tone}.${selectedEvidence ? ` Include this specific evidence: ${selectedEvidence.title} - ${selectedEvidence.summary}` : ''}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('Claude API error:', err);
    return jsonResponse({ error: 'Failed to generate email' }, response.status);
  }

  const data = await response.json();
  const emailText = data.content[0]?.text || '';

  // Parse subject and body from the response
  let subject = '';
  let emailBody = emailText;

  const subjectMatch = emailText.match(/^Subject:\s*(.+?)(?:\n|$)/im);
  if (subjectMatch) {
    subject = subjectMatch[1].trim();
    emailBody = emailText.replace(subjectMatch[0], '').trim();
  } else {
    const subjects = {
      condemn: `Demand for Accountability: Rep. Randy Fine's Hateful Rhetoric`,
      thank: `Thank You for Standing Against Hate`,
      urge: `Your Silence on Randy Fine's Rhetoric Is Concerning`,
      callout: `Your Defense of Randy Fine's Rhetoric Is Unacceptable`,
    };
    subject = subjects[action] || subjects.condemn;
  }

  return jsonResponse({ subject, body: emailBody });
}

function buildSystemPrompt(tone, action, evidence) {
  const toneDescriptions = {
    formal: 'Write in a professional, measured tone suitable for official correspondence. Use proper salutation and closing.',
    passionate: 'Write with emotional conviction and urgency. Express strong feelings while remaining coherent and respectful.',
    personal: 'Write from a personal perspective, sharing how this issue affects the writer directly. Be authentic and relatable.',
    factual: 'Write in a data-driven, evidence-focused style. Cite specific incidents and facts. Be analytical and thorough.',
    brief: 'Write concisely and directly. Keep the email under 150 words. Get straight to the point.',
  };

  const actionInstructions = {
    condemn: 'The writer wants the representative to publicly condemn Randy Fine\'s hateful rhetoric and take action to hold him accountable.',
    thank: 'The writer wants to thank the representative for speaking out against Randy Fine\'s rhetoric. Express gratitude and encourage continued action.',
    urge: 'The writer wants to urge a silent representative to take a public stance. Express concern about their silence and demand they speak up.',
    callout: 'The writer wants to challenge a representative who has defended or enabled Randy Fine\'s rhetoric. Be firm but avoid personal attacks.',
  };

  return `You are helping a constituent write an email to their elected representative about Randy Fine's documented pattern of hateful rhetoric targeting Muslim and Palestinian communities.

TONE: ${toneDescriptions[tone] || toneDescriptions.formal}

ACTION: ${actionInstructions[action] || actionInstructions.condemn}

GUIDELINES:
- Write ONLY the email (subject line + body), no meta-commentary
- Start with "Subject: " on the first line
- Each email should be unique — vary the structure, arguments, and phrasing
- Reference specific documented incidents when relevant
- Be respectful but firm — this is civic engagement, not harassment
- Include a clear ask/call to action
- Sign off with the sender's name
- Do NOT include any AI disclaimers or notes
${evidence ? `\nSPECIFIC EVIDENCE TO REFERENCE: "${evidence.title}" — ${evidence.summary}${evidence.quote ? ` (Quote: "${evidence.quote}")` : ''}` : ''}`;
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}
