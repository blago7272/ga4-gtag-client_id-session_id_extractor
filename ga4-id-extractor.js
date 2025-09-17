/**
 * GA4 Client ID and Session ID Extractor
 * Combines native gtag.js API with cookie fallback methods
 */

// Cookie reading utility
function readCookie(name) {
    const m = document.cookie.match('(^|;)\\s*' + name.replace(/[-.$?*|{}()[\]\\/+^]/g, '\\$&') + '\\s*=\\s*([^;]+)');
    return m ? decodeURIComponent(m.pop()) : '';
}

// Fallback: client_id from _ga cookie
function getClientIdFromCookie() {
    const v = readCookie('_ga');
    if (!v) return '';
    const parts = v.split('.');
    return parts.length >= 4 ? (parts[2] + '.' + parts[3]) : '';
}

// Fallback: session_id from _ga_<MEASUREMENT_ID> cookie
function getSessionIdFromCookie(measurementId) {
    const cookieName = `_ga_${measurementId.replace(/G-/, '')}`;
    const v = readCookie(cookieName);
    if (!v) return '';
    const p = v.split('.');
    // Expect: ["GS1","1","<sid>","<sessionCount>", ...]
    return p.length >= 3 ? p[2] : '';
}

// Check if gtag is available and measurement ID is configured
function isGtagAvailable(measurementId) {
    return typeof window.gtag === 'function' && 
           typeof window.google_tag_manager !== 'undefined' &&
           measurementId;
}

// Get client_id using native gtag API
function getClientIdFromGtag(measurementId) {
    return new Promise((resolve) => {
        try {
            gtag('get', measurementId, 'client_id', (clientId) => {
                resolve(clientId || '');
            });
        } catch (error) {
            console.warn('Error getting client_id from gtag:', error);
            resolve('');
        }
    });
}

// Get session_id using native gtag API
function getSessionIdFromGtag(measurementId) {
    return new Promise((resolve) => {
        try {
            gtag('get', measurementId, 'session_id', (sessionId) => {
                resolve(sessionId || '');
            });
        } catch (error) {
            console.warn('Error getting session_id from gtag:', error);
            resolve('');
        }
    });
}

// Main function to get client_id (tries gtag first, then cookie fallback)
async function getClientId(measurementId, timeout = 2000) {
    if (isGtagAvailable(measurementId)) {
        try {
            // Race the gtag call against a timeout
            const clientId = await Promise.race([
                getClientIdFromGtag(measurementId),
                new Promise(resolve => setTimeout(() => resolve(''), timeout))
            ]);
            
            if (clientId) {
                return clientId;
            }
        } catch (error) {
            console.warn('Native gtag client_id failed, falling back to cookie:', error);
        }
    }
    
    // Fallback to cookie method
    return getClientIdFromCookie();
}

// Main function to get session_id (tries gtag first, then cookie fallback)
async function getSessionId(measurementId, timeout = 2000) {
    if (isGtagAvailable(measurementId)) {
        try {
            // Race the gtag call against a timeout
            const sessionId = await Promise.race([
                getSessionIdFromGtag(measurementId),
                new Promise(resolve => setTimeout(() => resolve(''), timeout))
            ]);
            
            if (sessionId) {
                return sessionId;
            }
        } catch (error) {
            console.warn('Native gtag session_id failed, falling back to cookie:', error);
        }
    }
    
    // Fallback to cookie method
    return getSessionIdFromCookie(measurementId);
}

// Convenience function to get both values at once
async function getGA4Identifiers(measurementId, timeout = 2000) {
    const [clientId, sessionId] = await Promise.all([
        getClientId(measurementId, timeout),
        getSessionId(measurementId, timeout)
    ]);
    
    return {
        clientId,
        sessionId,
        source: {
            clientId: clientId ? (isGtagAvailable(measurementId) ? 'gtag-api' : 'cookie') : 'not-found',
            sessionId: sessionId ? (isGtagAvailable(measurementId) ? 'gtag-api' : 'cookie') : 'not-found'
        }
    };
}

// Synchronous versions (cookie-only, for immediate use)
function getGA4IdentifiersSync(measurementId) {
    return {
        clientId: getClientIdFromCookie(),
        sessionId: getSessionIdFromCookie(measurementId),
        source: {
            clientId: getClientIdFromCookie() ? 'cookie' : 'not-found',
            sessionId: getSessionIdFromCookie(measurementId) ? 'cookie' : 'not-found'
        }
    };
}

// Usage Examples:

// Async usage (recommended - tries gtag first, falls back to cookies)
/*
(async () => {
    const measurementId = 'G-XXXXXXXXXX'; // Replace with your GA4 measurement ID
    
    const identifiers = await getGA4Identifiers(measurementId);
    console.log('Client ID:', identifiers.clientId);
    console.log('Session ID:', identifiers.sessionId);
    console.log('Sources:', identifiers.source);
})();
*/

// Individual calls
/*
(async () => {
    const measurementId = 'G-XXXXXXXXXX';
    
    const clientId = await getClientId(measurementId);
    const sessionId = await getSessionId(measurementId);
    
    console.log('Client ID:', clientId);
    console.log('Session ID:', sessionId);
})();
*/

// Synchronous usage (cookie-only, immediate)
/*
const measurementId = 'G-XXXXXXXXXX';
const identifiers = getGA4IdentifiersSync(measurementId);
console.log('Client ID (sync):', identifiers.clientId);
console.log('Session ID (sync):', identifiers.sessionId);
*/