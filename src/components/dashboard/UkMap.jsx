import React, { useMemo, useState, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, GeoJSON } from "react-leaflet";
import { MapPin, Layers } from "lucide-react";

// Fixed, deterministic color per course route so a route is always the same
// colour regardless of the active filters.
const ROUTE_PALETTE = {
  "Health and science": "#38BDF8",
  "Education and early years": "#F59E0B",
  "Business and administration": "#10B981",
  "Engineering and manufacturing": "#8B5CF6",
  "Sales, marketing and procurement": "#F43F5E",
  "Catering and hospitality": "#FBBF24",
  "Construction and the built environment": "#6366F1",
  "Digital": "#22D3EE",
  "Legal, finance and accounting": "#84CC16",
  "Care services": "#EC4899",
  "Agriculture, environmental and animal care": "#14B8A6",
  "Transport and logistics": "#F97316",
  "Hair and beauty": "#A78BFA",
  "Creative and design": "#4ADE80",
  "Protective services": "#60A5FA",
};
const FALLBACK_COLOR = "#94A3B8";
const routeColor = (route) => ROUTE_PALETTE[route] || FALLBACK_COLOR;

// Sequential cyan ramp for the choropleth.
const CHORO_STOPS = ["#0E2A3F", "#12496A", "#1C6E9C", "#2A93C9", "#38BDF8", "#7DD3FC"];
const choroColor = (v, max) => {
  if (!v) return "#131C31";
  const t = Math.min(1, v / (max || 1));
  const idx = Math.min(CHORO_STOPS.length - 1, Math.floor(t * (CHORO_STOPS.length - 1) + 0.0001));
  return CHORO_STOPS[Math.max(1, idx)];
};

export const UkMap = ({ points, total, returned, loading, choropleth = [], filters, setFilters }) => {
  const [ready, setReady] = useState(false);
  const [view, setView] = useState("points"); // 'points' | 'regions'
  const [geo, setGeo] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    fetch("/itl1.geojson").then((r) => r.json()).then(setGeo).catch(() => setGeo(null));
  }, []);

  const legend = useMemo(() => {
    const counts = {};
    points.forEach((p) => {
      const r = p.course_route || "Unknown";
      counts[r] = (counts[r] || 0) + 1;
    });
    // Always show every known route so multi-select stays possible even after
    // filtering down to one route. Selected routes sort first, then by count.
    const selected = filters?.course_routes || [];
    return Object.keys(ROUTE_PALETTE)
      .map((name) => ({ name, count: counts[name] || 0, color: ROUTE_PALETTE[name] }))
      .sort((a, b) => {
        const sa = selected.includes(a.name) ? 1 : 0;
        const sb = selected.includes(b.name) ? 1 : 0;
        if (sa !== sb) return sb - sa;
        return b.count - a.count;
      });
  }, [points, filters]);

  const choroByCode = useMemo(() => {
    const m = {};
    choropleth.forEach((c) => (m[c.code] = c));
    return m;
  }, [choropleth]);
  const choroMax = useMemo(() => Math.max(1, ...choropleth.map((c) => c.count)), [choropleth]);

  const selectedRoutes = filters?.course_routes || [];
  const toggleRoute = (name) => {
    if (!setFilters || !ROUTE_PALETTE[name]) return;
    const arr = selectedRoutes;
    setFilters({
      ...filters,
      course_routes: arr.includes(name) ? arr.filter((x) => x !== name) : [...arr, name],
    });
  };

  const geoStyle = (feature) => {
    const c = choroByCode[feature.properties.id];
    return {
      fillColor: choroColor(c?.count || 0, choroMax),
      weight: 1,
      color: "#2A3A56",
      fillOpacity: 0.82,
    };
  };
  const onEachRegion = (feature, layer) => {
    const c = choroByCode[feature.properties.id];
    const name = feature.properties.name;
    layer.bindTooltip(
      `<div style="font-weight:600">${name}</div><div>${(c?.count || 0).toLocaleString()} vacancies</div>`,
      { sticky: true, className: "choro-tip" }
    );
  };

  return (
    <div
      data-testid="uk-map-card"
      className="overflow-hidden rounded-xl border border-[#2A3A56] bg-[#18243E]/90 shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
    >
      <div className="flex flex-col gap-3 border-b border-[#2A3A56] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h3 className="font-heading text-base font-semibold tracking-tight text-white">Vacancy Map</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {view === "points" ? (
              <>
                Plotting <span className="font-mono-data text-[#38BDF8]">{returned?.toLocaleString() ?? 0}</span> of{" "}
                <span className="font-mono-data text-slate-300">{total?.toLocaleString() ?? 0}</span> geo-located vacancies
              </>
            ) : (
              <>Vacancy density shaded by ITL1 region</>
            )}
          </p>
        </div>
        {/* View toggle */}
        <div className="flex items-center gap-1 rounded-lg border border-[#2A3A56] bg-[#0E1626] p-1">
          <button
            data-testid="map-view-points"
            onClick={() => setView("points")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              view === "points" ? "bg-[#38BDF8]/15 text-[#38BDF8]" : "text-slate-400 hover:text-white"
            }`}
          >
            <MapPin className="h-3.5 w-3.5" /> Points
          </button>
          <button
            data-testid="map-view-regions"
            onClick={() => setView("regions")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              view === "regions" ? "bg-[#38BDF8]/15 text-[#38BDF8]" : "text-slate-400 hover:text-white"
            }`}
          >
            <Layers className="h-3.5 w-3.5" /> Heatmap
          </button>
        </div>
      </div>

      {/* Colour legend — clickable to filter by course route (points view) */}
      {view === "points" && (
        <div data-testid="map-legend" className="border-b border-[#2A3A56] bg-[#131C31]/60 px-5 py-3 sm:px-6">
          <p className="mb-2 font-mono-data text-[10px] uppercase tracking-widest text-slate-500">
            Dot colour = course route · click to filter
          </p>
          <div className="flex flex-wrap gap-2">
            {legend.map((l) => {
              const active = selectedRoutes.includes(l.name);
              const dim = selectedRoutes.length > 0 && !active;
              return (
                <button
                  key={l.name}
                  data-testid={`legend-${l.name}`}
                  onClick={() => toggleRoute(l.name)}
                  title={`${l.name}: ${l.count.toLocaleString()} vacancies`}
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-all ${
                    active
                      ? "border-[#38BDF8] bg-[#38BDF8]/15 text-white"
                      : "border-[#2A3A56] text-slate-300 hover:border-[#38BDF8]/50"
                  } ${dim ? "opacity-45" : ""}`}
                >
                  <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: l.color }} />
                  {l.name}
                  <span className="font-mono-data text-[10px] text-slate-500">{l.count.toLocaleString()}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Choropleth scale legend (regions view) */}
      {view === "regions" && (
        <div className="flex items-center gap-3 border-b border-[#2A3A56] bg-[#131C31]/60 px-5 py-3 sm:px-6">
          <span className="font-mono-data text-[10px] uppercase tracking-widest text-slate-500">Low</span>
          <div className="flex h-2.5 flex-1 overflow-hidden rounded-full">
            {CHORO_STOPS.slice(1).map((c) => (
              <span key={c} className="h-full flex-1" style={{ background: c }} />
            ))}
          </div>
          <span className="font-mono-data text-[10px] uppercase tracking-widest text-slate-500">High</span>
        </div>
      )}

      <div className="relative h-[520px] w-full">
        {(loading || !ready) && (
          <div className="absolute inset-0 z-[500] flex items-center justify-center bg-[#0B101D]/60">
            <span className="font-mono-data text-xs text-slate-400">Loading map…</span>
          </div>
        )}
        {ready && (
          <MapContainer
            center={[54.2, -2.6]}
            zoom={6}
            minZoom={5}
            maxZoom={16}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
            preferCanvas={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            {view === "regions" && geo && (
              <GeoJSON key={JSON.stringify(choroByCode)} data={geo} style={geoStyle} onEachFeature={onEachRegion} />
            )}
            {view === "points" &&
              points.map((p) => (
                <CircleMarker
                  key={p.vacancy_reference}
                  center={[p.lat, p.lng]}
                  radius={4}
                  pathOptions={{
                    color: routeColor(p.course_route),
                    fillColor: routeColor(p.course_route),
                    fillOpacity: 0.55,
                    weight: 1,
                  }}
                >
                  <Popup>
                    <div className="space-y-1">
                      <p className="text-[13px] font-semibold text-white">{p.title}</p>
                      <p className="text-slate-300">{p.employer}</p>
                      <p className="text-slate-400">Route: {p.course_route}</p>
                      <p className="text-slate-400">Level: {p.apprenticeship_level}</p>
                      {p.wage_info && <p className="text-[#F59E0B]">{p.wage_info}</p>}
                      <p className="text-slate-500">{p.postcode} · {p.itl1_name}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
          </MapContainer>
        )}
      </div>
    </div>
  );
};
