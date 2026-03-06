'use client';

import { useEffect, useState, useMemo } from 'react';
import { Car, DollarSign, Download, CheckCircle, Clock, Search, X } from 'lucide-react';

function formatCLP(n: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}

function exportCSV(data: any[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map((row) => headers.map((h) => `"${row[h] ?? ''}"`).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}

export default function AdminAdjudicadosPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cobro, setCobro] = useState('');

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const rows = useMemo(() => {
    if (!data) return [];
    const soldItems = data.soldItems || [];
    const companies = data.companies || [];
    const companyMap = new Map(companies.map((c: any) => [c.tenantId, c.name]));
    const users = data.users || [];
    const userMap = new Map(users.map((u: any) => [u.id, u]));

    return soldItems.map((item: any) => {
      const companyName = companyMap.get(item._tenantId) || 'Sin empresa';
      const buyer = item.soldToUserId ? userMap.get(item.soldToUserId) : null;
      const comision = Math.round((item.soldPrice || 0) * 0.02);
      // Simulate payment status (in real app, this would come from a billing model)
      const paid = Math.random() > 0.4;
      return {
        fecha: item.soldAt,
        automotora: companyName,
        auto: `${item.brand} ${item.model || ''}`,
        plate: item.plate,
        precioBase: item.basePrice,
        precioFinal: item.soldPrice || 0,
        ganador: buyer?.name || buyer?.email || '-',
        comision,
        estadoCobro: paid ? 'Pagado' : 'Pendiente',
      };
    });
  }, [data]);

  const filtered = useMemo(() => {
    return rows.filter((r: any) => {
      if (search) {
        const s = search.toLowerCase();
        if (!r.auto.toLowerCase().includes(s) && !r.automotora.toLowerCase().includes(s) && !r.ganador.toLowerCase().includes(s)) return false;
      }
      if (cobro && r.estadoCobro !== cobro) return false;
      return true;
    });
  }, [rows, search, cobro]);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthRows = rows.filter((r: any) => r.fecha && new Date(r.fecha) >= monthStart);
  const totalFact = rows.reduce((acc: number, r: any) => acc + r.comision, 0);
  const totalFactMes = thisMonthRows.reduce((acc: number, r: any) => acc + r.comision, 0);
  const totalCobrado = rows.filter((r: any) => r.estadoCobro === 'Pagado').reduce((acc: number, r: any) => acc + r.comision, 0);

  const handleExport = () => {
    exportCSV(
      filtered.map((r: any) => ({
        Fecha: r.fecha ? formatDate(r.fecha) : '-',
        Automotora: r.automotora,
        Auto: r.auto,
        Patente: r.plate,
        'Precio Base': r.precioBase,
        'Precio Final': r.precioFinal,
        Ganador: r.ganador,
        Comisión: r.comision,
        'Estado Cobro': r.estadoCobro,
      })),
      'adjudicados.csv'
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Autos Adjudicados</h1>
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-stone-800/50" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Autos Adjudicados</h1>
          <p className="text-sm text-stone-400">Clave para facturación</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 rounded-lg border border-stone-700 bg-stone-800 px-4 py-2 text-sm font-medium text-stone-200 hover:bg-stone-700"
        >
          <Download size={16} /> Exportar reporte mensual
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-stone-800 bg-stone-900/50 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-500/10 p-2.5 text-green-500"><Car size={20} /></div>
            <div>
              <p className="text-xs uppercase tracking-wider text-stone-500">Adjudicados (mes)</p>
              <p className="text-2xl font-bold">{thisMonthRows.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-stone-800 bg-stone-900/50 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-yellow-500/10 p-2.5 text-yellow-500"><DollarSign size={20} /></div>
            <div>
              <p className="text-xs uppercase tracking-wider text-stone-500">Facturación estimada</p>
              <p className="text-2xl font-bold">{formatCLP(totalFact)}</p>
              <p className="text-xs text-stone-500">{formatCLP(totalFactMes)} este mes</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-stone-800 bg-stone-900/50 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2.5 text-blue-500"><CheckCircle size={20} /></div>
            <div>
              <p className="text-xs uppercase tracking-wider text-stone-500">Facturación cobrada</p>
              <p className="text-2xl font-bold">{formatCLP(totalCobrado)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
          <input
            type="text"
            placeholder="Buscar por auto, automotora, ganador..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-stone-700 bg-stone-800/50 py-2 pl-9 pr-3 text-sm text-stone-200 placeholder-stone-500 focus:border-yellow-500/50 focus:outline-none"
          />
        </div>
        <select
          value={cobro}
          onChange={(e) => setCobro(e.target.value)}
          className="rounded-lg border border-stone-700 bg-stone-800/50 px-3 py-2 text-sm text-stone-200 focus:border-yellow-500/50 focus:outline-none"
        >
          <option value="">Todos</option>
          <option value="Pagado">Pagado</option>
          <option value="Pendiente">Pendiente</option>
        </select>
        {(search || cobro) && (
          <button onClick={() => { setSearch(''); setCobro(''); }} className="flex items-center gap-1 rounded-lg border border-stone-700 px-3 py-2 text-sm text-stone-400 hover:text-stone-200">
            <X size={14} /> Limpiar
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-stone-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-800 bg-stone-900/80">
              <th className="px-4 py-3 text-left font-medium text-stone-400">Fecha</th>
              <th className="px-4 py-3 text-left font-medium text-stone-400">Automotora</th>
              <th className="px-4 py-3 text-left font-medium text-stone-400">Auto</th>
              <th className="px-4 py-3 text-right font-medium text-stone-400">Precio Base</th>
              <th className="px-4 py-3 text-right font-medium text-stone-400">Precio Final</th>
              <th className="px-4 py-3 text-left font-medium text-stone-400">Ganador</th>
              <th className="px-4 py-3 text-right font-medium text-stone-400">Comisión</th>
              <th className="px-4 py-3 text-center font-medium text-stone-400">Cobro</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800/50">
            {filtered.map((r: any, i: number) => (
              <tr key={i} className="transition-colors hover:bg-stone-800/30">
                <td className="px-4 py-3 text-stone-300">{r.fecha ? formatDate(r.fecha) : '-'}</td>
                <td className="px-4 py-3 text-stone-200">{r.automotora}</td>
                <td className="px-4 py-3 font-medium text-stone-200">{r.auto}</td>
                <td className="px-4 py-3 text-right tabular-nums text-stone-300">{formatCLP(r.precioBase)}</td>
                <td className="px-4 py-3 text-right tabular-nums font-medium text-stone-100">{formatCLP(r.precioFinal)}</td>
                <td className="px-4 py-3 text-stone-300">{r.ganador}</td>
                <td className="px-4 py-3 text-right tabular-nums font-medium text-yellow-400">{formatCLP(r.comision)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    r.estadoCobro === 'Pagado' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
                  }`}>
                    {r.estadoCobro}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-stone-500">
                  No se encontraron autos adjudicados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
