import React, { useEffect, useMemo, useState } from "react";
import { Play, Pause, Headphones, ListMusic, Flame, Mic2 } from "lucide-react";
import api, { mediaUrl } from "@/lib/api";
import { useRadio } from "@/context/RadioContext";
import ShareButton from "@/components/ShareButton";
import Equalizer from "@/components/Equalizer";
import LyricsModal from "@/components/LyricsModal";

function fmt(sec) {
  if (!sec || !isFinite(sec)) return "";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const genreLabel = (g) => {
  const m = { remix: "Remix", mashup: "Mashup", manea: "Manele", manele: "Manele", cover: "Cover AI", trap: "Trap-Manele", pop: "Balkan Pop" };
  return m[(g || "").toLowerCase()] || (g || "Manea").toUpperCase();
};

// Rând din deck-ul de stream: număr mare, vinil care iese la hover, wave preview, acțiuni rapide
function DeckRow({ t, num }) {
  const { current, mode, playing, playTrack, toggle } = useRadio();
  const [likes, setLikes] = useState(t.likes || 0);
  const [fired, setFired] = useState(false);
  const [lyricsOpen, setLyricsOpen] = useState(false);
  const isCurrent = current?.id === t.id;
  const inTrackMode = isCurrent && mode === "track";
  const isPlayingThis = inTrackMode && playing;

  const onPlay = () => (inTrackMode ? toggle() : playTrack(t));
  const onFire = async (e) => {
    e.stopPropagation();
    if (fired) return;
    setFired(true);
    setLikes((l) => l + 1);
    try {
      const r = await api.post(`/tracks/${t.id}/like`);
      if (typeof r.data?.likes === "number") setLikes(r.data.likes);
    } catch { /* rămâne optimist */ }
  };

  return (
    <div
      className={`deck-row group ${inTrackMode ? "current" : ""} ${isPlayingThis ? "playing" : ""}`}
      onClick={onPlay}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPlay(); } }}
      data-testid={`track-card-${t.id}`}
      data-cursor="PLAY"
      aria-label={`Redă ${t.title}`}
    >
      <span className="deck-num">{String(num).padStart(2, "0")}</span>

      {/* cover + vinilul care slidează la hover */}
      <span className="deck-disc-wrap" aria-hidden="true">
        <span className="deck-disc" />
        <img src={mediaUrl(t.cover_url) || "/logo-alt.png"} alt="" loading="lazy"
          className={`deck-cover ${t.cover_url ? "object-cover" : "object-contain p-2.5"}`} />
      </span>

      {/* titlu + artist + wave preview la hover */}
      <span className="min-w-0">
        <span className="flex items-center gap-2.5">
          <span className="font-semibold text-sm leading-snug truncate">{t.title}</span>
          <Equalizer playing={isPlayingThis} bars={4} className={`h-3 shrink-0 deck-eq ${isPlayingThis ? "!opacity-100" : ""}`} />
        </span>
        <span className="block text-[10px] font-mono-x uppercase tracking-[0.14em] text-[var(--text-2)] mt-1 truncate">
          {t.artist || "BIOXIC"}
        </span>
      </span>

      <span className="deck-tag deck-hide-sm">{genreLabel(t.genre)}</span>
      <span className="deck-meta deck-hide-sm"><Headphones size={11} /> {t.plays || 0}</span>
      <span className="deck-meta deck-hide-sm">{fmt(t.duration)}</span>

      {/* acțiuni rapide — nu declanșează play-ul rândului */}
      <span className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
        {t.lyrics ? (
          <button className="knob knob-sm !w-9 !h-9" onClick={() => setLyricsOpen(true)} aria-label={`Versuri ${t.title}`} data-testid={`track-lyrics-${t.id}`}>
            <Mic2 />
          </button>
        ) : null}
        <button className={`knob knob-sm !w-9 !h-9 ${fired ? "!text-[var(--accent-hi)] !border-[rgba(255,160,80,.5)]" : ""}`} onClick={onFire} aria-label={`Apreciază ${t.title}`} data-testid={`track-fire-${t.id}`}>
          <Flame />
          {likes > 0 && <span className="absolute -bottom-1 -right-1 text-[8px] font-mono-x bg-black/80 rounded-full px-1 border border-[var(--edge)]">{likes}</span>}
        </button>
        <ShareButton track={t} testid={`track-share-${t.id}`} />
        <button className="knob !w-11 !h-11" style={{ color: "var(--flame)" }} onClick={onPlay} aria-label={isPlayingThis ? `Pauză ${t.title}` : `Redă ${t.title}`} data-testid={`track-play-${t.id}`}>
          {isPlayingThis ? <Pause fill="currentColor" /> : <Play fill="currentColor" className="ml-0.5" />}
        </button>
      </span>

      {lyricsOpen && <LyricsModal track={t} onClose={() => setLyricsOpen(false)} />}
    </div>
  );
}

// Piese — deck de stream numerotat, grupat pe playlisturi; „embedded" = secțiune în pagina Muzică
export default function Piese({ embedded = false }) {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState("toate");

  useEffect(() => {
    api.get("/tracks")
      .then((r) => setTracks(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const groups = useMemo(() => {
    const map = new Map();
    for (const t of tracks) {
      const key = (t.playlist || "").trim() || "Single-uri";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(t);
    }
    return [...map.entries()];
  }, [tracks]);

  const visible = active === "toate" ? groups : groups.filter(([name]) => name === active);
  let counter = 0; // numerotare continuă pe tot deck-ul

  return (
    <div data-testid="piese-page" className={embedded ? "" : "max-w-4xl mx-auto px-4 sm:px-8 py-6 sm:py-8"}>
      {!embedded && (
        <div className="flex flex-wrap items-end justify-between gap-4 rv">
          <div>
            <p className="badge-engraved">Arhiva · Direct din seif</p>
            <h2 className="font-display text-4xl sm:text-5xl uppercase tracking-tight mt-2">
              Piese <span className="text-[var(--flame)]">({tracks.length})</span>
            </h2>
            <p className="text-[var(--text-2)] text-sm mt-3 max-w-xl">
              Apasă play pentru ascultare individuală. Când piesa se termină, revii automat la radioul live 24/7.
            </p>
          </div>
          <span className="flex items-center gap-2 text-[10px] font-mono-x uppercase tracking-widest text-[var(--text-3)]">
            <Headphones size={13} /> Calitate originală · direct din seif
          </span>
        </div>
      )}

      {/* filtre playlist */}
      {groups.length > 1 && (
        <div className="flex flex-wrap gap-2 mt-7" data-testid="playlist-filters">
          {["toate", ...groups.map(([name]) => name)].map((name) => (
            <button
              key={name}
              data-testid={`playlist-filter-${name === "toate" ? "toate" : name}`}
              onClick={() => setActive(name)}
              className={`rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-widest transition-colors border ${
                active === name
                  ? "border-transparent text-[#140800]"
                  : "border-[var(--edge)] text-[var(--text-2)] hover:text-[var(--text)] hover:border-[var(--edge-hi)]"
              }`}
              style={active === name ? { background: "linear-gradient(180deg, var(--flame), var(--flame-deep))" } : {}}
            >
              {name === "toate" ? "Toate" : name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid gap-3 mt-10">
          {[0, 1, 2].map((i) => (
            <div key={i} className="glass rounded-2xl h-[76px] animate-pulse" />
          ))}
        </div>
      ) : tracks.length === 0 ? (
        <div className="ob-card p-14 text-center mt-10" data-testid="piese-empty">
          <p className="font-display text-xl uppercase">Nicio piesă încă</p>
          <p className="text-[var(--text-2)] text-sm mt-2">Prima piesă urcă în curând. Revino!</p>
        </div>
      ) : (
        visible.map(([name, list]) => (
          <section key={name} className="mt-10" data-testid={`playlist-group-${name}`}>
            <h3 className="font-display text-base sm:text-lg uppercase flex items-center gap-2.5 px-2">
              <ListMusic size={17} className="text-[var(--flame)]" />
              {name}
              <span className="text-[10px] font-mono-x text-[var(--text-3)] tracking-widest">{list.length} {list.length === 1 ? "piesă" : "piese"}</span>
            </h3>
            <div className="mt-3 space-y-1" data-testid={`deck-${name}`}>
              {list.map((t) => {
                counter += 1;
                return <DeckRow key={t.id} t={t} num={counter} />;
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
