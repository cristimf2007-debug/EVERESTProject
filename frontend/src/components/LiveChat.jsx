import React, { useEffect, useRef, useState } from "react";
import { Send, Users, Heart } from "lucide-react";
import { WS_URL } from "@/lib/api";

// Chat live sub radio — realtime prin WebSocket
export default function LiveChat() {
  const [messages, setMessages] = useState([]);
  const [viewers, setViewers] = useState(0);
  const [likes, setLikes] = useState(0);
  const [hearts, setHearts] = useState([]);
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
    const connect = () => {
      if (stopped) return;
      ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      ws.onopen = () => setConnected(true);
      ws.onclose = () => {
        setConnected(false);
        if (!stopped) retry = setTimeout(connect, 3000);
      };
      ws.onmessage = (ev) => {
        let data;
        try { data = JSON.parse(ev.data); } catch { return; }
        if (data.type === "history") setMessages(data.messages.map((m) => ({ ...m, type: "message" })));
        else if (data.type === "message") setMessages((ms) => [...ms.slice(-80), data]);
        else if (data.type === "viewers") setViewers(data.count);
        else if (data.type === "like_count") setLikes(data.total);
        else if (data.type === "join") setMessages((ms) => [...ms.slice(-80), { id: data.id, type: "sys", text: `${data.name} a intrat pe chat` }]);
        else if (data.type === "leave") setMessages((ms) => [...ms.slice(-80), { id: data.id, type: "sys", text: `${data.name} a ieșit` }]);
        else if (data.type === "delete") setMessages((ms) => ms.filter((m) => m.id !== data.id));
        else if (data.type === "reaction" && data.emoji === "heart") {
          const id = data.id;
          setHearts((h) => [...h.slice(-14), id]);
          setTimeout(() => setHearts((h) => h.filter((x) => x !== id)), 2300);
        }
      };
    };
    connect();
    return () => { stopped = true; clearTimeout(retry); ws?.close(); };
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const send = (e) => {
    e?.preventDefault();
    const t = text.trim();
    if (!t || !wsRef.current || wsRef.current.readyState !== 1) return;
    wsRef.current.send(JSON.stringify({ type: "message", name: name || "Fan", text: t }));
    setText("");
  };

  const tapHeart = () => {
    if (wsRef.current?.readyState === 1) wsRef.current.send(JSON.stringify({ type: "tap" }));
  };

  const saveName = (e) => {
    e.preventDefault();
    const n = name.trim().slice(0, 24);
    if (!n) return;
    localStorage.setItem("bioxic_name", n);
    setName(n);
    setNameSet(true);
  };

  return (
    <section className="glass rounded-2xl overflow-hidden relative" data-testid="chat-container">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--line)]">
        <h3 className="font-display text-sm font-bold uppercase tracking-widest">Chat live</h3>
        <div className="flex items-center gap-4 text-[11px] font-mono-x text-[var(--mist)]">
          <span data-testid="chat-viewers" className="flex items-center gap-1.5"><Users size={12} /> {viewers}</span>
          <span data-testid="chat-likes" className="flex items-center gap-1.5 text-[var(--berry)]"><Heart size={12} fill="currentColor" /> {likes}</span>
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-[var(--accent2)]" : "bg-[var(--berry)]"}`} title={connected ? "conectat" : "reconectare…"} />
        </div>
      </div>

      <div ref={listRef} className="chat-scroll h-72 overflow-y-auto px-5 py-4 space-y-2.5 relative" data-testid="chat-messages">
        {messages.length === 0 && (
          <p className="text-sm text-[var(--dim)] text-center pt-20">Fii primul care spune ceva pe chat.</p>
        )}
        {messages.map((m) =>
          m.type === "sys" ? (
            <p key={m.id} className="chat-msg text-[11px] font-mono-x text-[var(--dim)] italic">{m.text}</p>
          ) : (
            <div key={m.id} className="chat-msg text-sm" data-testid={`chat-message-${m.id}`}>
              <span className="font-semibold text-[var(--accent)]">{m.name}</span>
              <span className="text-[var(--dim)]"> · </span>
              <span className="text-[var(--frost)]/90">{m.text}</span>
            </div>
          )
        )}
        {/* inimi plutitoare */}
        <div className="absolute right-4 bottom-2 pointer-events-none">
          {hearts.map((id) => (
            <Heart key={id} size={18} fill="var(--berry)" className="heart-float text-[var(--berry)] absolute" style={{ right: Math.random() * 40 }} />
          ))}
        </div>
      </div>

      <div className="border-t border-[var(--line)] p-3.5">
        {!nameSet ? (
          <form onSubmit={saveName} className="flex gap-2">
            <input
              data-testid="chat-name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Numele tău de fan…"
              maxLength={24}
              className="flex-1 rounded-full bg-black/30 border border-[var(--line)] px-4 py-2.5 text-sm outline-none focus:border-[rgba(var(--accent-rgb),.5)] transition-colors"
            />
            <button data-testid="chat-name-save" className="btn-x gold !py-2.5 !px-5 text-xs font-bold uppercase tracking-widest">Intră</button>
          </form>
        ) : (
          <form onSubmit={send} className="flex gap-2">
            <input
              data-testid="chat-text-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Scrie ca ${name}…`}
              maxLength={300}
              className="flex-1 rounded-full bg-black/30 border border-[var(--line)] px-4 py-2.5 text-sm outline-none focus:border-[rgba(var(--accent-rgb),.5)] transition-colors"
            />
            <button
              type="button"
              data-testid="chat-heart-button"
              onClick={tapHeart}
              className="btn-ghost grid w-10 h-10 rounded-full place-items-center shrink-0"
              aria-label="Trimite inimă"
            >
              <Heart size={15} className="text-[var(--berry)]" />
            </button>
            <button data-testid="chat-send-button" className="btn-x gold !p-2.5 rounded-full shrink-0" aria-label="Trimite">
              <Send size={16} />
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
