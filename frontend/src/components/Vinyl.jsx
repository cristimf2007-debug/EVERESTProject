import React from "react";
import { mediaUrl } from "@/lib/api";

// Vinyl realist: șanțuri fine, reflexie anizotropică care se rotește, etichetă cu cover, ax
export default function Vinyl({ cover, title, spinning }) {
  return (
    <div className={`vinyl vinyl-spin ${spinning ? "" : "vinyl-paused"}`} data-testid="live-vinyl">
      <div className="vinyl-grooves" aria-hidden="true" />
      <div className="vinyl-sheen" aria-hidden="true" />
      <div className="vinyl-label">
        <img src={mediaUrl(cover) || "/logo-alt.png"} alt={title || "BIOXIC"} data-testid="live-cover" />
      </div>
      <span className="vinyl-hole" aria-hidden="true" />
    </div>
  );
}
