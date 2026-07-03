import { useEffect } from "react";

export default function Popunder() {
  useEffect(() => {
    const src = "https://pl30188524.effectivecpmnetwork.com/db/e7/bd/dbe7bdf663c76816965f8eac3253dfab.js";

    // Prevent duplicate loading if script already exists in head
    if (document.querySelector(`script[src="${src}"]`)) {
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    document.head.appendChild(script);

    return () => {
      const existingScript = document.querySelector(`script[src="${src}"]`);
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  return null;
}