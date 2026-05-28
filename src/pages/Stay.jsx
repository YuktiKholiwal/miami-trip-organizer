import { useTrip } from "../state/TripContext.jsx";
import { confirmDelete } from "../lib/confirmDelete.js";

export default function Stay() {
  const { trip, update } = useTrip();
  const s = trip.stay;

  const editStay = (field, value) => update(`stay.${field}`, value);

  const editRoom = (id, field, value) => {
    update("stay.rooms", (rooms) =>
      rooms.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const toggleOccupant = (roomId, personId) => {
    update("stay.rooms", (rooms) =>
      rooms.map((r) => {
        if (r.id !== roomId) return { ...r, occupants: r.occupants.filter((p) => p !== personId) };
        const has = r.occupants.includes(personId);
        return { ...r, occupants: has ? r.occupants.filter((p) => p !== personId) : [...r.occupants, personId] };
      })
    );
  };

  const addRoom = () => {
    update("stay.rooms", (rooms) => [
      ...rooms,
      { id: `r_${Math.random().toString(36).slice(2, 8)}`, name: `Room ${rooms.length + 1}`, occupants: [] },
    ]);
  };

  const removeRoom = (id) => {
    const room = s.rooms.find((r) => r.id === id);
    if (!confirmDelete(room?.name ? `room "${room.name}"` : "this room")) return;
    update("stay.rooms", (rooms) => rooms.filter((r) => r.id !== id));
  };

  const assigned = new Set(s.rooms.flatMap((r) => r.occupants));
  const unassigned = trip.people.filter((p) => !assigned.has(p.id));

  return (
    <div className="space-y-8">
      <header>
        <h1 className="section-title">where we crash</h1>
        <p className="text-plum/60 mt-1">hotel info + room assignments</p>
      </header>

      <section className="card-pop p-5 sm:p-8 relative overflow-hidden">
        <div aria-hidden className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-flamingo/20 blur-3xl" />
        <div className="relative grid lg:grid-cols-2 gap-5 sm:gap-6">
          <div>
            <div className="text-[11px] uppercase tracking-[0.25em] text-plum/60">home base</div>
            <input
              value={s.name}
              onChange={(e) => editStay("name", e.target.value)}
              placeholder="Hotel name"
              className="field-line mt-2 font-display text-2xl sm:text-4xl text-plum"
            />
            <input
              value={s.address}
              onChange={(e) => editStay("address", e.target.value)}
              placeholder="Address"
              className="field-line mt-2 text-sm text-plum/80"
            />
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(s.address || s.name)}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-xs text-flamingo hover:underline"
            >
              📍 open in maps →
            </a>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Check-in</label>
              <input type="date" className="field" value={s.checkIn} onChange={(e) => editStay("checkIn", e.target.value)} />
            </div>
            <div>
              <label className="field-label">Check-out</label>
              <input type="date" className="field" value={s.checkOut} onChange={(e) => editStay("checkOut", e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="field-label">Confirmation #</label>
              <input className="field" placeholder="ABC123" value={s.confirmation} onChange={(e) => editStay("confirmation", e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="field-label">Notes</label>
              <textarea className="field min-h-[80px]" placeholder="Anything to remember" value={s.notes} onChange={(e) => editStay("notes", e.target.value)} />
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between mb-4">
          <h2 className="font-display text-2xl text-plum">room assignments</h2>
          <button onClick={addRoom} className="btn-ghost text-xs">+ add room</button>
        </div>

        {unassigned.length > 0 && (
          <div className="card p-4 mb-4">
            <div className="text-[11px] uppercase tracking-[0.2em] text-plum/60 mb-2">unassigned</div>
            <div className="flex flex-wrap gap-2">
              {unassigned.map((p) => (
                <span key={p.id} className="pill bg-white" style={{ color: p.color }}>
                  {p.emoji} {p.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {s.rooms.map((room) => (
            <div key={room.id} className="card p-5 relative group">
              <button
                onClick={() => removeRoom(room.id)}
                className="icon-btn touch-show absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                aria-label="Remove room"
              >
                ✕
              </button>
              <input
                value={room.name}
                onChange={(e) => editRoom(room.id, "name", e.target.value)}
                placeholder="Room name"
                className="field-line font-display text-xl text-plum"
              />
              <div className="text-xs text-plum/50 mt-1">{room.occupants.length} in this room</div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {trip.people.map((p) => {
                  const has = room.occupants.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => toggleOccupant(room.id, p.id)}
                      className={`pill text-xs ${
                        has ? "bg-plum text-cream" : "bg-white text-plum/70 hover:bg-cream"
                      }`}
                      title={p.name}
                    >
                      <span>{p.emoji}</span>
                      <span>{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
