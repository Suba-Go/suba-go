'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Car, Clock, User as UserIcon, DollarSign, Trophy } from 'lucide-react';

type DashboardUser = {
  id: string;
  name?: string | null;
  email?: string | null;
};

function formatCLP(n: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleString('es-CL', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminSubastaDetallePage() {
  const { auctionId } = useParams<{ auctionId: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then((r) => r.json())
      .then((d) => {
        const auction = d.auctions?.find((a: any) => a.id === auctionId);
        const company = d.companies?.find((c: any) => c.tenantId === auction?._tenantId);
        const auctionBids = d.bids?.filter((b: any) => b.auctionId === auctionId) || [];
        const users = d.users || [];
        setData({ auction, company, bids: auctionBids, users });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [auctionId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-stone-800" />
        <div className="h-64 animate-pulse rounded-xl bg-stone-800/50" />
      </div>
    );
  }

  if (!data?.auction) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <p className="text-stone-400">Subasta no encontrada</p>
        <Link href="/admin/subastas" className="text-sm text-yellow-500 hover:underline">
          Volver a subastas
        </Link>
      </div>
    );
  }

  const { auction, company, bids, users } = data;
  const auctionItems = auction.items || [];
  const userMap = new Map<string, DashboardUser>(
    users.map((u: any) => [u.id as string, u as DashboardUser])
  );

  // Find winner for each item
  const itemResults = auctionItems.map((ai: any) => {
    const item = ai.item;
    const itemBids = bids
      .filter((b: any) => b.auctionItemId === ai.id)
      .sort((a: any, b: any) => b.offered_price - a.offered_price);
    const winner = itemBids[0] ? userMap.get(itemBids[0].userId) : null;
    const sold = item?.state === 'VENDIDO';
    return { ...ai, itemBids, winner, sold, finalPrice: sold ? item.soldPrice || itemBids[0]?.offered_price : itemBids[0]?.offered_price || 0 };
  });

  const allBidsSorted = bids.sort((a: any, b: any) => new Date(b.bid_time).getTime() - new Date(a.bid_time).getTime());

  return (
    <div className="space-y-8">
      {/* Back */}
      <Link href="/admin/subastas" className="inline-flex items-center gap-2 text-sm text-stone-400 hover:text-stone-200">
        <ArrowLeft size={16} /> Volver a subastas
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{auction.title}</h1>
          <p className="text-sm text-stone-400">{auction.description}</p>
          <div className="mt-2 flex items-center gap-3 text-xs text-stone-500">
            <span>{company?.name || 'Sin empresa'}</span>
            <span>•</span>
            <span>{formatDateTime(auction.startTime)} — {formatDateTime(auction.endTime)}</span>
          </div>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${
          auction.status === 'ACTIVA' ? 'border-green-500/20 bg-green-500/10 text-green-400'
          : auction.status === 'COMPLETADA' ? 'border-blue-500/20 bg-blue-500/10 text-blue-400'
          : auction.status === 'PENDIENTE' ? 'border-yellow-500/20 bg-yellow-500/10 text-yellow-400'
          : 'border-stone-500/20 bg-stone-500/10 text-stone-400'
        }`}>
          {auction.status}
        </span>
      </div>

      {/* Items in this auction */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Autos en esta subasta ({auctionItems.length})</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {itemResults.map((ai: any) => (
            <div key={ai.id} className="rounded-xl border border-stone-800 bg-stone-900/50 p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-stone-100">
                    {ai.item?.brand} {ai.item?.model || ''}
                  </p>
                  <p className="text-xs text-stone-500">
                    {ai.item?.year} • {ai.item?.plate}
                  </p>
                </div>
                {ai.sold ? (
                  <Trophy size={18} className="text-yellow-500" />
                ) : (
                  <Car size={18} className="text-stone-600" />
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-stone-500">Precio base</p>
                  <p className="font-medium text-stone-300">{formatCLP(ai.item?.basePrice || ai.startingBid)}</p>
                </div>
                <div>
                  <p className="text-stone-500">Precio final</p>
                  <p className="font-medium text-stone-100">{ai.finalPrice > 0 ? formatCLP(ai.finalPrice) : '-'}</p>
                </div>
                <div>
                  <p className="text-stone-500">Pujas</p>
                  <p className="font-medium text-stone-300">{ai.itemBids.length}</p>
                </div>
                <div>
                  <p className="text-stone-500">Ganador</p>
                  <p className="font-medium text-stone-300">{ai.winner?.name || ai.winner?.email || '-'}</p>
                </div>
              </div>
              {ai.sold && (
                <div className="rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-400 text-center">
                  Adjudicado
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bid history */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Historial de pujas ({allBidsSorted.length})</h2>
        <div className="overflow-x-auto rounded-xl border border-stone-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-800 bg-stone-900/80">
                <th className="px-4 py-3 text-left font-medium text-stone-400">Hora</th>
                <th className="px-4 py-3 text-left font-medium text-stone-400">Usuario</th>
                <th className="px-4 py-3 text-right font-medium text-stone-400">Monto ofertado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/50">
              {allBidsSorted.map((bid: any, i: number) => {
                const user = userMap.get(bid.userId);
                return (
                  <tr key={bid.id || i} className="transition-colors hover:bg-stone-800/30">
                    <td className="px-4 py-3 text-stone-300">{formatDateTime(bid.bid_time)}</td>
                    <td className="px-4 py-3 text-stone-200">{user?.name || user?.email || bid.userId.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-stone-100">{formatCLP(bid.offered_price)}</td>
                  </tr>
                );
              })}
              {allBidsSorted.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-stone-500">
                    No hay pujas registradas en esta subasta
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
