import React, { useEffect, useMemo, useState } from "react";
import { GitCompareArrows, Building2, School, Award, Briefcase, Users, PoundSterling, MapPin, Layers, Clock, CalendarClock } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend,
} from "recharts";
import { fetchCompare, fetchOverlapLeaderboard } from "../../lib/api";
import { EntitySearchSelect } from "./EntitySearchSelect";

const A_COLOR = "#38BDF8";
const B_COLOR = "#F59E0B";

const DIMENSIONS = [
  { key: "employer", label: "Employers", field: "employer", icon: Building2 },
  { key: "provider", label: "Providers", field: "provider", icon: School },
  { key: "standard", label: "Standards", field: "standard", icon: Award },
];

const monthLabel = (m) => {
  if (!m) return m;
  const [y, mm] = m.split("-");
  return `${["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][+mm]} ${y.slice(2)}`;
};

const METRICS = [
  { key: "total_vacancies", label: "Total Vacancies", icon: Briefcase, fmt: (v) => v.toLocaleString() },
  { key: "total_positions", label: "Positions", icon: Users, fmt: (v) => v.toLocaleString() },
  { key: "avg_wage", label: "Avg Hourly Wage", icon: PoundSterling, fmt: (v) => `£${v}` },
  { key: "avg_hours", label: "Avg Hours/Week", icon: Clock, fmt: (v) => v },
  { key: "avg_advert_days", label: "Avg Advert Days", icon: CalendarClock, fmt: (v) => `${v} days` },
  { key: "distinct_regions", label: "Regions Covered", icon: MapPin, fmt: (v) => v },
  { key: "distinct_routes", label: "Course Routes", icon: Layers, fmt: (v) => v },
];

const MetricRow = ({ metric, a, b }) => {
  const av = a?.[metric.key] ?? 0;
  const bv = b?.[metric.key] ?? 0;
  const aWin = av > bv;
  const bWin = bv > av;
  const Icon = metric.icon;
  return (
    <div data-testid={`compare-metric-${metric.key}`} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-[#1E293B] py-3 last:border-0">
      <div className={`text-right font-mono-data text-lg font-bold ${aWin ? "text-[#38BDF8]" : "text-slate-300"}`}>
        {a ? metric.fmt(av) : "—"}
      </div>
      <div className="flex min-w-[150px] flex-col items-center">
        <Icon className="h-3.5 w-3.5 text-slate-500" />
        <span className="mt-0.5 text-center text-[11px] uppercase tracking-wider text-slate-500">{metric.label}</span>
      </div>
      <div className={`text-left font-mono-data text-lg font-bold ${bWin ? "text-[#F59E0B]" : "text-slate-300"}`}>
        {b ? metric.fmt(bv) : "—"}
      </div>
    </div>
  );
};

const Chip = ({ list }) => (
  <div className="flex flex-wrap gap-1">
    {list.slice(0, 3).map((r) => (
      <span key={r.name} className="rounded-full border border-[#2A3A56] bg-[#0E1626] px-2 py-0.5 text-[11px] text-slate-400">
        {r.name} <span className="font-mono-data text-slate-600">{r.count}</span>
      </span>
    ))}
  </div>
);

export const ComparePanel = () => {
  const [dimension, setDimension] = useState("provider");
  const [a, setA] = useState(null);
  const [b, setB] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState(null);
  const [lbLoading, setLbLoading] = useState(false);

  const field = DIMENSIONS.find((d) => d.key === dimension).field;

  // reset selections when dimension changes
  useEffect(() => { setA(null); setB(null); setData(null); setLeaderboard(null); }, [dimension]);

  useEffect(() => {
    const names = [a, b].filter(Boolean);
    if (names.length === 0) { setData(null); return; }
    setLoading(true);
    fetchCompare(dimension, names).then(setData).finally(() => setLoading(false));
  }, [dimension, a, b]);

  // Similarity leaderboard for the chosen A (providers/employers only)
  useEffect(() => {
    if (dimension === "standard" || !a) { setLeaderboard(null); return; }
    setLbLoading(true);
    fetchOverlapLeaderboard(dimension, a, 15)
      .then(setLeaderboard)
      .finally(() => setLbLoading(false));
  }, [dimension, a]);

  const entA = data?.entities?.find((e) => e.name === a);
  const entB = data?.entities?.find((e) => e.name === b);

  const mergedTs = useMemo(() => {
    const map = {};
    (entA?.timeseries || []).forEach((r) => { map[r.month] = { month: r.month, a: r.vacancies }; });
    (entB?.timeseries || []).forEach((r) => { map[r.month] = { ...(map[r.month] || { month: r.month }), b: r.vacancies }; });
    return Object.values(map).sort((x, y) => x.month.localeCompare(y.month));
  }, [entA, entB]);

  // Standards comparison (only relevant for provider / employer dimensions)
  const stdCompare = useMemo(() => {
    const mapA = new Map((entA?.standards || []).map((s) => [s.name, s.count]));
    const mapB = new Map((entB?.standards || []).map((s) => [s.name, s.count]));
    const shared = [];
    const onlyA = [];
    const onlyB = [];
    mapA.forEach((count, name) => {
      if (mapB.has(name)) shared.push({ name, a: count, b: mapB.get(name) });
      else onlyA.push({ name, count });
    });
    mapB.forEach((count, name) => { if (!mapA.has(name)) onlyB.push({ name, count }); });
    shared.sort((x, y) => y.a + y.b - (x.a + x.b));
    onlyA.sort((x, y) => y.count - x.count);
    onlyB.sort((x, y) => y.count - x.count);
    const union = shared.length + onlyA.length + onlyB.length;
    const overlap = union > 0 ? (shared.length / union) * 100 : 0;
    return { shared, onlyA, onlyB, union, overlap };
  }, [entA, entB]);
  const showStandards = dimension !== "standard";

  return (
    <div className="space-y-4 sm:space-y-6">
      <div
        data-testid="compare-controls"
        className="rounded-xl border border-[#2A3A56] bg-[#18243E]/90 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.3)] sm:p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#8B5CF6]/15">
            <GitCompareArrows className="h-4 w-4 text-[#8B5CF6]" />
          </div>
          <div>
            <h3 className="font-heading text-base font-semibold tracking-tight text-white">Head-to-Head Comparison</h3>
            <p className="text-xs text-slate-500">Pick a type, then choose two to compare (across all data)</p>
          </div>
        </div>

        {/* Dimension selector */}
        <div className="mb-4 flex flex-wrap gap-2">
          {DIMENSIONS.map((d) => {
            const Icon = d.icon;
            const active = dimension === d.key;
            return (
              <button
                key={d.key}
                data-testid={`compare-dim-${d.key}`}
                onClick={() => setDimension(d.key)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                  active ? "border-[#8B5CF6] bg-[#8B5CF6]/15 text-[#8B5CF6]" : "border-[#2A3A56] bg-[#0E1626] text-slate-400 hover:border-[#8B5CF6]/40"
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {d.label}
              </button>
            );
          })}
        </div>

        {/* Two pickers */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <EntitySearchSelect field={field} value={a} onChange={setA} accent={A_COLOR} testid="compare-a"
            placeholder={`Select first ${dimension}…`} />
          <span className="text-center font-mono-data text-xs uppercase tracking-widest text-slate-600">vs</span>
          <EntitySearchSelect field={field} value={b} onChange={setB} accent={B_COLOR} testid="compare-b"
            placeholder={`Select second ${dimension}…`} />
        </div>
      </div>

      {/* Similarity leaderboard for chosen A (providers / employers) */}
      {showStandards && a && (
        <div data-testid="overlap-leaderboard" className="rounded-xl border border-[#2A3A56] bg-[#18243E]/90 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.3)] sm:p-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-heading text-base font-semibold tracking-tight text-white">
                Most similar to <span style={{ color: A_COLOR }}>{a}</span>
              </h3>
            <p className="text-xs text-slate-500">Top 5 genuine peers (≥50% similar) by shared standards, vacancy volume & location · tap to load as Side B</p>
            </div>
          </div>
          {lbLoading && <p className="py-6 text-center text-xs text-slate-500">Finding similar {dimension}s…</p>}
          {!lbLoading && leaderboard && leaderboard.items.length === 0 && (
            <p className="py-6 text-center text-xs text-slate-500">No {dimension}s are closely similar (≥50%) to this one.</p>
          )}
          {!lbLoading && leaderboard && leaderboard.items.map((it, i) => (
            <button
              key={it.name}
              data-testid={`overlap-lb-row-${i + 1}`}
              onClick={() => setB(it.name)}
              className={`flex w-full items-center gap-3 border-b border-[#1E293B] py-2.5 text-left transition-colors last:border-0 hover:bg-[#131C31] ${
                b === it.name ? "bg-[#F59E0B]/10" : ""
              }`}
            >
              <span className="w-6 flex-shrink-0 text-center font-mono-data text-xs text-slate-500">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-slate-200" title={it.name}>{it.name}</p>
                <p className="font-mono-data text-[11px] text-slate-500" title={`Standard mix ${it.sim_standards}% · Location ${it.sim_location}%`}>
                  {it.shared} shared standards · {it.vacancies.toLocaleString()} vacancies
                  {it.sim_location != null && <> · {it.sim_location}% location</>}
                </p>
              </div>
              <div className="flex w-28 flex-shrink-0 items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#0E1626]">
                  <div className="h-full rounded-full bg-[#8B5CF6]" style={{ width: `${it.overlap}%` }} />
                </div>
                <span className="w-12 text-right font-mono-data text-xs font-semibold text-[#8B5CF6]">{it.overlap}%</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {!a && !b && (
        <div className="rounded-xl border border-dashed border-[#2A3A56] bg-[#131C31]/40 py-16 text-center">
          <GitCompareArrows className="mx-auto mb-3 h-8 w-8 text-slate-600" />
          <p className="text-sm text-slate-400">Select two {dimension}s above to see a side-by-side comparison.</p>
        </div>
      )}

      {(a || b) && (
        <>
          {/* Header names */}
          <div data-testid="compare-results" className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border p-4" style={{ borderColor: `${A_COLOR}55`, background: `${A_COLOR}0d` }}>
              <span className="font-mono-data text-[10px] uppercase tracking-widest" style={{ color: A_COLOR }}>Side A</span>
              <p className="mt-1 truncate font-heading text-sm font-semibold text-white" title={a}>{a || "—"}</p>
            </div>
            <div className="rounded-xl border p-4" style={{ borderColor: `${B_COLOR}55`, background: `${B_COLOR}0d` }}>
              <span className="font-mono-data text-[10px] uppercase tracking-widest" style={{ color: B_COLOR }}>Side B</span>
              <p className="mt-1 truncate font-heading text-sm font-semibold text-white" title={b}>{b || "—"}</p>
            </div>
          </div>

          {/* Metric table */}
          <div className="rounded-xl border border-[#2A3A56] bg-[#18243E]/90 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.3)] sm:p-6">
            {loading && <p className="py-8 text-center text-xs text-slate-500">Comparing…</p>}
            {!loading && METRICS.map((m) => <MetricRow key={m.key} metric={m} a={entA} b={entB} />)}
          </div>

          {/* Timeseries comparison */}
          <div className="rounded-xl border border-[#2A3A56] bg-[#18243E]/90 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.3)] sm:p-6">
            <h3 className="mb-4 font-heading text-base font-semibold tracking-tight text-white">Vacancies Over Time</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={mergedTs} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickFormatter={monthLabel} stroke="#64748B" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: "#1E293B" }} minTickGap={24} />
                <YAxis stroke="#64748B" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={40} />
                <Tooltip
                  contentStyle={{ background: "#18243E", border: "1px solid #2A3A56", borderRadius: 8, fontSize: 12 }}
                  labelFormatter={monthLabel}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line isAnimationActive={false} type="monotone" dataKey="a" name={a || "A"} stroke={A_COLOR} strokeWidth={2.5} dot={false} />
                <Line isAnimationActive={false} type="monotone" dataKey="b" name={b || "B"} stroke={B_COLOR} strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Standards comparison (providers/employers) OR top routes & regions (standards) */}
          {showStandards ? (
            <div data-testid="compare-standards" className="space-y-4">
              {/* Overlap score */}
              {a && b && (
                <div data-testid="compare-overlap" className="rounded-xl border border-[#8B5CF6]/40 bg-[#8B5CF6]/10 p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-mono-data text-[10px] uppercase tracking-widest text-[#8B5CF6]">Standard-mix overlap</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {stdCompare.shared.length} shared of {stdCompare.union} total distinct standards
                      </p>
                    </div>
                    <span data-testid="compare-overlap-value" className="font-mono-data text-3xl font-bold text-white">
                      {stdCompare.overlap.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#0E1626]">
                    <div className="h-full rounded-full bg-[#8B5CF6] transition-all duration-500" style={{ width: `${stdCompare.overlap}%` }} />
                  </div>
                </div>
              )}

              {/* Shared standards */}
              <div className="rounded-xl border border-[#2A3A56] bg-[#18243E]/90 p-5 sm:p-6">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-mono-data text-[10px] uppercase tracking-widest text-slate-500">
                    Standards shared by both
                  </p>
                  <span className="rounded-full bg-[#10B981]/15 px-2 py-0.5 font-mono-data text-[11px] text-[#10B981]">
                    {stdCompare.shared.length}
                  </span>
                </div>
                <div data-testid="compare-standards-shared" className="max-h-56 space-y-1 overflow-y-auto pr-1">
                  {stdCompare.shared.length === 0 && (
                    <p className="py-4 text-center text-xs text-slate-500">No standards in common.</p>
                  )}
                  {stdCompare.shared.map((s) => (
                    <div key={s.name} className="flex items-center justify-between gap-3 rounded-md border border-[#1E293B] px-3 py-1.5">
                      <span className="min-w-0 flex-1 truncate text-xs text-slate-200" title={s.name}>{s.name}</span>
                      <span className="flex items-center gap-2 font-mono-data text-[11px]">
                        <span style={{ color: A_COLOR }}>{s.a}</span>
                        <span className="text-slate-600">vs</span>
                        <span style={{ color: B_COLOR }}>{s.b}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Unique standards, side by side */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                  { list: stdCompare.onlyA, label: a, color: A_COLOR, tid: "compare-standards-only-a" },
                  { list: stdCompare.onlyB, label: b, color: B_COLOR, tid: "compare-standards-only-b" },
                ].map((side, idx) => (
                  <div key={idx} className="rounded-xl border border-[#2A3A56] bg-[#18243E]/90 p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="min-w-0 truncate font-mono-data text-[11px]" style={{ color: side.color }} title={side.label || "—"}>
                        Only {side.label || "—"}
                      </p>
                      <span className="rounded-full border px-2 py-0.5 font-mono-data text-[11px] text-slate-400" style={{ borderColor: `${side.color}55` }}>
                        {side.list.length}
                      </span>
                    </div>
                    <div data-testid={side.tid} className="max-h-56 space-y-1 overflow-y-auto pr-1">
                      {side.list.length === 0 && (
                        <p className="py-4 text-center text-xs text-slate-500">
                          {side.label ? "No unique standards." : "Select to compare."}
                        </p>
                      )}
                      {side.list.map((s) => (
                        <div key={s.name} className="flex items-center justify-between gap-2 rounded-md border border-[#1E293B] px-3 py-1.5">
                          <span className="min-w-0 flex-1 truncate text-xs text-slate-200" title={s.name}>{s.name}</span>
                          <span className="font-mono-data text-[11px] text-slate-500">{s.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-[#2A3A56] bg-[#18243E]/90 p-5">
                <p className="mb-3 font-mono-data text-[10px] uppercase tracking-widest text-slate-500">Top routes & regions</p>
                <div className="space-y-2">
                  <span className="font-mono-data text-[11px]" style={{ color: A_COLOR }}>{a || "A"}</span>
                  <Chip list={entA?.top_routes || []} />
                  <Chip list={entA?.top_regions || []} />
                </div>
              </div>
              <div className="rounded-xl border border-[#2A3A56] bg-[#18243E]/90 p-5">
                <p className="mb-3 font-mono-data text-[10px] uppercase tracking-widest text-slate-500">Top routes & regions</p>
                <div className="space-y-2">
                  <span className="font-mono-data text-[11px]" style={{ color: B_COLOR }}>{b || "B"}</span>
                  <Chip list={entB?.top_routes || []} />
                  <Chip list={entB?.top_regions || []} />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
