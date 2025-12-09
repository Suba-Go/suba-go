'use client';

import { useState } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@suba-go/shared-components/components/ui/tabs';
import FeedbackForm from '@/components/feedback/feedback-form';
import FeedbackList from '@/components/feedback/feedback-list';

export default function ClientFeedbackTabs() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <Tabs defaultValue="enviar" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="enviar">Enviar</TabsTrigger>
        <TabsTrigger value="historial">Historial</TabsTrigger>
        <TabsTrigger value="mas">Más secciones</TabsTrigger>
      </TabsList>

      <TabsContent value="enviar" className="mt-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Enviar Nuevo Feedback
          </h2>
          <FeedbackForm onSuccess={() => setRefreshKey((k) => k + 1)} />
        </div>
      </TabsContent>

      <TabsContent value="historial" className="mt-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Tu Feedback Enviado
          </h2>
          <FeedbackList key={refreshKey} />
        </div>
      </TabsContent>

      <TabsContent value="mas" className="mt-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Próximas secciones</h2>
          <p className="text-gray-600 text-sm">
            Aquí podremos añadir nuevas áreas como estadísticas, respuestas del equipo,
            seguimiento de estados y más sin cambiar la estructura existente.
          </p>
        </div>
      </TabsContent>
    </Tabs>
  );
}
