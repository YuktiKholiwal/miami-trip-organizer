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
                  placeholder="Day title"
                  className="field-line mt-1 font-display text-3xl text-plum"
                />
                <input
                  value={day.vibe}
                  onChange={(e) => editDay(day.id, "vibe", e.target.value)}
                  placeholder="vibe of the day"
                  className="field-line mt-2 italic text-flamingo"
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
                      className="field-line col-span-3 sm:col-span-2 text-sm font-mono text-plum"
                    />
                    <div className="col-span-9 sm:col-span-10 space-y-1.5">
                      <input
                        value={e.title}
                        onChange={(ev) => editEvent(day.id, e.id, "title", ev.target.value)}
                        placeholder="What's the plan?"
                        className="field-line font-display text-lg text-plum"
                      />
                      <div className="flex flex-wrap gap-2">
                        <input
                          value={e.location}
                          onChange={(ev) => editEvent(day.id, e.id, "location", ev.target.value)}
                          placeholder="📍 location"
                          className="field-line text-sm text-plum/80 max-w-[220px]"
                        />
                        <input
                          value={e.notes}
                          onChange={(ev) => editEvent(day.id, e.id, "notes", ev.target.value)}
                          placeholder="notes…"
                          className="field-line flex-1 min-w-[140px] text-sm text-plum/70"
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
