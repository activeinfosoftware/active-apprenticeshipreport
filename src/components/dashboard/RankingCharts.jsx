import React from "react";
import { Building2, School } from "lucide-react";

const Leaderboard = ({ title, subtitle, icon: Icon, data, color, testid }) => {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div
      data-testid={testid}
      className="rounded-xl border border-[#2A3A56] bg-[#18243E]/90 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.3)] backdrop-blur-md sm:p-6"
    >
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${color}1f` }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <div>
          <h3 className="font-heading text-base font-semibold tracking-tight text-white">{title}</h3>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-2.5">
        {data.length === 0 && <p className="py-6 text-center text-xs text-slate-500">No data for current filters.</p>}
        {data.map((d, i) => (
          <div key={d.name} data-testid={`${testid}-row-${i}`} className="group">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2">
                <span className="font-mono-data text-[11px] text-slate-500">{String(i + 1).padStart(2, "0")}</span>
                <span className="truncate text-xs text-slate-200" title={d.name}>{d.name}</span>
              </span>
              <span className="font-mono-data text-xs font-semibold text-white">{d.count.toLocaleString()}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#0E1626]">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(d.count / max) * 100}%`, background: color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const RankingCharts = ({ topEmployers = [], topProviders = [] }) => (
  <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
    <Leaderboard
      title="Top Employers"
      subtitle="Most active hiring employers"
      icon={Building2}
      data={topEmployers}
      color="#38BDF8"
      testid="ranking-employers"
    />
    <Leaderboard
      title="Top Training Providers"
      subtitle="Providers with most vacancies"
      icon={School}
      data={topProviders}
      color="#F59E0B"
      testid="ranking-providers"
    />
  </div>
);
