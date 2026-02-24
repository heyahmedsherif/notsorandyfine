const STORAGE_KEY = 'notsorandyfine_stats';

const BADGES = [
  { id: 'first-email', name: 'First Voice', description: 'Generated your first email', icon: '📧', threshold: { emailsGenerated: 1 } },
  { id: 'five-emails', name: 'Persistent', description: 'Generated 5 emails', icon: '📬', threshold: { emailsGenerated: 5 } },
  { id: 'ten-emails', name: 'Advocate', description: 'Generated 10 emails', icon: '📣', threshold: { emailsGenerated: 10 } },
  { id: 'first-copy', name: 'Ready to Send', description: 'Copied your first email', icon: '📋', threshold: { emailsCopied: 1 } },
  { id: 'evidence-user', name: 'Informed', description: 'Used evidence in an email', icon: '📰', threshold: { evidenceUsed: 1 } },
  { id: 'five-reps', name: 'Wide Reach', description: 'Contacted 5 different reps', icon: '🏛️', threshold: { repsContacted: 5 } },
  { id: 'share-master', name: 'Amplifier', description: 'Shared on social media', icon: '🔊', threshold: { shares: 1 } },
  { id: 'streak-3', name: 'Consistent', description: 'Took action 3 days in a row', icon: '🔥', threshold: { streak: 3 } },
];

const POINTS = {
  emailGenerated: 10,
  emailCopied: 5,
  evidenceUsed: 3,
  repContacted: 5,
  shared: 8,
  badgeEarned: 20,
};

function getDefaultStats() {
  return {
    points: 0,
    emailsGenerated: 0,
    emailsCopied: 0,
    evidenceUsed: 0,
    repsContacted: 0,
    shares: 0,
    totalActions: 0,
    badges: [],
    streak: 0,
    lastActionDate: null,
    contactedReps: [],
  };
}

export function getStats() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...getDefaultStats(), ...JSON.parse(stored) };
  } catch {}
  return getDefaultStats();
}

function saveStats(stats) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {}
}

function updateStreak(stats) {
  const today = new Date().toISOString().split('T')[0];
  if (stats.lastActionDate === today) return;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  stats.streak = stats.lastActionDate === yesterday ? stats.streak + 1 : 1;
  stats.lastActionDate = today;
}

function checkBadges(stats) {
  const newBadges = [];
  for (const badge of BADGES) {
    if (stats.badges.includes(badge.id)) continue;
    const [key, value] = Object.entries(badge.threshold)[0];
    if (stats[key] >= value) {
      stats.badges.push(badge.id);
      stats.points += POINTS.badgeEarned;
      newBadges.push(badge);
    }
  }
  return newBadges;
}

export function trackAction(action, data = {}) {
  const stats = getStats();
  updateStreak(stats);
  stats.totalActions++;

  switch (action) {
    case 'email_generated':
      stats.emailsGenerated++;
      stats.points += POINTS.emailGenerated;
      break;
    case 'email_copied':
      stats.emailsCopied++;
      stats.points += POINTS.emailCopied;
      break;
    case 'evidence_used':
      stats.evidenceUsed++;
      stats.points += POINTS.evidenceUsed;
      break;
    case 'rep_contacted':
      if (data.repName && !stats.contactedReps.includes(data.repName)) {
        stats.contactedReps.push(data.repName);
        stats.repsContacted = stats.contactedReps.length;
      }
      stats.points += POINTS.repContacted;
      break;
    case 'shared':
      stats.shares++;
      stats.points += POINTS.shared;
      break;
  }

  const newBadges = checkBadges(stats);
  saveStats(stats);

  // Dispatch event for UI updates
  window.dispatchEvent(new CustomEvent('stats-updated', { detail: { stats, newBadges } }));

  return { stats, newBadges };
}

export function getBadges() {
  return BADGES;
}

export function getEarnedBadges() {
  const stats = getStats();
  return BADGES.filter(b => stats.badges.includes(b.id));
}

export function getLockedBadges() {
  const stats = getStats();
  return BADGES.filter(b => !stats.badges.includes(b.id));
}

export function init() {
  // Update any stats displays on the page
  const stats = getStats();
  document.querySelectorAll('[data-stat]').forEach(el => {
    const key = el.getAttribute('data-stat');
    if (key && stats[key] !== undefined) {
      el.textContent = stats[key].toString();
    }
  });
}
