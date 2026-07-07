import React, { useContext } from 'react';
import { ConsentContext } from '../context/ConsentContext';

function loadScript(src: string, attrs: Record<string, string> = {}) {
  const s = document.createElement('script');
  s.src = src;
  s.async = true;
  Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
  document.head.appendChild(s);
}

function fireAnalytics() {
  // Google Analytics 4
  loadScript('https://www.googletagmanager.com/gtag/js?id=G-FSRC0QYPZ8');
  (window as any).dataLayer = (window as any).dataLayer || [];
  const gtag = (...args: any[]) => { (window as any).dataLayer.push(args); };
  gtag('js', new Date());
  gtag('config', 'G-FSRC0QYPZ8');

  // Google Tag Manager
  (() => {
    const w = window as any;
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    loadScript('https://www.googletagmanager.com/gtm.js?id=GTM-5TK8K27H&l=dataLayer');
  })();

  // Ahrefs analytics
  loadScript('https://analytics.ahrefs.com/analytics.js', { 'data-key': 'd8Po74rUYNcrHGAvFgv3sQ' });

  // Google Adsense
  loadScript(
    'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5673387170560268',
    { crossorigin: 'anonymous' }
  );
}

export const ConsentBanner: React.FC = () => {
  const { consentGiven, setConsentGiven } = useContext(ConsentContext);

  if (consentGiven) return null;

  const handleAccept = () => {
    setConsentGiven(true);
    fireAnalytics();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cookie consent"
      className="fixed bottom-4 left-4 right-4 md:left-4 md:right-auto md:max-w-sm z-[9999] bg-[#1e1e1e]/95 backdrop-blur-lg border border-[#333] rounded-xl p-4 shadow-2xl text-[#cccccc] text-xs leading-relaxed"
    >
      <p className="mb-3 text-[#aaaaaa]">
        We use cookies and similar tracking technologies to improve your experience, serve ads, and analyse traffic.
        By continuing to use this site, you agree to our use of these technologies.
      </p>
      <div className="flex items-center gap-3">
        <button
          id="consent-accept-btn"
          onClick={handleAccept}
          className="px-4 py-1.5 bg-[#007acc] hover:bg-[#005a96] active:bg-[#004e82] text-white text-xs font-semibold rounded transition-colors duration-150"
        >
          Got it
        </button>
        <a
          href="/privacy"
          className="text-[#007acc] hover:underline text-xs"
        >
          Privacy Policy
        </a>
      </div>
    </div>
  );
};
