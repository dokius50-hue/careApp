const DEBUG_INGEST = 'http://127.0.0.1:7393/ingest/9b2f55a8-329e-41a6-8f6a-8cbeabddb8f7';
const SESSION_ID = '1abaea';

export function debugLog(location, message, data, hypothesisId) {
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
