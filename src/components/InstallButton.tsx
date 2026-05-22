"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if currently running in standalone (PWA) mode
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Register service worker asynchronously on page load (Strict Mode-safe check)
    if ("serviceWorker" in navigator) {
      if (navigator.serviceWorker.controller) {
        console.log("ℹ️ Service Worker: Already active and controlling this page.");
        return;
      }

      const handleLoad = () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("Service Worker registered successfully with scope:", reg.scope);
          })
          .catch((err) => {
            console.error("Service Worker registration failed:", err);
          });
      };

      if (document.readyState === "complete") {
        handleLoad();
      } else {
        window.addEventListener("load", handleLoad);
        return () => window.removeEventListener("load", handleLoad);
      }
    }
  }, []);

  useEffect(() => {
    if (isInstalled) {
      console.log("ℹ️ PWA Install Button: App is marked as already installed.");
      return;
    }

    // Check if the event was already captured globally
    if (typeof window !== "undefined" && (window as any).deferredPrompt) {
      console.log("⚡ PWA Install Button: Found deferredPrompt pre-captured on window object!");
      setDeferredPrompt((window as any).deferredPrompt);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      console.log("⚡ PWA Install Button: beforeinstallprompt event received in component!");
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleDeferredPromptReady = () => {
      if ((window as any).deferredPrompt) {
        console.log("⚡ PWA Install Button: deferredpromptready event received from layout!");
        setDeferredPrompt((window as any).deferredPrompt);
      }
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
      console.log("🎉 Reframe app installed successfully!");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("deferredpromptready", handleDeferredPromptReady);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("deferredpromptready", handleDeferredPromptReady);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [isInstalled]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA install prompt outcome: ${outcome}`);
    setDeferredPrompt(null);
  };

  if (!deferredPrompt || isInstalled) {
    return null;
  }

  return (
    <button
      id="pwa-install-button"
      onClick={handleInstallClick}
      className="
        inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
        bg-gradient-to-r from-red-500 to-rose-600 dark:from-red-600 dark:to-rose-700
        text-white hover:from-red-600 hover:to-rose-700 dark:hover:from-red-500 dark:hover:to-rose-600
        rounded-full shadow-sm hover:shadow-md active:scale-95
        transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
        dark:focus:ring-offset-gray-900 border border-red-400/20
      "
      aria-label="Install Reframe to your home screen"
    >
      <Download className="w-3.5 h-3.5 animate-bounce" style={{ animationDuration: "2s" }} />
      <span>Install App</span>
    </button>
  );
}
