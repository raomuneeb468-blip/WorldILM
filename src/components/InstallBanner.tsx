import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).deferredPwaPrompt = e;
      // Show the banner slightly delayed
      setTimeout(() => setShowBanner(true), 3500);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  useEffect(() => {
    // For iOS detection and showing a message
    const isIos = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };
    const isInStandaloneMode = () => 
      (('standalone' in window.navigator) && (window.navigator as any).standalone) || 
      window.matchMedia('(display-mode: standalone)').matches;
      
    if (isInStandaloneMode()) {
      return; // Do not show install banner if already installed
    }
    
    if (isIos()) {
      setTimeout(() => setShowBanner(true), 4000);
    }
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      // iOS fallback
      alert('Tap Share -> "Add to Home Screen" to install!');
      setShowBanner(false);
    }
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 p-4 flex items-center gap-4 z-[8000] shadow-[0_-4px_28px_rgba(0,0,0,0.1)]"
        >
          <div className="w-12 h-12 rounded-xl bg-white border border-zinc-200 flex items-center justify-center shrink-0 shadow-xs">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="install-banner-grad" x1="4" y1="6" x2="28" y2="26" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="#4f6bf0" />
                  <stop offset="1" stopColor="#17c3e6" />
                </linearGradient>
              </defs>
              <path 
                d="M5 9 L10.5 24 L16 13 L21.5 24 L27 9"
                stroke="url(#install-banner-grad)" 
                strokeWidth="3.4"
                strokeLinecap="round" 
                strokeLinejoin="round" 
                fill="none"
              />
              <circle 
                cx="16" 
                cy="6" 
                r="2.1" 
                fill="url(#install-banner-grad)"
              />
            </svg>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-zinc-900 dark:text-white">Install WorldILM AI</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Add to home screen for the best experience</div>
          </div>
          
          <button
            onClick={handleInstall}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4f6bf0] to-[#17c3e6] text-white text-xs font-bold shrink-0 transition-all shadow-lg shadow-[#4f6bf0]/25 hover:opacity-90 active:scale-95"
          >
            Install
          </button>
          
          <button
            onClick={() => setShowBanner(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 shrink-0 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
