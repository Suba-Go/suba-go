'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { FileSpreadsheet, Download, BarChart3, TrendingUp, Calendar, Filter } from 'lucide-react';

function formatCLP(n: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}

type ReportType = 'adjudicaciones' | 'ingresos' | 'usuarios' | 'sin-pujas';

interface ReportConfig {
  id: ReportType;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const REPORT_CONFIGS: ReportConfig[] = [
  { id: 'adjudicaciones', title: 'Adjudicaciones mensuales', description: 'Detalle de todos los autos adjudicados por mes', icon: <BarChart3 size={20} />, color: 'text-green-400 bg-green-500/10' },
  { id: 'ingresos', title: 'Ingresos por cliente', description: 'Facturación y comisiones agrupadas por automotora', icon: <TrendingUp size={20} />, color: 'text-blue-400 bg-blue-500/10' },
  { id: 'usuarios', title: 'Usuarios activos', description: 'Usuarios que participaron en subastas con detalle de actividad', icon: <Calendar size={20} />, color: 'text-purple-400 bg-purple-500/10' },
  { id: 'sin-pujas', title: 'Subastas sin pujas', description: 'Subastas e ítems que no recibieron ninguna oferta', icon: <Filter size={20} />, color: 'text-amber-400 bg-amber-500/10' },
];

export default function AdminReportesPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState<ReportType>('adjudicaciones');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const report = useMemo(() => {
    if (!data) return { headers: [] as string[], rows: [] as any[] };

    const auctions = data.auctions || [];
    const items = data.items || [];
    const soldItems = data.soldItems || [];
    const users = data.users || [];
    const companies = data.companies || [];
    const bids = data.bids || [];

    const filter = (d: string) => {
      const date = new Date(d);
      if (dateFrom && date < new Date(dateFrom)) return false;
      if (dateTo && date > new Date(dateTo + 'T23:59:59')) return false;
      return true;
    };

    switch (activeReport) {
      case 'adjudicaciones': {
        const filteredSold = soldItems.filter((i: any) => filter(i.updatedAt || i.createdAt));
        const rows = filteredSold.map((item: any) => {
          const company = companies.find((c: any) => c.tenantId === item._tenantId);
          const commission = Math.round((item.soldPrice || 0) * 0.02);
          return {
            fecha: formatDate(item.updatedAt || item.createdAt),
            automotora: company?.name || '-',
            auto: `${item.brand} ${item.model} ${item.year}`,
            precioBase: formatCLP(item.basePrice || 0),
            precioVenta: formatCLP(item.soldPrice || 0),
            comision: formatCLP(commission),
          };
        });
        return { headers: ['Fecha', 'Automotora', 'Auto', 'Precio base', 'Precio venta', 'Comisión'], rows };
      }

      case 'ingresos': {
        const rows = companies.map((c: any) => {
          const cSold = soldItems.filter((i: any) => i._tenantId === c.tenantId && filter(i.updatedAt || i.createdAt));
          const totalVentas = cSold.reduce((a: number, i: any) => a + (i.soldPrice || 0), 0);
          const totalComision = cSold.reduce((a: number, i: any) => a + Math.round((i.soldPrice || 0) * 0.02), 0);
          return {
            automotora: c.name,
            autosAdjudicados: cSold.length,
            totalVentas: formatCLP(totalVentas),
            comisionTotal: formatCLP(totalComision),
            promedioVenta: cSold.length ? formatCLP(Math.round(totalVentas / cSold.length)) : '-',
          };
        });
        return { headers: ['Automotora', 'Autos adj.', 'Total ventas', 'Comisión total', 'Promedio venta'], rows };
      }

      case 'usuarios': {
        const rows = users.filter((u: any) => {
          const uBids = bids.filter((b: any) => b.userId === u.id);
          return uBids.length > 0;
        }).map((u: any) => {
          const uBids = bids.filter((b: any) => b.userId === u.id);
          const wonItems = soldItems.filter((i: any) => i.winnerId === u.id);
          return {
            nombre: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
            email: u.email,
            totalPujas: uBids.length,
            subastasParticipadas: new Set(uBids.map((b: any) => b.auctionId)).size,
            autosGanados: wonItems.length,
            ultimaPuja: uBids.length ? formatDate(uBids[uBids.length - 1].createdAt) : '-',
          };
        });
        return { headers: ['Nombre', 'Email', 'Total pujas', 'Subastas', 'Autos ganados', 'Última puja'], rows };
      }

      case 'sin-pujas': {
        const noBidItems = items.filter((item: any) => {
          const itemBids = bids.filter((b: any) => b.itemId === item.id);
          return itemBids.length === 0 && filter(item.createdAt);
        });
        const rows = noBidItems.map((item: any) => {
          const company = companies.find((c: any) => c.tenantId === item._tenantId);
          const auction = auctions.find((a: any) => a.id === item.auctionId);
          return {
            auto: `${item.brand} ${item.model} ${item.year}`,
            automotora: company?.name || '-',
            subasta: auction?.title || '-',
            precioBase: formatCLP(item.basePrice || 0),
            estado: auction?.status || '-',
          };
        });
        return { headers: ['Auto', 'Automotora', 'Subasta', 'Precio base', 'Estado subasta'], rows };
      }

      default:
        return { headers: [], rows: [] };
    }
  }, [data, activeReport, dateFrom, dateTo]);

  const downloadCSV = useCallback(() => {
    const { headers, rows } = report;
    if (!rows.length) return;
    const keys = Object.keys(rows[0]);
    const csv = [headers.join(','), ...rows.map((r: any) => keys.map((k) => `"${r[k]}"`).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-${activeReport}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [report, activeReport]);

  const downloadExcel = useCallback(() => {
    // Simple XLSX-like HTML table export (opens in Excel)
    const { headers, rows } = report;
    if (!rows.length) return;
    const keys = Object.keys(rows[0]);
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:spreadsheet"><head><meta charset="UTF-8"></head><body><table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r: any) => `<tr>${keys.map((k) => `<td>${r[k]}</td>`).join('')}</tr>`).join('')}</tbody></table></body></html>`;
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-${activeReport}-${new Date().toISOString().slice(0, 10)}.xls`;
    a.click();
    URL.revokeObjectURL(url);
  }, [report, activeReport]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Reportes</h1>
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (<div key={i} className="h-24 rounded-lg bg-stone-800/50" />))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reportes</h1>
        <p className="text-sm text-stone-400">Genera y exporta reportes detallados</p>
      </div>

      {/* Report type selector */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {REPORT_CONFIGS.map((rc) => (
          <button
            key={rc.id}
            onClick={() => setActiveReport(rc.id)}
            className={`group rounded-xl border p-4 text-left transition-all ${
              activeReport === rc.id
                ? 'border-yellow-500/30 bg-yellow-500/5'
                : 'border-stone-800 bg-stone-900/50 hover:border-stone-700'
            }`}
          >
            <div className={`mb-2 inline-flex rounded-lg p-2 ${rc.color}`}>{rc.icon}</div>
            <h3 className="text-sm font-medium text-stone-200">{rc.title}</h3>
            <p className="mt-0.5 text-xs text-stone-500">{rc.description}</p>
          </button>
        ))}
      </div>

      {/* Date filter + export */}
      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-stone-800 bg-stone-900/50 p-4">
        <div>
          <label className="mb-1 block text-xs text-stone-500">Desde</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-lg border border-stone-700 bg-stone-800/50 px-3 py-1.5 text-sm text-stone-200 focus:border-yellow-500/50 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-stone-500">Hasta</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-lg border border-stone-700 bg-stone-800/50 px-3 py-1.5 text-sm text-stone-200 focus:border-yellow-500/50 focus:outline-none" />
        </div>
        <div className="ml-auto flex gap-2">
          <button onClick={downloadCSV} className="inline-flex items-center gap-1.5 rounded-lg border border-stone-700 px-3 py-1.5 text-sm text-stone-300 hover:bg-stone-800">
            <Download size={14} /> CSV
          </button>
          <button onClick={downloadExcel} className="inline-flex items-center gap-1.5 rounded-lg bg-yellow-500 px-3 py-1.5 text-sm font-medium text-stone-900 hover:bg-yellow-400">
            <FileSpreadsheet size={14} /> Excel
          </button>
        </div>
      </div>

      {/* Report table */}
      <div className="overflow-x-auto rounded-xl border border-stone-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-800 bg-stone-900/80">
              {report.headers.map((h: string, i: number) => (
                <th key={i} className="px-4 py-3 text-left font-medium text-stone-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800/50">
            {report.rows.map((row: any, i: number) => {
              const keys = Object.keys(row);
              return (
                <tr key={i} className="transition-colors hover:bg-stone-800/30">
                  {keys.map((k, j) => (
                    <td key={j} className="whitespace-nowrap px-4 py-3 text-stone-300">{row[k]}</td>
                  ))}
                </tr>
              );
            })}
            {report.rows.length === 0 && (
              <tr><td colSpan={report.headers.length || 1} className="px-4 py-12 text-center text-stone-500">Sin datos para este reporte</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-stone-600">{report.rows.length} filas · Generado el {new Date().toLocaleDateString('es-CL')}</p>
    </div>
  );
}
