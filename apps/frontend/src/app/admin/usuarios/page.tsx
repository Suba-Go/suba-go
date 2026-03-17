'use client';

import { useEffect, useState, useMemo } from 'react';
import { Search, Download, Eye, X, User as UserIcon } from 'lucide-react';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}

function exportCSV(data: any[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csv = [headers.join(','), ...data.map((r) => headers.map((h) => `"${r[h] ?? ''}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
}

export default function AdminUsuariosPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const rows = useMemo(() => {
    if (!data) return [];
    const users = data.users || [];
    const bids = data.bids || [];
    const soldItems = data.soldItems || [];

    return users
      .filter((u: any) => u.role === 'USER')
      .map((u: any) => {
        const userBids = bids.filter((b: any) => b.userId === u.id);
        const auctionIds = new Set(userBids.map((b: any) => b.auctionId));
        const wonItems = soldItems.filter((i: any) => i.soldToUserId === u.id);
        return {
          id: u.id,
          name: u.name || '-',
          rut: u.rut || '-',
          email: u.email,
          phone: u.phone || '-',
          public_name: u.public_name || '-',
          pujas: userBids.length,
          subastasParticipadas: auctionIds.size,
          subastasGanadas: wonItems.length,
          registrado: u.createdAt,
          bids: userBids,
          wonItems,
        };
      })
      .sort((a: any, b: any) => b.pujas - a.pujas);
  }, [data]);

  const filtered = useMemo(() => {
    if (!search) return rows;
    const s = search.toLowerCase();
    return rows.filter((r: any) =>
      r.name.toLowerCase().includes(s) ||
      r.email.toLowerCase().includes(s) ||
      r.rut.toLowerCase().includes(s) ||
      r.phone.includes(s)
    );
  }, [rows, search]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Usuarios que ofertaron</h1>
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (<div key={i} className="h-12 rounded-lg bg-stone-800/50" />))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usuarios que ofertaron</h1>
          <p className="text-sm text-stone-400">{filtered.length} usuarios</p>
        </div>
        <button
          onClick={() => exportCSV(
            filtered.map((r: any) => ({
              Nombre: r.name, RUT: r.rut, Email: r.email, Teléfono: r.phone,
              Pujas: r.pujas, 'Subastas Participadas': r.subastasParticipadas,
              'Subastas Ganadas': r.subastasGanadas, 'Fecha Registro': formatDate(r.registrado),
            })),
            'usuarios.csv'
          )}
          className="flex items-center gap-2 rounded-lg border border-stone-700 bg-stone-800 px-4 py-2 text-sm font-medium text-stone-200 hover:bg-stone-700"
        >
          <Download size={16} /> Exportar
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
        <input
          type="text"
          placeholder="Buscar por nombre, email, RUT, teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-stone-700 bg-stone-800/50 py-2 pl-9 pr-3 text-sm text-stone-200 placeholder-stone-500 focus:border-yellow-500/50 focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-stone-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-800 bg-stone-900/80">
              <th className="px-4 py-3 text-left font-medium text-stone-400">Nombre</th>
              <th className="px-4 py-3 text-left font-medium text-stone-400">RUT</th>
              <th className="px-4 py-3 text-left font-medium text-stone-400">Email</th>
              <th className="px-4 py-3 text-left font-medium text-stone-400">Teléfono</th>
              <th className="px-4 py-3 text-center font-medium text-stone-400">Pujas</th>
              <th className="px-4 py-3 text-center font-medium text-stone-400">Subastas</th>
              <th className="px-4 py-3 text-center font-medium text-stone-400">Ganadas</th>
              <th className="px-4 py-3 text-left font-medium text-stone-400">Registro</th>
              <th className="px-4 py-3 text-center font-medium text-stone-400">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800/50">
            {filtered.map((r: any) => (
              <>
                <tr key={r.id} className="transition-colors hover:bg-stone-800/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-700 text-xs font-medium">
                        {r.name[0]?.toUpperCase() || '?'}
                      </div>
                      <span className="text-stone-200">{r.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-stone-400">{r.rut}</td>
                  <td className="px-4 py-3 text-stone-300">{r.email}</td>
                  <td className="px-4 py-3 text-stone-300">{r.phone}</td>
                  <td className="px-4 py-3 text-center tabular-nums font-medium text-stone-200">{r.pujas}</td>
                  <td className="px-4 py-3 text-center tabular-nums text-stone-300">{r.subastasParticipadas}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`tabular-nums font-medium ${r.subastasGanadas > 0 ? 'text-green-400' : 'text-stone-500'}`}>
                      {r.subastasGanadas}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone-400">{formatDate(r.registrado)}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setExpandedUser(expandedUser === r.id ? null : r.id)}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-stone-400 transition-colors hover:bg-stone-700 hover:text-stone-200"
                    >
                      <Eye size={14} /> {expandedUser === r.id ? 'Cerrar' : 'Detalle'}
                    </button>
                  </td>
                </tr>
                {expandedUser === r.id && (
                  <tr key={`${r.id}-detail`}>
                    <td colSpan={9} className="bg-stone-900/30 px-6 py-4">
                      <div className="grid gap-6 lg:grid-cols-2">
                        <div>
                          <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-stone-500">Últimas pujas</h4>
                          <div className="space-y-1.5">
                            {r.bids.slice(0, 5).map((b: any, i: number) => (
                              <div key={i} className="flex items-center justify-between rounded-md bg-stone-800/50 px-3 py-1.5 text-xs">
                                <span className="text-stone-400">{formatDate(b.bid_time)}</span>
                                <span className="font-medium tabular-nums text-stone-200">
                                  {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(b.offered_price)}
                                </span>
                              </div>
                            ))}
                            {r.bids.length === 0 && <p className="text-xs text-stone-500">Sin pujas</p>}
                          </div>
                        </div>
                        <div>
                          <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-stone-500">Autos ganados</h4>
                          <div className="space-y-1.5">
                            {r.wonItems.map((item: any, i: number) => (
                              <div key={i} className="flex items-center justify-between rounded-md bg-stone-800/50 px-3 py-1.5 text-xs">
                                <span className="text-stone-200">{item.brand} {item.model}</span>
                                <span className="font-medium tabular-nums text-green-400">
                                  {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(item.soldPrice || 0)}
                                </span>
                              </div>
                            ))}
                            {r.wonItems.length === 0 && <p className="text-xs text-stone-500">Sin autos ganados</p>}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-stone-500">
                  No se encontraron usuarios
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
