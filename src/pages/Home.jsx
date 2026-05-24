import { Link } from "react-router-dom";
import Countdown from "../components/Countdown.jsx";
import { useTrip } from "../state/TripContext.jsx";

const fmt = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

const tiles = [
  { to: "/crew", emoji: "🦩", label: "The crew", desc: "Everyone going" },
  { to: "/flights", emoji: "✈️", label: "Flights", desc: "Arrivals + departures" },
  { to: "/stay", emoji: "🏨", label: "Stay", desc: "Moxy South Beach" },
  { to: "/cars", emoji: "🚗", label: "Cars", desc: "Who's driving who" },
  { to: "/itinerary", emoji: "📍", label: "Itinerary", desc: "Day-by-day plan" },
  { to: "/map", emoji: "🗺️", label: "Map", desc: "All the spots" },
  { to: "/polls", emoji: "🗳️", label: "Polls", desc: "Decide things" },
  { to: "/packing", emoji: "🧳", label: "Packing", desc: "Don't forget the SPF" },
  { to: "/spend", emoji: "💸", label: "Spend", desc: "Who owes who" },
];

export default function Home() {
  const { trip } = useTrip();

  const stats = [
    { v: trip.people.length, l: "people" },
    { v: 4, l: "days" },
    { v: 3, l: "nights" },
    { v: trip.cars.length, l: "cars" },
  ];

  return (
    <div className="space-y-6 sm:space-y-10">
      <section className="relative overflow-hidden rounded-[28px] sm:rounded-[40px] border border-white/60 bg-sunsetSoft shadow-soft">
        <div aria-hidden className="absolute -top-24 -right-24 w-[320px] sm:w-[420px] h-[320px] sm:h-[420px] rounded-full bg-sunset opacity-90 blur-3xl animate-shimmer" />
        <div aria-hidden className="absolute -bottom-32 -left-20 w-[280px] sm:w-[380px] h-[280px] sm:h-[380px] rounded-full bg-flamingo/60 blur-3xl" />
        <div className="relative px-5 sm:px-12 py-7 sm:py-16">
          <div className="flex items-center gap-1.5 mb-3 flex-wrap">
            <span className="pill bg-white/70 text-plum">📍 {trip.meta.city}</span>
            <span className="pill bg-white/70 text-plum">
              {fmt(trip.meta.startDate)} – {fmt(trip.meta.endDate)}, 2026
            </span>
          </div>
          <h1 className="font-display text-4xl sm:text-7xl text-plum leading-[1.05] tracking-tight">
            {trip.meta.title}
            <span className="block text-flamingo italic font-medium text-2xl sm:text-4xl mt-1.5 sm:mt-2">
              {trip.meta.subtitle}
            </span>
          </h1>
          <p className="mt-4 sm:mt-6 max-w-xl text-sm sm:text-base text-plum/70">
            The unofficial command center for our long weekend in South Beach —
            flights, cars, the playlist, who packed the speaker.
          </p>

          <div className="mt-5 sm:mt-8">
            <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-plum/60 mb-2 sm:mb-3">we leave in</div>
            <Countdown date={trip.meta.startDate} />
          </div>

          <div className="mt-6 sm:mt-10 grid grid-cols-4 gap-2 sm:gap-3 max-w-2xl">
            {stats.map((s) => (
              <div key={s.l} className="card px-2 sm:px-4 py-2.5 sm:py-3 text-center">
                <div className="font-display text-xl sm:text-2xl text-plum">{s.v}</div>
                <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em] text-plum/60 mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between mb-3 sm:mb-4">
          <h2 className="section-title">jump in</h2>
          <span className="text-xs text-plum/50 hidden sm:block">tap a card</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {tiles.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              className="card group hover:card-pop hover:-translate-y-0.5 active:scale-[0.98] transition-all p-4 sm:p-5 flex flex-col gap-1.5 sm:gap-2 min-h-[112px] sm:min-h-[140px]"
            >
              <div className="text-2xl sm:text-3xl group-hover:animate-floaty">{t.emoji}</div>
              <div className="font-display text-base sm:text-xl text-plum leading-tight">{t.label}</div>
              <div className="text-[11px] sm:text-xs text-plum/60 leading-snug">{t.desc}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="card p-4 sm:p-5">
          <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-plum/60">vibe check</div>
          <div className="mt-1.5 sm:mt-2 font-display text-lg sm:text-2xl leading-snug">white party, boat day, Wynwood crawl 🪩</div>
        </div>
        <div className="card p-4 sm:p-5">
          <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-plum/60">weather guess</div>
          <div className="mt-1.5 sm:mt-2 font-display text-lg sm:text-2xl leading-snug">~85°F · humid · sun ☀️</div>
        </div>
        <div className="card p-4 sm:p-5">
          <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-plum/60">house rule</div>
          <div className="mt-1.5 sm:mt-2 font-display text-lg sm:text-2xl leading-snug">no one eats alone 🌮</div>
        </div>
      </section>
    </div>
  );
}
