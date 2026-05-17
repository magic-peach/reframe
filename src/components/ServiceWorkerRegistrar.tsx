'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/registerServiceWorker';

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return null;
}