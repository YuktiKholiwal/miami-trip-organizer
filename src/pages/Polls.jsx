import { useMemo, useState } from "react";
import { useTrip } from "../state/TripContext.jsx";

export default function Polls() {
  const { trip, update } = useTrip();
  const [voterId, setVoterId] = useState(() => localStorage.getItem("miami-voter") || "");
  const [draft, setDraft] = useState({ question: "", options: ["", ""] });

  const setVoter = (id) => {
    setVoterId(id);
    localStorage.setItem("miami-voter", id);
  };

  const vote = (pollId, optionId) => {
    if (!voterId) {
      alert("Pick who you are first ☝️");
      return;
    }
    update("polls", (polls) =>
      polls.map((p) => {
        if (p.id !== pollId) return p;
        return {
          ...p,
          options: p.options.map((o) => ({
            ...o,
            voters: o.id === optionId
              ? (o.voters.includes(voterId) ? o.voters.filter((v) => v !== voterId) : [...o.voters, voterId])
              : o.voters.filter((v) => v !== voterId),
          })),
        };
      })
    );
  };

  const addOption = () => setDraft((d) => ({ ...d, options: [...d.options, ""] }));
  const setOption = (i, v) => setDraft((d) => ({ ...d, options: d.options.map((o, idx) => (idx === i ? v : o)) }));
  const removeOption = (i) => setDraft((d) => ({ ...d, options: d.options.filter((_, idx) => idx !== i) }));

  const createPoll = () => {
    const q = draft.question.trim();
    const opts = draft.options.map((o) => o.trim()).filter(Boolean);
    if (!q || opts.length < 2) {
      alert("Need a question and at least 2 options.");
      return;
    }
    update("polls", (polls) => [
      {
        id: `po_${Math.random().toString(36).slice(2, 8)}`,
        question: q,
        options: opts.map((label) => ({
          id: `op_${Math.random().toString(36).slice(2, 8)}`,
          label,
          voters: [],
        })),
        createdAt: new Date().toISOString(),
      },
      ...polls,
    ]);
    setDraft({ question: "", options: ["", ""] });
  };

  const removePoll = (id) => {
    if (!confirm("Delete this poll?")) return;
    update("polls", (polls) => polls.filter((p) => p.id !== id));
  };

  const peopleById = useMemo(
    () => Object.fromEntries(trip.people.map((p) => [p.id, p])),
    [trip.people]
  );

  const me = trip.people.find((p) => p.id === voterId);

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="section-title">polls</h1>
          <p className="text-plum/60 mt-1">decide things without the group-chat chaos</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-plum/60">i am:</span>
          <select
            value={voterId}
            onChange={(e) => setVoter(e.target.value)}
            className="field max-w-[180px]"
          >
            <option value="">— pick yourself —</option>
            {trip.people.map((p) => (
              <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
            ))}
          </select>
        </div>
      </header>

      <section className="card-pop p-5">
        <h2 className="font-display text-2xl text-plum mb-3">new poll</h2>
        <input
          className="field"
          placeholder="What's the question? (e.g. 'Brunch — Stiltsville or Joe's?')"
          value={draft.question}
          onChange={(e) => setDraft({ ...draft, question: e.target.value })}
        />
        <div className="mt-3 space-y-2">
          {draft.options.map((o, i) => (
            <div key={i} className="flex gap-2">
              <input
                className="field"
                placeholder={`Option ${i + 1}`}
                value={o}
                onChange={(e) => setOption(i, e.target.value)}
              />
              {draft.options.length > 2 && (
                <button onClick={() => removeOption(i)} className="text-plum/40 hover:text-flamingo">✕</button>
              )}
            </div>
          ))}
          <button onClick={addOption} className="text-xs text-flamingo hover:underline">+ add option</button>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={createPoll} className="btn-sunset">create poll</button>
        </div>
      </section>

      <div className="space-y-4">
        {trip.polls.length === 0 && (
          <div className="card p-6 text-center text-plum/50">no polls yet ✨</div>
        )}
        {trip.polls.map((poll) => {
          const totalVotes = poll.options.reduce((n, o) => n + o.voters.length, 0);
          const max = Math.max(1, ...poll.options.map((o) => o.voters.length));
          return (
            <div key={poll.id} className="card p-5 group relative">
              <button
                onClick={() => removePoll(poll.id)}
                className="icon-btn touch-show absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                aria-label="Delete poll"
              >
                ✕
              </button>
              <h3 className="font-display text-xl text-plum">{poll.question}</h3>
              <div className="text-xs text-plum/50 mt-1">{totalVotes} vote{totalVotes === 1 ? "" : "s"}</div>

              <ul className="mt-4 space-y-2">
                {poll.options.map((o) => {
                  const isMine = me && o.voters.includes(me.id);
                  const pct = totalVotes ? Math.round((o.voters.length / totalVotes) * 100) : 0;
                  const winning = o.voters.length === max && o.voters.length > 0;
                  return (
                    <li key={o.id}>
                      <button
                        onClick={() => vote(poll.id, o.id)}
                        className={`w-full text-left rounded-2xl border transition-all overflow-hidden relative ${
                          isMine ? "border-flamingo bg-flamingo/5" : "border-cream bg-white/60 hover:bg-white"
                        }`}
                      >
                        <div
                          className="absolute inset-y-0 left-0 transition-all"
                          style={{
                            width: `${pct}%`,
                            background: winning
                              ? "linear-gradient(90deg,#FF7E5F22,#FF3D8A22)"
                              : "linear-gradient(90deg,#FFE9DA,#FFE9DA)",
                          }}
                        />
                        <div className="relative px-4 py-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] ${
                              isMine ? "bg-flamingo border-flamingo text-white" : "border-plum/20"
                            }`}>
                              {isMine ? "✓" : ""}
                            </span>
                            <span className="text-plum font-medium">{o.label}</span>
                            {winning && totalVotes > 0 && <span className="pill bg-flamingo/10 text-flamingo">leading</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex -space-x-1.5">
                              {o.voters.slice(0, 5).map((v) => {
                                const p = peopleById[v];
                                if (!p) return null;
                                return (
                                  <span
                                    key={v}
                                    title={p.name}
                                    className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[11px]"
                                    style={{ background: `${p.color}33` }}
                                  >
                                    {p.emoji}
                                  </span>
                                );
                              })}
                              {o.voters.length > 5 && (
                                <span className="w-6 h-6 rounded-full border-2 border-white bg-cream text-plum text-[10px] flex items-center justify-center">
                                  +{o.voters.length - 5}
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-xs text-plum/70 tabular-nums">{pct}%</span>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
