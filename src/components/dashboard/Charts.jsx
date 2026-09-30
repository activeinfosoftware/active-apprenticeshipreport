import React from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, LabelList,
} from "recharts";

const AXIS = "#64748B";
const GRID = "#1E293B";

const ChartCard = ({ title, subtitle, children, testid, right }) => (
  <div
    data-testid={testid}
    className="rounded-xl border border-[#2A3A56] bg-[#18243E]/90 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.3)] backdrop-blur-md sm:p-6"
  >
    <div className="mb-4 flex items-start justify-between">
      <div>
        <h3 className="font-heading text-base font-semibold tracking-tight text-white">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {right}
    </div>
    {children}
  </div>
);

const TipBox = ({ label, rows }) => (
  <div className="rounded-lg border border-[#2A3A56] bg-[#18243E] px-3 py-2 shadow-xl">
    {label && <p className="mb-1 text-xs font-semibold text-white">{label}</p>}
    {rows.map((r, i) => (
      <p key={i} className="font-mono-data text-xs" style={{ color: r.color }}>
        {r.name}: <span className="font-semibold text-white">{r.value?.toLocaleString()}</span>
      </p>
    ))}
  </div>
);

const monthLabel = (m) => {
  if (!m) return m;
  const [y, mm] = m.split("-");
  return `${["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][+mm]} ${y.slice(2)}`;
};

const kfmt = (v) => (v >= 1000 ? `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : v);

export const TimeSeriesChart = ({ data }) => (
  <ChartCard title="Vacancies Over Time" subtitle="Monthly posted vacancies & positions" testid="chart-timeseries">
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="gVac" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gPos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10B981" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="month" tickFormatter={monthLabel} stroke={AXIS} tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: GRID }} minTickGap={24} />
        <YAxis stroke={AXIS} tick={{ fontSize: 11 }} tickFormatter={kfmt} tickLine={false} axisLine={false} width={44} />
        <Tooltip
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <TipBox label={monthLabel(label)} rows={payload.map((p) => ({ name: p.name, value: p.value, color: p.color }))} />
            ) : null
          }
        />
        <Area isAnimationActive={false} type="monotone" dataKey="positions" name="Positions" stroke="#10B981" strokeWidth={2} fill="url(#gPos)" />
        <Area isAnimationActive={false} type="monotone" dataKey="vacancies" name="Vacancies" stroke="#38BDF8" strokeWidth={2.5} fill="url(#gVac)" activeDot={{ r: 6 }} />
      </AreaChart>
    </ResponsiveContainer>
  </ChartCard>
);

export const RouteBarChart = ({ data }) => (
  <ChartCard title="By Course Route" subtitle="Vacancy volume per sector" testid="chart-route">
    <ResponsiveContainer width="100%" height={360}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 40, left: 10, bottom: 0 }}>
        <CartesianGrid stroke={GRID} strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" stroke={AXIS} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="name" stroke={AXIS} tick={{ fontSize: 10, fill: "#94A3B8" }} interval={0} width={165} tickLine={false} axisLine={false} />
        <Tooltip
          cursor={{ fill: "rgba(56,189,248,0.06)" }}
          content={({ active, payload }) =>
            active && payload?.length ? (
              <TipBox label={payload[0].payload.name} rows={[{ name: "Vacancies", value: payload[0].value, color: "#38BDF8" }]} />
            ) : null
          }
        />
        <Bar isAnimationActive={false} dataKey="count" fill="#38BDF8" radius={[0, 4, 4, 0]} barSize={16}>
          <LabelList dataKey="count" position="right" fill="#64748B" fontSize={10} formatter={(v) => v.toLocaleString()} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </ChartCard>
);

const LEVEL_COLORS = { Intermediate: "#38BDF8", Advanced: "#10B981", Higher: "#F59E0B", Degree: "#8B5CF6", Unknown: "#64748B" };

export const LevelDonut = ({ data }) => {
  const total = data.reduce((a, b) => a + b.count, 0);
  return (
    <ChartCard title="By Apprenticeship Level" subtitle="Share of vacancies" testid="chart-level">
      <div className="relative">
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie isAnimationActive={false} data={data} dataKey="count" nameKey="name" innerRadius="58%" outerRadius="80%" paddingAngle={4} stroke="none">
              {data.map((d) => <Cell key={d.name} fill={LEVEL_COLORS[d.name] || "#64748B"} />)}
            </Pie>
            <Tooltip
              content={({ active, payload }) =>
                active && payload?.length ? (
                  <TipBox label={payload[0].name}
                    rows={[{ name: "Vacancies", value: payload[0].value, color: LEVEL_COLORS[payload[0].name] }]} />
                ) : null
              }
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono-data text-3xl font-bold text-white">{total.toLocaleString()}</span>
          <span className="text-[11px] uppercase tracking-wider text-slate-500">Total</span>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1">
        {data.map((d) => (
          <span key={d.name} className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: LEVEL_COLORS[d.name] || "#64748B" }} />
            {d.name} <span className="font-mono-data text-slate-500">{((d.count / total) * 100).toFixed(0)}%</span>
          </span>
        ))}
      </div>
    </ChartCard>
  );
};

export const RegionBarChart = ({ data }) => (
  <ChartCard title="Top ITL1 Regions" subtitle="Vacancies by UK region" testid="chart-region">
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 60 }}>
        <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" stroke={AXIS} tick={{ fontSize: 10, fill: "#94A3B8" }} angle={-35} textAnchor="end" interval={0} height={70} tickLine={false} axisLine={{ stroke: GRID }} />
        <YAxis stroke={AXIS} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={40} />
        <Tooltip
          cursor={{ fill: "rgba(245,158,11,0.06)" }}
          content={({ active, payload }) =>
            active && payload?.length ? (
              <TipBox label={payload[0].payload.name} rows={[{ name: "Vacancies", value: payload[0].value, color: "#F59E0B" }]} />
            ) : null
          }
        />
        <Bar isAnimationActive={false} dataKey="count" fill="#F59E0B" radius={[4, 4, 0, 0]} barSize={26} />
      </BarChart>
    </ResponsiveContainer>
  </ChartCard>
);
