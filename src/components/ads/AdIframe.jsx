import { useEffect, useRef } from "react";

export default function AdIframe({
  adKey,
  width,
  height,
}) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;

    ref.current.innerHTML = "";

    window.atOptions = {
      key: adKey,
      format: "iframe",
      width,
      height,
      params: {},
    };

    const script = document.createElement("script");

    script.src = `https://www.highperformanceformat.com/${adKey}/invoke.js`;

    script.async = true;

    ref.current.appendChild(script);
  }, [adKey, width, height]);

  return <div ref={ref} />;
}