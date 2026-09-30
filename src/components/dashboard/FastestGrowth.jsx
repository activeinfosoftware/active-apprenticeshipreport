import React, { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Flame, ChevronLeft, ChevronRight, Download, Loader2, Filter, X } from "lucide-react";
import { fetchFastestGrowth, exportGrowthCsv, fetchGrowthDrivers } from "../../lib/api";
import { Slider } from "../ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { toast } from "sonner";

const PAGE_SIZE = 10;

// Summarise active sidebar filters so the panel can show what it is scoped to.
const activeFilterChips = (f = {}) => {
  const chips = [];
  if (f.status) chips.push({ key: "status", label: `Status: ${f.status}` });
  if (f.date_from) chips.push({ key: "date_from", label: `From ${f.date_from}` });
  if (f.date_to) chips.push({ key: "date_to", label: `To ${f.date_to}` });
  (f.itl1 || []).forEach((v) => chips.push({ key: "itl1", value: v, label: `Region: ${v}` }));
  (f.itl2 || []).forEach((v) => chips.push({ key: "itl2", value: v, label: `Sub-region: ${v}` }));
  (f.itl3 || []).forEach((v) => chips.push({ key: "itl3", value: v, label: `Area: ${v}` }));
  (f.course_routes || []).forEach((v) => chips.push({ key: "course_routes", value: v, label: `Route: ${v}` }));
  (f.apprenticeship_levels || []).forEach((v) => chips.push({ key: "apprenticeship_levels", value: v, label: `Level: ${v}` }));
  (f.course_types || []).forEach((v) => chips.push({ key: "course_types", value: v, label: `Type: ${v}` }));
  (f.employers || []).forEach((v) => chips.push({ key: "employers", value: v, label: `Employer: ${v}` }));
  (f.providers || []).forEach((v) => chips.push({ key: "providers", value: v, label: `Provider: ${v}` }));
  (f.standards || []).forEach((v) => chips.push({ key: "standards", value: v, label: `Standard: ${v}` }));
  if (f.search) chips.push({ key: "search", label: `Search: "${f.search}"` });
  return chips;
};

const monthLabel = (m) => {
  if (!m) return m;
  const [y, mm] = m.split("-");
  return `${["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][+mm]} ${y.slice(2)}`;
};

const Sparkline = ({ values, color }) => {
  const max = Math.max(...values, 0.0001);
  return (
    <div className="flex h-8 items-end gap-0.5">
      {values.map((s, i) => (
        <span key={i} className="w-1.5 rounded-sm" style={{ height: `${Math.max(6, (s / max) * 100)}%`, background: color }} title={`${s}`} />
      ))}
    </div>
  );
};

const DriverRow = ({ d, onClick }) => {
  const up = d.delta >= 0;
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick ? () => onClick(d.name) : undefined}
      data-testid={onClick ? `driver-employer-${d.name}` : undefined}
      className={`flex w-full items-center gap-3 border-b border-[#1E293B] py-2 text-left last:border-0 ${
        onClick ? "cursor-pointer rounded-md px-1 transition-colors hover:bg-[#1E2D4D]" : ""
      }`}
    >
      <span className="min-w-0 flex-1 truncate text-xs text-slate-200" title={onClick ? `Filter dashboard by ${d.name}` : d.name}>{d.name}</span>
      <span className="font-mono-data text-[11px] text-slate-500">{d.counts.join(" → ")}</span>
      <span className={`flex w-16 items-center justify-end gap-1 font-mono-data text-xs font-semibold ${up ? "text-[#10B981]" : "text-[#F43F5E]"}`}>
        {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}{up ? "+" : ""}{d.delta}
      </span>
    </Comp>
  );
};

export const FastestGrowth = ({ filters, setFilters }) => {
  const [window, setWindow] = useState(3);
  const [dimension, setDimension] = useState("standard");
  const [direction, setDirection] = useState("growth");
  const [mode, setMode] = useState("strict");
  const [minVac, setMinVac] = useState(3);
  const [data, setData] = useState({ months: [], items: [] });
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Drivers dialog state
  const [drvOpen, setDrvOpen] = useState(false);
  const [drvLoading, setDrvLoading] = useState(false);
  const [drv, setDrv] = useState(null);
  const [drvName, setDrvName] = useState("");

  const params = { window, dimension, direction, min_vacancies: minVac, mode };

  useEffect(() => setPage(0), [filters, window, dimension, direction, minVac, mode]);

  useEffect(() => {
    setLoading(true);
    fetchFastestGrowth(filters, params).then(setData).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, window, dimension, direction, minVac, mode]);

  const openDrivers = (name) => {
    setDrvName(name);
    setDrvOpen(true);
    setDrvLoading(true);
    setDrv(null);
    fetchGrowthDrivers({ dimension, name, window, direction, filters })
      .then(setDrv)
      .finally(() => setDrvLoading(false));
  };

  const filterByEmployer = (name) => {
    if (!setFilters) return;
    setFilters({ ...filters, employers: [name] });
    setDrvOpen(false);
    toast.success(`Dashboard filtered to employer: ${name}`);
  };

  const filterByProvider = (name) => {
    if (!setFilters) return;
    setFilters({ ...filters, providers: [name] });
    setDrvOpen(false);
    toast.success(`Dashboard filtered to provider: ${name}`);
  };

  const chips = activeFilterChips(filters);
  const clearChip = (chip) => {
    if (!setFilters) return;
    if (chip.value !== undefined) {
      setFilters({ ...filters, [chip.key]: (filters[chip.key] || []).filter((x) => x !== chip.value) });
    } else if (chip.key === "date_from" || chip.key === "date_to" || chip.key.startsWith("itl") || chip.key === "status" || chip.key === "search") {
      setFilters({ ...filters, [chip.key]: null });
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportGrowthCsv(filters, { ...params, top: 100 });
      toast.success("Growth ranking exported to CSV");
    } catch {
      toast.error("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const items = data.items || [];
  const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const pageItems = items.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const rangeLabel = data.months?.length
    ? `${monthLabel(data.months[0])} → ${monthLabel(data.months[data.months.length - 1])}`
    : "";
  const dimLabel = dimension === "route" ? "Course routes" : dimension === "level" ? "Levels" : "Standards";
  const isGrowth = direction === "growth";
  const accent = isGrowth ? "#10B981" : "#F43F5E";

  const Toggle = ({ options, value, onChange, activeColor, prefix }) => (
    <div className="flex items-center gap-1 rounded-lg border border-[#2A3A56] bg-[#0E1626] p-1">
      {options.map((o) => (
        <button
          key={o.key}
          data-testid={`${prefix}-${o.key}`}
          onClick={() => onChange(o.key)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            value === o.key ? "text-white" : "text-slate-400 hover:text-white"
          }`}
          style={value === o.key ? { background: `${activeColor}26`, color: activeColor } : {}}
        >
          {o.label}
        </button>
      ))}
    </div>
  );

  return (
    <div
      data-testid="fastest-growth-panel"
      className="rounded-xl border border-[#2A3A56] bg-[#18243E]/90 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.3)] backdrop-blur-md sm:p-6"
    >
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${accent}26` }}>
            <Flame className="h-4 w-4" style={{ color: accent }} />
          </div>
          <div>
            <h3 className="font-heading text-base font-semibold tracking-tight text-white">
              Fastest {isGrowth ? "Growth" : "Decline"}
            </h3>
            <p className="text-xs text-slate-500">
              {dimLabel} with market share {isGrowth ? "rising" : "falling"}{" "}
              {mode === "strict" ? "every month" : "in all but one month"}{" "}
              {rangeLabel && <span className="text-slate-400">· {rangeLabel}</span>}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Toggle prefix="growth-direction" activeColor={accent} value={direction} onChange={setDirection}
            options={[{ key: "growth", label: "Growth" }, { key: "decline", label: "Decline" }]} />
          <Toggle prefix="growth-mode" activeColor="#22D3EE" value={mode} onChange={setMode}
            options={[{ key: "strict", label: "Strict" }, { key: "near", label: "Near-miss" }]} />
          <Toggle prefix="growth-dim" activeColor="#8B5CF6" value={dimension} onChange={setDimension}
            options={[{ key: "standard", label: "Standard" }, { key: "route", label: "Route" }, { key: "level", label: "Level" }]} />
          <Toggle prefix="growth-window" activeColor="#38BDF8" value={window} onChange={setWindow}
            options={[{ key: 3, label: "3m" }, { key: 6, label: "6m" }]} />
          <button
            data-testid="growth-export-btn"
            onClick={handleExport}
            disabled={exporting || items.length === 0}
            className="flex items-center gap-1.5 rounded-lg border border-[#2A3A56] bg-[#0E1626] px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-[#1E2D4D] disabled:opacity-40"
          >
            {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} Export
          </button>
        </div>
      </div>

      {/* Active-filter scope banner: explains why numbers are scoped */}
      {chips.length > 0 && (
        <div data-testid="growth-active-filters" className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-[#F59E0B]/40 bg-[#F59E0B]/10 px-4 py-2.5">
          <Filter className="h-3.5 w-3.5 flex-shrink-0 text-[#F59E0B]" />
          <span className="text-[11px] font-medium text-[#F59E0B]">
            Scoped to active filters — a filter on this dimension picks which rows show; shares stay measured against the full market within your other filters:
          </span>
          {chips.map((c, i) => (
            <span key={i} className="flex max-w-full items-center gap-1 rounded-md border border-[#2A3A56] bg-[#0E1626] py-0.5 pl-2 pr-1 text-[11px] text-slate-300">
              <span className="truncate">{c.label}</span>
              {setFilters && (
                <button
                  data-testid={`growth-filter-clear-${c.key}`}
                  onClick={() => clearChip(c)}
                  className="rounded-full p-0.5 text-slate-400 hover:bg-[#1E2D4D] hover:text-white"
                  aria-label={`Clear ${c.label}`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Min vacancies guardrail */}
      <div className="mb-3 flex items-center gap-3 rounded-lg border border-[#2A3A56] bg-[#0E1626] px-4 py-2.5">
        <span className="whitespace-nowrap text-[11px] uppercase tracking-wider text-slate-500">Min vacancies</span>
        <Slider
          data-testid="growth-minvac-slider"
          value={[minVac]}
          min={1}
          max={100}
          step={1}
          onValueChange={(v) => setMinVac(v[0])}
          className="flex-1"
        />
        <span className="w-8 text-right font-mono-data text-xs font-semibold text-[#38BDF8]">{minVac}</span>
      </div>

      <div className="min-h-[440px]" data-testid="growth-list">
        {loading && <p className="py-16 text-center text-xs text-slate-500">Calculating…</p>}
        {!loading && items.length === 0 && (
          <p className="py-16 text-center text-xs text-slate-500">
            No {dimLabel.toLowerCase()} had market share {isGrowth ? "rising" : "falling"}{" "}
            {mode === "strict" ? "every month" : "in all but one month"} across this window
            (with the current filters and minimum-vacancy threshold).
          </p>
        )}
        {!loading &&
          pageItems.map((it, i) => {
            const rank = page * PAGE_SIZE + i + 1;
            const up = it.pct_increase >= 0;
            return (
              <button
                key={it.name}
                data-testid={`growth-row-${rank}`}
                onClick={() => openDrivers(it.name)}
                className="flex w-full items-center gap-3 border-b border-[#1E293B] py-2.5 text-left transition-colors last:border-0 hover:bg-[#131C31]"
              >
                <span className="w-6 flex-shrink-0 text-center font-mono-data text-xs text-slate-500">{rank}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-slate-200" title={it.name}>{it.name}</p>
                  <p className="font-mono-data text-[11px] text-slate-500">
                    {it.counts.join(" → ")} postings · {it.share_start}%→{it.share_end}% share · tap for drivers
                  </p>
                </div>
                <Sparkline values={it.shares} color={up ? "#10B981" : "#F43F5E"} />
                <span
                  className={`hidden w-10 flex-shrink-0 text-center font-mono-data text-[11px] sm:block ${
                    it.right_steps === it.total_steps ? "text-slate-500" : "text-[#22D3EE]"
                  }`}
                  title={`${it.right_steps} of ${it.total_steps} months moved this way`}
                >
                  {it.right_steps}/{it.total_steps}
                </span>
                <span className={`flex w-24 flex-shrink-0 items-center justify-end gap-1 font-mono-data text-sm font-semibold ${up ? "text-[#10B981]" : "text-[#F43F5E]"}`}>
                  {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  {up ? "+" : ""}{it.pct_increase}%
                </span>
              </button>
            );
          })}
      </div>

      {items.length > 0 && (
        <div className="mt-3 flex items-center justify-between border-t border-[#2A3A56] pt-3">
          <span className="font-mono-data text-xs text-slate-500">Top {items.length} · page {page + 1} of {pages}</span>
          <div className="flex gap-2">
            <button data-testid="growth-prev-btn" disabled={page <= 0} onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="flex h-8 items-center gap-1 rounded-md border border-[#2A3A56] bg-[#0E1626] px-3 text-xs text-slate-300 hover:bg-[#1E2D4D] hover:text-white disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            <button data-testid="growth-next-btn" disabled={page >= pages - 1} onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
              className="flex h-8 items-center gap-1 rounded-md border border-[#2A3A56] bg-[#0E1626] px-3 text-xs text-slate-300 hover:bg-[#1E2D4D] hover:text-white disabled:opacity-40">
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Drivers drill-down dialog */}
      <Dialog open={drvOpen} onOpenChange={setDrvOpen}>
        <DialogContent data-testid="growth-drivers-dialog" className="flex max-h-[88vh] max-w-lg flex-col overflow-hidden border-[#2A3A56] bg-[#131C31] text-slate-200">
          <DialogHeader>
            <DialogTitle className="font-heading text-white">
              Drivers · <span style={{ color: accent }}>{drvName}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Employers (and standards, for routes/levels) that {isGrowth ? "increased" : "declined"} most, driving this {dimension}'s {isGrowth ? "growth" : "decline"} across the window.
            </DialogDescription>
          </DialogHeader>
          {drvLoading && <p className="py-10 text-center text-xs text-slate-500">Loading drivers…</p>}
          {!drvLoading && drv && (
            <div className="-mr-2 space-y-4 overflow-y-auto pr-2">
              <div>
                <p className="mb-1 font-mono-data text-[10px] uppercase tracking-widest text-slate-500">
                  Monthly vacancies ({drv.months.map(monthLabel).join(" · ")})
                </p>
                <p className="font-mono-data text-lg font-bold text-white">
                  {drv.entity_counts.map((e) => e.count).join(" → ")}
                </p>
              </div>
              <div>
                <p className="mb-2 font-mono-data text-[10px] uppercase tracking-widest text-slate-500">
                  Top employers by {isGrowth ? "increase" : "decline"} · tap to filter dashboard
                </p>
                <div data-testid="drivers-employers">
                  {drv.drivers_employers.length === 0 && <p className="py-3 text-xs text-slate-500">No employer data.</p>}
                  {drv.drivers_employers.map((d) => <DriverRow key={d.name} d={d} onClick={filterByEmployer} />)}
                </div>
              </div>
              {drv.drivers_providers?.length > 0 && (
                <div>
                  <p className="mb-2 font-mono-data text-[10px] uppercase tracking-widest text-slate-500">
                    Top providers by {isGrowth ? "increase" : "decline"} · tap to filter dashboard
                  </p>
                  <div data-testid="drivers-providers">
                    {drv.drivers_providers.map((d) => <DriverRow key={d.name} d={d} onClick={filterByProvider} />)}
                  </div>
                </div>
              )}
              {drv.drivers_standards?.length > 0 && (
                <div>
                  <p className="mb-2 font-mono-data text-[10px] uppercase tracking-widest text-slate-500">
                    Top standards by {isGrowth ? "increase" : "decline"}
                  </p>
                  <div data-testid="drivers-standards">
                    {drv.drivers_standards.map((d) => <DriverRow key={d.name} d={d} />)}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
