"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface PwaInstallContextValue {
  canInstall: boolean;
  isStandalone: boolean;
  isIos: boolean;
  promptInstall: () => Promise<void>;
  openGuide: () => void;
}

const PwaInstallContext = createContext<PwaInstallContextValue>({
  canInstall: false,
  isStandalone: false,
  isIos: false,
  promptInstall: async () => {},
  openGuide: () => {},
});

export function PwaInstallProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(true);
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    const ua = window.navigator.userAgent || "";
    const iosDevice = /iphone|ipad|ipod/i.test(ua);
    const mobileDevice = /android|iphone|ipad|ipod/i.test(ua);
    setIsIos(iosDevice);

    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem("copian_pwa_banner_dismissed") === "1";
    } catch {
      dismissed = false;
    }
    if (!standalone && mobileDevice && !dismissed) {
      setBannerDismissed(false);
    }

    let onControllerChange: (() => void) | null = null;
    if ("serviceWorker" in navigator) {
      if (process.env.NODE_ENV !== "production") {
        navigator.serviceWorker
          .getRegistrations()
          .then((regs) => Promise.all(regs.map((r) => r.unregister())))
          .catch(() => {});
      } else {
        const hadController = Boolean(navigator.serviceWorker.controller);
        if ("caches" in window) {
          caches
            .keys()
            .then((keys) =>
              Promise.all(keys.filter((k) => k === "copian-pwa-v1").map((k) => caches.delete(k)))
            )
            .catch(() => {});
        }
        onControllerChange = () => {
          try {
            if (hadController && !sessionStorage.getItem("copian_sw_v2_reloaded")) {
              sessionStorage.setItem("copian_sw_v2_reloaded", "1");
              window.location.reload();
            }
          } catch {
            // ignore storage/reload errors
          }
        };
        navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
        navigator.serviceWorker
          .register("/sw.js", { updateViaCache: "none" })
          .then((reg) => reg.update().catch(() => {}))
          .catch(() => {
            // ignore if unsupported in restricted contexts
          });
      }
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!standalone && !dismissed) {
        setBannerDismissed(false);
      }
    };

    const onAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
      setBannerDismissed(true);
      setGuideOpen(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onAppInstalled);
      if ("serviceWorker" in navigator && onControllerChange) {
        navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      }
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setDeferredPrompt(null);
          setBannerDismissed(true);
        }
        return;
      } catch {
        setDeferredPrompt(null);
      }
    }
    setGuideOpen(true);
  }, [deferredPrompt]);

  const dismissBanner = () => {
    setBannerDismissed(true);
    try {
      sessionStorage.setItem("copian_pwa_banner_dismissed", "1");
    } catch {
      // ignore storage failure
    }
  };

  return (
    <PwaInstallContext.Provider
      value={{
        canInstall: Boolean(deferredPrompt),
        isStandalone,
        isIos,
        promptInstall,
        openGuide: () => setGuideOpen(true),
      }}
    >
      {children}

      {/* Mobile App Install Strip (only shown on mobile or when Android browser fires install prompt) */}
      {!isStandalone && !bannerDismissed && (deferredPrompt || isIos) && (
        <div
          role="region"
          aria-label="Install Copian B2B App"
          className="fixed bottom-20 inset-x-4 sm:left-auto sm:right-6 sm:w-96 z-50 bg-dark-surface-container-low text-white border border-dark-outline-variant rounded-lg p-3.5 shadow-xl flex items-center justify-between gap-3 no-print"
        >
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/icons/icon-192x192.png"
              alt="Copian App Icon"
              className="w-10 h-10 rounded-md shrink-0 border border-white/15"
            />
            <div className="min-w-0">
              <p className="font-headline text-label-lg text-white truncate">Copian B2B App</p>
              <p className="font-body text-[12px] text-dark-on-surface-variant truncate">
                {deferredPrompt
                  ? "Install for instant SKU lookup & quotes"
                  : "Add to Home Screen for app experience"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={promptInstall}
              className="px-3 py-1.5 rounded bg-light-primary text-white font-body text-label-md hover:bg-light-primary-container"
            >
              Install
            </button>
            <button
              type="button"
              onClick={dismissBanner}
              aria-label="Dismiss install banner"
              className="p-1.5 rounded text-dark-outline hover:text-white"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Manual Install Guide Modal for iOS Safari / browsers without native prompt */}
      {guideOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setGuideOpen(false);
          }}
          className="fixed inset-0 z-50 bg-light-scrim/50 backdrop-blur-[1px] flex items-center justify-center p-4 no-print animate-fade-in"
        >
          <div className="bg-light-surface-container-lowest border border-light-outline-variant rounded-lg max-w-md w-full p-6 shadow-xl flex flex-col gap-4 animate-modal-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src="/icons/icon-192x192.png"
                  alt="Copian App Icon"
                  className="w-10 h-10 rounded-md"
                />
                <div>
                  <h3 className="font-headline text-title-lg text-light-on-surface">Install Copian B2B App</h3>
                  <p className="font-body text-body-sm text-light-on-surface-variant">Runs fullscreen like a native mobile app</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGuideOpen(false)}
                aria-label="Close install instructions"
                className="p-1 rounded hover:bg-light-surface-container-low"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {isIos ? (
              <ol className="space-y-2 font-body text-body-md text-light-on-surface-variant list-decimal pl-5">
                <li>
                  Tap the <strong className="text-light-on-surface">Share</strong> button in Safari&apos;s toolbar.
                </li>
                <li>
                  Scroll down and tap <strong className="text-light-on-surface">Add to Home Screen</strong>.
                </li>
                <li>
                  Tap <strong className="text-light-on-surface">Add</strong> to launch Copian B2B from your home screen.
                </li>
              </ol>
            ) : (
              <ol className="space-y-2 font-body text-body-md text-light-on-surface-variant list-decimal pl-5">
                <li>
                  Open your browser menu (<strong className="text-light-on-surface">⋮</strong> on Android Chrome or Edge address bar icon).
                </li>
                <li>
                  Select <strong className="text-light-on-surface">Install app</strong> or <strong className="text-light-on-surface">Add to Home screen</strong>.
                </li>
                <li>
                  Confirm to install Copian B2B directly on your home screen &amp; app drawer.
                </li>
              </ol>
            )}

            <button
              type="button"
              onClick={() => setGuideOpen(false)}
              className="px-4 py-2 rounded bg-light-primary text-light-on-primary font-body text-label-md hover:bg-light-primary-container self-end"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </PwaInstallContext.Provider>
  );
}

export function usePwaInstall() {
  return useContext(PwaInstallContext);
}
