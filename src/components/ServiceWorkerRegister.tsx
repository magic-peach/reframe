"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!('serviceWorker' in navigator)) return;

    // Only register in production-like environments
    if (process.env.NODE_ENV === 'development') return;

    const swUrl = '/sw.js';

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register(swUrl, { scope: '/' });
        // Optionally listen for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // new update available
                console.log('[sw] New service worker installed.');
              } else {
                console.log('[sw] Service worker installed for the first time.');
              }
            }
          });
        });
      } catch (err) {
        console.warn('[sw] registration failed', err);
      }
    };

    register();
  }, []);

  return null;
}
