'use client';

import { useEffect, useState } from 'react';
import {
  Car, Gavel, TrendingUp, Building2, Users, DollarSign,
  ArrowUpRight, ArrowDownRight, Activity,
} from 'lucide-react';

interface Metrics {
  totalAuctionedMonth: number;
  totalSold: number;
  totalSoldMonth: number;
  adjudicationRate: number;
  ingresoEstimado: number;
  ingresoMes: number;
  activeCompanies: number;
  usersWithBids: number;
  totalAuctions: number;
  totalItems: number;
  totalUsers: number;
}

interface ChartData {
  auctionsByDay: { date: string; count: number }[];
  adjByWeek: { week: string; count: number }[];
}

function formatCLP(amount: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(amount);
}

function MiniBarChart({ data, label }: { data: { label: string; value: number }[]; label: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-stone-400">{label}</p>
      <div className="flex items-end gap-[2px]" style={{ height: 120 }}>
        {data.map((d, i) => (
          <div key={i} className="group relative flex-1" style={{ height: '100%' }}>
            <div
              className="absolute bottom-0 w-full rounded-t bg-yellow-500/80 transition-colors group-hover:bg-yellow-400"
              style={{ height: `${Math.max((d.value / max) * 100, 2)}%` }}
            />
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 rounded bg-stone-800 px-1.5 py-0.5 text-[10px] text-stone-300 opacity-0 transition-opacity group-hover:opacity-100 whitespace-nowrap">
              {d.label}: {d.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({
  title, value, subtitle, icon: Icon, trend, color = 'yellow',
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: any;
  trend?: 'up' | 'down' | null;
  color?: 'yellow' | 'green' | 'blue' | 'red';
}) {
  const colors = {
    yellow: 'bg-yellow-500/10 text-yellow-500',
    green: 'bg-green-500/10 text-green-500',
    blue: 'bg-blue-500/10 text-blue-500',
    red: 'bg-red-500/10 text-red-500',
  };
  return (
    <div className="rounded-xl border border-stone-800 bg-stone-900/50 p-5 transition-colors hover:border-stone-700">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-stone-500">{title}</p>
          <p className="text-2xl font-bold tabular-nums">{value}</p>
          {subtitle && (
            <p className="flex items-center gap-1 text-xs text-stone-400">
              {trend === 'up' && <ArrowUpRight size={12} className="text-green-400" />}
              {trend === 'down' && <ArrowDownRight size={12} className="text-red-400" />}
              {subtitle}
            </p>
          )}
        </div>
        <div className={`rounded-lg p-2.5 ${colors[color]}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

export default function AdminOverviewPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then((r) => r.json())
      .then((data) => {
        setMetrics(data.metrics);
        setCharts(data.charts);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Overview</h1>
          <p className="text-sm text-stone-400">Cargando métricas del sistema...</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[120px] animate-pulse rounded-xl border border-stone-800 bg-stone-900/50" />
          ))}
        </div>
      </div>
    );
  }

  if (!metrics || !charts) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Activity size={48} className="text-stone-600" />
        <p className="text-stone-400">No se pudieron cargar las métricas</p>
      </div>
    );
  }

  const dayData = charts.auctionsByDay.slice(-14).map((d) => ({
    label: new Date(d.date).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }),
    value: d.count,
  }));

  const weekData = charts.adjByWeek.map((d) => ({
    label: new Date(d.week).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }),
    value: d.count,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-sm text-stone-400">
          Panel de administración — {new Date().toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Autos subastados (mes)"
          value={metrics.totalAuctionedMonth}
          subtitle="en subastas este mes"
          icon={Car}
          color="yellow"
        />
        <StatCard
          title="Autos adjudicados"
          value={metrics.totalSold}
          subtitle={`${metrics.totalSoldMonth} este mes`}
          icon={Gavel}
          color="green"
          trend="up"
        />
        <StatCard
          title="Tasa de adjudicación"
          value={`${metrics.adjudicationRate}%`}
          subtitle="del mes actual"
          icon={TrendingUp}
          color={metrics.adjudicationRate >= 50 ? 'green' : 'red'}
          trend={metrics.adjudicationRate >= 50 ? 'up' : 'down'}
        />
        <StatCard
          title="Ingreso Suba&Go (est.)"
          value={formatCLP(metrics.ingresoEstimado)}
          subtitle={`${formatCLP(metrics.ingresoMes)} este mes`}
          icon={DollarSign}
          color="green"
          trend="up"
        />
        <StatCard
          title="Automotoras activas"
          value={metrics.activeCompanies}
          icon={Building2}
          color="blue"
        />
        <StatCard
          title="Usuarios que ofertaron"
          value={metrics.usersWithBids}
          subtitle={`de ${metrics.totalUsers} registrados`}
          icon={Users}
          color="yellow"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-stone-800 bg-stone-900/50 p-5">
          <MiniBarChart data={dayData} label="Subastas por día (últimos 14 días)" />
        </div>
        <div className="rounded-xl border border-stone-800 bg-stone-900/50 p-5">
          <MiniBarChart data={weekData} label="Adjudicaciones por semana (últimas 12 semanas)" />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-stone-800 bg-stone-900/50 p-5 text-center">
          <p className="text-3xl font-bold text-yellow-500">{metrics.totalAuctions}</p>
          <p className="mt-1 text-xs text-stone-400">Subastas totales</p>
        </div>
        <div className="rounded-xl border border-stone-800 bg-stone-900/50 p-5 text-center">
          <p className="text-3xl font-bold text-yellow-500">{metrics.totalItems}</p>
          <p className="mt-1 text-xs text-stone-400">Autos registrados</p>
        </div>
        <div className="rounded-xl border border-stone-800 bg-stone-900/50 p-5 text-center">
          <p className="text-3xl font-bold text-yellow-500">{metrics.totalUsers}</p>
          <p className="mt-1 text-xs text-stone-400">Usuarios totales</p>
        </div>
      </div>
    </div>
  );
}
