import { useState } from "react";
import { useTrip } from "../state/TripContext.jsx";
import { confirmDelete } from "../lib/confirmDelete.js";

const emojis = ["✨", "🌴", "🍹", "🕶️", "🦩", "🌊", "🔆", "🎶", "🌅", "🍉", "💃", "🕺", "🌺", "🥥", "⚡", "🐬", "🪩", "🌷"];

export default function Crew() {
  const { trip, update } = useTrip();
  const [pickerFor, setPickerFor] = useState(null);

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
    const person = trip.people.find((p) => p.id === id);
    if (!confirmDelete(person?.name ? `${person.name} from the crew` : "this person")) return;
    update("people", (people) => people.filter((p) => p.id !== id));
  };

  const pickerPerson = trip.people.find((p) => p.id === pickerFor);

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="section-title">the crew</h1>
          <p className="text-plum/60 mt-1">{trip.people.length} people · tap a face to change it</p>
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
            <button
              onClick={() => setPickerFor(p.id)}
              className="relative w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition hover:scale-105 active:scale-95"
              style={{ background: `${p.color}22`, color: p.color }}
              aria-label="Change emoji"
              title="Tap to change emoji"
            >
              <span>{p.emoji}</span>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white shadow-soft flex items-center justify-center text-[10px]">
                ✏️
              </span>
            </button>
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
          </div>
        ))}
        <button
          onClick={addPerson}
          className="card p-4 sm:p-5 border-2 border-dashed border-plum/15 text-plum/50 hover:text-flamingo hover:border-flamingo/40 transition flex flex-col items-center justify-center min-h-[160px] gap-1"
        >
          <span className="text-3xl leading-none">＋</span>
          <span className="text-sm font-medium">add someone</span>
        </button>
      </div>

      {/* Emoji picker — bottom sheet on mobile, centered modal on desktop */}
      {pickerPerson && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-plum/30 backdrop-blur-sm"
          onClick={() => setPickerFor(null)}
        >
          <div
            className="card-pop p-5 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Pick an emoji"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-plum/70">
                pick a face{pickerPerson.name ? ` for ${pickerPerson.name}` : ""}
              </div>
              <button
                onClick={() => setPickerFor(null)}
                className="icon-btn"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {emojis.map((e) => (
                <button
                  key={e}
                  onClick={() => {
                    editPerson(pickerPerson.id, "emoji", e);
                    setPickerFor(null);
                  }}
                  className={`aspect-square rounded-xl flex items-center justify-center text-2xl transition ${
                    pickerPerson.emoji === e
                      ? "bg-plum text-cream scale-105"
                      : "bg-white/70 hover:bg-white active:scale-95"
                  }`}
                  aria-label={`Set emoji ${e}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
