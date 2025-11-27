'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@suba-go/shared-components/components/ui/card';
import { Button } from '@suba-go/shared-components/components/ui/button';
import { Spinner } from '@suba-go/shared-components/components/ui/spinner';
import { useToast } from '@suba-go/shared-components/components/ui/toaster';

type AuctionItem = {
  id: string;
  startingBid?: number | null;
  bids?: Array<{ offered_price: number }>;
  item?: { soldPrice?: number | null };
};

type Auction = {
  id: string;
  title: string;
  status: 'PENDIENTE' | 'ACTIVA' | 'CANCELADA' | 'COMPLETADA' | 'ELIMINADA';
  startTime: string;
  endTime: string;
  items?: AuctionItem[];
};

type Stats = {
  totalAuctions: number;
  activeAuctions: number;
  totalParticipants: number;
  totalRevenue: number;
};

export default function ManagerStatsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [auctions, setAuctions] = useState<Auction[]>([]);

  const activeVsTotalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const revenuePerAuctionCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [statsRes, auctionsRes] = await Promise.all([
          fetch('/api/auctions/stats'),
          fetch('/api/auctions'),
        ]);
        const statsData = await statsRes.json();
        const auctionsData = await auctionsRes.json();
        if (!statsRes.ok) {
          toast({ title: 'Error', description: statsData?.error || 'No se pudo obtener estadísticas' });
        } else {
          setStats(statsData as Stats);
        }
        if (!auctionsRes.ok) {
          toast({ title: 'Error', description: auctionsData?.error || 'No se pudieron obtener las subastas' });
        } else {
          setAuctions(Array.isArray(auctionsData) ? auctionsData as Auction[] : []);
        }
      } catch {
        toast({ title: 'Error', description: 'Error al cargar datos' });
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const computed = useMemo(() => {
    const completed = auctions.filter((a) => a.status === 'COMPLETADA');
    const revenueByAuction = completed.map((a) => {
      const sum = (a.items || []).reduce((acc, it) => acc + (Number(it.item?.soldPrice) || 0), 0);
      return { id: a.id, title: a.title, revenue: sum };
    });
    const topRevenue = [...revenueByAuction].sort((a, b) => b.revenue - a.revenue).slice(0, 10);
    const statusCounts = {
      PENDIENTE: auctions.filter((a) => a.status === 'PENDIENTE').length,
      ACTIVA: auctions.filter((a) => a.status === 'ACTIVA').length,
      CANCELADA: auctions.filter((a) => a.status === 'CANCELADA').length,
      COMPLETADA: auctions.filter((a) => a.status === 'COMPLETADA').length,
    };
    return { revenueByAuction, topRevenue, statusCounts };
  }, [auctions]);

  useEffect(() => {
    const canvas = activeVsTotalCanvasRef.current;
    if (!canvas || !stats) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const total = stats.totalAuctions || 0;
    const active = stats.activeAuctions || 0;
    const pending = computed.statusCounts.PENDIENTE || 0;
    const completed = computed.statusCounts.COMPLETADA || 0;
    const canceled = computed.statusCounts.CANCELADA || 0;
    const labels = ['Activas', 'Pendientes', 'Completadas', 'Canceladas'];
    const values = [active, pending, completed, canceled];
    const maxVal = Math.max(1, ...values);
    const barW = Math.floor((w - 80) / values.length);
    ctx.fillStyle = '#374151';
    ctx.font = '12px sans-serif';
    ctx.fillText(`Total: ${total}`, 10, 20);
    values.forEach((v, i) => {
      const barH = Math.round((h - 60) * (v / maxVal));
      const x = 40 + i * barW;
      const y = h - 40 - barH;
      const color = ['#2563eb', '#6b7280', '#10b981', '#ef4444'][i];
      ctx.fillStyle = color;
      ctx.fillRect(x, y, barW - 12, barH);
      ctx.fillStyle = '#111827';
      ctx.fillText(labels[i], x, h - 20);
      ctx.fillText(String(v), x, y - 6);
    });
  }, [stats, computed]);

  useEffect(() => {
    const canvas = revenuePerAuctionCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const data = computed.topRevenue;
    const maxVal = Math.max(1, ...data.map((d) => d.revenue));
    const barW = Math.floor((w - 80) / Math.max(1, data.length));
    ctx.fillStyle = '#374151';
    ctx.font = '12px sans-serif';
    data.forEach((d, i) => {
      const barH = Math.round((h - 60) * (d.revenue / maxVal));
      const x = 40 + i * barW;
      const y = h - 40 - barH;
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(x, y, barW - 12, barH);
      ctx.fillStyle = '#111827';
      const label = d.title.length > 10 ? d.title.slice(0, 10) + '…' : d.title;
      ctx.fillText(label, x, h - 20);
      ctx.fillText(`$${Math.round(d.revenue).toLocaleString('es-CL')}`, x, y - 6);
    });
  }, [computed]);

  const downloadCanvas = (ref: React.RefObject<HTMLCanvasElement>, name: string) => {
    const canvas = ref.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.png`;
    a.click();
  };

  const downloadCSV = () => {
    const headers = ['auction_id', 'title', 'status', 'items_count', 'revenue'];
    const rows = auctions.map((a) => {
      const revenue = (a.items || []).reduce((acc, it) => acc + (Number(it.item?.soldPrice) || 0), 0);
      return [a.id, a.title, a.status, String(a.items?.length || 0), String(revenue)];
    });
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'estadisticas_subastas.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold">Estadísticas de Subastas</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total subastas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.totalAuctions ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Activas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.activeAuctions ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Participantes únicos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.totalParticipants ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ingresos totales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${Math.round(stats?.totalRevenue || 0).toLocaleString('es-CL')}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Distribución por estado</CardTitle>
          <Button onClick={() => downloadCanvas(activeVsTotalCanvasRef, 'distribucion_estado')}>Exportar PNG</Button>
        </CardHeader>
        <CardContent>
          <canvas ref={activeVsTotalCanvasRef} width={900} height={300} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Top ingresos por subasta</CardTitle>
          <Button onClick={() => downloadCanvas(revenuePerAuctionCanvasRef, 'ingresos_por_subasta')}>Exportar PNG</Button>
        </CardHeader>
        <CardContent>
          <canvas ref={revenuePerAuctionCanvasRef} width={900} height={300} />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="outline" onClick={downloadCSV}>Exportar CSV</Button>
      </div>
    </div>
  );
}

