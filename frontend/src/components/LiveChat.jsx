import React, { useEffect, useRef, useState } from "react";
import { Send, Users, Heart, LogIn } from "lucide-react";
import { WS_URL, mediaUrl } from "@/lib/api";
import { useFan } from "@/context/FanContext";

const REACTION_META = {
  heart: { emoji: "🎃" },
  fire: { emoji: "🔥" },
  crown: { emoji: "💀" },
};

const NAME_COLORS = ["var(--accent)", "#8cc7a8", "#bfe3ff", "#f0a4c0", "#ffd28c", "#a8e6cf", "#e3b8ff"];
const nameColor = (name) => {
  let h = 0;
  for (let i = 0; i < (name || "").length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return NAME_COLORS[h % NAME_COLORS.length];
};

function Avatar({ picture, name, size = 28 }) {
  if (picture) {
    return <img src={mediaUrl(picture)} alt={name} className="rounded-full object-cover shrink-0 ring-1 ring-[var(--line-hi)]" style={{ width: size, height: size }} />;
  }
  return (
    <span
      className="grid rounded-full place-items-center font-black shrink-0 text-[var(--on-accent)]"
      style={{ width: size, height: size, fontSize: size * 0.38, background: "linear-gradient(180deg, var(--accent-hi), var(--accent))" }}
    >
      {(name || "F")[0].toUpperCase()}
    </span>
  );
}

// Chat live — stil streaming: bule cu avatar, nume colorate, reacții plutitoare
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
  const wsRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    let ws;
    let stopped = false;
    let retry;
    let ping;
    const seen = new Set();
    const push = (msg) => {
      if (msg.id && seen.has(msg.id)) return;
      if (msg.id) { seen.add(msg.id); if (seen.size > 400) seen.clear(); }
      setMessages((ms) => [...ms.slice(-80), msg]);
    };
    const connect = () => {
      if (stopped) return;
      if (ws && (ws.readyState === 0 || ws.readyState === 1)) return;
      ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      ws.onopen = () => {
        setConnected(true);
        ping = setInterval(() => {
          if (ws.readyState === 1) ws.send(JSON.stringify({ type: "ping" }));
        }, 25000);
      };
      ws.onclose = () => {
        clearInterval(ping);
        setConnected(false);
        if (!stopped) retry = setTimeout(connect, 3000);
      };
      ws.onmessage = (ev) => {
        let data;
        try { data = JSON.parse(ev.data); } catch { return; }
        if (data.type === "history") {
          setMessages(data.messages.filter((m) => !seen.has(m.id)).map((m) => { seen.add(m.id); return { ...m, type: "message" }; }));
        }
        else if (data.type === "message") push(data);
        else if (data.type === "viewers") setViewers(data.count);
        else if (data.type === "like_count") setLikes(data.total);
        else if (data.type === "join") push({ id: data.id, type: "sys", text: `${data.name} a intrat pe chat` });
        else if (data.type === "leave") push({ id: data.id, type: "sys", text: `${data.name} a ieșit` });
        else if (data.type === "delete") setMessages((ms) => ms.filter((m) => m.id !== data.id));
        else if (data.type === "reaction" && REACTION_META[data.emoji]) {
          const id = data.id;
          setFloats((h) => [...h.slice(-14), { id, emoji: data.emoji }]);
          setTimeout(() => setFloats((h) => h.filter((x) => x.id !== id)), 2300);
        }
      };
    };
    connect();
    return () => { stopped = true; clearTimeout(retry); clearInterval(ping); ws?.close(); };
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const send = (e) => {
    e?.preventDefault();
    const t = text.trim();
    if (!t || !wsRef.current || wsRef.current.readyState !== 1) return;
    wsRef.current.send(JSON.stringify({ type: "message", name: me?.name || name || "Fan", text: t }));
    setText("");
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

  return (
    <section
      className="rounded-3xl overflow-hidden relative border border-[var(--line-hi)]"
      style={{ background: "linear-gradient(180deg, rgba(13,36,27,.85), rgba(6,17,13,.92))", backdropFilter: "blur(20px)", boxShadow: "0 24px 60px -24px rgba(0,0,0,.8)" }}
      data-testid="chat-container"
    >
      {/* header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--line)] bg-black/25">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[var(--berry)] live-dot" />
          <h3 className="font-display text-sm font-extrabold uppercase tracking-[0.2em]">Chat live</h3>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono-x text-[var(--mist)]">
          <span data-testid="chat-viewers" className="flex items-center gap-1.5"><Users size={12} /> {viewers}</span>
          <span data-testid="chat-likes" className="flex items-center gap-1.5 text-[var(--berry)]"><Heart size={12} fill="currentColor" /> {likes}</span>
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-[var(--accent2)]" : "bg-[var(--berry)]"}`} title={connected ? "conectat" : "reconectare…"} />
        </div>
      </div>

      {/* mesaje */}
      <div ref={listRef} className="chat-scroll h-80 overflow-y-auto px-4 py-4 space-y-1 relative" data-testid="chat-messages">
        {messages.length === 0 && (
          <div className="text-center pt-24">
            <p className="font-display text-sm font-bold uppercase tracking-widest text-[var(--mist)]">Liniște pe frecvență</p>
            <p className="text-xs text-[var(--dim)] mt-1.5">Fii primul care spune ceva.</p>
          </div>
        )}
        {messages.map((m) =>
          m.type === "sys" ? (
            <p key={m.id} className="chat-msg text-center py-1">
              <span className="text-[10px] font-mono-x text-[var(--dim)] bg-black/25 rounded-full px-3 py-1">{m.text}</span>
            </p>
          ) : (
            <div key={m.id} className="chat-msg group flex items-start gap-2.5 rounded-xl px-2 py-1.5 hover:bg-white/[0.04] transition-colors" data-testid={`chat-message-${m.id}`}>
              <Avatar picture={m.picture} name={m.name} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-[12px] font-bold" style={{ color: nameColor(m.name) }}>{m.name}</span>
                  {m.ts && (
                    <span className="text-[9px] font-mono-x text-[var(--dim)] opacity-0 group-hover:opacity-100 transition-opacity">
                      {new Date(m.ts).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </div>
                <p className="text-sm text-[var(--frost)]/90 break-words leading-snug mt-0.5">{m.text}</p>
              </div>
            </div>
          )
        )}
        {/* reacții plutitoare */}
        <div className="absolute right-4 bottom-2 pointer-events-none">
          {floats.map((f) => (
            <span
              key={f.id}
              className="heart-float absolute text-lg"
              style={{ right: Math.random() * 44 }}
            >
              {REACTION_META[f.emoji].emoji}
            </span>
          ))}
        </div>
      </div>

      {/* reacții */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-t border-[var(--line)] bg-black/15" data-testid="chat-reactions">
        <span className="text-[9px] font-mono-x uppercase tracking-[0.25em] text-[var(--dim)] mr-auto">Dă-i drumul</span>
        <button type="button" data-testid="chat-heart-button" onClick={tapHeart} aria-label="Dovleac"
          className="grid w-9 h-9 rounded-full place-items-center text-base border border-[rgba(232,115,26,.35)] bg-[rgba(232,115,26,.08)] hover:scale-110 transition-transform">
          🎃
        </button>
        <button type="button" data-testid="chat-fire-button" onClick={() => react("fire")} aria-label="Foc"
          className="grid w-9 h-9 rounded-full place-items-center text-base border border-[rgba(255,138,60,.35)] bg-[rgba(255,138,60,.08)] hover:scale-110 transition-transform">
          🔥
        </button>
        <button type="button" data-testid="chat-crown-button" onClick={() => react("crown")} aria-label="Cranii"
          className="grid w-9 h-9 rounded-full place-items-center text-base border border-[rgba(139,14,14,.4)] bg-[rgba(139,14,14,.1)] hover:scale-110 transition-transform">
          💀
        </button>
      </div>

      {/* input */}
      <div className="border-t border-[var(--line)] p-3.5 bg-black/25">
        {me ? (
          <form onSubmit={send} className="flex items-center gap-2.5">
            <span data-testid="chat-my-avatar"><Avatar picture={me.picture} name={me.name} size={34} /></span>
            <input
              data-testid="chat-text-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Scrie ceva… dacă ai curaj`}
              maxLength={300}
              className="flex-1 rounded-full bg-black/40 border border-[var(--line)] px-4 py-2.5 text-sm outline-none focus:border-[rgba(var(--accent-rgb),.5)] transition-colors"
            />
            <button data-testid="chat-send-button" className="btn-x gold !p-2.5 rounded-full shrink-0" aria-label="Trimite">
              <Send size={16} />
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
                className="flex-1 rounded-full bg-black/40 border border-[var(--line)] px-4 py-2.5 text-sm outline-none focus:border-[rgba(var(--accent-rgb),.5)] transition-colors"
              />
              <button data-testid="chat-name-save" className="btn-x gold !py-2.5 !px-5 text-xs font-bold uppercase tracking-widest">Intră</button>
            </div>
            <button type="button" data-testid="chat-login-link" onClick={() => setLoginOpen(true)}
              className="w-full flex items-center justify-center gap-1.5 text-[10px] font-mono-x uppercase tracking-widest text-[var(--dim)] hover:text-[var(--accent)] transition-colors">
              <LogIn size={11} /> sau intră în cont — cu nume și poză de profil
            </button>
          </form>
        ) : (
          <form onSubmit={send} className="flex gap-2">
            <input
              data-testid="chat-text-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Scrie ceva… dacă ai curaj`}
              maxLength={300}
              className="flex-1 rounded-full bg-black/40 border border-[var(--line)] px-4 py-2.5 text-sm outline-none focus:border-[rgba(var(--accent-rgb),.5)] transition-colors"
            />
            <button data-testid="chat-send-button" className="btn-x gold !p-2.5 rounded-full shrink-0" aria-label="Trimite">
              <Send size={16} />
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
