import React, { useEffect, useState } from "react";

export default function WinterIntro() {
  const [show, setShow] = useState(() => !sessionStorage.getItem("bioxic_wintro"));

  useEffect(() => {
    if (!show) return;
    sessionStorage.setItem("bioxic_wintro", "1");
    const t = setTimeout(() => setShow(false), 2100);
    return () => clearTimeout(t);
  }, [show]);

  if (!show) return null;
  return (
    <div className="wintro" aria-hidden="true" data-testid="winter-intro">
      <b>BIOXIC</b>
    </div>
  );
}
