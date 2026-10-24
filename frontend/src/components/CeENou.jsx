import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Music2, Clapperboard, Check, Sparkles } from "lucide-react";
import api, { mediaUrl } from "@/lib/api";

const KEY = "bioxic_last_visit";

// „De la ultima vizită" — piese/clipuri noi de când ai fost ultima dată; cu „Am văzut"
export default function CeENou() {
  const [items, setItems] = useState(null);

  useEffect(() => {
    let last = null;
    try { last = localStorage.getItem(KEY); } catch { /* storage blocat */ }
    const now = new Date().toISOString();
    const markNow = () => { try { localStorage.setItem(KEY, now); } catch { /* storage blocat */ } };

    if (!last) { markNow(); setItems([]); return; }

    Promise.all([
      api.get("/tracks").catch(() => ({ data: [] })),
      api.get("/videos").catch(() => ({ data: [] })),
    ]).then(([tr, vr]) => {
      const since = new Date(last).getTime();
      const nt = (tr.data || []).filter((t) => Date.parse(t.created_at || "") > since);
      const nv = (vr.data || []).filter((v) => Date.parse(v.created_at || "") > since);
      window.dispatchEvent(new CustomEvent("bioxic:new-counts", { detail: { muzica: nt.length, video: nv.length } }));
      const list = [
        ...nv.map((v) => ({ kind: "video", id: v.id, title: v.title, cover: v.thumb_url, to: `/clipuri/${v.id}` })),
        ...nt.map((t) => ({ kind: "track", id: t.id, title: t.title, cover: t.cover_url, to: "/muzica/piese" })),
      ].slice(0, 8);
      setItems(list);
    });
  }, []);

  const markSeen = () => {
    try { localStorage.setItem(KEY, new Date().toISOString()); } catch { /* storage blocat */ }
    window.dispatchEvent(new CustomEvent("bioxic:new-counts", { detail: { muzica: 0, video: 0 } }));
    setItems([]);
  };

  if (!items || !items.length) return null;

  return (
    <section className="max-w-[1240px] mx-auto px-4 sm:px-8 mt-6" data-testid="whats-new">
      <div className="ob-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2.5 font-display text-base sm:text-lg uppercase">
            <Sparkles size={16} className="text-[var(--flame)]" /> De la ultima vizită
          </p>
          <button onClick={markSeen} className="btn-steel !h-9 !px-4 !text-[10px]" data-testid="whats-new-seen">
            <Check size={12} /> Am văzut
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-4">
          {items.map((it) => (
            <Link key={`${it.kind}-${it.id}`} to={it.to} className="queue-row flex items-center gap-3 rounded-xl border border-[var(--edge)] px-3 py-2.5 min-w-0" data-testid={`whats-new-${it.kind}-${it.id}`}>
              <img src={mediaUrl(it.cover) || "/logo-alt.png"} alt="" loading="lazy" className={`object-cover shrink-0 ${it.kind === "video" ? "w-14 h-9 rounded-lg" : "w-9 h-9 rounded-lg"}`} />
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold truncate">{it.title}</span>
                <span className="flex items-center gap-1 text-[8px] font-mono-x uppercase tracking-widest text-[var(--text-3)] mt-0.5">
                  {it.kind === "video" ? <><Clapperboard size={9} /> Clip nou</> : <><Music2 size={9} /> Piesă nouă</>}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
