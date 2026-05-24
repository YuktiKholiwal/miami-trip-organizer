import { useEffect, useState } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { useTrip } from "../state/TripContext.jsx";

const primaryTabs = [
  { to: "/", label: "Home", emoji: "🌅" },
  { to: "/itinerary", label: "Plan", emoji: "📍" },
  { to: "/map", label: "Map", emoji: "🗺️" },
  { to: "/spend", label: "Spend", emoji: "💸" },
];

const moreItems = [
  { to: "/crew", label: "The crew", emoji: "🦩", desc: "Everyone going" },
  { to: "/flights", label: "Flights", emoji: "✈️", desc: "Arrivals + departures" },
  { to: "/stay", label: "Stay", emoji: "🏨", desc: "Moxy South Beach" },
  { to: "/cars", label: "Cars", emoji: "🚗", desc: "Who's driving who" },
  { to: "/polls", label: "Polls", emoji: "🗳️", desc: "Decide things" },
  { to: "/packing", label: "Packing", emoji: "🧳", desc: "Don't forget the SPF" },
];

const desktopNav = [...primaryTabs.slice(0, 1), ...moreItems.slice(0, 4), ...primaryTabs.slice(1), ...moreItems.slice(4)];

const syncBadge = {
  local: { label: "local", color: "bg-cream text-plum/60" },
  connecting: { label: "connecting…", color: "bg-cream text-plum/60" },
  synced: { label: "synced", color: "bg-palm/10 text-palm" },
  error: { label: "offline", color: "bg-flamingo/10 text-flamingo" },
};

export default function Layout({ children }) {
  const { trip, resetAll, syncState } = useTrip();
  const badge = syncBadge[syncState] || syncBadge.local;
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = moreItems.some((m) => location.pathname === m.to);

  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [moreOpen]);

  return (
    <div className="min-h-screen relative">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/50 border-b border-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 group min-w-0">
            <span className="text-xl sm:text-2xl group-hover:animate-floaty">🌴</span>
            <div className="leading-tight min-w-0">
              <div className="font-display font-semibold text-plum text-sm sm:text-base truncate">{trip.meta.title}</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-plum/60 hidden sm:block">the crew</div>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-1 ml-6 overflow-x-auto">
            {desktopNav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === "/"}
                className={({ isActive }) =>
                  `pill ${isActive ? "bg-plum text-cream" : "text-plum/70 hover:bg-white"}`
                }
              >
                <span>{n.emoji}</span>
                <span>{n.label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <span
              className={`pill ${badge.color}`}
              title={syncState === "synced" ? "Live syncing across devices" : syncState}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  syncState === "synced" ? "bg-palm" : syncState === "error" ? "bg-flamingo" : "bg-plum/40"
                }`}
              />
              <span className={syncState === "synced" ? "hidden sm:inline" : ""}>{badge.label}</span>
            </span>
            <button
              onClick={resetAll}
              className="hidden sm:inline pill text-plum/50 hover:text-flamingo hover:bg-white"
              title="Reset trip data"
            >
              ↺ reset
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-10 pb-nav md:pb-10 relative">
        {children}
      </main>

      <footer className="hidden md:block max-w-7xl mx-auto px-6 py-10 text-center text-xs text-plum/50">
        made with 🧡 for the crew · May 29 – June 1, 2026
      </footer>

      {/* Mobile bottom tab bar */}
      <nav
        className="md:hidden fixed inset-x-0 bottom-0 z-40 backdrop-blur-xl bg-white/85 border-t border-white/70 shadow-[0_-8px_24px_-12px_rgba(43,20,55,0.15)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-stretch px-2">
          {primaryTabs.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.to === "/"} className="tab-link">
              <span className="tab-emoji">{t.emoji}</span>
              <span>{t.label}</span>
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => setMoreOpen((o) => !o)}
            aria-current={moreActive || moreOpen ? "page" : undefined}
            className="tab-link"
          >
            <span className="tab-emoji">{moreOpen ? "✕" : "•••"}</span>
            <span>{moreOpen ? "Close" : "More"}</span>
          </button>
        </div>
      </nav>

      {/* More sheet */}
      {moreOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-plum/30 backdrop-blur-sm"
            onClick={() => setMoreOpen(false)}
            aria-hidden
          />
          <div
            className="md:hidden fixed inset-x-0 z-40 bg-white/95 backdrop-blur-xl rounded-t-3xl border-t border-white shadow-glow"
            style={{
              bottom: "calc(56px + env(safe-area-inset-bottom))",
              maxHeight: "70vh",
            }}
            role="dialog"
            aria-label="More sections"
          >
            <div className="px-5 pt-3 pb-2 flex items-center justify-between">
              <div className="w-10 h-1 rounded-full bg-plum/15 mx-auto" />
            </div>
            <div className="px-4 pb-5 grid grid-cols-2 gap-3">
              {moreItems.map((m) => (
                <NavLink
                  key={m.to}
                  to={m.to}
                  className={({ isActive }) =>
                    `card p-4 flex items-start gap-3 active:scale-[0.98] transition ${
                      isActive ? "ring-2 ring-flamingo/40" : ""
                    }`
                  }
                >
                  <span className="text-2xl">{m.emoji}</span>
                  <span className="min-w-0">
                    <span className="block font-display text-base text-plum leading-tight">{m.label}</span>
                    <span className="block text-[11px] text-plum/55 mt-0.5">{m.desc}</span>
                  </span>
                </NavLink>
              ))}
            </div>
            <div className="px-5 pb-4 flex items-center justify-between text-xs text-plum/50">
              <span>made with 🧡 · may 29 – jun 1</span>
              <button onClick={resetAll} className="text-plum/40 hover:text-flamingo">↺ reset</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
