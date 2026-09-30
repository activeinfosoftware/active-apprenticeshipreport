import React, { useEffect, useState } from "react";
import { Search, ArrowUpDown, ChevronLeft, ChevronRight, Download, Loader2 } from "lucide-react";
import { fetchTable, exportCsv } from "../../lib/api";
import { toast } from "sonner";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";

const LEVEL_BADGE = {
  Intermediate: "bg-[#38BDF8]/15 text-[#38BDF8] border-[#38BDF8]/30",
  Advanced: "bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30",
  Higher: "bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30",
  Degree: "bg-[#8B5CF6]/15 text-[#8B5CF6] border-[#8B5CF6]/30",
  Unknown: "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

const COLS = [
  { key: "title", label: "Vacancy", sortable: true },
  { key: "employer", label: "Employer", sortable: true },
  { key: "standard_name", label: "Standard (totals)", sortable: false },
  { key: "course_route", label: "Route", sortable: false },
  { key: "apprenticeship_level", label: "Level", sortable: true },
  { key: "itl1_name", label: "Region", sortable: false },
  { key: "wage_max", label: "Wage/hr", sortable: true },
  { key: "posted_date", label: "Posted", sortable: true },
];

export const DataTable = ({ filters }) => {
  const [data, setData] = useState({ rows: [], total: 0, page: 1, pages: 1 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("posted_date");
  const [sortDir, setSortDir] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => setPage(1), [filters]);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      fetchTable({ ...filters, search: search || filters.search }, page, 25, sortBy, sortDir)
        .then(setData)
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [filters, page, search, sortBy, sortDir]);

  const sort = (key) => {
    if (sortBy === key) setSortDir(sortDir === 1 ? -1 : 1);
    else { setSortBy(key); setSortDir(-1); }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportCsv({ ...filters, search: search || filters.search });
      toast.success(`Exported ${data.total.toLocaleString()} vacancies to CSV`);
    } catch (e) {
      toast.error("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div
      data-testid="data-table-card"
      className="rounded-xl border border-[#2A3A56] bg-[#18243E]/90 shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
    >
      <div className="flex flex-col gap-3 border-b border-[#2A3A56] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h3 className="font-heading text-base font-semibold tracking-tight text-white">Vacancy Records</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            <span className="font-mono-data text-slate-300">{data.total.toLocaleString()}</span> results
          </p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              data-testid="table-search-input"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search title, employer, provider…"
              className="border-[#2A3A56] bg-[#0E1626] pl-9 text-sm text-slate-200 placeholder:text-slate-500"
            />
          </div>
          <Button
            data-testid="export-csv-btn"
            onClick={handleExport}
            disabled={exporting || data.total === 0}
            className="gap-1.5 whitespace-nowrap bg-[#38BDF8] text-[#0B101D] hover:bg-[#7DD3FC] disabled:opacity-50"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export CSV
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-[#2A3A56] hover:bg-transparent">
              {COLS.map((c) => (
                <TableHead key={c.key} className="bg-[#131C31] text-[11px] uppercase tracking-wider text-slate-400">
                  {c.sortable ? (
                    <button data-testid={`sort-${c.key}`} onClick={() => sort(c.key)}
                      className="flex items-center gap-1 hover:text-[#38BDF8]">
                      {c.label}
                      <ArrowUpDown className={`h-3 w-3 ${sortBy === c.key ? "text-[#38BDF8]" : "text-slate-600"}`} />
                    </button>
                  ) : c.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.rows.map((r) => (
              <TableRow key={r.vacancy_reference} data-testid={`table-row-${r.vacancy_reference}`}
                className="border-[#1E293B] transition-colors hover:bg-[#1E2D4D]">
                <TableCell className="max-w-[240px]">
                  <p className="truncate font-medium text-slate-200">{r.title}</p>
                  <p className="truncate text-xs text-slate-500">{r.course_title}</p>
                </TableCell>
                <TableCell className="max-w-[160px] truncate text-slate-300">{r.employer}</TableCell>
                <TableCell className="max-w-[200px]">
                  <p className="truncate text-slate-200" title={r.standard_name}>{r.standard_name || "—"}</p>
                  <p className="font-mono-data text-[11px] text-slate-500" title="Vacancies · Positions · Average advert days">
                    <span className="text-[#38BDF8]">{(r.standard_vacancies ?? 0).toLocaleString()}</span> vac ·{" "}
                    <span className="text-[#10B981]">{(r.standard_positions ?? 0).toLocaleString()}</span> pos ·{" "}
                    <span className="text-[#F59E0B]">{(r.standard_avg_advert_days ?? 0).toLocaleString()}</span> avg adv days
                  </p>
                </TableCell>
                <TableCell className="text-slate-400">{r.course_route}</TableCell>
                <TableCell>
                  <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${LEVEL_BADGE[r.apprenticeship_level] || LEVEL_BADGE.Unknown}`}>
                    {r.apprenticeship_level}
                  </span>
                </TableCell>
                <TableCell className="text-slate-400">{r.itl1_name}</TableCell>
                <TableCell className="font-mono-data text-slate-200">
                  {r.wage_max ? `£${r.wage_max.toFixed(2)}` : "—"}
                </TableCell>
                <TableCell className="font-mono-data text-xs text-slate-400">{r.posted_date}</TableCell>
              </TableRow>
            ))}
            {!loading && data.rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={COLS.length} className="py-12 text-center text-slate-500">
                  No vacancies match the selected filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between border-t border-[#2A3A56] px-5 py-3 sm:px-6">
        <span className="font-mono-data text-xs text-slate-500">Page {data.page} of {data.pages || 1}</span>
        <div className="flex gap-2">
          <Button data-testid="table-prev-btn" variant="outline" size="sm" disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="h-8 border-[#2A3A56] bg-[#0E1626] text-slate-300 hover:bg-[#1E2D4D] hover:text-white disabled:opacity-40">
            <ChevronLeft className="h-4 w-4" /> Prev
          </Button>
          <Button data-testid="table-next-btn" variant="outline" size="sm" disabled={page >= data.pages}
            onClick={() => setPage((p) => p + 1)}
            className="h-8 border-[#2A3A56] bg-[#0E1626] text-slate-300 hover:bg-[#1E2D4D] hover:text-white disabled:opacity-40">
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
