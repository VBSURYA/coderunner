import { useEffect, useRef } from "react";

export default function NativeBanner() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const script = document.createElement("script");

    script.src =
      "https://pl30188525.effectivecpmnetwork.com/9109b54ae6d24d60cdfd913c403a6e09/invoke.js";

    script.async = true;
    script.setAttribute("data-cfasync", "false");

    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, []);

  return (
    <div ref={containerRef} id="container-9109b54ae6d24d60cdfd913c403a6e09"></div>
  );
}