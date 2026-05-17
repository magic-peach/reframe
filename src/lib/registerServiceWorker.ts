// src/lib/registerServiceWorker.ts

export async function registerServiceWorker(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) {
    console.warn('[SW] Service workers are not supported in this browser.');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (
          newWorker.state === 'installed' &&
          navigator.serviceWorker.controller
        ) {
          console.log('[SW] New version available. Reload to update.');
        }
      });
    });

    console.log('[SW] Registered successfully, scope:', registration.scope);
  } catch (err) {
    console.error('[SW] Registration failed:', err);
  }
}