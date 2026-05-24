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
        name: "New friend",
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
    <div className="space-y-8">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="section-title">the crew</h1>
          <p className="text-plum/60 mt-1">{trip.people.length} people · tap any card to edit.</p>
        </div>
        <button onClick={addPerson} className="btn-sunset">+ add someone</button>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {trip.people.map((p) => (
          <div key={p.id} className="card p-5 relative group">
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
              className="mt-3 w-full font-display text-xl text-plum bg-transparent focus:outline-none border-b border-transparent focus:border-flamingo/40"
            />
            <input
              value={p.role}
              onChange={(e) => editPerson(p.id, "role", e.target.value)}
              placeholder="role / nickname"
              className="mt-1 w-full text-xs text-plum/60 bg-transparent focus:outline-none placeholder:text-plum/30"
            />
            <div className="mt-3 flex items-center gap-1 flex-wrap">
              {emojis.slice(0, 9).map((e) => (
                <button
                  key={e}
                  onClick={() => editPerson(p.id, "emoji", e)}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm transition ${
                    p.emoji === e ? "bg-plum text-cream" : "hover:bg-white"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
