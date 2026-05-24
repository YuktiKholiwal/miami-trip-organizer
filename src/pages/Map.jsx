import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { useTrip } from "../state/TripContext.jsx";

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

export default function MapPage() {
  const { trip, update } = useTrip();
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersLayer = useRef(null);
  const [activeCats, setActiveCats] = useState(() => new Set(Object.keys(CATEGORIES)));
  const [draft, setDraft] = useState({ name: "", address: "", lat: "", lng: "", category: "food", notes: "" });

  useEffect(() => {
    if (mapInstance.current) return;
    const map = L.map(mapRef.current, {
      center: [25.785, -80.13],
      zoom: 13,
      scrollWheelZoom: true,
      zoomControl: true,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);
    markersLayer.current = L.layerGroup().addTo(map);
    mapInstance.current = map;
  }, []);

  useEffect(() => {
    if (!markersLayer.current) return;
    markersLayer.current.clearLayers();
    const visible = trip.places.filter((p) => activeCats.has(p.category));
    visible.forEach((p) => {
      const m = L.marker([p.lat, p.lng], { icon: makeIcon(p.category) });
      m.bindPopup(
        `<div style="font-family:Inter,sans-serif;min-width:200px">
          <div style="font-family:Fraunces,serif;font-size:18px;font-weight:600;color:#2B1437">${escape(p.name)}</div>
          <div style="font-size:12px;color:#2B143799;margin-top:2px">${escape(p.address || "")}</div>
          ${p.notes ? `<div style="font-size:12px;color:#2B1437;margin-top:8px;font-style:italic">${escape(p.notes)}</div>` : ""}
          <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">
            <a href="https://maps.google.com/?q=${encodeURIComponent(p.address || p.name)}" target="_blank" rel="noreferrer" style="font-size:11px;color:#FF3D8A;text-decoration:none">→ Google Maps</a>
            <button data-id="${p.id}" class="js-remove-pin" style="font-size:11px;color:#999;background:none;border:none;cursor:pointer">remove</button>
          </div>
        </div>`
      );
      m.addTo(markersLayer.current);
    });
  }, [trip.places, activeCats]);

  useEffect(() => {
    const handler = (e) => {
      const el = e.target.closest(".js-remove-pin");
      if (!el) return;
      const id = el.getAttribute("data-id");
      removePlace(id);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip.places]);

  const toggleCat = (cat) => {
    setActiveCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const lookupAddress = async () => {
    if (!draft.address.trim()) return;
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(draft.address)}`);
      const data = await r.json();
      if (data[0]) {
        setDraft((d) => ({ ...d, lat: data[0].lat, lng: data[0].lon }));
      } else {
        alert("Couldn't find that address — try a more specific one or enter lat/lng manually.");
      }
    } catch {
      alert("Lookup failed — check your connection.");
    }
  };

  const addPlace = () => {
    const lat = parseFloat(draft.lat);
    const lng = parseFloat(draft.lng);
    if (!draft.name.trim() || isNaN(lat) || isNaN(lng)) return;
    update("places", (places) => [
      ...places,
      {
        id: `pl_${Math.random().toString(36).slice(2, 8)}`,
        name: draft.name.trim(),
        address: draft.address.trim(),
        lat,
        lng,
        category: draft.category,
        notes: draft.notes.trim(),
      },
    ]);
    setDraft({ name: "", address: "", lat: "", lng: "", category: "food", notes: "" });
    if (mapInstance.current) mapInstance.current.flyTo([lat, lng], 15);
  };

  const removePlace = (id) => {
    update("places", (places) => places.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="section-title">map</h1>
        <p className="text-plum/60 mt-1">all the spots · drop pins for new ones</p>
      </header>

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

      <div className="card-pop overflow-hidden">
        <div ref={mapRef} className="w-full h-[60vh] min-h-[420px]" />
      </div>

      <section className="card p-5">
        <h2 className="font-display text-2xl text-plum mb-3">drop a pin</h2>
        <div className="grid sm:grid-cols-12 gap-2">
          <input className="field sm:col-span-4" placeholder="Name (e.g. Versace Mansion)" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <input className="field sm:col-span-5" placeholder="Address" value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} />
          <button onClick={lookupAddress} className="btn-ghost sm:col-span-3 text-xs">🔍 find lat/lng</button>
          <input className="field sm:col-span-2" placeholder="lat" value={draft.lat} onChange={(e) => setDraft({ ...draft, lat: e.target.value })} />
          <input className="field sm:col-span-2" placeholder="lng" value={draft.lng} onChange={(e) => setDraft({ ...draft, lng: e.target.value })} />
          <select className="field sm:col-span-3" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
            {Object.entries(CATEGORIES).map(([key, c]) => (
              <option key={key} value={key}>{c.emoji} {c.label}</option>
            ))}
          </select>
          <input className="field sm:col-span-5" placeholder="Notes (optional)" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
        </div>
        <div className="mt-3 flex justify-end">
          <button onClick={addPlace} className="btn-sunset">add pin</button>
        </div>
      </section>
    </div>
  );
}

function escape(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
