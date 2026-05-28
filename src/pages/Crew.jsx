import { useTrip } from "../state/TripContext.jsx";

const emojis = ["✨", "🌴", "🍹", "🕶️", "🦩", "🌊", "🔆", "🎶", "🌅", "🍉", "💃", "🕺", "🌺", "🥥", "⚡", "🐬", "🪩", "🌷"];

export default function Crew() {
  const { trip, update } = useTrip();

  const editPerson = (id, field, value) => {
    update("people", (people) =>
      people.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const addPerson = () => {
    update("people", (people) => [
      ...people,
      {
        id: `p_${Math.random().toString(36).slice(2, 8)}`,
        name: "",
        emoji: "🌟",
        color: "#FF7E5F",
        role: "",
      },
    ]);
  };

  const removePerson = (id) => {
    if (!confirm("Remove this person? They'll be cleared from flights/cars/rooms too.")) return;
    update("people", (people) => people.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="section-title">the crew</h1>
          <p className="text-plum/60 mt-1">{trip.people.length} people · tap any card to edit</p>
        </div>
        <button onClick={addPerson} className="btn-sunset hidden sm:inline-flex">+ add someone</button>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
        {trip.people.map((p) => (
          <div key={p.id} className="card p-4 sm:p-5 relative group">
            <button
              onClick={() => removePerson(p.id)}
              className="icon-btn touch-show absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition"
              aria-label="Remove"
            >
              ✕
            </button>
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: `${p.color}22`, color: p.color }}
            >
              <span>{p.emoji}</span>
            </div>
            <input
              value={p.name}
              onChange={(e) => editPerson(p.id, "name", e.target.value)}
              placeholder="Name"
              className="field-line mt-3 font-display text-xl text-plum"
            />
            <input
              value={p.role}
              onChange={(e) => editPerson(p.id, "role", e.target.value)}
              placeholder="role / nickname"
              className="field-line mt-1 text-xs text-plum/70"
            />
            <div className="mt-3 grid grid-cols-9 gap-1">
              {emojis.slice(0, 9).map((e) => (
                <button
                  key={e}
                  onClick={() => editPerson(p.id, "emoji", e)}
                  className={`aspect-square min-h-[32px] rounded-lg flex items-center justify-center text-base transition ${
                    p.emoji === e ? "bg-plum text-cream" : "hover:bg-white active:bg-cream"
                  }`}
                  aria-label={`Set emoji ${e}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        ))}
        <button
          onClick={addPerson}
          className="card p-4 sm:p-5 border-2 border-dashed border-plum/15 text-plum/50 hover:text-flamingo hover:border-flamingo/40 transition flex flex-col items-center justify-center min-h-[180px] gap-1"
        >
          <span className="text-3xl leading-none">＋</span>
          <span className="text-sm font-medium">add someone</span>
        </button>
      </div>
    </div>
  );
}
