import React from "react";
import { Briefcase, Users, PoundSterling, Building2 } from "lucide-react";

const fmt = (n) => (n == null ? "—" : n.toLocaleString());

const cards = [
  { key: "total_vacancies", label: "Total Vacancies", icon: Briefcase, color: "#38BDF8", suffix: "" },
  { key: "total_positions", label: "Positions Available", icon: Users, color: "#10B981", suffix: "" },
  { key: "avg_wage", label: "Avg Hourly Wage", icon: PoundSterling, color: "#F59E0B", prefix: "£" },
  { key: "distinct_employers", label: "Distinct Employers", icon: Building2, color: "#8B5CF6", suffix: "" },
];

export const KpiCards = ({ kpis, loading }) => (
  <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
    {cards.map((c, i) => {
      const Icon = c.icon;
      const val = kpis?.[c.key];
      return (
        <div
          key={c.key}
          data-testid={`kpi-${c.key}`}
          className="animate-fade-up rounded-xl border border-[#2A3A56] bg-[#18243E]/90 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.3)] backdrop-blur-md transition-all duration-200 hover:border-[#38BDF8]/50"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="flex items-start justify-between">
            <span className="font-mono-data text-[11px] uppercase tracking-wider text-slate-400">{c.label}</span>
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: `${c.color}1f`, boxShadow: `0 0 15px ${c.color}22` }}
            >
              <Icon className="h-4 w-4" style={{ color: c.color }} />
            </div>
          </div>
          <div className="mt-4 font-mono-data text-3xl font-bold tracking-tight text-white">
            {loading ? <span className="text-slate-600">···</span> : (c.prefix || "") + fmt(val) + (c.suffix || "")}
          </div>
          {c.key === "distinct_employers" && (
            <p className="mt-1 text-xs text-slate-500">{fmt(kpis?.distinct_providers)} training providers</p>
          )}
          {c.key === "avg_wage" && <p className="mt-1 text-xs text-slate-500">per hour, upper band</p>}
          {c.key === "total_positions" && <p className="mt-1 text-xs text-slate-500">across all vacancies</p>}
          {c.key === "total_vacancies" && <p className="mt-1 text-xs text-slate-500">matching current filters</p>}
        </div>
      );
    })}
  </div>
);
