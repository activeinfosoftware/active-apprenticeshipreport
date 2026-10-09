import React, { useEffect, useState } from "react";
import { Calendar as CalendarIcon, RotateCcw, MapPin, Filter, ChevronDown, Building2, School, Award, Radio, Network } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fetchOptions, fetchItl } from "../../lib/api";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { ScrollArea } from "../ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { SearchableMultiSelect } from "./SearchableMultiSelect";
import { ItlMultiSelect } from "./ItlMultiSelect";

const Group = ({ title, icon: Icon, children, defaultOpen = false, testid }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border-b border-[#1E293B] pb-4">
      <CollapsibleTrigger
        data-testid={`filter-group-${testid}`}
        className="flex w-full items-center justify-between py-2 text-left"
      >
        <span className="flex items-center gap-2 text-xs font-mono-data uppercase tracking-widest text-slate-400">
          <Icon className="h-3.5 w-3.5 text-[#38BDF8]" /> {title}
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3">{children}</CollapsibleContent>
    </Collapsible>
  );
};

const DateField = ({ label, value, onChange, testid }) => (
  <div className="flex-1">
    <Label className="text-[11px] text-slate-400">{label}</Label>
    <Popover>
      <PopoverTrigger asChild>
        <Button
          data-testid={testid}
          variant="outline"
          className="mt-1 w-full justify-start border-[#2A3A56] bg-[#0E1626] text-left font-normal text-slate-200 hover:bg-[#1E2D4D] hover:text-white"
        >
          <CalendarIcon className="mr-2 h-3.5 w-3.5 text-[#38BDF8]" />
          <span className="text-xs">{value ? format(parseISO(value), "dd MMM yyyy") : "Any"}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto border-[#2A3A56] bg-[#18243E] p-0" align="start">
        <Calendar
          mode="single"
          selected={value ? parseISO(value) : undefined}
          onSelect={(d) => onChange(d ? format(d, "yyyy-MM-dd") : null)}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  </div>
);

export const FilterSidebar = ({ filters, setFilters, resultCount }) => {
  const [options, setOptions] = useState({ course_routes: [], apprenticeship_levels: [], course_types: [], provider_types: [] });
  const [itl1List, setItl1List] = useState([]);
  const [itl2List, setItl2List] = useState([]);
  const [itl3List, setItl3List] = useState([]);

  useEffect(() => {
    fetchOptions().then(setOptions);
    fetchItl(1).then(setItl1List);
    fetchItl(2).then(setItl2List);
    fetchItl(3).then(setItl3List);
  }, []);

  // useEffect(() => {
  //   if (filters.itl1?.length) fetchItl(2, filters.itl1).then(setItl2List);
  //   else setItl2List([]);
  // }, [filters.itl1]);

  // useEffect(() => {
  //   if (filters.itl2?.length) fetchItl(3, filters.itl1, filters.itl2).then(setItl3List);
  //   else setItl3List([]);
  // }, [filters.itl1, filters.itl2]);

  const toggleArray = (key, val) => {
    const arr = filters[key] || [];
    setFilters({ ...filters, [key]: arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val] });
  };

  const [collapseKey, setCollapseKey] = useState(0);

  const reset = () => {
    setFilters({
      date_from: null, date_to: null, course_routes: [], apprenticeship_levels: [],
      course_types: [], itl1: [], itl2: [], itl3: [],
      provider_types: [],
      employers: [], providers: [], standards: [],
      employers_mode: "include", providers_mode: "include", standards_mode: "include",
      status: null, search: null,
    });
    setCollapseKey((k) => k + 1); // remount groups so they collapse again
  };

  const activeCount =
    (filters.course_routes?.length || 0) +
    (filters.apprenticeship_levels?.length || 0) +
    (filters.course_types?.length || 0) +
    (filters.provider_types?.length || 0) +
    (filters.employers?.length || 0) +
    (filters.providers?.length || 0) +
    (filters.standards?.length || 0) +
    (filters.status ? 1 : 0) +
    (filters.itl1?.length || 0) + (filters.itl2?.length || 0) + (filters.itl3?.length || 0) +
    (filters.date_from ? 1 : 0) + (filters.date_to ? 1 : 0);

  return (
    <aside className="flex h-full w-full flex-col bg-[#0E1626]">
      <div className="flex items-center justify-between border-b border-[#1E293B] px-5 py-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[#38BDF8]" />
          <h2 className="font-heading text-sm font-semibold text-white">Filters</h2>
          {activeCount > 0 && (
            <span className="rounded-full bg-[#38BDF8]/15 px-2 py-0.5 font-mono-data text-[10px] text-[#38BDF8]">
              {activeCount}
            </span>
          )}
        </div>
        <Button
          data-testid="reset-filters-btn"
          onClick={reset}
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs text-slate-400 hover:bg-[#1E2D4D] hover:text-white"
        >
          <RotateCcw className="h-3 w-3" /> Reset
        </Button>
      </div>

      <ScrollArea className="flex-1 px-5">
        <div key={collapseKey} className="space-y-4 py-4">
          <Group title="Status" icon={Radio} testid="status">
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: null, label: "All" },
                { val: "live", label: "Live" },
                { val: "archived", label: "Archived" },
              ].map((opt) => {
                const active = (filters.status ?? null) === opt.val;
                return (
                  <button
                    key={opt.label}
                    data-testid={`status-option-${opt.label.toLowerCase()}`}
                    onClick={() => setFilters({ ...filters, status: opt.val })}
                    className={`rounded-lg border px-2 py-2 text-xs font-medium transition-all ${
                      active
                        ? "border-[#10B981] bg-[#10B981]/15 text-[#10B981]"
                        : "border-[#2A3A56] bg-[#0E1626] text-slate-400 hover:border-[#10B981]/40"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </Group>

          <Group title="Posted Date" icon={CalendarIcon} testid="date">
            <div className="flex gap-2">
              <DateField label="From" value={filters.date_from} testid="date-from-btn"
                onChange={(v) => setFilters({ ...filters, date_from: v })} />
              <DateField label="To" value={filters.date_to} testid="date-to-btn"
                onChange={(v) => setFilters({ ...filters, date_to: v })} />
            </div>
          </Group>

          <Group title="Geography (ITL)" icon={MapPin} testid="itl">
            <div className="space-y-3">
              {[
                { lvl: "itl1", label: "ITL1 — Region", list: itl1List, disabled: false,
                  placeholder: "Search regions…" },
                { lvl: "itl2", label: "ITL2 — Sub-region", list: itl2List, disabled: !filters.itl1?.length,
                  placeholder: "Search sub-regions…" },
                { lvl: "itl3", label: "ITL3 — Local area", list: itl3List, disabled: !filters.itl2?.length,
                  placeholder: "Search local areas…" },
              ].map(({ lvl, label, list, disabled, placeholder }) => (
                <div key={lvl}>
                  <Label className="text-[11px] text-slate-400">{label}</Label>
                  <div className="mt-1">
                    <ItlMultiSelect
                      testid={`itl-${lvl}`}
                      list={list}
                      selected={filters[lvl] || []}
                      disabled={disabled}
                      placeholder={placeholder}
                      onChange={(v) => setFilters({ ...filters, [lvl]: v })}
                    />
                  </div>
                  {disabled && (
                    <p className="mt-1 text-[10px] text-slate-600">
                      {lvl === "itl2" ? "Pick an ITL1 region first" : "Pick an ITL2 sub-region first"}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Group>

          <Group title="Course Route" icon={Filter} testid="route">
            <div className="space-y-2">
              {options.course_routes.length > 0 && (
                <label data-testid="route-select-all"
                  className="mb-1 flex cursor-pointer items-center gap-2.5 rounded-md border-b border-[#1E293B] px-1 pb-2 hover:bg-[#131C31]">
                  <Checkbox
                    checked={
                      filters.course_routes?.length === options.course_routes.length && options.course_routes.length > 0
                        ? true
                        : filters.course_routes?.length > 0
                        ? "indeterminate"
                        : false
                    }
                    onCheckedChange={() =>
                      setFilters({
                        ...filters,
                        course_routes:
                          filters.course_routes?.length === options.course_routes.length ? [] : [...options.course_routes],
                      })
                    }
                    className="border-[#2A3A56] data-[state=checked]:border-[#38BDF8] data-[state=checked]:bg-[#38BDF8] data-[state=indeterminate]:border-[#38BDF8] data-[state=indeterminate]:bg-[#38BDF8]"
                  />
                  <span className="text-xs font-medium text-slate-200">Select all routes</span>
                </label>
              )}
              {options.course_routes.map((r) => (
                <label key={r} data-testid={`route-option-${r}`}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1 hover:bg-[#131C31]">
                  <Checkbox
                    checked={filters.course_routes?.includes(r)}
                    onCheckedChange={() => toggleArray("course_routes", r)}
                    className="border-[#2A3A56] data-[state=checked]:border-[#38BDF8] data-[state=checked]:bg-[#38BDF8]"
                  />
                  <span className="text-xs text-slate-300">{r}</span>
                </label>
              ))}
            </div>
          </Group>

          <Group title="Apprenticeship Level" icon={Filter} testid="level" defaultOpen={false}>
            <div className="grid grid-cols-2 gap-2">
              {options.apprenticeship_levels.map((l) => {
                const active = filters.apprenticeship_levels?.includes(l);
                return (
                  <button key={l} data-testid={`level-option-${l}`}
                    onClick={() => toggleArray("apprenticeship_levels", l)}
                    className={`rounded-lg border px-2 py-2 text-xs font-medium transition-all ${
                      active ? "border-[#38BDF8] bg-[#38BDF8]/15 text-[#38BDF8]"
                             : "border-[#2A3A56] bg-[#0E1626] text-slate-400 hover:border-[#38BDF8]/40"
                    }`}>
                    {l}
                  </button>
                );
              })}
            </div>
          </Group>

          <Group title="Course Type" icon={Filter} testid="type" defaultOpen={false}>
            <div className="flex flex-wrap gap-2">
              {options.course_types.map((t) => {
                const active = filters.course_types?.includes(t);
                return (
                  <button key={t} data-testid={`type-option-${t}`}
                    onClick={() => toggleArray("course_types", t)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                      active ? "border-[#F59E0B] bg-[#F59E0B]/15 text-[#F59E0B]"
                             : "border-[#2A3A56] bg-[#0E1626] text-slate-400 hover:border-[#F59E0B]/40"
                    }`}>
                    {t}
                  </button>
                );
              })}
            </div>
          </Group>

          <Group title="Employer" icon={Building2} testid="employer" defaultOpen={false}>
            <SearchableMultiSelect
              field="employer"
              testid="employer"
              placeholder="Search employers…"
              selected={filters.employers || []}
              onChange={(v) => setFilters({ ...filters, employers: v })}
              mode={filters.employers_mode || "include"}
              onModeChange={(m) => setFilters({ ...filters, employers_mode: m })}
            />
          </Group>

          <Group title="Provider" icon={School} testid="provider" defaultOpen={false}>
            <SearchableMultiSelect
              field="provider"
              testid="provider"
              placeholder="Search training providers…"
              selected={filters.providers || []}
              onChange={(v) => setFilters({ ...filters, providers: v })}
              mode={filters.providers_mode || "include"}
              onModeChange={(m) => setFilters({ ...filters, providers_mode: m })}
            />
          </Group>

          <Group title="Provider Type" icon={Network} testid="provider-type" defaultOpen={false}>
            <div className="flex flex-wrap gap-2">
              {options.provider_types.map((t) => {
                const active = filters.provider_types?.includes(t);
                return (
                  <button key={t} data-testid={`provider-type-option-${t}`}
                    onClick={() => toggleArray("provider_types", t)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                      active ? "border-[#38BDF8] bg-[#38BDF8]/15 text-[#38BDF8]"
                             : "border-[#2A3A56] bg-[#0E1626] text-slate-400 hover:border-[#38BDF8]/40"
                    }`}>
                    {t}
                  </button>
                );
              })}
              {options.provider_types.length === 0 && (
                <p className="text-xs text-slate-500">No provider types available</p>
              )}
            </div>
          </Group>

          <Group title="Standard" icon={Award} testid="standard" defaultOpen={false}>
            <SearchableMultiSelect
              field="standard"
              testid="standard"
              placeholder="Search standards…"
              selected={filters.standards || []}
              onChange={(v) => setFilters({ ...filters, standards: v })}
              mode={filters.standards_mode || "include"}
              onModeChange={(m) => setFilters({ ...filters, standards_mode: m })}
            />
          </Group>
        </div>
      </ScrollArea>

      <div className="border-t border-[#1E293B] px-5 py-3">
        <p className="font-mono-data text-[11px] text-slate-500">
          <span className="text-[#10B981]">{resultCount?.toLocaleString() ?? "—"}</span> vacancies match
        </p>
      </div>
    </aside>
  );
};
