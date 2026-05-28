import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { useTrip } from "../state/TripContext.jsx";
import { confirmDelete } from "../lib/confirmDelete.js";

const CATEGORIES = {
  stay: { label: "Stay", emoji: "🏨", color: "#FF3D8A" },
  beach: { label: "Beach", emoji: "🏖️", color: "#FF7E5F" },
  food: { label: "Food", emoji: "🍽️", color: "#E1306C" },
  club: { label: "Club", emoji: "🪩", color: "#9B5DE5" },
  activity: { label: "Activity", emoji: "✨", color: "#1E96A8" },
  other: { label: "Other", emoji: "📍", color: "#2B1437" },
};

const makeIcon = (cat) => {
  const c = CATEGORIES[cat] || CATEGORIES.other;
  const html = `
    <div style="position:relative;width:44px;height:54px;">
      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">
        <div style="width:36px;height:36px;border-radius:50%;background:${c.color};box-shadow:0 6px 14px ${c.color}55;display:flex;align-items:center;justify-content:center;font-size:18px;border:3px solid white;">${c.emoji}</div>
      </div>
      <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:2px;height:14px;background:${c.color};"></div>
    </div>`;
  return L.divIcon({ html, className: "miami-marker", iconSize: [44, 54], iconAnchor: [22, 54], popupAnchor: [0, -48] });
};

const draftIcon = () =>
  L.divIcon({
    html: `<div class="miami-draft-dot"></div>`,
    className: "miami-draft-marker",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

export default function MapPage() {
  const { trip, update } = useTrip();
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersLayer = useRef(null);
  const draftMarkerRef = useRef(null);
  const [activeCats, setActiveCats] = useState(() => new Set(Object.keys(CATEGORIES)));
  const [draft, setDraft] = useState(null); // { lat, lng, name, address, category, notes } or null
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);

  // Init map once
  useEffect(() => {
    if (mapInstance.current) return;
    const map = L.map(mapRef.current, {
      center: [25.785, -80.13],
      zoom: 13,
      scrollWheelZoom: true,
      zoomControl: true,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);
    markersLayer.current = L.layerGroup().addTo(map);
    mapInstance.current = map;

    map.on("click", (e) => {
      setDraft({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        name: "",
        address: "",
        category: "food",
        notes: "",
      });
    });
  }, []);

  // Re-render saved markers when places or filters change
  useEffect(() => {
    if (!markersLayer.current) return;
    markersLayer.current.clearLayers();
    trip.places
      .filter((p) => activeCats.has(p.category))
      .forEach((p) => {
        const m = L.marker([p.lat, p.lng], { icon: makeIcon(p.category) });
        m.bindPopup(
          `<div style="font-family:Inter,sans-serif;min-width:200px">
            <div style="font-family:Fraunces,serif;font-size:18px;font-weight:600;color:#2B1437">${escapeHtml(p.name)}</div>
            <div style="font-size:12px;color:#2B143799;margin-top:2px">${escapeHtml(p.address || "")}</div>
            ${p.notes ? `<div style="font-size:12px;color:#2B1437;margin-top:8px;font-style:italic">${escapeHtml(p.notes)}</div>` : ""}
            <a href="https://maps.google.com/?q=${encodeURIComponent(p.address || `${p.lat},${p.lng}`)}" target="_blank" rel="noreferrer" style="display:inline-block;margin-top:8px;font-size:11px;color:#FF3D8A;text-decoration:none">→ open in Google Maps</a>
          </div>`
        );
        m.addTo(markersLayer.current);
      });
  }, [trip.places, activeCats]);

  // Show / move / remove the draft pin marker
  useEffect(() => {
    if (!mapInstance.current) return;
    if (!draft) {
      if (draftMarkerRef.current) {
        draftMarkerRef.current.remove();
        draftMarkerRef.current = null;
      }
      return;
    }
    if (!draftMarkerRef.current) {
      draftMarkerRef.current = L.marker([draft.lat, draft.lng], { icon: draftIcon(), zIndexOffset: 1000 }).addTo(mapInstance.current);
    } else {
      draftMarkerRef.current.setLatLng([draft.lat, draft.lng]);
    }
  }, [draft]);

  const toggleCat = (cat) => {
    setActiveCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const searchAddress = async (e) => {
    e?.preventDefault();
    const q = search.trim();
    if (!q) return;
    setSearching(true);
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`);
      const data = await r.json();
      if (!data[0]) {
        alert("Couldn't find that address. Try something more specific, or click on the map.");
        return;
      }
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      mapInstance.current?.flyTo([lat, lng], 16);
      setDraft({ lat, lng, name: "", address: q, category: "food", notes: "" });
    } catch {
      alert("Search failed. Check your connection.");
    } finally {
      setSearching(false);
    }
  };

  const flyTo = (p) => {
    mapInstance.current?.flyTo([p.lat, p.lng], 16);
  };

  const savePin = () => {
    if (!draft) return;
    const name = draft.name.trim();
    if (!name) {
      alert("Give your pin a name first.");
      return;
    }
    update("places", (places) => [
      ...places,
      {
        id: `pl_${Math.random().toString(36).slice(2, 8)}`,
        name,
        address: draft.address.trim(),
        lat: draft.lat,
        lng: draft.lng,
        category: draft.category,
        notes: draft.notes.trim(),
      },
    ]);
    setDraft(null);
  };

  const removePlace = (id) => {
    const place = trip.places.find((p) => p.id === id);
    if (!confirmDelete(place?.name ? `pin "${place.name}"` : "this pin")) return;
    update("places", (places) => places.filter((p) => p.id !== id));
  };

  const editPlace = (id, field, value) => {
    update("places", (places) => places.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="section-title">map</h1>
        <p className="text-plum/60 mt-1">tap anywhere on the map to drop a pin · or search an address</p>
      </header>

      {/* Search */}
      <form onSubmit={searchAddress} className="flex gap-2">
        <input
          className="field flex-1"
          placeholder="Search an address or place (e.g. Joe's Stone Crab, Miami)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit" disabled={searching || !search.trim()} className="btn-sunset disabled:opacity-50 disabled:cursor-not-allowed">
          {searching ? "…" : "Search"}
        </button>
      </form>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(CATEGORIES).map(([key, c]) => (
          <button
            key={key}
            onClick={() => toggleCat(key)}
            className={`pill ${activeCats.has(key) ? "bg-plum text-cream" : "bg-white/60 text-plum/40 line-through"}`}
          >
            <span>{c.emoji}</span>
            <span>{c.label}</span>
          </button>
        ))}
      </div>

      {/* Map */}
      <div className="card-pop overflow-hidden">
        <div ref={mapRef} className="w-full h-[60vh] min-h-[420px] cursor-crosshair" />
      </div>

      {/* Draft pin form */}
      {draft && (
        <section className="card-pop p-5 border-2 border-flamingo/40">
          <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
            <div>
              <h2 className="font-display text-xl text-plum">new pin</h2>
              <div className="text-xs text-plum/55 font-mono mt-0.5">
                {draft.lat.toFixed(5)}, {draft.lng.toFixed(5)}
              </div>
            </div>
            <button
              onClick={() => setDraft(null)}
              className="text-xs text-plum/60 hover:text-flamingo px-3 py-1 rounded-full bg-white/60"
            >
              cancel
            </button>
          </div>
          <div className="grid sm:grid-cols-12 gap-2">
            <input
              autoFocus
              className="field sm:col-span-5"
              placeholder="Name (required)"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && savePin()}
            />
            <select
              className="field sm:col-span-3"
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
            >
              {Object.entries(CATEGORIES).map(([key, c]) => (
                <option key={key} value={key}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <input
              className="field sm:col-span-4"
              placeholder="Address (optional)"
              value={draft.address}
              onChange={(e) => setDraft({ ...draft, address: e.target.value })}
            />
            <input
              className="field sm:col-span-12"
              placeholder="Notes (optional)"
              value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            />
          </div>
          <div className="mt-4 sm:flex sm:justify-end">
            <button onClick={savePin} className="btn-sunset w-full sm:w-auto">save pin</button>
          </div>
        </section>
      )}

      {/* Pin list */}
      <section>
        <div className="flex items-end justify-between mb-3">
          <h2 className="font-display text-2xl text-plum">your spots</h2>
          <div className="text-xs text-plum/55">{trip.places.length} pin{trip.places.length === 1 ? "" : "s"}</div>
        </div>
        {trip.places.length === 0 ? (
          <div className="card p-6 text-center text-plum/55">
            no pins yet · tap the map or search above to drop one
          </div>
        ) : (
          <div className="card divide-y divide-cream">
            {trip.places.map((p) => {
              const c = CATEGORIES[p.category] || CATEGORIES.other;
              return (
                <div key={p.id} className="p-3 sm:p-4 flex items-center gap-3 group">
                  <div
                    className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-base"
                    style={{ background: `${c.color}1A`, color: c.color }}
                    title={c.label}
                  >
                    {c.emoji}
                  </div>
                  <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    <input
                      className="field-line text-plum font-medium"
                      value={p.name}
                      placeholder="Name"
                      onChange={(e) => editPlace(p.id, "name", e.target.value)}
                    />
                    <select
                      className="field-line text-sm text-plum/80"
                      value={p.category}
                      onChange={(e) => editPlace(p.id, "category", e.target.value)}
                    >
                      {Object.entries(CATEGORIES).map(([key, cc]) => (
                        <option key={key} value={key}>{cc.emoji} {cc.label}</option>
                      ))}
                    </select>
                    {p.address && (
                      <div className="text-xs text-plum/55 sm:col-span-2 truncate">{p.address}</div>
                    )}
                  </div>
                  <button
                    onClick={() => flyTo(p)}
                    className="icon-btn shrink-0"
                    aria-label="Center on map"
                    title="Center on map"
                  >
                    🎯
                  </button>
                  <button
                    onClick={() => removePlace(p.id)}
                    className="icon-btn shrink-0 touch-show opacity-0 group-hover:opacity-100"
                    aria-label="Remove pin"
                    title="Remove pin"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
