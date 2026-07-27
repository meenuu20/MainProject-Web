const LOCAL_API_URL = "http://localhost:8000";
const REMOTE_API_URL = "https://dumping-evidence-backend-production-296d.up.railway.app";

// We set this to empty because we will now return absolute URLs in the event objects
const API_BASE_URL = "";

async function fetchFromSource(baseUrl) {
  try {
    const response = await fetch(`${baseUrl}/api/evidence`);
    if (!response.ok) return { items: [] };
    const data = await response.json();
    
    // Convert relative URLs to absolute URLs so the frontend doesn't need to know the source
    return {
      items: (data.items || []).map(item => ({
        ...item,
        image_url: item.image_url ? `${baseUrl}${item.image_url}` : null,
        video_url: item.video_url ? `${baseUrl}${item.video_url}` : null,
        _source: baseUrl === LOCAL_API_URL ? 'local' : 'remote'
      }))
    };
  } catch (e) {
    console.error(`Failed to fetch from ${baseUrl}:`, e);
    return { items: [] };
  }
}

export { API_BASE_URL, LOCAL_API_URL, REMOTE_API_URL };

export async function fetchEvidenceList() {
  const [local, remote] = await Promise.all([
    fetchFromSource(LOCAL_API_URL),
    fetchFromSource(REMOTE_API_URL)
  ]);

  const combined = [...local.items, ...remote.items];
  // Sort by timestamp descending
  combined.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return { items: combined, count: combined.length };
}

export async function fetchEvidenceById(eventId) {
  // Try local first, then remote
  for (const url of [LOCAL_API_URL, REMOTE_API_URL]) {
    try {
      const response = await fetch(`${url}/api/evidence/${eventId}`);
      if (response.ok) {
        const item = await response.json();
        return {
          ...item,
          image_url: item.image_url ? `${url}${item.image_url}` : null,
          video_url: item.video_url ? `${url}${item.video_url}` : null
        };
      }
    } catch (e) {}
  }
  throw new Error("Evidence not found in any source");
}

export async function deleteAllEvidence() {
  // Only delete from local as per user preference (safety)
  const response = await fetch(`${LOCAL_API_URL}/api/evidence`, { method: "DELETE" });
  return response.json();
}

export async function deleteEvidenceById(eventId) {
  // Try local first
  const response = await fetch(`${LOCAL_API_URL}/api/evidence/${eventId}`, { method: "DELETE" });
  if (response.ok) return response.json();
  
  // Try remote
  const remoteResponse = await fetch(`${REMOTE_API_URL}/api/evidence/${eventId}`, { method: "DELETE" });
  return remoteResponse.json();
}
