import { useTrip } from "../state/TripContext.jsx";

const fmt = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

export default function Itinerary() {
  const { trip, update } = useTrip();

  const editDay = (id, field, value) => {
    update("itinerary", (days) =>
      days.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );
  };

  const editEvent = (dayId, eventId, field, value) => {
    update("itinerary", (days) =>
      days.map((d) =>
        d.id !== dayId
          ? d
          : { ...d, events: d.events.map((e) => (e.id === eventId ? { ...e, [field]: value } : e)) }
      )
    );
  };

  const addEvent = (dayId) => {
    update("itinerary", (days) =>
      days.map((d) =>
        d.id !== dayId
          ? d
          : {
              ...d,
              events: [
                ...d.events,
                { id: `e_${Math.random().toString(36).slice(2, 8)}`, time: "", title: "New plan", location: "", notes: "" },
              ],
            }
      )
    );
  };

  const removeEvent = (dayId, eventId) => {
    update("itinerary", (days) =>
      days.map((d) =>
        d.id !== dayId
          ? d
          : { ...d, events: d.events.filter((e) => e.id !== eventId) }
      )
    );
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="section-title">itinerary</h1>
        <p className="text-plum/60 mt-1">3 nights, infinite vibes — edit anything inline</p>
      </header>

      <div className="space-y-6">
        {trip.itinerary.map((day, idx) => (
          <div key={day.id} className="card p-6 relative overflow-hidden">
            <div
              aria-hidden
              className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-30 blur-3xl"
              style={{ background: idx % 2 ? "#FF3D8A" : "#FF7E5F" }}
            />
            <div className="relative flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="text-[11px] uppercase tracking-[0.25em] text-plum/60">{fmt(day.date)}</div>
                <input
                  value={day.title}
                  onChange={(e) => editDay(day.id, "title", e.target.value)}
                  className="mt-1 font-display text-3xl text-plum bg-transparent focus:outline-none border-b border-transparent focus:border-flamingo/40"
                />
                <input
                  value={day.vibe}
                  onChange={(e) => editDay(day.id, "vibe", e.target.value)}
                  className="block mt-1 italic text-flamingo bg-transparent focus:outline-none"
                />
              </div>
              <button onClick={() => addEvent(day.id)} className="btn-ghost text-xs">+ event</button>
            </div>

            <ol className="relative mt-6 pl-6 border-l-2 border-cream space-y-4">
              {day.events.map((e) => (
                <li key={e.id} className="relative group">
                  <span className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-flamingo" />
                  <div className="grid grid-cols-12 gap-2 items-start">
                    <input
                      value={e.time}
                      onChange={(ev) => editEvent(day.id, e.id, "time", ev.target.value)}
                      placeholder="time"
                      className="col-span-3 sm:col-span-2 text-sm font-mono text-plum bg-transparent focus:outline-none placeholder:text-plum/30"
                    />
                    <div className="col-span-9 sm:col-span-10">
                      <input
                        value={e.title}
                        onChange={(ev) => editEvent(day.id, e.id, "title", ev.target.value)}
                        className="w-full font-display text-lg text-plum bg-transparent focus:outline-none"
                      />
                      <div className="flex flex-wrap gap-3 mt-1">
                        <input
                          value={e.location}
                          onChange={(ev) => editEvent(day.id, e.id, "location", ev.target.value)}
                          placeholder="📍 location"
                          className="text-sm text-plum/70 bg-transparent focus:outline-none placeholder:text-plum/30"
                        />
                        <input
                          value={e.notes}
                          onChange={(ev) => editEvent(day.id, e.id, "notes", ev.target.value)}
                          placeholder="notes…"
                          className="flex-1 min-w-[120px] text-sm text-plum/50 bg-transparent focus:outline-none placeholder:text-plum/30"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => removeEvent(day.id, e.id)}
                      className="icon-btn touch-show absolute right-0 top-0 opacity-0 group-hover:opacity-100"
                      aria-label="Remove event"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}
