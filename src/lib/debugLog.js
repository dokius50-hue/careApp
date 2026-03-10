// Only send to ingest if explicitly enabled (e.g. VITE_DEBUG_INGEST_URL set). Avoids console noise when ingest is not running.
const DEBUG_INGEST = import.meta.env.VITE_DEBUG_INGEST_URL || null;
const SESSION_ID = '1abaea';

export function debugLog(location, message, data, hypothesisId) {
  if (!DEBUG_INGEST) return;
  const payload = {
    sessionId: SESSION_ID,
    location,
    message,
    data: data ?? {},
    timestamp: Date.now(),
    hypothesisId
  };
  fetch(DEBUG_INGEST, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': SESSION_ID },
    body: JSON.stringify(payload)
  }).catch(() => {});
}
