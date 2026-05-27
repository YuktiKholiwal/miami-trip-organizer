import { useMemo } from "react";
import { useTrip } from "../state/TripContext.jsx";

export default function Packing() {
  const { trip, update } = useTrip();

  const toggleItem = (catId, itemId) => {
    update("packing.categories", (cats) =>
      cats.map((c) =>
        c.id !== catId
          ? c
          : { ...c, items: c.items.map((i) => (i.id === itemId ? { ...i, done: !i.done } : i)) }
      )
    );
  };

  const editItem = (catId, itemId, value) => {
    update("packing.categories", (cats) =>
      cats.map((c) =>
        c.id !== catId
          ? c
          : { ...c, items: c.items.map((i) => (i.id === itemId ? { ...i, label: value } : i)) }
      )
    );
  };

  const addItem = (catId) => {
    update("packing.categories", (cats) =>
      cats.map((c) =>
        c.id !== catId
          ? c
          : {
              ...c,
              items: [
                ...c.items,
                { id: `i_${Math.random().toString(36).slice(2, 8)}`, label: "New item", done: false },
              ],
            }
      )
    );
  };

  const removeItem = (catId, itemId) => {
    update("packing.categories", (cats) =>
      cats.map((c) =>
        c.id !== catId ? c : { ...c, items: c.items.filter((i) => i.id !== itemId) }
      )
    );
  };

  const editCategory = (id, field, value) => {
    update("packing.categories", (cats) =>
      cats.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const addCategory = () => {
    update("packing.categories", (cats) => [
      ...cats,
      {
        id: `k_${Math.random().toString(36).slice(2, 8)}`,
        title: "New list",
        emoji: "📝",
        items: [],
      },
    ]);
  };

  const totals = useMemo(() => {
    const all = trip.packing.categories.flatMap((c) => c.items);
    const done = all.filter((i) => i.done).length;
    return { total: all.length, done, pct: all.length ? Math.round((done / all.length) * 100) : 0 };
  }, [trip.packing.categories]);

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="section-title">packing</h1>
          <p className="text-plum/60 mt-1">shared checklist · tap to tick off</p>
        </div>
        <div className="card px-5 py-3 min-w-[220px]">
          <div className="flex items-baseline justify-between">
            <div className="text-[11px] uppercase tracking-[0.2em] text-plum/60">packed</div>
            <div className="font-display text-2xl text-plum">{totals.done}/{totals.total}</div>
          </div>
          <div className="mt-2 h-2 bg-cream rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${totals.pct}%`, background: "linear-gradient(90deg,#FF7E5F,#FF3D8A)" }}
            />
          </div>
        </div>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {trip.packing.categories.map((cat) => {
          const done = cat.items.filter((i) => i.done).length;
          return (
            <div key={cat.id} className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <input
                  value={cat.emoji}
                  onChange={(e) => editCategory(cat.id, "emoji", e.target.value)}
                  className="field-line w-11 text-xl text-center"
                />
                <input
                  value={cat.title}
                  onChange={(e) => editCategory(cat.id, "title", e.target.value)}
                  placeholder="Category name"
                  className="field-line flex-1 font-display text-lg text-plum"
                />
                <span className="text-xs text-plum/50 tabular-nums">{done}/{cat.items.length}</span>
              </div>
              <ul className="space-y-1.5">
                {cat.items.map((it) => (
                  <li key={it.id} className="flex items-center gap-2 group">
                    <button
                      onClick={() => toggleItem(cat.id, it.id)}
                      aria-label={it.done ? "Mark as unpacked" : "Mark as packed"}
                      className={`w-6 h-6 sm:w-5 sm:h-5 shrink-0 rounded-md border-2 flex items-center justify-center text-xs transition ${
                        it.done
                          ? "bg-flamingo border-flamingo text-white"
                          : "border-plum/20 text-transparent hover:border-flamingo/60"
                      }`}
                    >
                      ✓
                    </button>
                    <input
                      value={it.label}
                      onChange={(e) => editItem(cat.id, it.id, e.target.value)}
                      placeholder="Item"
                      className={`field-line flex-1 text-sm ${
                        it.done ? "line-through text-plum/40" : "text-plum"
                      }`}
                    />
                    <button
                      onClick={() => removeItem(cat.id, it.id)}
                      className="icon-btn touch-show w-7 h-7 opacity-0 group-hover:opacity-100"
                      aria-label="Remove item"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => addItem(cat.id)}
                className="mt-3 text-xs text-flamingo hover:underline"
              >
                + add item
              </button>
            </div>
          );
        })}
        <button
          onClick={addCategory}
          className="card p-5 border-dashed border-2 border-cream text-plum/50 hover:text-flamingo hover:border-flamingo/40 transition flex items-center justify-center min-h-[140px]"
        >
          + add category
        </button>
      </div>
    </div>
  );
}
