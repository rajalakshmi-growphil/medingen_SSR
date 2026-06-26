const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(/^127\.\d+\.\d+\.\d+$/)
);

export function register() {
  if (!("serviceWorker" in navigator)) return;

  const swUrl = `/service-worker.js`;

  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      console.log("[SW] registered:", registration.scope);

      registration.onupdatefound = () => {
        const installing = registration.installing;
        if (!installing) return;

        installing.onstatechange = () => {
          if (installing.state === "installed") {
            if (navigator.serviceWorker.controller) {
              console.log("[SW] new content available");
            } else {
              console.log("[SW] content cached");
            }
          }
        };
      };
    })
    .catch((err) => {
      console.error("[SW] registration error:", err);
    });
}
/**
 * Register a valid service worker
 */
function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      // console.log('[SW] Service Worker registered with scope:', registration.scope);

      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;

        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New content available
              console.log('[SW] New content is available; please refresh.');
              if (config && config.onUpdate) config.onUpdate(registration);
            } else {
              // Content cached for offline use
              console.log('[SW] Content is cached for offline use.');
              if (config && config.onSuccess) config.onSuccess(registration);
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('[SW] Error during service worker registration:', error);
    });
}

/**
 * Check if service worker exists and is valid (localhost only)
 */
function checkValidServiceWorker(swUrl, config) {
  fetch(swUrl)
    .then((response) => {
      const contentType = response.headers.get('content-type');

      if (
        response.status === 404 ||
        (contentType && !contentType.includes('javascript'))
      ) {
        // SW missing or invalid → unregister and reload
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        // SW is valid → register normally
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log('[SW] No internet connection found. App is running in offline mode.');
    });
}

/**
 * Unregister the service worker (optional)
 */
export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => registration.unregister())
      .catch((error) => console.error('[SW] Error unregistering service worker:', error));
  }
}
