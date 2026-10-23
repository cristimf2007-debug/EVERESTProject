import React, { useEffect, useRef, useState } from "react";
import { Share2, MessageCircle, Music2, Link2 } from "lucide-react";
import { toast } from "sonner";
import { API } from "@/lib/api";

// Partajare piesă — WhatsApp direct, TikTok prin link copiat (OG cu cover)
export default function ShareButton({ track, className = "", testid = "share-button" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  if (!track) return null;
  const url = `${API}/share/${track.slug || track.id}`;
  const text = `BIOXIC — ${track.title} · ascultă în seif`;

  const copyLink = (where) => {
    navigator.clipboard?.writeText(url).then(() => {
      toast.success("Link copiat!", { description: where === "tiktok" ? "Lipește-l în TikTok — apare cu cover-ul piesei." : url });
    }).catch(() => {});
    setOpen(false);
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        data-testid={testid}
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="btn-ghost grid w-9 h-9 rounded-full place-items-center"
        aria-label="Distribuie piesa"
      >
        <Share2 size={15} />
      </button>
      {open && (
        <div className="absolute bottom-11 right-0 z-50 glass rounded-2xl p-2 w-48 grid gap-1" data-testid={`${testid}-menu`}>
          <a
            data-testid={`${testid}-whatsapp`}
            href={`https://wa.me/?text=${encodeURIComponent(text + "\n" + url)}`}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm hover:bg-white/5 transition-colors"
          >
            <MessageCircle size={15} className="text-[#25D366]" /> WhatsApp
          </a>
          <button
            data-testid={`${testid}-tiktok`}
            onClick={(e) => { e.stopPropagation(); copyLink("tiktok"); }}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm hover:bg-white/5 transition-colors text-left"
          >
            <Music2 size={15} className="text-[var(--ice)]" /> TikTok
          </button>
          <button
            data-testid={`${testid}-copy`}
            onClick={(e) => { e.stopPropagation(); copyLink(); }}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm hover:bg-white/5 transition-colors text-left"
          >
            <Link2 size={15} className="text-[var(--accent)]" /> Copiază link
          </button>
        </div>
      )}
    </div>
  );
}
