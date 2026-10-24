import React, { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Send, Users, Heart, LogIn, MessageCircle, X, ArrowDown } from "lucide-react";
import { WS_URL, mediaUrl } from "@/lib/api";
import { useFan } from "@/context/FanContext";

const REACTION_META = {
  heart: { emoji: "🎃" },
  fire: { emoji: "🔥" },
  crown: { emoji: "💀" },
};
const MAX_MSGS = 200; // fereastra de mesaje ținută în memorie/DOM
const BACKOFF = [1000, 2000, 5000, 10000];

const NAME_COLORS = ["#FF7A1A", "#8cc7a8", "#bfe3ff", "#f0a4c0", "#ffd28c", "#a8e6cf", "#e3b8ff"];
const nameColor = (name) => {
  let h = 0;
  for (let i = 0; i < (name || "").length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return NAME_COLORS[h % NAME_COLORS.length];
};

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

// rând memoizat — reacțiile/numărătoarele nu re-randează mesajele
const ChatRow = memo(function ChatRow({ m }) {
  if (m.type === "sys") {
    return (
      <p className="chat-msg text-center py-1">
        <span className="text-[10px] font-mono-x text-[var(--text-3)] bg-white/[0.03] rounded-full px-3 py-1">{m.text}</span>
      </p>
    );
  }
  return (
    <div className={`chat-msg group flex items-start gap-2.5 rounded-xl px-2 py-1.5 hover:bg-white/[0.03] transition-colors ${m.pending ? "opacity-50" : ""}`} data-testid={`chat-message-${m.id}`}>
      <Avatar picture={m.picture} name={m.name} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-[12px] font-semibold" style={{ color: nameColor(m.name) }}>{m.name}</span>
          {m.ts && (
            <span className="text-[9px] font-mono-x text-[var(--text-3)] opacity-0 group-hover:opacity-100 transition-opacity">
              {new Date(m.ts).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
        <p className="text-sm text-[var(--text)]/90 break-words leading-snug mt-0.5">{m.text}</p>
      </div>
    </div>
  );
});

// Chat live — panou de sticlă pe desktop, bottom sheet pe mobil.
// Performanță: buffer + flush o dată pe frame, max 200 mesaje, WS unic cu backoff, send optimistic.
export default function LiveChat() {
  const { me, setLoginOpen } = useFan();
  const [messages, setMessages] = useState([]);
  const [viewers, setViewers] = useState(0);
  const [likes, setLikes] = useState(0);
  const [floats, setFloats] = useState([]);
  const [name, setName] = useState(() => localStorage.getItem("bioxic_name") || "");
  const [nameSet, setNameSet] = useState(() => !!localStorage.getItem("bioxic_name"));
  const [text, setText] = useState("");
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [open, setOpen] = useState(false); // sheet pe mobil
  const [newCount, setNewCount] = useState(0);

  const wsRef = useRef(null);
  const listRef = useRef(null);
  const bufferRef = useRef([]);
  const flushScheduled = useRef(false);
  const atBottomRef = useRef(true);
  const seenRef = useRef(new Set());
  const pendingRef = useRef([]);
  const reactTimesRef = useRef([]);
  const needScrollRef = useRef(false);
  const flushedRef = useRef(0);
  const rateRef = useRef([]);
  const [burst, setBurst] = useState(false); // la rafale mari oprim animația de intrare per mesaj

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
          const fresh = data.messages.filter((m) => !seen.has(m.id)).map((m) => { seen.add(m.id); return { ...m, type: "message" }; });
          setMessages(fresh.slice(-MAX_MSGS));
          needScrollRef.current = true;
        } else if (data.type === "message") {
          if (data.id && seen.has(data.id)) return;
          if (data.id) { seen.add(data.id); if (seen.size > 600) seen.clear(); }
          bufferRef.current.push(data);
          scheduleFlush();
        } else if (data.type === "viewers") setViewers(data.count);
        else if (data.type === "like_count") setLikes(data.total);
        else if (data.type === "join") { bufferRef.current.push({ id: data.id, type: "sys", text: `${data.name} a intrat pe chat` }); scheduleFlush(); }
        else if (data.type === "leave") { bufferRef.current.push({ id: data.id, type: "sys", text: `${data.name} a ieșit` }); scheduleFlush(); }
        else if (data.type === "delete") setMessages((ms) => ms.filter((m) => m.id !== data.id));
        else if (data.type === "reaction" && REACTION_META[data.emoji]) {
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
  const send = (e) => {
    e?.preventDefault();
    const t = text.trim();
    if (!t || !wsRef.current || wsRef.current.readyState !== 1) return;
    const senderName = me?.name || name || "Fan";
    const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    pendingRef.current.push({ id: localId, name: senderName, text: t });
    if (pendingRef.current.length > 10) pendingRef.current.shift();
    bufferRef.current.push({ id: localId, type: "message", name: senderName, text: t, picture: me?.picture, pending: true });
    scheduleFlush();
    atBottomRef.current = true;
    wsRef.current.send(JSON.stringify({ type: "message", name: senderName, text: t }));
    setText("");
    // dacă serverul nu confirmă în 4s (rate-limit), marcăm mesajul ca afișat
    setTimeout(() => {
      const i = pendingRef.current.findIndex((p) => p.id === localId);
      if (i !== -1) {
        pendingRef.current.splice(i, 1);
        setMessages((ms) => ms.map((m) => (m.id === localId ? { ...m, pending: false } : m)));
      }
    }, 4000);
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

  return (
    <>
      {/* buton plutitor pe mobil — deschide sheet-ul de chat */}
      <button className="chat-fab" data-testid="chat-open-fab" onClick={() => setOpen(true)} aria-label="Deschide chatul live">
        <MessageCircle size={15} /> Chat live
        {viewers > 0 && <span className="text-[var(--flame)]">{viewers}</span>}
      </button>

      <section className={`chat-shell ${open ? "open" : ""} ${burst ? "chat-burst" : ""}`} data-testid="chat-container">
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
            <button className="lg:hidden text-[var(--text-2)] hover:text-[var(--text)] transition-colors" onClick={() => setOpen(false)} aria-label="Închide chatul" data-testid="chat-close-button">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* mesaje */}
        <div ref={listRef} onScroll={onScroll} role="log" aria-live="polite" aria-label="Mesaje chat live" className="chat-scroll h-72 sm:h-80 max-lg:h-auto max-lg:flex-1 max-lg:min-h-[38vh] overflow-y-auto px-4 py-4 space-y-1 relative" data-testid="chat-messages" data-lenis-prevent>
          {messages.length === 0 && (
            <div className="text-center pt-24">
              <p className="font-display text-sm font-bold uppercase tracking-widest text-[var(--text-2)]">Liniște pe frecvență</p>
              <p className="text-xs text-[var(--text-3)] mt-1.5">Fii primul care spune ceva.</p>
            </div>
          )}
          {messages.map((m) => <ChatRow key={m.id} m={m} />)}
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

        {/* input */}
        <div className="border-t border-[var(--edge)] p-3.5 bg-black/25 shrink-0">
          {me ? (
            <form onSubmit={send} className="flex items-center gap-2.5">
              <span data-testid="chat-my-avatar"><Avatar picture={me.picture} name={me.name} size={34} /></span>
              <input
                data-testid="chat-text-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Scrie ceva… dacă ai curaj"
                maxLength={300}
                className="input-recessed flex-1 !rounded-full px-4 py-2.5 text-sm outline-none"
              />
              <button data-testid="chat-send-button" className="btn-flame !h-10 !w-10 !p-0 shrink-0" aria-label="Trimite">
                <Send size={15} />
              </button>
            </form>
          ) : !nameSet ? (
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
          ) : (
            <form onSubmit={send} className="flex gap-2">
              <input
                data-testid="chat-text-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Scrie ceva… dacă ai curaj"
                maxLength={300}
                className="input-recessed flex-1 !rounded-full px-4 py-2.5 text-sm outline-none"
              />
              <button data-testid="chat-send-button" className="btn-flame !h-10 !w-10 !p-0 shrink-0" aria-label="Trimite">
                <Send size={15} />
              </button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
