// Cloudflare Worker — API proxy for NotSoRandyFine
// Endpoints:
//   GET  /api/lookup-reps?zip=XXXXX  — Rep lookup via embedded legislators data
//   POST /api/generate-email          — Claude API for email generation

import { LEGISLATORS } from './legislators-data.js';

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

  // Step 1: Zip to congressional district via Census geocoder
  const geocodeUrl = `https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?address=${zip}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`;
  let state = null;
  let district = null;
  let stateUpperDistrict = null;
  let stateLowerDistrict = null;

  try {
    const geoResponse = await fetch(geocodeUrl);
    if (geoResponse.ok) {
      const geoData = await geoResponse.json();
      const match = geoData?.result?.addressMatches?.[0];
      if (match) {
        const geographies = match.geographies;
        const stateGeo = geographies?.['States']?.[0];
        const cdGeo = geographies?.['119th Congressional Districts']?.[0] ||
                      geographies?.['Congressional Districts']?.[0];
        const slduGeo = geographies?.['State Legislative Districts - Upper']?.[0];
        const sldlGeo = geographies?.['State Legislative Districts - Lower']?.[0];
        if (stateGeo) state = stateGeo.STUSAB;
        if (cdGeo) district = parseInt(cdGeo.CD119FP || cdGeo.CDFP || cdGeo.CD || '0');
        if (slduGeo) stateUpperDistrict = slduGeo.SLDUST || slduGeo.NAME;
        if (sldlGeo) stateLowerDistrict = sldlGeo.SLDLST || sldlGeo.NAME;
      }
    }
  } catch (e) {
    console.error('Census geocode error:', e);
  }

  // Fallback: use zip prefix to state mapping if geocoder fails
  if (!state) {
    state = zipToState(zip);
  }

  if (!state) {
    return jsonResponse({ error: 'Could not determine state from zip code' }, 400);
  }

  // Step 2: Look up from embedded legislators data
  const officials = [];

  for (const leg of LEGISLATORS) {
    if (leg.s !== state) continue;

    if (leg.t === 'sen') {
      officials.push({
        name: leg.n,
        office: 'U.S. Senator',
        party: leg.p === 'Democrat' ? 'Democratic' : leg.p,
        phones: leg.ph ? [leg.ph] : [],
        emails: [],
        urls: leg.u ? [leg.u] : [],
        photoUrl: `https://bioguide.congress.gov/bioguide/photo/${leg.b[0]}/${leg.b}.jpg`,
        contactForm: leg.cf || null,
        directRep: true,
      });
    }

    if (leg.t === 'rep') {
      const isDirectRep = district === null || district === undefined || leg.d === district;
      officials.push({
        name: leg.n,
        office: 'U.S. Representative',
        party: leg.p === 'Democrat' ? 'Democratic' : leg.p,
        phones: leg.ph ? [leg.ph] : [],
        emails: [],
        urls: leg.u ? [leg.u] : [],
        photoUrl: `https://bioguide.congress.gov/bioguide/photo/${leg.b[0]}/${leg.b}.jpg`,
        contactForm: leg.cf || null,
        district: leg.d,
        directRep: isDirectRep,
      });
    }
  }

  // Step 3: Look up state legislators via OpenStates API
  let stateLegislators = [];
  if (env.OPENSTATES_API_KEY && state) {
    stateLegislators = await lookupStateLegislators(state, stateUpperDistrict, stateLowerDistrict, env.OPENSTATES_API_KEY);
  }

  return jsonResponse({ officials, stateLegislators, state, district });
}

async function lookupStateLegislators(state, upperDistrict, lowerDistrict, apiKey) {
  const legislators = [];
  const stateJurisdiction = `ocd-jurisdiction/country:us/state:${state.toLowerCase()}/government`;

  const chambers = [];
  if (upperDistrict) chambers.push({ classification: 'upper', district: upperDistrict });
  if (lowerDistrict) chambers.push({ classification: 'lower', district: lowerDistrict });

  for (const { classification, district } of chambers) {
    try {
      // Strip leading zeros from district number
      const districtNum = String(parseInt(district) || district);
      const url = `https://v3.openstates.org/people?jurisdiction=${encodeURIComponent(stateJurisdiction)}&org_classification=${classification}&district=${encodeURIComponent(districtNum)}&include=links`;
      const response = await fetch(url, {
        headers: { 'X-API-Key': apiKey },
      });

      if (!response.ok) continue;

      const data = await response.json();
      for (const person of (data.results || [])) {
        const office = classification === 'upper' ? 'State Senator' : 'State Representative';
        const email = person.email || (person.offices || []).find(o => o.email)?.email || null;
        legislators.push({
          name: person.name,
          office,
          party: person.party === 'Democrat' ? 'Democratic' : (person.party || ''),
          emails: email ? [email] : [],
          phones: [],
          urls: person.links?.length ? [person.links[0].url] : [],
          photoUrl: person.image || null,
          contactForm: null,
          district: districtNum,
          level: 'state',
          directRep: true,
        });
      }
    } catch (e) {
      console.error(`OpenStates ${classification} lookup error:`, e);
    }
  }

  return legislators;
}

function zipToState(zip) {
  const prefix = parseInt(zip.substring(0, 3));
  const ranges = [
    [[005, 005], 'NY'], [[006, 009], 'PR'], [[010, 027], 'MA'], [[028, 029], 'RI'],
    [[030, 038], 'NH'], [[039, 049], 'ME'], [[050, 059], 'VT'], [[060, 069], 'CT'],
    [[070, 089], 'NJ'], [[100, 149], 'NY'], [[150, 196], 'PA'], [[197, 199], 'DE'],
    [[200, 205], 'DC'], [[206, 219], 'MD'], [[220, 246], 'VA'], [[247, 268], 'WV'],
    [[270, 289], 'NC'], [[290, 299], 'SC'], [[300, 319], 'GA'], [[320, 349], 'FL'],
    [[350, 369], 'AL'], [[370, 385], 'TN'], [[386, 397], 'MS'], [[400, 427], 'KY'],
    [[430, 459], 'OH'], [[460, 479], 'IN'], [[480, 499], 'MI'], [[500, 528], 'IA'],
    [[530, 549], 'WI'], [[550, 567], 'MN'], [[570, 577], 'SD'], [[580, 588], 'ND'],
    [[590, 599], 'MT'], [[600, 629], 'IL'], [[630, 658], 'MO'], [[660, 679], 'KS'],
    [[680, 693], 'NE'], [[700, 714], 'LA'], [[716, 729], 'AR'], [[730, 749], 'OK'],
    [[750, 799], 'TX'], [[800, 816], 'CO'], [[820, 831], 'WY'], [[832, 838], 'ID'],
    [[840, 847], 'UT'], [[850, 865], 'AZ'], [[870, 884], 'NM'], [[889, 898], 'NV'],
    [[900, 961], 'CA'], [[967, 968], 'HI'], [[970, 979], 'OR'], [[980, 994], 'WA'],
    [[995, 999], 'AK'],
  ];

  for (const [[min, max], st] of ranges) {
    if (prefix >= min && prefix <= max) return st;
  }
  return null;
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
