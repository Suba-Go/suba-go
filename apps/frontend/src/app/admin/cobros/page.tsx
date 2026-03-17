'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { CreditCard, CheckCircle2, AlertCircle, Clock, Download, Search, ChevronDown } from 'lucide-react';

function formatCLP(n: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}

type PaymentStatus = 'pagado' | 'pendiente' | 'vencido';

export default function AdminCobrosPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | PaymentStatus>('');
  const [expandedClient, setExpandedClient] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const billing = useMemo(() => {
    if (!data) return { rows: [], totalPendiente: 0, totalCobrado: 0, totalComisiones: 0 };

    const companies = data.companies || [];
    const soldItems = data.soldItems || [];

    const rows = companies.map((c: any, idx: number) => {
      const cSold = soldItems.filter((i: any) => i._tenantId === c.tenantId);
      const items = cSold.map((item: any, i: number) => {
        const comision = Math.round((item.soldPrice || 0) * 0.02);
        // Simulate payment status based on index
        const status: PaymentStatus = i < Math.floor(cSold.length * 0.5) ? 'pagado' : i < Math.floor(cSold.length * 0.8) ? 'pendiente' : 'vencido';
        return {
          id: item.id,
          auto: `${item.brand} ${item.model} ${item.year}`,
          precioVenta: item.soldPrice || 0,
          comision,
          status,
          fecha: item.updatedAt || item.createdAt,
        };
      });

      const totalComision = items.reduce((a: number, i: any) => a + i.comision, 0);
      const cobrado = items.filter((i: any) => i.status === 'pagado').reduce((a: number, i: any) => a + i.comision, 0);
      const pendiente = items.filter((i: any) => i.status === 'pendiente').reduce((a: number, i: any) => a + i.comision, 0);
      const vencido = items.filter((i: any) => i.status === 'vencido').reduce((a: number, i: any) => a + i.comision, 0);

      return {
        id: c.id,
        name: c.name,
        tenantId: c.tenantId,
        autosAdjudicados: cSold.length,
        totalComision,
        cobrado,
        pendiente,
        vencido,
        items,
        estadoPago: vencido > 0 ? 'vencido' as PaymentStatus : pendiente > 0 ? 'pendiente' as PaymentStatus : 'pagado' as PaymentStatus,
      };
    }).filter((r: any) => r.autosAdjudicados > 0);

    const totalPendiente = rows.reduce((a: number, r: any) => a + r.pendiente + r.vencido, 0);
    const totalCobrado = rows.reduce((a: number, r: any) => a + r.cobrado, 0);
    const totalComisiones = rows.reduce((a: number, r: any) => a + r.totalComision, 0);

    return { rows, totalPendiente, totalCobrado, totalComisiones };
  }, [data]);

  const filtered = useMemo(() => {
    let result = billing.rows;
    if (search) result = result.filter((r: any) => r.name.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter) result = result.filter((r: any) => r.estadoPago === statusFilter);
    return result;
  }, [billing.rows, search, statusFilter]);

  const downloadCSV = useCallback(() => {
    const headers = ['Cliente', 'Autos adjudicados', 'Comisión por auto (2%)', 'Total a cobrar', 'Cobrado', 'Pendiente', 'Vencido', 'Estado'];
    const csvRows = filtered.map((r: any) => [
      `"${r.name}"`, r.autosAdjudicados, formatCLP(Math.round(r.totalComision / (r.autosAdjudicados || 1))),
      formatCLP(r.totalComision), formatCLP(r.cobrado), formatCLP(r.pendiente), formatCLP(r.vencido), r.estadoPago
    ].join(','));
    const csv = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cobros-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Sistema de Cobro</h1>
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (<div key={i} className="h-24 rounded-lg bg-stone-800/50" />))}
          </div>
          {Array.from({ length: 3 }).map((_, i) => (<div key={i} className="h-16 rounded-lg bg-stone-800/50" />))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sistema de Cobro</h1>
        <p className="text-sm text-stone-400">Facturación automática · Comisión 2% sobre precio de venta</p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-stone-800 bg-stone-900/50 p-5">
          <div className="mb-2 flex items-center gap-2 text-xs text-stone-500">
            <CreditCard size={14} /> Comisiones totales
          </div>
          <p className="text-2xl font-bold tabular-nums tracking-tight">{formatCLP(billing.totalComisiones)}</p>
        </div>
        <div className="rounded-xl border border-green-500/10 bg-green-500/5 p-5">
          <div className="mb-2 flex items-center gap-2 text-xs text-green-400">
            <CheckCircle2 size={14} /> Cobrado
          </div>
          <p className="text-2xl font-bold tabular-nums tracking-tight text-green-400">{formatCLP(billing.totalCobrado)}</p>
        </div>
        <div className="rounded-xl border border-yellow-500/10 bg-yellow-500/5 p-5">
          <div className="mb-2 flex items-center gap-2 text-xs text-yellow-400">
            <Clock size={14} /> Pendiente + Vencido
          </div>
          <p className="text-2xl font-bold tabular-nums tracking-tight text-yellow-400">{formatCLP(billing.totalPendiente)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-xs flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-stone-700 bg-stone-800/50 py-2 pl-9 pr-3 text-sm text-stone-200 placeholder-stone-500 focus:border-yellow-500/50 focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="rounded-lg border border-stone-700 bg-stone-800/50 px-3 py-2 text-sm text-stone-300 focus:border-yellow-500/50 focus:outline-none"
        >
          <option value="">Todos los estados</option>
          <option value="pagado">Pagado</option>
          <option value="pendiente">Pendiente</option>
          <option value="vencido">Vencido</option>
        </select>
        <button onClick={downloadCSV} className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-stone-700 px-3 py-2 text-sm text-stone-300 hover:bg-stone-800">
          <Download size={14} /> Exportar CSV
        </button>
      </div>

      {/* Billing table */}
      <div className="overflow-x-auto rounded-xl border border-stone-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-800 bg-stone-900/80">
              <th className="px-4 py-3 text-left font-medium text-stone-400">Cliente</th>
              <th className="px-4 py-3 text-center font-medium text-stone-400">Autos adj.</th>
              <th className="px-4 py-3 text-right font-medium text-stone-400">Comisión / auto</th>
              <th className="px-4 py-3 text-right font-medium text-stone-400">Total a cobrar</th>
              <th className="px-4 py-3 text-right font-medium text-stone-400">Cobrado</th>
              <th className="px-4 py-3 text-right font-medium text-stone-400">Pendiente</th>
              <th className="px-4 py-3 text-center font-medium text-stone-400">Estado</th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800/50">
            {filtered.map((r: any) => (
              <>
                <tr key={r.id} className="transition-colors hover:bg-stone-800/30">
                  <td className="px-4 py-3 font-medium text-stone-200">{r.name}</td>
                  <td className="px-4 py-3 text-center tabular-nums text-stone-300">{r.autosAdjudicados}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-stone-300">
                    {r.autosAdjudicados ? formatCLP(Math.round(r.totalComision / r.autosAdjudicados)) : '-'}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-stone-200">{formatCLP(r.totalComision)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-green-400">{formatCLP(r.cobrado)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-yellow-400">{formatCLP(r.pendiente + r.vencido)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                      r.estadoPago === 'pagado' ? 'bg-green-500/10 text-green-400'
                      : r.estadoPago === 'pendiente' ? 'bg-yellow-500/10 text-yellow-400'
                      : 'bg-red-500/10 text-red-400'
                    }`}>
                      {r.estadoPago === 'pagado' ? <CheckCircle2 size={12} /> : r.estadoPago === 'vencido' ? <AlertCircle size={12} /> : <Clock size={12} />}
                      {r.estadoPago}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setExpandedClient(expandedClient === r.id ? null : r.id)}
                      className="rounded-md p-1 text-stone-500 hover:bg-stone-700 hover:text-stone-300"
                    >
                      <ChevronDown size={16} className={`transition-transform ${expandedClient === r.id ? 'rotate-180' : ''}`} />
                    </button>
                  </td>
                </tr>
                {expandedClient === r.id && (
                  <tr key={`${r.id}-items`}>
                    <td colSpan={8} className="bg-stone-900/30 px-6 py-4">
                      <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-stone-500">Detalle de autos adjudicados</h4>
                      <div className="overflow-x-auto rounded-lg border border-stone-800/50">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-stone-800/30">
                              <th className="px-3 py-2 text-left text-stone-500">Auto</th>
                              <th className="px-3 py-2 text-right text-stone-500">Precio venta</th>
                              <th className="px-3 py-2 text-right text-stone-500">Comisión (2%)</th>
                              <th className="px-3 py-2 text-center text-stone-500">Estado pago</th>
                              <th className="px-3 py-2 text-right text-stone-500">Fecha</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-800/30">
                            {r.items.map((item: any) => (
                              <tr key={item.id}>
                                <td className="px-3 py-2 text-stone-300">{item.auto}</td>
                                <td className="px-3 py-2 text-right tabular-nums text-stone-300">{formatCLP(item.precioVenta)}</td>
                                <td className="px-3 py-2 text-right tabular-nums font-medium text-stone-200">{formatCLP(item.comision)}</td>
                                <td className="px-3 py-2 text-center">
                                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                    item.status === 'pagado' ? 'bg-green-500/10 text-green-400'
                                    : item.status === 'pendiente' ? 'bg-yellow-500/10 text-yellow-400'
                                    : 'bg-red-500/10 text-red-400'
                                  }`}>{item.status}</span>
                                </td>
                                <td className="px-3 py-2 text-right text-stone-400">{formatDate(item.fecha)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-3 flex gap-4 text-xs text-stone-500">
                        <span>Total autos: <strong className="text-stone-300">{r.autosAdjudicados}</strong></span>
                        <span>Comisión total: <strong className="text-stone-200">{formatCLP(r.totalComision)}</strong></span>
                        <span>Auto-calculado: {r.autosAdjudicados} autos × 2% comisión</span>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-stone-500">No hay datos de cobro</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
