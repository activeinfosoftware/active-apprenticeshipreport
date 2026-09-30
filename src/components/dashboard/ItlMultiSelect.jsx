import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, Check } from "lucide-react";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";

// Local searchable multi-select over a pre-fetched ITL option list.
// `list` = [{ name, count }], `selected` = string[], `onChange(next)`.
export const ItlMultiSelect = ({ list = [], selected = [], onChange, placeholder, disabled, testid }) => {
  const [query, setQuery] = useState("");
  const prevLen = useRef(selected.length);

  // Clear residual search text when selections are cleared (e.g. Reset).
  useEffect(() => {
    if (prevLen.current > 0 && selected.length === 0) setQuery("");
    prevLen.current = selected.length;
  }, [selected.length]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((r) => r.name.toLowerCase().includes(q));
  }, [list, query]);

  const toggle = (name) => {
    onChange(selected.includes(name) ? selected.filter((x) => x !== name) : [...selected, name]);
  };

  return (
    <div className={`space-y-2 ${disabled ? "pointer-events-none opacity-40" : ""}`}>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5" data-testid={`${testid}-selected`}>
          {selected.map((s) => (
            <span
              key={s}
              className="flex max-w-full items-center gap-1 rounded-md border border-[#38BDF8]/40 bg-[#38BDF8]/15 py-0.5 pl-2 pr-1 text-[11px] text-[#38BDF8]"
            >
              <span className="truncate">{s}</span>
              <button
                data-testid={`${testid}-remove-${s}`}
                onClick={() => toggle(s)}
                className="rounded-full p-0.5 hover:bg-[#38BDF8]/25"
                aria-label={`Remove ${s}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
        <Input
          data-testid={`${testid}-search`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="h-8 border-[#2A3A56] bg-[#0E1626] pl-8 text-xs text-slate-200 placeholder:text-slate-500"
        />
      </div>

      <ScrollArea className="h-40 rounded-md border border-[#2A3A56] bg-[#0E1626]">
        <div className="p-1" data-testid={`${testid}-list`}>
          {filtered.length === 0 && (
            <p className="px-2 py-6 text-center text-xs text-slate-500">No areas</p>
          )}
          {filtered.map((r) => {
            const active = selected.includes(r.name);
            return (
              <button
                key={r.name}
                data-testid={`${testid}-option-${r.name}`}
                onClick={() => toggle(r.name)}
                className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors ${
                  active ? "bg-[#38BDF8]/15 text-[#38BDF8]" : "text-slate-300 hover:bg-[#131C31]"
                }`}
              >
                <span
                  className={`flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded border ${
                    active ? "border-[#38BDF8] bg-[#38BDF8]" : "border-[#2A3A56]"
                  }`}
                >
                  {active && <Check className="h-2.5 w-2.5 text-[#0B101D]" />}
                </span>
                <span className="flex-1 truncate">{r.name}</span>
                <span className="font-mono-data text-[10px] text-slate-500">{r.count}</span>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
