import React, { useEffect, useRef, useState } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { fetchValues } from "../../lib/api";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

// Single-select searchable picker (server-side search) for a comparison slot.
export const EntitySearchSelect = ({ field, value, onChange, placeholder, accent, testid }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounce = useRef(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    clearTimeout(debounce.current);
    let cancelled = false;
    debounce.current = setTimeout(() => {
      fetchValues(field, query, 50)
        .then((d) => !cancelled && setResults(d))
        .finally(() => !cancelled && setLoading(false));
    }, 250);
    return () => { cancelled = true; clearTimeout(debounce.current); };
  }, [field, query, open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          data-testid={`${testid}-trigger`}
          className="flex w-full items-center justify-between gap-2 rounded-lg border bg-[#0E1626] px-3 py-2.5 text-left text-sm transition-colors hover:border-[#38BDF8]/50"
          style={{ borderColor: value ? accent : "#2A3A56" }}
        >
          <span className={`truncate ${value ? "text-white" : "text-slate-500"}`}>
            {value || placeholder}
          </span>
          {value ? (
            <X
              className="h-4 w-4 flex-shrink-0 text-slate-400 hover:text-white"
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
            />
          ) : (
            <Search className="h-4 w-4 flex-shrink-0 text-slate-500" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] border-[#2A3A56] bg-[#18243E] p-2" align="start">
        <div className="relative mb-2">
          {loading ? (
            <Loader2 className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-slate-500" />
          ) : (
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          )}
          <Input
            data-testid={`${testid}-search`}
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type to search…"
            className="h-8 border-[#2A3A56] bg-[#0E1626] pl-8 text-xs text-slate-200 placeholder:text-slate-500"
          />
        </div>
        <ScrollArea className="h-56">
          <div className="pr-2">
            {results.length === 0 && !loading && (
              <p className="px-2 py-6 text-center text-xs text-slate-500">No matches</p>
            )}
            {results.map((r) => (
              <button
                key={r.name}
                data-testid={`${testid}-option-${r.name}`}
                onClick={() => { onChange(r.name); setOpen(false); setQuery(""); }}
                className="flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-xs text-slate-300 transition-colors hover:bg-[#131C31]"
              >
                <span className="truncate">{r.name}</span>
                <span className="font-mono-data text-[10px] text-slate-500">{r.count}</span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
