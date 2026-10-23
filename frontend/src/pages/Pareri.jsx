import React, { useEffect, useState } from "react";
import { Star, MessageSquareQuote, Send } from "lucide-react";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";

function Stars({ value, onPick, size = 16 }) {
  return (
    <div className="flex gap-1" data-testid="review-stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          {...(onPick ? { "data-testid": `review-star-${n}` } : {})}
          onClick={() => onPick?.(n)}
          disabled={!onPick}
          className={onPick ? "hover:scale-125 transition-transform" : "cursor-default"}
          aria-label={`${n} stele`}
        >
          <Star
            size={size}
            className={n <= value ? "text-[var(--accent)]" : "text-[var(--dim)]"}
            fill={n <= value ? "currentColor" : "none"}
          />
        </button>
      ))}
    </div>
  );
}

export default function Pareri() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState(() => localStorage.getItem("bioxic_name") || "");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const load = () => api.get("/reviews").then((r) => setReviews(r.data || [])).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) : 0;

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return toast.error("Scrie părerea ta mai întâi.");
    setSending(true);
    try {
      await api.post("/reviews", { name: name.trim() || "Fan", rating, text: text.trim() });
      if (name.trim()) localStorage.setItem("bioxic_name", name.trim());
      toast.success("Mulțumim pentru părere!", { description: "A apărut pe site." });
      setText("");
      load();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div data-testid="pareri-page" className="max-w-4xl mx-auto px-4 sm:px-8 py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold uppercase tracking-wide">
            Păreri <span className="text-[var(--accent)]">({reviews.length})</span>
          </h2>
          <p className="text-[var(--mist)] text-sm mt-2 max-w-xl">Ce zic fanii despre BIOXIC și radio. Lasă și tu o părere — apare instant.</p>
        </div>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2.5" data-testid="reviews-average">
            <Stars value={Math.round(avg)} />
            <span className="font-display text-xl font-extrabold text-[var(--accent)]">{avg.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* formular */}
      <form onSubmit={submit} className="glass rounded-2xl p-5 sm:p-6 mt-8" data-testid="review-form">
        <div className="flex flex-wrap items-center gap-4">
          <input
            data-testid="review-name-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Numele tău"
            maxLength={40}
            className="flex-1 min-w-[180px] rounded-full bg-black/30 border border-[var(--line)] px-4 py-2.5 text-sm outline-none focus:border-[rgba(var(--accent-rgb),.5)] transition-colors"
          />
          <Stars value={rating} onPick={setRating} size={20} />
        </div>
        <textarea
          data-testid="review-text-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Cum ți se pare radioul? Piesele? Zi tot."
          maxLength={500}
          rows={3}
          className="w-full rounded-2xl bg-black/30 border border-[var(--line)] px-4 py-3 text-sm outline-none focus:border-[rgba(var(--accent-rgb),.5)] transition-colors mt-3 resize-none"
        />
        <button data-testid="review-submit-button" disabled={sending} className="btn-x gold mt-4 !py-2.5 !px-6 text-xs font-bold uppercase tracking-widest disabled:opacity-50">
          <Send size={13} /> {sending ? "Se trimite…" : "Lasă părerea"}
        </button>
      </form>

      {/* lista */}
      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4 mt-8">
          {[0, 1].map((i) => <div key={i} className="glass rounded-2xl h-32 animate-pulse" />)}
        </div>
      ) : reviews.length === 0 ? (
        <div className="glass rounded-2xl p-14 text-center mt-8" data-testid="reviews-empty">
          <MessageSquareQuote size={32} className="mx-auto text-[var(--accent)] mb-4" />
          <p className="font-display text-xl font-bold uppercase">Nicio părere încă</p>
          <p className="text-[var(--mist)] text-sm mt-2">Fii primul care zice cum e.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4 mt-8" data-testid="reviews-list">
          {reviews.map((r) => (
            <article key={r.id} className="track-card glass rounded-2xl p-5" data-testid={`review-card-${r.id}`}>
              <div className="flex items-center justify-between gap-3">
                <p className="font-bold text-sm">{r.name}</p>
                <Stars value={r.rating} size={13} />
              </div>
              <p className="text-sm text-[var(--frost)]/85 mt-3 leading-relaxed">{r.text}</p>
              <p className="text-[10px] font-mono-x uppercase tracking-widest text-[var(--dim)] mt-3">
                {new Date(r.created_at).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
