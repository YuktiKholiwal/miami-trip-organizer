import { useMemo, useState } from "react";
import { useTrip } from "../state/TripContext.jsx";
import { confirmDelete } from "../lib/confirmDelete.js";

const money = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n || 0);

export default function Spend() {
  const { trip, update } = useTrip();
  const [draft, setDraft] = useState({
    title: "",
    amount: "",
    paidBy: trip.people[0]?.id || "",
    splitWith: trip.people.map((p) => p.id),
    category: "Food",
  });

  const addExpense = () => {
    const amt = parseFloat(draft.amount);
    if (!draft.title.trim() || isNaN(amt) || amt <= 0 || !draft.paidBy || draft.splitWith.length === 0) return;
    update("expenses", (xs) => [
      ...xs,
      {
        id: `x_${Math.random().toString(36).slice(2, 8)}`,
        title: draft.title.trim(),
        amount: amt,
        paidBy: draft.paidBy,
        splitWith: draft.splitWith,
        category: draft.category,
        date: new Date().toISOString(),
      },
    ]);
    setDraft({ ...draft, title: "", amount: "" });
  };

  const removeExpense = (id) => {
    const x = trip.expenses.find((e) => e.id === id);
    if (!confirmDelete(x?.title ? `"${x.title}"` : "this expense")) return;
    update("expenses", (xs) => xs.filter((e) => e.id !== id));
  };

  const toggleSplit = (id) => {
    setDraft((d) => ({
      ...d,
      splitWith: d.splitWith.includes(id) ? d.splitWith.filter((x) => x !== id) : [...d.splitWith, id],
    }));
  };

  const { totals, balances, settlements } = useMemo(() => {
    const balances = Object.fromEntries(trip.people.map((p) => [p.id, 0]));
    let total = 0;

    trip.expenses.forEach((x) => {
      total += x.amount;
      const share = x.amount / Math.max(x.splitWith.length, 1);
      balances[x.paidBy] = (balances[x.paidBy] || 0) + x.amount;
      x.splitWith.forEach((id) => {
        balances[id] = (balances[id] || 0) - share;
      });
    });

    const debtors = [];
    const creditors = [];
    Object.entries(balances).forEach(([id, v]) => {
      if (v > 0.01) creditors.push({ id, v });
      else if (v < -0.01) debtors.push({ id, v: -v });
    });
    creditors.sort((a, b) => b.v - a.v);
    debtors.sort((a, b) => b.v - a.v);

    const settle = [];
    let i = 0;
    let j = 0;
    while (i < debtors.length && j < creditors.length) {
      const amt = Math.min(debtors[i].v, creditors[j].v);
      settle.push({ from: debtors[i].id, to: creditors[j].id, amount: amt });
      debtors[i].v -= amt;
      creditors[j].v -= amt;
      if (debtors[i].v < 0.01) i++;
      if (creditors[j].v < 0.01) j++;
    }

    const perPerson = total / Math.max(trip.people.length, 1);
    return {
      totals: { total, perPerson, count: trip.expenses.length },
      balances,
      settlements: settle,
    };
  }, [trip.expenses, trip.people]);

  const personName = (id) => {
    const p = trip.people.find((x) => x.id === id);
    return p ? `${p.emoji} ${p.name}` : "?";
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="section-title">spend</h1>
        <p className="text-plum/60 mt-1">log it, split it, settle up at the end</p>
      </header>

      <section className="grid sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="text-[11px] uppercase tracking-[0.2em] text-plum/60">trip total</div>
          <div className="mt-1 font-display text-3xl text-plum">{money(totals.total)}</div>
        </div>
        <div className="card p-5">
          <div className="text-[11px] uppercase tracking-[0.2em] text-plum/60">per person (avg)</div>
          <div className="mt-1 font-display text-3xl text-plum">{money(totals.perPerson)}</div>
        </div>
        <div className="card p-5">
          <div className="text-[11px] uppercase tracking-[0.2em] text-plum/60">expenses logged</div>
          <div className="mt-1 font-display text-3xl text-plum">{totals.count}</div>
        </div>
      </section>

      <section className="card-pop p-5 sm:p-6">
        <h2 className="font-display text-2xl text-plum mb-5">add an expense</h2>
        <div className="grid sm:grid-cols-12 gap-3 sm:gap-4">
          <div className="sm:col-span-7">
            <label className="field-label">What was it?</label>
            <input
              className="field"
              placeholder="e.g. dinner at Joe's"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </div>
          <div className="sm:col-span-3">
            <label className="field-label">Amount</label>
            <input
              type="number"
              inputMode="decimal"
              className="field"
              placeholder="0.00"
              value={draft.amount}
              onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="field-label">Category</label>
            <select
              className="field"
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
            >
              {["Food", "Drinks", "Club", "Cab", "Hotel", "Activity", "Misc"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-12">
            <label className="field-label">Who paid?</label>
            <select
              className="field"
              value={draft.paidBy}
              onChange={(e) => setDraft({ ...draft, paidBy: e.target.value })}
            >
              <option value="">— pick a person —</option>
              {trip.people.map((p) => (
                <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <label className="field-label !mb-0">Split between</label>
            <div className="flex gap-1">
              <button
                onClick={() => setDraft({ ...draft, splitWith: trip.people.map((p) => p.id) })}
                className="text-[11px] text-plum/60 hover:text-flamingo uppercase tracking-wider"
              >
                all
              </button>
              <span className="text-plum/30 text-[11px]">·</span>
              <button
                onClick={() => setDraft({ ...draft, splitWith: [] })}
                className="text-[11px] text-plum/60 hover:text-flamingo uppercase tracking-wider"
              >
                none
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {trip.people.map((p) => {
              const on = draft.splitWith.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => toggleSplit(p.id)}
                  className={`pill text-xs transition ${on ? "bg-plum text-cream" : "bg-white text-plum/70 hover:bg-cream"}`}
                >
                  <span>{p.emoji}</span>
                  <span>{p.name}</span>
                </button>
              );
            })}
          </div>
          {draft.splitWith.length > 0 && draft.amount && !isNaN(parseFloat(draft.amount)) && (
            <div className="mt-2 text-xs text-plum/60">
              {money(parseFloat(draft.amount) / draft.splitWith.length)} per person × {draft.splitWith.length}
            </div>
          )}
        </div>
        <div className="mt-5 sm:flex sm:justify-end">
          <button onClick={addExpense} className="btn-sunset w-full sm:w-auto">+ add expense</button>
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="font-display text-2xl text-plum mb-3">balances</h2>
          {trip.people.length === 0 ? (
            <div className="text-sm text-plum/50">add people first</div>
          ) : (
            <ul className="divide-y divide-cream">
              {trip.people.map((p) => {
                const b = balances[p.id] || 0;
                const pos = b > 0.01;
                const neg = b < -0.01;
                return (
                  <li key={p.id} className="flex items-center justify-between py-2.5">
                    <span className="flex items-center gap-2">
                      <span className="text-lg">{p.emoji}</span>
                      <span className="text-plum">{p.name}</span>
                    </span>
                    <span
                      className={`font-mono text-sm tabular-nums ${
                        pos ? "text-palm" : neg ? "text-flamingo" : "text-plum/40"
                      }`}
                    >
                      {pos ? "+" : ""}{money(b)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-display text-2xl text-plum mb-3">settle up</h2>
          {settlements.length === 0 ? (
            <div className="text-sm text-plum/50">all even — or no expenses yet ✨</div>
          ) : (
            <ul className="space-y-2">
              {settlements.map((s, i) => (
                <li key={i} className="flex items-center justify-between py-2 px-3 rounded-xl bg-cream/60">
                  <span className="text-sm">
                    <span className="text-flamingo">{personName(s.from)}</span>
                    <span className="text-plum/40 mx-2">→</span>
                    <span className="text-palm">{personName(s.to)}</span>
                  </span>
                  <span className="font-mono text-sm tabular-nums text-plum">{money(s.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl text-plum mb-3">all expenses</h2>
        {trip.expenses.length === 0 ? (
          <div className="card p-6 text-center text-plum/50">no expenses yet · add your first one ☝️</div>
        ) : (
          <div className="card divide-y divide-cream">
            {[...trip.expenses].reverse().map((x) => (
              <div key={x.id} className="p-3 sm:p-4 flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-cream flex items-center justify-center text-sm font-medium text-plum shrink-0">
                  {x.category.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-plum truncate">{x.title}</div>
                  <div className="text-xs text-plum/60 truncate">
                    {personName(x.paidBy)} · split {x.splitWith.length}
                  </div>
                </div>
                <div className="font-mono text-plum tabular-nums text-sm sm:text-base shrink-0">{money(x.amount)}</div>
                <button
                  onClick={() => removeExpense(x.id)}
                  className="icon-btn shrink-0"
                  aria-label="Remove expense"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
