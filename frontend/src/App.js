import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { RadioProvider } from "@/context/RadioContext";
import Snowfall from "@/components/Snowfall";
import ChannelHeader from "@/components/ChannelHeader";
import PlayerBar from "@/components/PlayerBar";
import Live from "@/pages/Live";
import Piese from "@/pages/Piese";
import Despre from "@/pages/Despre";
import Pareri from "@/pages/Pareri";
import Admin from "@/pages/Admin";

function Shell() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  return (
    <>
      {!isAdmin && <ChannelHeader />}
      <main className="relative z-10 pb-28">
        <Routes>
          <Route path="/" element={<Live />} />
          <Route path="/piese" element={<Piese />} />
          <Route path="/pareri" element={<Pareri />} />
          <Route path="/despre" element={<Despre />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Live />} />
        </Routes>
      </main>
      <PlayerBar />
    </>
  );
}

function App() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <BrowserRouter>
        <RadioProvider>
          <div className="sky-bg" />
          <Snowfall />
          <div className="grain-overlay" />
          <Shell />
          <Toaster theme="dark" position="top-center" />
        </RadioProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
