'use client';

import { useState } from 'react';
import { Plus, Calendar, Users, TrendingUp } from 'lucide-react';
import { Button } from '@suba-go/shared-components/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@suba-go/shared-components/components/ui/card';
import { AuctionCreateModal } from './auction-create-modal';
import { AuctionEditModal } from './auction-edit-modal';
import { AuctionCard } from './auction-card';
import { useFetchData } from '@/hooks/use-fetch-data';
import { AuctionDto } from '@suba-go/shared-validation';

interface AuctionDashboardProps {
  subdomain: string;
}

export function AuctionDashboard({ subdomain }: AuctionDashboardProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState<AuctionDto | null>(
    null
  );

  // Fetch auctions data
  const {
    data: auctions,
    isLoading,
    error,
    refetch,
  } = useFetchData<AuctionDto[]>({
    url: `/api/auctions`,
    key: ['auctions', subdomain],
  });

  // Fetch dashboard stats
  const { data: stats } = useFetchData<{
    totalAuctions: number;
    activeAuctions: number;
    totalParticipants: number;
    totalRevenue: number;
  }>({
    url: `/api/auctions/stats`,
    key: ['auction-stats', subdomain],
  });

  const handleAuctionCreated = () => {
    refetch();
    setIsCreateModalOpen(false);
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error al cargar las subastas</p>
        <Button onClick={() => refetch()} className="mt-4">
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Subastas
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalAuctions || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Subastas Activas
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.activeAuctions || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participantes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalParticipants || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingresos Totales
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats?.totalRevenue?.toLocaleString('es-CL') || '0'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Subastas</h2>
          <p className="text-gray-600">
            Gestiona todas las subastas de tu empresa
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nueva Subasta
        </Button>
      </div>

      {/* Auctions List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : auctions && auctions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {auctions.map((auction) => (
            <AuctionCard
              key={auction.id}
              auction={auction}
              onUpdate={refetch}
              onEdit={(auction) => {
                setSelectedAuction(auction);
                setIsEditModalOpen(true);
              }}
            />
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay subastas creadas
            </h3>
            <p className="text-gray-600 mb-6">
              Comienza creando tu primera subasta para gestionar los items de tu
              empresa
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              Crear Primera Subasta
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Auction Modal */}
      <AuctionCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleAuctionCreated}
      />

      {/* Edit Auction Modal */}
      {selectedAuction && (
        <AuctionEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            setIsEditModalOpen(false);
            refetch();
          }}
          auction={selectedAuction}
        />
      )}
    </div>
  );
}
