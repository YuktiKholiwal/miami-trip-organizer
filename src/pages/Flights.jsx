import { useMemo, useState } from "react";
import { useTrip, personById } from "../state/TripContext.jsx";

const fmtDate = (iso) =>
  iso
    ? new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : "—";

export default function Flights() {
  const { trip, update } = useTrip();
  const [filter, setFilter] = useState("all");

  const editFlight = (id, field, value) => {
    update("flights", (flights) =>
      flights.map((f) => (f.id === id ? { ...f, [field]: value } : f))
    );
  };

  const flightsByPerson = useMemo(() => {
    const map = new Map();
    trip.flights.forEach((f) => map.set(f.personId, f));
    return map;
  }, [trip.flights]);

  const visible = trip.people.filter((p) => {
    const f = flightsByPerson.get(p.id);
    if (filter === "all") return true;
    if (filter === "filled") return f && (f.arrivalTime || f.departureTime);
    if (filter === "tbd") return !f || (!f.arrivalTime && !f.departureTime);
    return true;
  });

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="section-title">flights</h1>
          <p className="text-plum/60 mt-1">arrivals: fri may 29 · departures: mon jun 1</p>
        </div>
        <div className="flex gap-2">
          {["all", "filled", "tbd"].map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`pill capitalize ${
                filter === k ? "bg-plum text-cream" : "bg-white/60 text-plum/70"
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {visible.map((p) => {
          const f = flightsByPerson.get(p.id);
          if (!f) return null;
          return (
            <div key={p.id} className="card p-4 sm:p-5">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{ background: `${p.color}22`, color: p.color }}
                >
                  {p.emoji}
                </div>
                <div className="font-display text-lg sm:text-xl text-plum truncate">{p.name}</div>
                {f.arrivalTime && (
                  <span className="ml-auto pill bg-palm/10 text-palm shrink-0">arr {f.arrivalTime}</span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-flamingo text-base">↘</span>
                    <span className="text-[11px] uppercase tracking-[0.2em] text-plum/60 font-medium">Arrival</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <label className="field-label">Airline</label>
                      <input className="field" placeholder="e.g. Delta" value={f.arrivalAirline} onChange={(e) => editFlight(f.id, "arrivalAirline", e.target.value)} />
                    </div>
                    <div>
                      <label className="field-label">Flight #</label>
                      <input className="field" placeholder="DL 1234" value={f.arrivalNumber} onChange={(e) => editFlight(f.id, "arrivalNumber", e.target.value)} />
                    </div>
                    <div>
                      <label className="field-label">From</label>
                      <input className="field" placeholder="JFK, etc" value={f.arrivalFrom} onChange={(e) => editFlight(f.id, "arrivalFrom", e.target.value)} />
                    </div>
                    <div>
                      <label className="field-label">Date</label>
                      <input type="date" className="field" value={f.arrivalDate} onChange={(e) => editFlight(f.id, "arrivalDate", e.target.value)} />
                    </div>
                    <div>
                      <label className="field-label">Time</label>
                      <input type="time" className="field" value={f.arrivalTime} onChange={(e) => editFlight(f.id, "arrivalTime", e.target.value)} />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-coral text-base">↗</span>
                    <span className="text-[11px] uppercase tracking-[0.2em] text-plum/60 font-medium">Departure</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <label className="field-label">Airline</label>
                      <input className="field" placeholder="e.g. Delta" value={f.departureAirline} onChange={(e) => editFlight(f.id, "departureAirline", e.target.value)} />
                    </div>
                    <div>
                      <label className="field-label">Flight #</label>
                      <input className="field" placeholder="DL 1234" value={f.departureNumber} onChange={(e) => editFlight(f.id, "departureNumber", e.target.value)} />
                    </div>
                    <div>
                      <label className="field-label">To</label>
                      <input className="field" placeholder="JFK, etc" value={f.departureTo} onChange={(e) => editFlight(f.id, "departureTo", e.target.value)} />
                    </div>
                    <div>
                      <label className="field-label">Date</label>
                      <input type="date" className="field" value={f.departureDate} onChange={(e) => editFlight(f.id, "departureDate", e.target.value)} />
                    </div>
                    <div>
                      <label className="field-label">Time</label>
                      <input type="time" className="field" value={f.departureTime} onChange={(e) => editFlight(f.id, "departureTime", e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label className="field-label">Confirmation # (optional)</label>
                <input
                  className="field"
                  placeholder="ABC123"
                  value={f.confirmation}
                  onChange={(e) => editFlight(f.id, "confirmation", e.target.value)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
