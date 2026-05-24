import { useTrip } from "../state/TripContext.jsx";

export default function Cars() {
  const { trip, update } = useTrip();

  const editCar = (id, field, value) => {
    update("cars", (cars) =>
      cars.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const toggleRider = (carId, personId) => {
    update("cars", (cars) =>
      cars.map((c) => {
        if (c.id !== carId) return c;
        const has = c.riders.includes(personId);
        return { ...c, riders: has ? c.riders.filter((p) => p !== personId) : [...c.riders, personId] };
      })
    );
  };

  const addCar = () => {
    update("cars", (cars) => [
      ...cars,
      {
        id: `c_${Math.random().toString(36).slice(2, 8)}`,
        label: `Car ${cars.length + 1}`,
        make: "",
        model: "",
        company: "",
        pickup: "",
        dropoff: "",
        driverId: "",
        riders: [],
        confirmation: "",
      },
    ]);
  };

  const removeCar = (id) => {
    update("cars", (cars) => cars.filter((c) => c.id !== id));
  };

  const assigned = new Set(trip.cars.flatMap((c) => [c.driverId, ...c.riders].filter(Boolean)));
  const unassigned = trip.people.filter((p) => !assigned.has(p.id));

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="section-title">cars</h1>
          <p className="text-plum/60 mt-1">each couple has their own rental · drag people in</p>
        </div>
        <button onClick={addCar} className="btn-sunset">+ add car</button>
      </header>

      {unassigned.length > 0 && (
        <div className="card p-4">
          <div className="text-[11px] uppercase tracking-[0.2em] text-plum/60 mb-2">no car yet</div>
          <div className="flex flex-wrap gap-2">
            {unassigned.map((p) => (
              <span key={p.id} className="pill bg-white" style={{ color: p.color }}>
                {p.emoji} {p.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {trip.cars.map((c) => {
          const driver = trip.people.find((p) => p.id === c.driverId);
          return (
            <div key={c.id} className="card p-5 relative group">
              <button
                onClick={() => removeCar(c.id)}
                className="icon-btn touch-show absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                aria-label="Remove car"
              >
                ✕
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-coral/15 text-coral flex items-center justify-center text-2xl">🚗</div>
                <input
                  value={c.label}
                  onChange={(e) => editCar(c.id, "label", e.target.value)}
                  className="font-display text-xl text-plum bg-transparent focus:outline-none border-b border-transparent focus:border-flamingo/40 w-full"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                <input className="field" placeholder="Company (e.g. Turo, Hertz)" value={c.company} onChange={(e) => editCar(c.id, "company", e.target.value)} />
                <input className="field" placeholder="Make + model" value={c.make} onChange={(e) => editCar(c.id, "make", e.target.value)} />
                <input className="field" placeholder="Pickup (date / location)" value={c.pickup} onChange={(e) => editCar(c.id, "pickup", e.target.value)} />
                <input className="field" placeholder="Drop-off" value={c.dropoff} onChange={(e) => editCar(c.id, "dropoff", e.target.value)} />
                <input className="field sm:col-span-2" placeholder="Confirmation #" value={c.confirmation} onChange={(e) => editCar(c.id, "confirmation", e.target.value)} />
              </div>

              <div className="mt-4">
                <div className="text-[11px] uppercase tracking-[0.2em] text-plum/60 mb-2">driver</div>
                <select
                  value={c.driverId}
                  onChange={(e) => editCar(c.id, "driverId", e.target.value)}
                  className="field"
                >
                  <option value="">— pick a driver —</option>
                  {trip.people.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.emoji} {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4">
                <div className="text-[11px] uppercase tracking-[0.2em] text-plum/60 mb-2">passengers</div>
                <div className="flex flex-wrap gap-1.5">
                  {trip.people.map((p) => {
                    if (p.id === c.driverId) return null;
                    const has = c.riders.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => toggleRider(c.id, p.id)}
                        className={`pill text-xs ${
                          has ? "bg-plum text-cream" : "bg-white text-plum/70 hover:bg-cream"
                        }`}
                      >
                        <span>{p.emoji}</span>
                        <span>{p.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {driver && (
                <div className="mt-4 text-xs text-plum/60">
                  {driver.emoji} {driver.name} driving · {c.riders.length} passenger{c.riders.length === 1 ? "" : "s"}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
