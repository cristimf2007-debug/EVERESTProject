import React, { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useRadio } from "@/context/RadioContext";

// Auto-update după republicare: verifică /version.json la load, la 5 min și la refocus.
// Nu întrerupe dacă utilizatorul scrie în chat sau se uită la un video.
export default function VersionChecker() {
  const { pause } = useRadio();
  const bootRef = useRef(null);
  const checkingRef = useRef(false);
  const pauseRef = useRef(pause);
  pauseRef.current = pause;

  useEffect(() => {
    const busyNow = () => {
      const ae = document.activeElement;
      const typing = ae && (ae.tagName === "INPUT" || ae.tagName === "TEXTAREA");
      return typing || !!window.__bioxicVideoPlaying;
    };

    const offerUpdate = (version, changes) => {
      toast.custom(
        (id) => (
          <div className="ob-card p-4 w-[320px]" data-testid="update-toast">
            <p className="badge-engraved">Versiune nouă disponibilă</p>
            <p className="font-display text-lg mt-1.5">v{version}</p>
            {changes.length > 0 && (
              <ul className="mt-2 space-y-1">
                {changes.slice(0, 4).map((c) => (
                  <li key={c} className="text-xs text-[var(--text-2)]">· {c}</li>
                ))}
              </ul>
            )}
            <div className="flex gap-2 mt-4">
              <button
                className="btn-flame !h-9 !px-4 !text-[10px] flex-1"
                data-testid="update-now"
                onClick={() => {
                  toast.dismiss(id);
                  try { pauseRef.current?.(); } catch { /* radio oprit oricum la reload */ }
                  try { sessionStorage.setItem("bioxic_updated_to", version); } catch { /* storage blocat */ }
                  window.location.reload();
                }}
              >
                Actualizează acum
              </button>
              <button
                className="btn-steel !h-9 !px-4 !text-[10px]"
                data-testid="update-later"
                onClick={() => {
                  try { localStorage.setItem("bioxic_update_snooze", String(Date.now() + 30 * 60 * 1000)); } catch { /* storage blocat */ }
                  toast.dismiss(id);
                }}
              >
                Mai târziu
              </button>
            </div>
          </div>
        ),
        { duration: Infinity, id: "bioxic-update" }
      );
    };

    const check = async () => {
      if (checkingRef.current) return;
      checkingRef.current = true;
      try {
        const r = await fetch("/version.json", { cache: "no-store" });
        if (!r.ok) return;
        const data = await r.json().catch(() => null);
        if (!data?.version) return;

        if (bootRef.current === null) {
          bootRef.current = data.version;
          try {
            const just = sessionStorage.getItem("bioxic_updated_to");
            if (just && just === data.version) {
              sessionStorage.removeItem("bioxic_updated_to");
              toast.success(`Actualizat la v${data.version} ✓`, { id: "bioxic-updated" });
            }
          } catch { /* storage blocat */ }
          return;
        }
        if (data.version === bootRef.current) return;
        const snooze = parseInt(localStorage.getItem("bioxic_update_snooze") || "0", 10);
        if (Date.now() < snooze) return;
        if (busyNow()) return; // nu întrerupem — reîncearcă la ciclul următor

        let changes = [];
        try {
          const c = await fetch("/changelog.json", { cache: "no-store" }).then((r) => r.json());
          if (c?.version === data.version) changes = c.changes || [];
        } catch { /* fără changelog — doar versiunea */ }
        offerUpdate(data.version, changes);
      } catch { /* offline sau fișier lipsă — ignorăm */ } finally {
        checkingRef.current = false;
      }
    };

    check();
    const iv = setInterval(check, 5 * 60 * 1000);
    const onVis = () => { if (!document.hidden) check(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(iv); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  return null;
}
