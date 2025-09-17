# GA4 Client & Session ID Extractor

A small utility for extracting GA4 `client_id` and `session_id` using the native `gtag('get', ...)` API, with cookie-based fallbacks for robustness.

## Features
- Asynchronous methods (use gtag API first, fallback to cookies if unavailable).
- Cookie-only synchronous methods for immediate use.
- Timeout handling (default 2000ms).

## Usage

```html
<script src="ga4-id-extractor.js"></script>
<script>
  (async () => {
    const measurementId = 'G-XXXXXXXXXX';
    const ids = await getGA4Identifiers(measurementId);
    console.log(ids.clientId, ids.sessionId, ids.source);
  })();
</script>
