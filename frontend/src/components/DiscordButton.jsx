import React from "react";

export function DiscordIcon({ size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.317 4.37a19.79 19.79 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.058a.082.082 0 00.031.056 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.873-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.3 12.3 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.84 19.84 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
  );
}

export const DISCORD_URL = "https://discord.gg/PJ5A45SkRs";

export default function DiscordButton({ tid = "discord-button", compact = false }) {
  return (
    <a
      href={DISCORD_URL}
      target="_blank"
      rel="noopener noreferrer"
      data-testid={tid}
      className={`group relative inline-flex items-center justify-center gap-3 rounded-md font-bold text-white transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 ${
        compact ? "px-5 py-3 text-sm" : "px-8 py-5 text-base sm:text-lg w-full"
      }`}
      style={{
        background: "linear-gradient(135deg, #5865F2 0%, #4752C4 100%)",
        boxShadow: "0 8px 30px rgba(88,101,242,0.45), inset 0 1px 0 rgba(255,255,255,0.25)",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 12px 45px rgba(88,101,242,0.7), inset 0 1px 0 rgba(255,255,255,0.35)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 8px 30px rgba(88,101,242,0.45), inset 0 1px 0 rgba(255,255,255,0.25)"; }}
    >
      <DiscordIcon size={compact ? 20 : 28} className="drop-shadow" />
      <span className="flex flex-col items-start leading-tight">
        {!compact && <span className="text-[10px] uppercase tracking-[0.25em] opacity-80">Server oficial</span>}
        <span>BIOXIC HOUSE pe Discord</span>
      </span>
    </a>
  );
}
