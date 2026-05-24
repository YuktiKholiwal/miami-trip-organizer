import { useEffect, useState } from "react";

const calc = (target) => {
  const diff = target - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, mins: 0, secs: 0, done: true };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  const secs = Math.floor((diff / 1000) % 60);
  return { days, hours, mins, secs, done: false };
};

export default function Countdown({ date }) {
  const target = new Date(`${date}T00:00:00`).getTime();
  const [t, setT] = useState(() => calc(target));

  useEffect(() => {
    const i = setInterval(() => setT(calc(target)), 1000);
    return () => clearInterval(i);
  }, [target]);

  if (t.done) {
    return (
      <div className="font-display text-4xl text-flamingo">we're here 🌴</div>
    );
  }

  const units = [
    { v: t.days, l: "days" },
    { v: t.hours, l: "hours" },
    { v: t.mins, l: "mins" },
    { v: t.secs, l: "secs" },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 sm:flex sm:flex-wrap sm:gap-4 max-w-md">
      {units.map((u) => (
        <div key={u.l} className="card px-2 py-2.5 sm:px-5 sm:py-4 sm:min-w-[88px] text-center">
          <div className="font-display text-2xl sm:text-4xl text-plum tabular-nums leading-none">
            {String(u.v).padStart(2, "0")}
          </div>
          <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em] text-plum/60 mt-1">{u.l}</div>
        </div>
      ))}
    </div>
  );
}
