import { useEffect } from "react";

export default function Popunder() {
  useEffect(() => {
    const script = document.createElement("script");

    script.src =
      "https://pl30188524.effectivecpmnetwork.com/db/e7/bd/dbe7bdf663c76816965f8eac3253dfab.js";

    script.async = true;

    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return null;
}