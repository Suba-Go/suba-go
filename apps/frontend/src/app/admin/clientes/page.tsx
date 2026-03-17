'use client';

import { useEffect, useState, useMemo } from 'react';
import { Building2, Search, Eye, X } from 'lucide-react';

function formatCLP(n: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AdminClientesPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedClient, setExpandedClient] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const rows = useMemo(() => {
    if (!data) return [];
    const companies = data.companies || [];
    const items = data.items || [];
    const auctions = data.auctions || [];
    const soldItems = data.soldItems || [];

    return companies.map((c: any) => {
      const companyItems = items.filter((i: any) => i._tenantId === c.tenantId);
      const companySold = soldItems.filter((i: any) => i._tenantId === c.tenantId);
      const companyAuctions = auctions.filter((a: any) => a._tenantId === c.tenantId);
      const factTotal = companySold.reduce((acc: number, i: any) => acc + Math.round((i.soldPrice || 0) * 0.02), 0);
      const factPendiente = Math.round(factTotal * 0.4); // Simulate pendiente

      return {
        id: c.id,
        name: c.name,
        tenantId: c.tenantId,
        autosPublicados: companyItems.length,
        autosAdjudicados: companySold.length,
        factTotal,
        factPendiente,
        auctions: companyAuctions,
        soldItems: companySold,
        createdAt: c.createdAt,
      };
    });
  }, [data]);

  const filtered = useMemo(() => {
    if (!search) return rows;
    return rows.filter((r: any) => r.name.toLowerCase().includes(search.toLowerCase()));
  }, [rows, search]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Clientes (Automotoras)</h1>
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (<div key={i} className="h-16 rounded-lg bg-stone-800/50" />))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Clientes (Automotoras)</h1>
        <p className="text-sm text-stone-400">{filtered.length} automotoras registradas</p>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
        <input
          type="text"
          placeholder="Buscar automotora..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-stone-700 bg-stone-800/50 py-2 pl-9 pr-3 text-sm text-stone-200 placeholder-stone-500 focus:border-yellow-500/50 focus:outline-none"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-stone-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-800 bg-stone-900/80">
              <th className="px-4 py-3 text-left font-medium text-stone-400">Automotora</th>
              <th className="px-4 py-3 text-center font-medium text-stone-400">Autos publicados</th>
              <th className="px-4 py-3 text-center font-medium text-stone-400">Adjudicados</th>
              <th className="px-4 py-3 text-right font-medium text-stone-400">Facturación acumulada</th>
              <th className="px-4 py-3 text-right font-medium text-stone-400">Facturación pendiente</th>
              <th className="px-4 py-3 text-center font-medium text-stone-400">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800/50">
            {filtered.map((r: any) => (
              <>
                <tr key={r.id} className="transition-colors hover:bg-stone-800/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                        <Building2 size={16} />
                      </div>
                      <span className="font-medium text-stone-200">{r.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums text-stone-300">{r.autosPublicados}</td>
                  <td className="px-4 py-3 text-center tabular-nums font-medium text-green-400">{r.autosAdjudicados}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-stone-200">{formatCLP(r.factTotal)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-yellow-400">{formatCLP(r.factPendiente)}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setExpandedClient(expandedClient === r.id ? null : r.id)}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-stone-400 hover:bg-stone-700 hover:text-stone-200"
                    >
                      <Eye size={14} /> {expandedClient === r.id ? 'Cerrar' : 'Detalle'}
                    </button>
                  </td>
                </tr>
                {expandedClient === r.id && (
                  <tr key={`${r.id}-detail`}>
                    <td colSpan={6} className="bg-stone-900/30 px-6 py-4">
                      <div className="grid gap-6 lg:grid-cols-2">
                        <div>
                          <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-stone-500">Historial de subastas</h4>
                          <div className="space-y-1.5">
                            {r.auctions.slice(0, 5).map((a: any) => (
                              <div key={a.id} className="flex items-center justify-between rounded-md bg-stone-800/50 px-3 py-1.5 text-xs">
                                <span className="text-stone-200">{a.title}</span>
                                <span className={`rounded-full px-2 py-0.5 ${
                                  a.status === 'COMPLETADA' ? 'bg-blue-500/10 text-blue-400'
                                  : a.status === 'ACTIVA' ? 'bg-green-500/10 text-green-400'
                                  : 'bg-stone-700/50 text-stone-400'
                                }`}>{a.status}</span>
                              </div>
                            ))}
                            {r.auctions.length === 0 && <p className="text-xs text-stone-500">Sin subastas</p>}
                          </div>
                        </div>
                        <div>
                          <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-stone-500">Autos vendidos</h4>
                          <div className="space-y-1.5">
                            {r.soldItems.map((item: any, i: number) => (
                              <div key={i} className="flex items-center justify-between rounded-md bg-stone-800/50 px-3 py-1.5 text-xs">
                                <span className="text-stone-200">{item.brand} {item.model}</span>
                                <span className="font-medium tabular-nums text-green-400">{formatCLP(item.soldPrice || 0)}</span>
                              </div>
                            ))}
                            {r.soldItems.length === 0 && <p className="text-xs text-stone-500">Sin ventas</p>}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 rounded-lg bg-yellow-500/5 border border-yellow-500/10 px-4 py-3">
                        <p className="text-xs text-stone-400">Total a cobrar: <span className="font-bold text-yellow-400">{formatCLP(r.factTotal)}</span></p>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-stone-500">No se encontraron automotoras</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
