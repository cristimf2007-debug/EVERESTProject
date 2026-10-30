import React, { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock, Sparkles } from "lucide-react";
import api from "@/lib/api";

const DOW = ["LU", "MA", "MI", "JO", "VI", "SÂ", "DU"];
const DAYS_FULL = ["Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă", "Duminică"];

export const toMin = (t) => {
  const [h, m] = String(t || "0:0").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};
export const todayIdx = () => (new Date().getDay() + 6) % 7; // 0 = Luni … 6 = Duminică
export const isPremiere = (s) => /premier/i.test(`${s.title} ${s.note || ""}`);

// prima apariție viitoare a unei emisiuni (day null = în fiecare zi)
export function nextOccurrence(s, from = new Date()) {
  const [h, m] = String(s.time || "0:0").split(":").map(Number);
  const d = new Date(from);
  d.setHours(h || 0, m || 0, 0, 0);
  if (s.day == null) {
    if (d <= from) d.setDate(d.getDate() + 1);
    return d;
  }
  const target = (s.day + 1) % 7; // JS: 0 = Duminică
  while (d.getDay() !== target || d <= from) d.setDate(d.getDate() + 1);
  return d;
}

export function findNextEntry(schedule, from = new Date()) {
  let best = null;
  for (const s of schedule) {
    const at = nextOccurrence(s, from);
    if (!best || at < best.at) best = { entry: s, at };
  }
  return best;
}

// Countdown premium — cifre mari Syne, celule de sticlă, ticăie la secundă
export function Countdown({ target, testid = "countdown" }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, target.getTime() - now);
  const dd = Math.floor(diff / 86400000);
  const hh = Math.floor((diff % 86400000) / 3600000);
  const mm = Math.floor((diff % 3600000) / 60000);
  const ss = Math.floor((diff % 60000) / 1000);
  const cells = dd > 0
    ? [[dd, "zile"], [hh, "ore"], [mm, "min"], [ss, "sec"]]
    : [[hh, "ore"], [mm, "min"], [ss, "sec"]];
  return (
    <div className="flex items-stretch gap-2 sm:gap-2.5" data-testid={testid} role="timer" aria-label="Timp rămas până la următoarea emisiune">
      {cells.map(([v, lbl], i) => (
        <React.Fragment key={lbl}>
          {i > 0 && <span className="cd-sep" aria-hidden="true">:</span>}
          <span className="cd-cell">
            <span className="cd-num" data-testid={`${testid}-${lbl}`}>{String(v).padStart(2, "0")}</span>
            <span className="cd-lbl block">{lbl}</span>
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

// Card „Urmează premiera" — folosit în hero-ul de pe prima pagină și pe /tv
export function NextPremiereCard({ schedule }) {
  const next = useMemo(() => findNextEntry(schedule), [schedule]);
  if (!next) {
    return (
      <div className="ob-card p-6" data-testid="next-premiere-empty">
        <p className="sec-kicker">Urmează</p>
        <p className="text-sm text-[var(--text-2)] mt-3 leading-relaxed">
          Programul se completează în curând. Până atunci, streamul live cântă non-stop.
        </p>
      </div>
    );
  }
  const { entry, at } = next;
  const dayLabel = entry.day == null ? "în fiecare zi" : DAYS_FULL[entry.day];
  return (
    <div className="ob-card p-6" data-testid="next-premiere-card">
      <p className="sec-kicker"><Sparkles size={11} /> {isPremiere(entry) ? "Premieră" : "Urmează"}</p>
      <h3 className="font-display text-xl sm:text-2xl mt-3 leading-tight">{entry.title}</h3>
      <p className="font-mono-x text-[10px] uppercase tracking-[0.2em] text-[var(--text-2)] mt-2">
        {dayLabel} · {entry.time}{entry.note ? ` · ${entry.note}` : ""}
      </p>
      <div className="mt-5">
        <Countdown target={at} testid="next-premiere-countdown" />
      </div>
    </div>
  );
}

// Ghidul TV săptămânal — taburi pe zile, stări clare: În direct / Urmează / Premieră / Terminat
export default function TvGuide({ schedule: external }) {
  const [own, setOwn] = useState(null);
  const [day, setDay] = useState(todayIdx());

  useEffect(() => {
    if (external) return;
    api.get("/tv/schedule").then((r) => setOwn(r.data || [])).catch(() => setOwn([]));
  }, [external]);
  const schedule = useMemo(() => external ?? own ?? [], [external, own]);

  const entries = useMemo(
    () => schedule.filter((s) => s.day == null || s.day === day).sort((a, b) => toMin(a.time) - toMin(b.time)),
    [schedule, day]
  );

  const isToday = day === todayIdx();
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  let nowIdx = -1;
  let nextIdx = -1;
  if (isToday && entries.length) {
    nextIdx = entries.findIndex((s) => toMin(s.time) >= nowMin);
    nowIdx = nextIdx === -1 ? entries.length - 1 : nextIdx - 1;
  }

  // numărul zilei din lună pentru fiecare tab
  const dayNums = useMemo(() => {
    const base = new Date();
    const cur = todayIdx();
    return DOW.map((_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + (i - cur));
      return d.getDate();
    });
  }, []);
  const hasEntries = useMemo(() => {
    const set = new Set();
    schedule.forEach((s) => { if (s.day != null) set.add(s.day); });
    return set;
  }, [schedule]);
  const hasDaily = schedule.some((s) => s.day == null);

  return (
    <section data-testid="tv-guide" className="rv">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="sec-kicker"><CalendarDays size={12} /> Programul săptămânii</p>
          <h2 className="sec-title mt-2.5">Ghid TV</h2>
        </div>
        <p className="font-mono-x text-[10px] uppercase tracking-[0.22em] text-[var(--text-3)] hidden sm:block">
          Orele sunt orientative · premierile se aud întâi aici
        </p>
      </div>

      {/* taburile săptămânii */}
      <div className="flex gap-2 mt-6 overflow-x-auto pb-1.5 chat-scroll" data-testid="tvg-tabs" role="tablist" aria-label="Zilele săptămânii">
        {DOW.map((d, i) => (
          <button
            key={d}
            role="tab"
            aria-selected={day === i}
            onClick={() => setDay(i)}
            className={`tvg-tab shrink-0 ${day === i ? "active" : ""}`}
            data-testid={`tvg-tab-${i}`}
          >
            <span className="dow flex items-center gap-1.5">
              {d}
              {(hasEntries.has(i) || (hasDaily && schedule.length > 0)) && <span className="w-1 h-1 rounded-full bg-[var(--flame)]" aria-hidden="true" />}
              {i === todayIdx() && <span className="text-[var(--live)]" aria-label="azi">●</span>}
            </span>
            <span className="dnum">{dayNums[i]}</span>
          </button>
        ))}
      </div>

      {/* emisiunile zilei selectate */}
      <div className="mt-5 space-y-2.5" data-testid="tvg-list">
        {entries.length === 0 ? (
          <div className="ob-card p-10 text-center" data-testid="tvg-empty">
            <Clock size={26} className="mx-auto text-[var(--flame)] mb-3" />
            <p className="font-display text-lg">Zi liberă în program</p>
            <p className="text-sm text-[var(--text-2)] mt-1.5">Streamul live cântă oricum, non-stop.</p>
          </div>
        ) : (
          entries.map((s, i) => {
            const state = !isToday ? null : i === nowIdx ? "now" : i === nextIdx ? "next" : toMin(s.time) < nowMin ? "done" : null;
            const premiere = isPremiere(s);
            return (
              <div
                key={s.id}
                className={`tvg-row ${state === "now" ? "is-now" : ""} ${state === "next" ? "is-next" : ""} ${state === "done" ? "is-done" : ""}`}
                data-testid={`tvg-row-${s.id}`}
              >
                <span className={`font-mono-x text-base sm:text-lg font-bold tabular-nums w-14 shrink-0 ${state === "now" ? "text-[var(--live)]" : state === "next" ? "text-[var(--flame)]" : "text-[var(--text-2)]"}`}>
                  {s.time}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm sm:text-[15px] font-semibold truncate">{s.title}</span>
                  {s.note && <span className="block text-xs text-[var(--text-3)] truncate mt-0.5">{s.note}</span>}
                </span>
                <span className="flex items-center gap-2 shrink-0">
                  {premiere && state !== "done" && <span className="st-pill st-premiere" data-testid={`tvg-premiere-${s.id}`}>Premieră</span>}
                  {state === "now" && <span className="st-pill st-now" data-testid="tvg-state-now"><span className="w-1.5 h-1.5 rounded-full bg-[var(--live)] live-dot" /> În direct</span>}
                  {state === "next" && <span className="st-pill st-next" data-testid="tvg-state-next">Urmează</span>}
                  {state === "done" && <span className="st-pill st-done">Terminat</span>}
                </span>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
