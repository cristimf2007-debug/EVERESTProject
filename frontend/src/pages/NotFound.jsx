import React from "react";
import { Link } from "react-router-dom";
import { Ghost } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] grid place-items-center px-4 relative z-10" data-testid="not-found-page">
      <div className="text-center">
        <Ghost size={44} className="mx-auto text-[var(--accent)] opacity-80" />
        <p className="font-display text-6xl sm:text-8xl mt-6 title-distressed text-[var(--frost)]" data-testid="not-found-code">404</p>
        <p className="font-mono-x text-[11px] uppercase tracking-[0.3em] text-[var(--accent)] mt-3">Pagina asta nu există</p>
        <p className="text-sm text-[var(--mist)] mt-3 max-w-xs mx-auto">
          Ai rătăcit prin seif. Radioul însă cântă non-stop — hai înapoi la muzică.
        </p>
        <Link to="/" className="btn-x gold mt-8 !py-3 !px-7 text-xs font-black uppercase tracking-[0.2em]" data-testid="not-found-home">
          Înapoi la Live 24/7
        </Link>
      </div>
    </div>
  );
}
