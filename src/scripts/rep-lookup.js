const WORKER_URL = 'https://notsorandyfine-api.ahmed-sherif.workers.dev';

export async function lookupReps(zipCode) {
  try {
    const response = await fetch(`${WORKER_URL}/api/lookup-reps?zip=${encodeURIComponent(zipCode)}`);
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Lookup failed (${response.status})`);
    }
    return await response.json();
  } catch (error) {
    console.error('Rep lookup error:', error);
    throw error;
  }
}

export function formatRepTitle(office) {
  const titleMap = {
    'President of the United States': 'President',
    'Vice President of the United States': 'Vice President',
    'U.S. Senator': 'U.S. Senator',
    'U.S. Representative': 'U.S. Representative',
    'Governor': 'Governor',
  };
  return titleMap[office] || office;
}
