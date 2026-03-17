'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Download, Filter, Eye, ChevronDown, X } from 'lucide-react';

interface Auction {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
  type: string;
  bidIncrement: number;
  items?: AuctionItem[];
  bids?: any[];
  _tenantId: string;
}

interface AuctionItem {
  id: string;
  startingBid: number;
  item: {
    id: string;
    brand: string;
    model: string;
    plate: string;
    basePrice: number;
    state: string;
    soldPrice?: number;
    soldToUser?: { name: string; email: string };
  };
  bids?: any[];
}

function formatCLP(n: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}

const statusColors: Record<string, string> = {
  ACTIVA: 'bg-green-500/10 text-green-400 border-green-500/20',
  PENDIENTE: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  COMPLETADA: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  CANCELADA: 'bg-red-500/10 text-red-400 border-red-500/20',
  ELIMINADA: 'bg-stone-500/10 text-stone-400 border-stone-500/20',
};

const statusLabels: Record<string, string> = {
  ACTIVA: 'Activa',
  PENDIENTE: 'Pendiente',
  COMPLETADA: 'Completada',
  CANCELADA: 'Cancelada',
  ELIMINADA: 'Eliminada',
};

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

export default function AdminSubastasPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const rows = useMemo(() => {
    if (!data) return [];
    const auctions: Auction[] = data.auctions || [];
    const companies: any[] = data.companies || [];
    const companyMap = new Map(companies.map((c: any) => [c.tenantId, c.name]));

    // Flatten auction items into rows
    const result: any[] = [];
    for (const auction of auctions) {
      const companyName = companyMap.get(auction._tenantId) || 'Sin empresa';
      const auctionItems = auction.items || [];

      if (auctionItems.length === 0) {
        result.push({
          auctionId: auction.id,
          fecha: auction.startTime,
          automotora: companyName,
          auto: '-',
          precioBase: 0,
          precioFinal: 0,
          huboPuja: 'No',
          estado: auction.status,
          ganador: '-',
          comision: 0,
          title: auction.title,
        });
      } else {
        for (const ai of auctionItems) {
          const item = ai.item;
          const itemBids = ai.bids || [];
          const maxBid = itemBids.length > 0 ? Math.max(...itemBids.map((b: any) => b.offered_price)) : 0;
          const sold = item?.state === 'VENDIDO';
          const finalPrice = sold ? (item.soldPrice || maxBid) : maxBid;
          const comision = sold ? Math.round(finalPrice * 0.02) : 0;

          result.push({
            auctionId: auction.id,
            fecha: auction.startTime,
            automotora: companyName,
            auto: item ? `${item.brand} ${item.model || ''}` : '-',
            precioBase: item?.basePrice || ai.startingBid,
            precioFinal: finalPrice,
            huboPuja: itemBids.length > 0 ? 'Sí' : 'No',
            estado: sold ? 'Adjudicado' : auction.status === 'COMPLETADA' ? 'No adjudicado' : statusLabels[auction.status] || auction.status,
            ganador: sold && item.soldToUser ? item.soldToUser.name || item.soldToUser.email : '-',
            comision,
            title: auction.title,
          });
        }
      }
    }
    return result;
  }, [data]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (search) {
        const s = search.toLowerCase();
        if (!r.auto.toLowerCase().includes(s) && !r.automotora.toLowerCase().includes(s) && !r.ganador.toLowerCase().includes(s) && !r.title.toLowerCase().includes(s)) {
          return false;
        }
      }
      if (statusFilter && r.estado !== statusFilter) return false;
      if (dateFrom && new Date(r.fecha) < new Date(dateFrom)) return false;
      if (dateTo && new Date(r.fecha) > new Date(dateTo + 'T23:59:59')) return false;
      return true;
    });
  }, [rows, search, statusFilter, dateFrom, dateTo]);

  const handleExport = () => {
    exportCSV(
      filtered.map((r) => ({
        'ID Subasta': r.auctionId.slice(0, 8),
        Fecha: formatDate(r.fecha),
        Automotora: r.automotora,
        Auto: r.auto,
        'Precio Base': r.precioBase,
        'Precio Final': r.precioFinal,
        'Hubo Puja': r.huboPuja,
        Estado: r.estado,
        Ganador: r.ganador,
        Comisión: r.comision,
      })),
      'subastas.csv'
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Subastas</h1>
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-stone-800/50" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Subastas</h1>
          <p className="text-sm text-stone-400">{filtered.length} registros</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 rounded-lg border border-stone-700 bg-stone-800 px-4 py-2 text-sm font-medium text-stone-200 transition-colors hover:bg-stone-700"
        >
          <Download size={16} />
          Exportar Excel
        </button>
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
            className="w-full rounded-lg border border-stone-700 bg-stone-800/50 py-2 pl-9 pr-3 text-sm text-stone-200 placeholder-stone-500 focus:border-yellow-500/50 focus:outline-none focus:ring-1 focus:ring-yellow-500/30"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-stone-700 bg-stone-800/50 px-3 py-2 text-sm text-stone-200 focus:border-yellow-500/50 focus:outline-none"
        >
          <option value="">Todos los estados</option>
          <option value="Adjudicado">Adjudicado</option>
          <option value="No adjudicado">No adjudicado</option>
          <option value="Activa">Activa</option>
          <option value="Pendiente">Pendiente</option>
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="rounded-lg border border-stone-700 bg-stone-800/50 px-3 py-2 text-sm text-stone-200 focus:border-yellow-500/50 focus:outline-none"
          placeholder="Desde"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="rounded-lg border border-stone-700 bg-stone-800/50 px-3 py-2 text-sm text-stone-200 focus:border-yellow-500/50 focus:outline-none"
          placeholder="Hasta"
        />
        {(search || statusFilter || dateFrom || dateTo) && (
          <button
            onClick={() => { setSearch(''); setStatusFilter(''); setDateFrom(''); setDateTo(''); }}
            className="flex items-center gap-1 rounded-lg border border-stone-700 px-3 py-2 text-sm text-stone-400 hover:text-stone-200"
          >
            <X size={14} /> Limpiar
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-stone-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-800 bg-stone-900/80">
              <th className="px-4 py-3 text-left font-medium text-stone-400">ID</th>
              <th className="px-4 py-3 text-left font-medium text-stone-400">Fecha</th>
              <th className="px-4 py-3 text-left font-medium text-stone-400">Automotora</th>
              <th className="px-4 py-3 text-left font-medium text-stone-400">Auto</th>
              <th className="px-4 py-3 text-right font-medium text-stone-400">Precio Base</th>
              <th className="px-4 py-3 text-right font-medium text-stone-400">Precio Final</th>
              <th className="px-4 py-3 text-center font-medium text-stone-400">Puja</th>
              <th className="px-4 py-3 text-left font-medium text-stone-400">Estado</th>
              <th className="px-4 py-3 text-left font-medium text-stone-400">Ganador</th>
              <th className="px-4 py-3 text-right font-medium text-stone-400">Comisión</th>
              <th className="px-4 py-3 text-center font-medium text-stone-400">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800/50">
            {filtered.map((r, i) => (
              <tr key={i} className="transition-colors hover:bg-stone-800/30">
                <td className="px-4 py-3 font-mono text-xs text-stone-500">{r.auctionId.slice(0, 8)}</td>
                <td className="px-4 py-3 text-stone-300">{formatDate(r.fecha)}</td>
                <td className="px-4 py-3 text-stone-200">{r.automotora}</td>
                <td className="px-4 py-3 font-medium text-stone-200">{r.auto}</td>
                <td className="px-4 py-3 text-right tabular-nums text-stone-300">{formatCLP(r.precioBase)}</td>
                <td className="px-4 py-3 text-right tabular-nums font-medium text-stone-100">{r.precioFinal > 0 ? formatCLP(r.precioFinal) : '-'}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.huboPuja === 'Sí' ? 'bg-green-500/10 text-green-400' : 'bg-stone-700/50 text-stone-500'}`}>
                    {r.huboPuja}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                    r.estado === 'Adjudicado'
                      ? 'border-green-500/20 bg-green-500/10 text-green-400'
                      : r.estado === 'No adjudicado'
                      ? 'border-red-500/20 bg-red-500/10 text-red-400'
                      : r.estado === 'Activa'
                      ? 'border-yellow-500/20 bg-yellow-500/10 text-yellow-400'
                      : 'border-stone-500/20 bg-stone-500/10 text-stone-400'
                  }`}>
                    {r.estado}
                  </span>
                </td>
                <td className="px-4 py-3 text-stone-300">{r.ganador}</td>
                <td className="px-4 py-3 text-right tabular-nums text-stone-300">{r.comision > 0 ? formatCLP(r.comision) : '-'}</td>
                <td className="px-4 py-3 text-center">
                  <Link
                    href={`/admin/subastas/${r.auctionId}`}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-stone-400 transition-colors hover:bg-stone-700 hover:text-stone-200"
                  >
                    <Eye size={14} /> Ver
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={11} className="px-4 py-12 text-center text-stone-500">
                  No se encontraron subastas con los filtros aplicados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
