const WORKER_URL = 'https://notsorandyfine-api.ahmed-sherif.workers.dev';

export async function generateEmail({ senderName, tone, action, repName, repTitle, selectedEvidence }) {
  try {
    const response = await fetch(`${WORKER_URL}/api/generate-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderName,
        tone,
        action,
        repName,
        repTitle,
        selectedEvidence,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Generation failed (${response.status})`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Email generation error:', error);
    throw error;
  }
}

export function generateFallbackEmail({ senderName, tone, action, repName, repTitle, selectedEvidence }) {
  const greeting = `Dear ${repTitle} ${repName},`;
  const signoff = `Sincerely,\n${senderName}`;

  const evidenceBlock = selectedEvidence
    ? `\n\nSpecifically, I want to draw your attention to: ${selectedEvidence.title}. ${selectedEvidence.summary}${selectedEvidence.quote ? ` He stated: "${selectedEvidence.quote}"` : ''}\n`
    : '';

  const templates = {
    condemn: {
      formal: `${greeting}\n\nI am writing to you as a concerned constituent to express my deep alarm regarding the documented pattern of hateful rhetoric by Representative Randy Fine. His inflammatory statements targeting Muslim and Palestinian communities are unbecoming of any public official and demand a formal response.${evidenceBlock}\n\nI urge you to publicly condemn this rhetoric and support measures to hold Representative Fine accountable. Silence in the face of bigotry is complicity.\n\n${signoff}`,
      passionate: `${greeting}\n\nI cannot stay silent while a sitting member of Congress spews hatred against entire communities. Randy Fine's documented record of anti-Muslim and anti-Palestinian rhetoric is not just offensive — it's dangerous. It emboldens hate and puts real people at risk.${evidenceBlock}\n\nI need to know: where do you stand? Will you condemn this hatred, or will your silence speak for you?\n\n${signoff}`,
      personal: `${greeting}\n\nI'm reaching out to you personally because Randy Fine's hateful rhetoric affects me and my community deeply. When an elected official targets people based on their faith or ethnicity, it creates fear and division that touches all of us.${evidenceBlock}\n\nI'm asking you, representative to constituent, to take a stand against this hatred. Your voice matters.\n\n${signoff}`,
      factual: `${greeting}\n\nI am writing regarding the documented pattern of inflammatory rhetoric by Rep. Randy Fine. There are currently 12 documented incidents of hateful statements targeting Muslim and Palestinian communities, verified by multiple news sources.${evidenceBlock}\n\nThe evidence is clear and publicly available. I request that you review these incidents and issue a public statement condemning this conduct.\n\n${signoff}`,
      brief: `${greeting}\n\nRandy Fine's hateful rhetoric toward Muslim and Palestinian communities is documented and inexcusable. I urge you to publicly condemn it.${evidenceBlock}\n\nAccountability matters. Where do you stand?\n\n${signoff}`,
    },
    thank: {
      formal: `${greeting}\n\nI am writing to express my gratitude for your public stance against the hateful rhetoric of Representative Randy Fine. Your willingness to speak out against bigotry demonstrates the moral leadership our country needs.\n\nPlease continue to hold all elected officials accountable, regardless of party.\n\n${signoff}`,
      passionate: `${greeting}\n\nThank you for standing up. In a time when too many leaders stay silent in the face of hate, your voice matters more than you know. Your condemnation of Randy Fine's rhetoric gives hope to everyone targeted by his words.\n\nKeep fighting the good fight.\n\n${signoff}`,
      personal: `${greeting}\n\nI wanted to personally thank you for speaking out against Randy Fine's hateful rhetoric. As someone directly affected by this kind of bigotry, it means everything to know that our leaders are willing to stand with us.\n\n${signoff}`,
      factual: `${greeting}\n\nI am writing to acknowledge your public statement regarding Rep. Randy Fine's documented pattern of hateful rhetoric. Your response was appropriate given the severity of the incidents recorded.\n\nContinued vigilance and accountability are essential.\n\n${signoff}`,
      brief: `${greeting}\n\nThank you for condemning Randy Fine's hateful rhetoric. Your leadership matters. Please keep speaking up.\n\n${signoff}`,
    },
    urge: {
      formal: `${greeting}\n\nI am writing to express my concern that you have not yet publicly addressed the documented pattern of hateful rhetoric by Representative Randy Fine. As your constituent, I believe your silence on this matter is noted and concerning.\n\nI respectfully urge you to review the evidence and issue a public statement.\n\n${signoff}`,
      passionate: `${greeting}\n\nYour silence on Randy Fine's hateful rhetoric is deafening. Every day you don't speak up, you send a message that this kind of bigotry is acceptable. It's not.\n\nYour constituents are watching. We need to hear from you. Now.\n\n${signoff}`,
      personal: `${greeting}\n\nI've been waiting to hear your response to Randy Fine's anti-Muslim and anti-Palestinian rhetoric. Your silence worries me. As someone who voted for you, I need to know that you stand against hate.\n\nPlease, say something.\n\n${signoff}`,
      factual: `${greeting}\n\nAs of this date, you have not issued any public statement regarding the 12+ documented incidents of hateful rhetoric by Rep. Randy Fine. Multiple colleagues from both parties have responded. Your position remains unrecorded.\n\nI request a public statement on this matter.\n\n${signoff}`,
      brief: `${greeting}\n\nYou haven't spoken up about Randy Fine's hateful rhetoric. Your silence is noticed. Please take a public stance.\n\n${signoff}`,
    },
    callout: {
      formal: `${greeting}\n\nI am deeply troubled by your defense of Representative Randy Fine's hateful rhetoric targeting Muslim and Palestinian communities. Supporting or enabling bigotry from a colleague reflects poorly on your commitment to representing all constituents.\n\nI urge you to reconsider your position and stand against hate.\n\n${signoff}`,
      passionate: `${greeting}\n\nDefending Randy Fine's hateful rhetoric is indefensible. When you stand with a colleague who targets entire communities, you own those words too. History is watching, and your constituents won't forget.\n\nDo the right thing. Condemn hate, don't enable it.\n\n${signoff}`,
      personal: `${greeting}\n\nAs your constituent, I am hurt and disappointed by your defense of Randy Fine's anti-Muslim rhetoric. When my representative defends hatred against my community, it tells me I don't matter to you.\n\nProve me wrong.\n\n${signoff}`,
      factual: `${greeting}\n\nYour public defense of Rep. Randy Fine's rhetoric is at odds with the documented evidence of his statements. I encourage you to review the 12+ verified incidents before continuing to support this conduct.\n\nFacts matter. Please reconsider.\n\n${signoff}`,
      brief: `${greeting}\n\nDefending Randy Fine's hateful rhetoric makes you complicit. Reconsider your position. Your constituents are paying attention.\n\n${signoff}`,
    },
  };

  const actionTemplates = templates[action] || templates.condemn;
  const email = actionTemplates[tone] || actionTemplates.formal;

  const subjects = {
    condemn: `Demand for Accountability: Rep. Randy Fine's Hateful Rhetoric`,
    thank: `Thank You for Standing Against Hate`,
    urge: `Your Silence on Randy Fine's Rhetoric Is Concerning`,
    callout: `Your Defense of Randy Fine's Rhetoric Is Unacceptable`,
  };

  return {
    subject: subjects[action] || subjects.condemn,
    body: email,
  };
}

export function copyToClipboard(text) {
  return navigator.clipboard.writeText(text);
}

export function createMailtoLink(email, subject, body) {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
