const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://smart-waste-backend-kwpq.onrender.com";

async function fetchJson(path) {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json();
}

export { API_BASE_URL };

export async function fetchEvidenceList() {
  return fetchJson("/api/evidence");
}

export async function fetchEvidenceById(eventId) {
  return fetchJson(`/api/evidence/${eventId}`);
}
