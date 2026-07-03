import { useEffect } from "react";

export default function NativeBanner() {
  useEffect(() => {
    const container = document.getElementById(
      "container-9109b54ae6d24d60cdfd913c403a6e09"
    );

    if (!container) return;

    const script = document.createElement("script");

    script.src =
      "https://pl30188525.effectivecpmnetwork.com/9109b54ae6d24d60cdfd913c403a6e09/invoke.js";

    script.async = true;
    script.setAttribute("data-cfasync", "false");

    container.appendChild(script);
  }, []);

  return (
    <div id="container-9109b54ae6d24d60cdfd913c403a6e09"></div>
  );
}