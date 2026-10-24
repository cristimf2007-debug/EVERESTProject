import React, { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Send, Users, Heart, LogIn, MessageCircle, X, ArrowDown, CornerUpLeft, Smile, Music2 } from "lucide-react";
import { toast } from "sonner";
import { WS_URL, mediaUrl } from "@/lib/api";
import { useFan } from "@/context/FanContext";
import { useRadio } from "@/context/RadioContext";

const REACTION_META = {
  heart: { emoji: "🎃" },
  fire: { emoji: "🔥" },
  crown: { emoji: "💀" },
};
const MAX_MSGS = 200; // fereastra de mesaje ținută în memorie/DOM
const MAX_LEN = 200;
const BACKOFF = [1000, 2000, 5000, 10000];
const EMOJI_SET = ["😂", "🔥", "❤️", "🎃", "💀", "👑", "🙌", "💯"];

const NAME_COLORS = ["#FF7A1A", "#8cc7a8", "#bfe3ff", "#f0a4c0", "#ffd28c", "#a8e6cf", "#e3b8ff"];
const nameColor = (name) => {
  let h = 0;
  for (let i = 0; i < (name || "").length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return NAME_COLORS[h % NAME_COLORS.length];
};
const badgeFor = (name) => ((name || "").toLowerCase() === "bioxic" ? " 👑" : " 🎃");

function Avatar({ picture, name, size = 28 }) {
  if (picture) {
    return <img src={mediaUrl(picture)} alt={name} loading="lazy" className="rounded-full object-cover shrink-0 ring-1 ring-[var(--edge-hi)]" style={{ width: size, height: size }} />;
  }
  return (
    <span
      className="grid rounded-full place-items-center font-black shrink-0 text-[#140800]"
      style={{ width: size, height: size, fontSize: size * 0.38, background: "linear-gradient(180deg, var(--accent-hi), var(--flame))" }}
    >
      {(name || "F")[0].toUpperCase()}
    </span>
  );
}

// text cu @mențiuni evidențiate
function RichText({ text }) {
  const parts = String(text).split(/(@\S+)/g);
  return (
    <p className="text-sm text-[var(--text)]/90 break-words leading-snug mt-0.5">
      {parts.map((p, i) =>
        p.startsWith("@") ? <span key={i} className="font-semibold" style={{ color: "var(--flame)" }}>{p}</span> : p
      )}
    </p>
  );
}

// rând memoizat — reacțiile/numărătoarele nu re-randează mesajele
const ChatRow = memo(function ChatRow({ m, myName, onReply, onLike, liked }) {
  if (m.type === "sys") {
    return (
      <p className="chat-msg text-center py-1">
        <span className="text-[10px] font-mono-x text-[var(--text-3)] bg-white/[0.03] rounded-full px-3 py-1">{m.text}</span>
      </p>
    );
  }
  if (m.type === "moment") {
    // „Moment": separator la schimbarea piesei, cu cover
    return (
      <div className="chat-msg flex items-center gap-3 py-2.5" data-testid={`chat-moment-${m.id}`}>
        <span className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, rgba(var(--flame-rgb),.35))" }} />
        <img src={mediaUrl(m.cover) || "/logo-alt.png"} alt="" className="w-8 h-8 rounded-full object-cover ring-1 ring-[rgba(var(--flame-rgb),.4)]" loading="lazy" />
        <span className="text-[9px] font-mono-x uppercase tracking-[0.16em] text-[var(--text-2)] text-center">
          Acum: <span className="text-[var(--flame)]">{m.title}</span>
        </span>
        <span className="h-px flex-1" style={{ background: "linear-gradient(270deg, transparent, rgba(var(--flame-rgb),.35))" }} />
      </div>
    );
  }
  const color = nameColor(m.name);
  const isMention = myName && (m.text || "").toLowerCase().includes(`@${myName.toLowerCase()}`);
  let touchX = null;
  return (
    <div
      className={`chat-msg group relative flex items-start gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-white/[0.03] ${m.pending ? "opacity-50" : ""} ${isMention ? "mention-hi" : ""}`}
      data-testid={`chat-message-${m.id}`}
      onTouchStart={(e) => { touchX = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchX == null) return;
        if (e.changedTouches[0].clientX - touchX > 64) onReply(m); // swipe dreapta → reply (mobil)
        touchX = null;
      }}
    >
      <Avatar picture={m.picture} name={m.name} />
      <div className="min-w-0 flex-1 chat-bubble" style={{ "--bc": color }}>
        <div className="flex items-baseline gap-2">
          <span className="text-[12px] font-semibold" style={{ color }}>
            {m.name}
            <span className="text-[11px]" title={(m.name || "").toLowerCase() === "bioxic" ? "BIOXIC" : "Halloween 2026"}>{badgeFor(m.name)}</span>
          </span>
          {m.ts && (
            <span className="text-[9px] font-mono-x text-[var(--text-3)] opacity-0 group-hover:opacity-100 transition-opacity">
              {new Date(m.ts).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <span className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button type="button" onClick={() => onReply(m)} aria-label={`Răspunde lui ${m.name}`} className="p-1.5 text-[var(--text-3)] hover:text-[var(--flame)] transition-colors" data-testid={`chat-reply-${m.id}`}>
              <CornerUpLeft size={12} />
            </button>
            <button type="button" onClick={() => onLike(m)} aria-label="Apreciază mesajul" className={`p-1.5 transition-colors ${liked ? "text-[var(--live)]" : "text-[var(--text-3)] hover:text-[var(--live)]"}`} data-testid={`chat-like-${m.id}`}>
              <Heart size={12} fill={liked ? "currentColor" : "none"} />
            </button>
          </span>
        </div>
        <RichText text={m.text} />
      </div>
    </div>
  );
});

// Chat live — panou de sticlă pe desktop, bottom sheet pe mobil, coloană în camera live (inRoom).
// Performanță: buffer + flush o dată pe frame, max 200 mesaje, WS unic cu backoff, send optimistic.
export default function LiveChat({ inRoom = false }) {
  const { me, setLoginOpen } = useFan();
  const { liveInfo, queue } = useRadio();
  const [messages, setMessages] = useState([]);
  const [viewers, setViewers] = useState(0);
  const [likes, setLikes] = useState(0);
  const [floats, setFloats] = useState([]);
  const [name, setName] = useState(() => localStorage.getItem("bioxic_name") || "");
  const [nameSet, setNameSet] = useState(() => !!localStorage.getItem("bioxic_name"));
  const [text, setText] = useState("");
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [blocked, setBlocked] = useState(""); // „kicked" / „banned" — oprim reconectarea
  const [open, setOpen] = useState(false); // sheet pe mobil
  const [newCount, setNewCount] = useState(0);
  const [burst, setBurst] = useState(false); // la rafale mari oprim animația de intrare per mesaj
  const [replyTo, setReplyTo] = useState(null);
  const [likedIds, setLikedIds] = useState(() => new Set());
  const [cereOpen, setCereOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);

  const wsRef = useRef(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const bufferRef = useRef([]);
  const flushScheduled = useRef(false);
  const atBottomRef = useRef(true);
  const seenRef = useRef(new Set());
  const pendingRef = useRef([]);
  const reactTimesRef = useRef([]);
  const needScrollRef = useRef(false);
  const flushedRef = useRef(0);
  const rateRef = useRef([]);

  // flush o singură dată pe frame de animație — nu un re-render per mesaj
  const flush = useCallback(() => {
    flushScheduled.current = false;
    const batch = bufferRef.current;
    if (!batch.length) return;
    bufferRef.current = [];
    flushedRef.current = batch.length;
    const now = Date.now();
    rateRef.current = rateRef.current.filter((t) => now - t < 1000).concat(batch.map(() => now));
    const isBurst = rateRef.current.length > 12;
    setBurst((b) => (b !== isBurst ? isBurst : b));
    // confirmarea mesajelor optimistic: ecoul serverului înlocuiește copia locală
    const ops = [];
    for (const b of batch) {
      if (b.type === "message") {
        const pi = pendingRef.current.findIndex((p) => p.name === b.name && p.text === b.text);
        if (pi !== -1) {
          ops.push({ replace: pendingRef.current[pi].id, msg: b });
          pendingRef.current.splice(pi, 1);
          continue;
        }
      }
      ops.push({ msg: b });
    }
    setMessages((ms) => {
      let next = ms;
      for (const op of ops) {
        if (op.replace) next = next.map((m) => (m.id === op.replace ? { ...op.msg, pending: false } : m));
        else next = [...next, op.msg];
      }
      return next.length > MAX_MSGS ? next.slice(next.length - MAX_MSGS) : next;
    });
    needScrollRef.current = true;
  }, []);

  const scheduleFlush = useCallback(() => {
    if (flushScheduled.current) return;
    flushScheduled.current = true;
    requestAnimationFrame(flush);
  }, [flush]);

  useEffect(() => {
    let ws;
    let stopped = false;
    let retry;
    let ping;
    let step = 0;
    const seen = seenRef.current;

    const connect = () => {
      if (stopped) return;
      if (ws && (ws.readyState === 0 || ws.readyState === 1)) return;
      ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      ws.onopen = () => {
        setConnected(true);
        setReconnecting(false);
        step = 0;
        ping = setInterval(() => {
          if (ws.readyState === 1) ws.send(JSON.stringify({ type: "ping" }));
        }, 25000);
      };
      ws.onclose = () => {
        clearInterval(ping);
        setConnected(false);
        if (!stopped) {
          setReconnecting(true);
          retry = setTimeout(connect, BACKOFF[Math.min(step, BACKOFF.length - 1)]);
          step += 1;
        }
      };
      ws.onmessage = (ev) => {
        let data;
        try { data = JSON.parse(ev.data); } catch { return; }
        if (data.type === "history") {
          // reconectare: îmbinăm istoricul cu ce e pe ecran — fără flicker/ștergeri
          const fresh = data.messages.filter((m) => !seen.has(m.id)).map((m) => { seen.add(m.id); return { ...m, type: "message" }; });
          setMessages((ms) => {
            if (!ms.length) return fresh.slice(-MAX_MSGS);
            const ids = new Set(ms.map((m) => m.id));
            const merged = [...fresh.filter((m) => !ids.has(m.id)), ...ms];
            return merged.length > MAX_MSGS ? merged.slice(merged.length - MAX_MSGS) : merged;
          });
          needScrollRef.current = true;
        } else if (data.type === "message") {
          if (data.id && seen.has(data.id)) return;
          if (data.id) { seen.add(data.id); if (seen.size > 600) seen.clear(); }
          bufferRef.current.push(data);
          scheduleFlush();
        } else if (data.type === "viewers") setViewers(data.count);
        else if (data.type === "like_count") setLikes(data.total);
        else if (data.type === "error") {
          // rate-limit / mute / blocare — serverul refuză mesajul, retragem copia optimistic
          toast.error(data.detail || "Mesajul nu a fost trimis.");
          const last = pendingRef.current.pop();
          if (last) setMessages((ms) => ms.filter((m) => m.id !== last.id));
        } else if (data.type === "kicked") {
          stopped = true;
          setBlocked("Un moderator te-a scos de pe chat. Sesiunea s-a închis.");
          try { ws.close(); } catch { /* deja închis */ }
        } else if (data.type === "banned") {
          stopped = true;
          setBlocked("Contul tău a fost suspendat de pe chat.");
          try { ws.close(); } catch { /* deja închis */ }
        } else if (data.type === "join") { bufferRef.current.push({ id: data.id, type: "sys", text: `${data.name} a intrat pe chat` }); scheduleFlush(); }
        else if (data.type === "leave") { bufferRef.current.push({ id: data.id, type: "sys", text: `${data.name} a ieșit` }); scheduleFlush(); }
        else if (data.type === "delete") setMessages((ms) => ms.filter((m) => m.id !== data.id));
        else if (data.type === "reaction" && REACTION_META[data.emoji]) {
          // reacțiile merg și către camera live (ies din vinyl + hype meter)
          window.dispatchEvent(new CustomEvent("bioxic:chat-reaction", { detail: { emoji: data.emoji } }));
          // throttle: max 8 reacții/secundă, max 20 pe ecran
          const now = Date.now();
          reactTimesRef.current = reactTimesRef.current.filter((t) => now - t < 1000);
          if (reactTimesRef.current.length < 8) {
            reactTimesRef.current.push(now);
            const id = data.id;
            setFloats((h) => [...h.slice(-19), { id, emoji: data.emoji, x: Math.random() * 44 }]);
            setTimeout(() => setFloats((h) => h.filter((x) => x.id !== id)), 2300);
          }
        }
      };
    };
    connect();
    return () => { stopped = true; clearTimeout(retry); clearInterval(ping); ws?.close(); };
  }, [scheduleFlush]);

  // „Moments": separator cu cover la fiecare schimbare de piesă (nu la prima încărcare)
  const trackId = liveInfo?.track?.id;
  const lastMomentRef = useRef(null);
  useEffect(() => {
    if (!trackId) return;
    if (lastMomentRef.current === trackId) return;
    const t = liveInfo.track;
    const first = lastMomentRef.current === null;
    lastMomentRef.current = trackId;
    if (first) return;
    bufferRef.current.push({ id: `moment-${trackId}-${Date.now()}`, type: "moment", title: t.title, artist: t.artist, cover: t.cover_url });
    scheduleFlush();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackId, scheduleFlush]);

  // mesaje de sistem injectate din camera live (ex: HYPE!)
  useEffect(() => {
    const onSys = (e) => {
      bufferRef.current.push({ id: `sys-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, type: "sys", text: e.detail?.text || "🔥 HYPE!" });
      scheduleFlush();
    };
    window.addEventListener("bioxic:inject-sys", onSys);
    return () => window.removeEventListener("bioxic:inject-sys", onSys);
  }, [scheduleFlush]);

  // auto-scroll inteligent: jos doar dacă ești deja jos; altfel pastilă „X mesaje noi"
  useLayoutEffect(() => {
    if (!needScrollRef.current) return;
    needScrollRef.current = false;
    const el = listRef.current;
    if (!el) return;
    if (atBottomRef.current) el.scrollTop = el.scrollHeight;
    else setNewCount((c) => c + flushedRef.current);
  }, [messages]);

  const onScroll = () => {
    const el = listRef.current;
    if (!el) return;
    const at = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
    atBottomRef.current = at;
    if (at) setNewCount(0);
  };

  const jumpToEnd = () => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    atBottomRef.current = true;
    setNewCount(0);
  };

  // trimitere optimistic: mesajul tău apare instant, estompat până confirmă serverul
  const sendText = (t) => {
    if (!t || blocked || !wsRef.current || wsRef.current.readyState !== 1) return;
    const senderName = me?.name || name || "Fan";
    const out = replyTo ? `@${replyTo.name} ${t}` : t;
    const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    pendingRef.current.push({ id: localId, name: senderName, text: out });
    if (pendingRef.current.length > 10) pendingRef.current.shift();
    bufferRef.current.push({ id: localId, type: "message", name: senderName, text: out, picture: me?.picture, pending: true });
    scheduleFlush();
    atBottomRef.current = true;
    wsRef.current.send(JSON.stringify({ type: "message", name: senderName, text: out }));
    setText("");
    setReplyTo(null);
    setCereOpen(false);
    setTimeout(() => {
      const i = pendingRef.current.findIndex((p) => p.id === localId);
      if (i !== -1) {
        pendingRef.current.splice(i, 1);
        setMessages((ms) => ms.map((m) => (m.id === localId ? { ...m, pending: false } : m)));
      }
    }, 4000);
  };

  const send = (e) => {
    e?.preventDefault();
    sendText(text.trim().slice(0, MAX_LEN));
  };

  const onInputChange = (e) => {
    const v = e.target.value;
    setText(v);
    setCereOpen(v.startsWith("/cere"));
  };

  // /cere — cerere de piesă direct din chat, din rotația curentă
  const cereQuery = text.startsWith("/cere") ? text.slice(5).trim().toLowerCase() : "";
  const cereList = cereOpen
    ? queue.filter((t) => !cereQuery || t.title.toLowerCase().includes(cereQuery) || (t.artist || "").toLowerCase().includes(cereQuery)).slice(0, 5)
    : [];

  const onReply = (m) => {
    setReplyTo({ name: m.name });
    inputRef.current?.focus();
  };
  const onLike = (m) => {
    setLikedIds((s) => {
      const n = new Set(s);
      if (n.has(m.id)) n.delete(m.id);
      else n.add(m.id);
      return n;
    });
  };

  const tapHeart = () => { if (wsRef.current?.readyState === 1) wsRef.current.send(JSON.stringify({ type: "tap" })); };
  const react = (emoji) => { if (wsRef.current?.readyState === 1) wsRef.current.send(JSON.stringify({ type: "reaction", emoji })); };

  const saveName = (e) => {
    e.preventDefault();
    const n = name.trim().slice(0, 24);
    if (!n) return;
    localStorage.setItem("bioxic_name", n);
    setName(n);
    setNameSet(true);
  };

  // hook de stres pentru testare: injectează mesaje prin aceeași cale de batching
  useEffect(() => {
    window.__bioxicChatStress = (n = 300, perSec = 5) => {
      let i = 0;
      const t = setInterval(() => {
        for (let k = 0; k < perSec && i < n; k++, i++) {
          bufferRef.current.push({ id: `stress-${i}`, type: "message", name: `Fan${(i % 37) + 1}`, text: `mesaj de test #${i} — manele non-stop`, ts: new Date().toISOString() });
        }
        scheduleFlush();
        if (i >= n) clearInterval(t);
      }, 1000);
      return true;
    };
    return () => { delete window.__bioxicChatStress; };
  }, [scheduleFlush]);

  const myName = me?.name || name;
  const shellClass = inRoom
    ? `chat-shell chat-room ${burst ? "chat-burst" : ""}`
    : `chat-shell ${open ? "open" : ""} ${burst ? "chat-burst" : ""}`;

  return (
    <>
      {/* buton plutitor pe mobil — deschide sheet-ul de chat (nu în camera live) */}
      {!inRoom && (
        <button className="chat-fab" data-testid="chat-open-fab" onClick={() => setOpen(true)} aria-label="Deschide chatul live">
          <MessageCircle size={15} /> Chat live
          {viewers > 0 && <span className="text-[var(--flame)]">{viewers}</span>}
        </button>
      )}

      <section className={shellClass} data-testid="chat-container">
        {/* header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--edge)] bg-black/25 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[var(--live)] live-dot" />
            <h3 className="font-display text-sm font-bold uppercase tracking-[0.2em]">Chat live</h3>
            {reconnecting && (
              <span className="text-[9px] font-mono-x uppercase tracking-widest text-[var(--text-3)] animate-pulse" data-testid="chat-reconnecting">
                Se reconectează…
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono-x text-[var(--text-2)]">
            <span data-testid="chat-viewers" className="flex items-center gap-1.5"><Users size={12} /> {viewers}</span>
            <span data-testid="chat-likes" className="flex items-center gap-1.5 text-[var(--live)]"><Heart size={12} fill="currentColor" /> {likes}</span>
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-500" : "bg-[var(--live)]"}`} title={connected ? "conectat" : "reconectare…"} />
            {!inRoom && (
              <button className="lg:hidden text-[var(--text-2)] hover:text-[var(--text)] transition-colors p-2" onClick={() => setOpen(false)} aria-label="Închide chatul" data-testid="chat-close-button">
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* mesaje — bule de lumină: fără chenare, linie fină în culoarea userului, fade spre sus */}
        <div ref={listRef} onScroll={onScroll} role="log" aria-live="polite" aria-label="Mesaje chat live"
          className={`chat-scroll ${inRoom ? "flex-1 min-h-0" : "h-72 sm:h-80 max-lg:h-auto max-lg:flex-1 max-lg:min-h-[38vh]"} chat-list-mask overflow-y-auto px-4 py-4 space-y-1 relative`}
          data-testid="chat-messages" data-lenis-prevent>
          {messages.length === 0 && (
            <div className="text-center pt-24">
              <p className="font-display text-sm font-bold uppercase tracking-widest text-[var(--text-2)]">Liniște pe frecvență</p>
              <p className="text-xs text-[var(--text-3)] mt-1.5">Fii primul care spune ceva.</p>
            </div>
          )}
          {messages.map((m) => (
            <ChatRow key={m.id} m={m} myName={myName} onReply={onReply} onLike={onLike} liked={likedIds.has(m.id)} />
          ))}
          {/* reacții plutitoare — transform/opacity, throttled */}
          <div className="absolute right-4 bottom-2 pointer-events-none">
            {floats.map((f) => (
              <span key={f.id} className="heart-float absolute text-lg" style={{ right: f.x }}>
                {REACTION_META[f.emoji].emoji}
              </span>
            ))}
          </div>
          {newCount > 0 && (
            <button
              onClick={jumpToEnd}
              data-testid="chat-new-messages"
              className="sticky bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[10px] font-mono-x uppercase tracking-widest text-[#140800]"
              style={{ background: "linear-gradient(180deg, var(--flame), var(--flame-deep))", boxShadow: "0 8px 24px -8px rgba(var(--flame-rgb),.6)" }}
            >
              <ArrowDown size={11} /> {newCount} {newCount === 1 ? "mesaj nou" : "mesaje noi"}
            </button>
          )}
        </div>

        {/* reacții */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-t border-[var(--edge)] bg-black/15 shrink-0" data-testid="chat-reactions">
          <span className="text-[9px] font-mono-x uppercase tracking-[0.25em] text-[var(--text-3)] mr-auto">Dă-i drumul</span>
          <button type="button" data-testid="chat-heart-button" onClick={tapHeart} aria-label="Dovleac"
            className="grid w-11 h-11 rounded-full place-items-center text-base border border-[rgba(var(--flame-rgb),.35)] bg-[rgba(var(--flame-rgb),.08)] hover:scale-110 transition-transform">
            🎃
          </button>
          <button type="button" data-testid="chat-fire-button" onClick={() => react("fire")} aria-label="Foc"
            className="grid w-11 h-11 rounded-full place-items-center text-base border border-[rgba(255,160,80,.35)] bg-[rgba(255,160,80,.08)] hover:scale-110 transition-transform">
            🔥
          </button>
          <button type="button" data-testid="chat-crown-button" onClick={() => react("crown")} aria-label="Cranii"
            className="grid w-11 h-11 rounded-full place-items-center text-base border border-[rgba(255,59,48,.4)] bg-[rgba(255,59,48,.1)] hover:scale-110 transition-transform">
            💀
          </button>
        </div>

        {/* /cere — cerere de piesă din rotație */}
        {cereOpen && (
          <div className="border-t border-[var(--edge)] bg-black/30 px-3.5 py-2.5 shrink-0" data-testid="chat-cere-panel">
            <p className="text-[9px] font-mono-x uppercase tracking-[0.25em] text-[var(--text-3)] mb-2 flex items-center gap-1.5">
              <Music2 size={11} /> Cere o piesă din rotație
            </p>
            {cereList.length === 0 ? (
              <p className="text-xs text-[var(--text-3)] py-1">Nicio piesă găsită în rotație.</p>
            ) : (
              cereList.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  data-testid={`chat-cere-item-${t.id}`}
                  onClick={() => sendText(`🎵 cer piesa: ${t.title}${t.artist ? ` — ${t.artist}` : ""}`)}
                  className="queue-row w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 border border-transparent text-left"
                >
                  <img src={mediaUrl(t.cover_url) || "/logo-alt.png"} alt="" className="w-7 h-7 rounded-md object-cover" loading="lazy" />
                  <span className="text-xs font-semibold truncate">{t.title}</span>
                </button>
              ))
            )}
          </div>
        )}

        {/* input */}
        <div className="border-t border-[var(--edge)] p-3.5 bg-black/25 shrink-0">
          {blocked && (
            <p className="text-[11px] font-mono-x uppercase tracking-widest text-[var(--live)] mb-2" data-testid="chat-blocked">{blocked}</p>
          )}
          {replyTo && !blocked && (
            <div className="flex items-center gap-2 mb-2 text-[10px] font-mono-x uppercase tracking-widest text-[var(--text-2)]" data-testid="chat-reply-chip">
              <CornerUpLeft size={11} className="text-[var(--flame)]" /> Răspunzi lui <span className="text-[var(--flame)]">@{replyTo.name}</span>
              <button type="button" onClick={() => setReplyTo(null)} aria-label="Anulează răspunsul" className="ml-auto p-1 text-[var(--text-3)] hover:text-[var(--text)]"><X size={12} /></button>
            </div>
          )}
          {(me || nameSet) && !blocked ? (
            <form onSubmit={send} className="flex items-center gap-2.5 relative">
              {me && <span data-testid="chat-my-avatar"><Avatar picture={me.picture} name={me.name} size={34} /></span>}
              <button type="button" className="knob knob-sm shrink-0" onClick={() => setEmojiOpen((o) => !o)} aria-label="Emoji" data-testid="chat-emoji-knob">
                <Smile />
              </button>
              {emojiOpen && (
                <div className="absolute bottom-14 left-0 glass rounded-2xl p-2 flex gap-1 z-20" data-testid="chat-emoji-panel">
                  {EMOJI_SET.map((e) => (
                    <button key={e} type="button" className="w-9 h-9 grid place-items-center text-lg hover:scale-125 transition-transform" onClick={() => { setText((t) => (t + e).slice(0, MAX_LEN)); setEmojiOpen(false); inputRef.current?.focus(); }}>
                      {e}
                    </button>
                  ))}
                </div>
              )}
              <input
                ref={inputRef}
                data-testid="chat-text-input"
                value={text}
                onChange={onInputChange}
                placeholder="Scrie ceva… sau /cere o piesă"
                maxLength={MAX_LEN}
                className="input-recessed flex-1 !rounded-full px-4 py-2.5 text-sm outline-none"
              />
              {text.length > 160 && (
                <span className="absolute right-14 -top-5 text-[9px] font-mono-x text-[var(--text-3)]" data-testid="chat-char-counter">{MAX_LEN - text.length}</span>
              )}
              <button data-testid="chat-send-button" className="btn-flame !h-10 !w-10 !p-0 shrink-0" aria-label="Trimite">
                <Send size={15} />
              </button>
            </form>
          ) : (
            <form onSubmit={saveName} className="space-y-2.5">
              <div className="flex gap-2">
                <input
                  data-testid="chat-name-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Numele tău de fan…"
                  maxLength={24}
                  className="input-recessed flex-1 !rounded-full px-4 py-2.5 text-sm outline-none"
                />
                <button data-testid="chat-name-save" className="btn-flame !h-10 !px-5 !text-[10px]">Intră</button>
              </div>
              <button type="button" data-testid="chat-login-link" onClick={() => setLoginOpen(true)}
                className="w-full flex items-center justify-center gap-1.5 text-[10px] font-mono-x uppercase tracking-widest text-[var(--text-3)] hover:text-[var(--flame)] transition-colors">
                <LogIn size={11} /> sau intră în cont — cu nume și poză de profil
              </button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
