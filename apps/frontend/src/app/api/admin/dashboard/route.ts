import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import superjson from 'superjson';

export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

function parseSuperjson(data: any): any {
  if (data && data.superjson) {
    return superjson.deserialize(data.superjson);
  }
  return data;
}

async function fetchBackend(path: string, token: string) {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return parseSuperjson(await res.json());
}

export async function GET() {
  const session = await auth();
  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const token = session.tokens.accessToken;

  try {
    // Fetch all tenants, then for each tenant get auctions, items, users
    const tenantsRes = await fetch(`${BACKEND_URL}/tenants`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const tenants: any[] = tenantsRes.ok ? parseSuperjson(await tenantsRes.json()) : [];

    const allAuctions: any[] = [];
    const allItems: any[] = [];
    const allUsers: any[] = [];
    const allBids: any[] = [];
    const allCompanies: any[] = [];

    for (const tenant of tenants) {
      const [auctions, items, companies] = await Promise.all([
        fetchBackend(`/auctions/tenant/${tenant.id}`, token),
        fetchBackend(`/items/tenant/${tenant.id}`, token),
        fetchBackend(`/companies/tenant/${tenant.id}`, token),
      ]);

      if (auctions) {
        for (const a of auctions) {
          a._tenantId = tenant.id;
          allAuctions.push(a);

          // Fetch bids for each auction
          const bids = await fetchBackend(`/bids/auction/${a.id}`, token);
          if (bids) {
            allBids.push(...bids.map((b: any) => ({ ...b, _auctionTitle: a.title })));
          }
        }
      }
      if (items) allItems.push(...items.map((i: any) => ({ ...i, _tenantId: tenant.id })));
      if (companies) {
        const companyList = Array.isArray(companies) ? companies : [companies];
        allCompanies.push(...companyList.map((c: any) => ({ ...c, _tenantId: tenant.id })));

        // Fetch users by company id (correct endpoint: /users/company/:companyId)
        for (const company of companyList) {
          const users = await fetchBackend(`/users/company/${company.id}`, token);
          if (users) {
            allUsers.push(...(Array.isArray(users) ? users : [users]).map((u: any) => ({ ...u, _tenantId: tenant.id })));
          }
        }
      }
    }

    // Compute metrics
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const soldItems = allItems.filter((i: any) => i.state === 'VENDIDO');
    const soldThisMonth = soldItems.filter((i: any) => i.soldAt && new Date(i.soldAt) >= monthStart);
    const auctionedThisMonth = allItems.filter(
      (i: any) => (i.state === 'EN_SUBASTA' || i.state === 'VENDIDO') && new Date(i.createdAt) >= monthStart
    );

    const comisionRate = 0.02; // 2% comisin por auto adjudicado
    const ingresoEstimado = soldItems.reduce((acc: number, i: any) => acc + (i.soldPrice || 0) * comisionRate, 0);
    const ingresoMes = soldThisMonth.reduce((acc: number, i: any) => acc + (i.soldPrice || 0) * comisionRate, 0);

    const usersWithBids = new Set(allBids.map((b: any) => b.userId));

    const activeCompanies = allCompanies.filter((c: any) => !c.isDeleted);

    const adjudicationRate = auctionedThisMonth.length > 0
      ? Math.round((soldThisMonth.length / auctionedThisMonth.length) * 100)
      : 0;

    // Auctions by day (last 30 days)
    const auctionsByDay: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      auctionsByDay[key] = 0;
    }
    allAuctions.forEach((a: any) => {
      const key = new Date(a.startTime).toISOString().slice(0, 10);
      if (auctionsByDay[key] !== undefined) auctionsByDay[key]++;
    });

    // Adjudicaciones por semana (last 12 weeks)
    const adjByWeek: Record<string, number> = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      const weekKey = `S${d.toISOString().slice(0, 10)}`;
      adjByWeek[weekKey] = 0;
    }
    soldItems.forEach((item: any) => {
      if (!item.soldAt) return;
      const soldDate = new Date(item.soldAt);
      const diffDays = Math.floor((now.getTime() - soldDate.getTime()) / (86400000));
      const weekIdx = Math.floor(diffDays / 7);
      if (weekIdx < 12) {
        const d = new Date(now);
        d.setDate(d.getDate() - weekIdx * 7);
        const weekKey = `S${d.toISOString().slice(0, 10)}`;
        if (adjByWeek[weekKey] !== undefined) adjByWeek[weekKey]++;
      }
    });

    return NextResponse.json({
      metrics: {
        totalAuctionedMonth: auctionedThisMonth.length,
        totalSold: soldItems.length,
        totalSoldMonth: soldThisMonth.length,
        adjudicationRate,
        ingresoEstimado: Math.round(ingresoEstimado),
        ingresoMes: Math.round(ingresoMes),
        activeCompanies: activeCompanies.length,
        usersWithBids: usersWithBids.size,
        totalAuctions: allAuctions.length,
        totalItems: allItems.length,
        totalUsers: allUsers.length,
      },
      charts: {
        auctionsByDay: Object.entries(auctionsByDay).map(([date, count]) => ({ date, count })),
        adjByWeek: Object.entries(adjByWeek).map(([week, count]) => ({ week: week.slice(1), count })),
      },
      auctions: allAuctions,
      items: allItems,
      users: allUsers,
      bids: allBids,
      companies: allCompanies,
      soldItems,
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
