import React, { useEffect, useRef, useState } from "react";
import { Search, X, Check, Loader2 } from "lucide-react";
import { fetchValues } from "../../lib/api";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";

// Server-side searchable multi-select for high-cardinality fields
// (Employer, Provider, Standard). `field` is the backend key.
export const SearchableMultiSelect = ({ field, selected = [], onChange, placeholder, testid, mode = "include", onModeChange }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounce = useRef(null);
  const exclude = mode === "exclude";
  const accent = exclude ? "#F43F5E" : "#38BDF8";

  useEffect(() => {
    setLoading(true);
    clearTimeout(debounce.current);
    let cancelled = false;
    debounce.current = setTimeout(() => {
      fetchValues(field, query, 50)
        .then((data) => {
          if (!cancelled) setResults(data);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(debounce.current);
    };
  }, [field, query]);

  const toggle = (name) => {
    onChange(selected.includes(name) ? selected.filter((x) => x !== name) : [...selected, name]);
  };

  return (
    <div className="space-y-2">
      {onModeChange && (
        <div className="flex overflow-hidden rounded-md border border-[#2A3A56]" data-testid={`${testid}-mode-toggle`}>
          {[
            { m: "include", label: "Include", color: "#38BDF8" },
            { m: "exclude", label: "Exclude", color: "#F43F5E" },
          ].map(({ m, label, color }) => {
            const active = mode === m;
            return (
              <button
                key={m}
                data-testid={`${testid}-mode-${m}`}
                onClick={() => onModeChange(m)}
                className="flex-1 py-1.5 text-[11px] font-medium transition-colors"
                style={active
                  ? { background: `${color}26`, color }
                  : { color: "#64748B", background: "#0E1626" }}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
      {onModeChange && selected.length > 0 && (
        <p className="text-[10px] text-slate-500" data-testid={`${testid}-mode-hint`}>
          {exclude
            ? `Showing everything except these ${selected.length}`
            : `Showing only these ${selected.length}`}
        </p>
      )}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5" data-testid={`${testid}-selected`}>
          {selected.map((s) => (
            <span
              key={s}
              className="flex max-w-full items-center gap-1 rounded-md border py-0.5 pl-2 pr-1 text-[11px]"
              style={{ borderColor: `${accent}66`, background: `${accent}26`, color: accent }}
            >
              <span className="truncate">{s}</span>
              <button
                data-testid={`${testid}-remove-${s}`}
                onClick={() => toggle(s)}
                className="rounded-full p-0.5 transition-colors hover:opacity-70"
                aria-label={`Remove ${s}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        {loading ? (
          <Loader2 className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-slate-500" />
        ) : (
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
        )}
        <Input
          data-testid={`${testid}-search`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="h-8 border-[#2A3A56] bg-[#0E1626] pl-8 text-xs text-slate-200 placeholder:text-slate-500"
        />
      </div>

      <ScrollArea className="h-44 rounded-md border border-[#2A3A56] bg-[#0E1626]">
        <div className="p-1" data-testid={`${testid}-list`}>
          {results.length === 0 && !loading && (
            <p className="px-2 py-6 text-center text-xs text-slate-500">No matches</p>
          )}
          {results.map((r) => {
            const active = selected.includes(r.name);
            return (
              <button
                key={r.name}
                data-testid={`${testid}-option-${r.name}`}
                onClick={() => toggle(r.name)}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors hover:bg-[#131C31]"
                style={active ? { background: `${accent}26`, color: accent } : { color: "#CBD5E1" }}
              >
                <span
                  className="flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded border"
                  style={active ? { borderColor: accent, background: accent } : { borderColor: "#2A3A56" }}
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
