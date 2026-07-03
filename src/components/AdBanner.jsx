import React, { useEffect, useRef } from "react";

const AD_OPTIONS = {
  key: "626d2c0e2785e210e34e35ddc2199030",
  format: "iframe",
  height: 250,
  width: 300,
  params: {},
};

export default function AdBanner() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    container.innerHTML = "";
    window.atOptions = AD_OPTIONS;

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src =
      "https://www.highperformanceformat.com/626d2c0e2785e210e34e35ddc2199030/invoke.js";
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, []);

    useEffect(() => {
    const script = document.createElement("script");

    script.src =
      "https://pl30188525.effectivecpmnetwork.com/9109b54ae6d24d60cdfd913c403a6e09/invoke.js";

    script.async = true;
    script.setAttribute("data-cfasync", "false");

    document
      .getElementById("container-9109b54ae6d24d60cdfd913c403a6e09")
      ?.appendChild(script);
  }, []);


  useEffect(() => {
    if (!containerRef.current) return;

    // First script
    const optionsScript = document.createElement("script");
    optionsScript.innerHTML = `
      atOptions = {
        'key' : 'c643744c99b4c00af9d1f5f9a3313547',
        'format' : 'iframe',
        'height' : 60,
        'width' : 468,
        'params' : {}
      };
    `;

    // Second script
    const invokeScript = document.createElement("script");
    invokeScript.src = "https://www.highperformanceformat.com/c643744c99b4c00af9d1f5f9a3313547/invoke.js";
    invokeScript.async = true;

    containerRef.current.appendChild(optionsScript);
    containerRef.current.appendChild(invokeScript);
  }, []);


    useEffect(() => {
    if (!containerRef.current) return;

    // First script
    const optionsScript = document.createElement("script");
    optionsScript.innerHTML = `
      atOptions = {
        'key' : '626d2c0e2785e210e34e35ddc2199030',
        'format' : 'iframe',
        'height' : 60,
        'width' : 468,
        'params' : {}
      };
    `;

    // Second script
    const invokeScript = document.createElement("script");
    invokeScript.src = "https://www.highperformanceformat.com/626d2c0e2785e210e34e35ddc2199030/invoke.js";
    invokeScript.async = true;

    containerRef.current.appendChild(optionsScript);
    containerRef.current.appendChild(invokeScript);
  }, []);


    useEffect(() => {
    if (!containerRef.current) return;

    // First script
    const optionsScript = document.createElement("script");
    optionsScript.innerHTML = `
      atOptions = {
        'key' : '3484b2c2d0ccf03f0cd5c846230cd8a4',
        'format' : 'iframe',
        'height' : 60,
        'width' : 468,
        'params' : {}
      };
    `;

    // Second script
    const invokeScript = document.createElement("script");
    invokeScript.src = "https://www.highperformanceformat.com/3484b2c2d0ccf03f0cd5c846230cd8a4/invoke.js";
    invokeScript.async = true;

    containerRef.current.appendChild(optionsScript);
    containerRef.current.appendChild(invokeScript);
  }, []);

   useEffect(() => {
    if (!containerRef.current) return;

    // First script
    const optionsScript = document.createElement("script");
    optionsScript.innerHTML = `
      atOptions = {
        'key' : '1675757818a3c089068b7e687b2ce98b',
        'format' : 'iframe',
        'height' : 60,
        'width' : 468,
        'params' : {}
      };
    `;

    // Second script
    const invokeScript = document.createElement("script");
    invokeScript.src = "https://www.highperformanceformat.com/1675757818a3c089068b7e687b2ce98b/invoke.js";
    invokeScript.async = true;

    containerRef.current.appendChild(optionsScript);
    containerRef.current.appendChild(invokeScript);
  }, []);

   useEffect(() => {
    if (!containerRef.current) return;

    // First script
    const optionsScript = document.createElement("script");
    optionsScript.innerHTML = `
      atOptions = {
        'key' : 'ca3fbd14fd4e9972a8a2959e42b6f1ab',
        'format' : 'iframe',
        'height' : 60,
        'width' : 468,
        'params' : {}
      };
    `;

    // Second script
    const invokeScript = document.createElement("script");
    invokeScript.src = "https://www.highperformanceformat.com/ca3fbd14fd4e9972a8a2959e42b6f1ab/invoke.js";
    invokeScript.async = true;

    containerRef.current.appendChild(optionsScript);
    containerRef.current.appendChild(invokeScript);
  }, []);


     useEffect(() => {
    if (!containerRef.current) return;

    // First script
    const optionsScript = document.createElement("script");
    optionsScript.innerHTML = `
      atOptions = {
        'key' : 'c5f65723fbe2967d76324513a72f4f3a',
        'format' : 'iframe',
        'height' : 60,
        'width' : 468,
        'params' : {}
      };
    `;

    // Second script
    const invokeScript = document.createElement("script");
    invokeScript.src = "https://www.highperformanceformat.com/c5f65723fbe2967d76324513a72f4f3a/invoke.js";
    invokeScript.async = true;

    containerRef.current.appendChild(optionsScript);
    containerRef.current.appendChild(invokeScript);
  }, []);


  return (
    <div
      className="fixed bottom-8 right-4 z-40 hidden xl:block"
      style={{ width: 300, height: 250 }}
      aria-label="Advertisement"
    >
      <div ref={containerRef} />
       <div id="container-9109b54ae6d24d60cdfd913c403a6e09"></div>
    </div>
  );
}
