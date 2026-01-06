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

interface ClientFeedbackTabsProps {
  primaryColor?: string;
}

export default function ClientFeedbackTabs({
  primaryColor = '#3B82F6',
}: ClientFeedbackTabsProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <Tabs defaultValue="enviar" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger
          value="enviar"
          className="data-[state=active]:text-white data-[state=active]:bg-[var(--primary-color)]"
          style={{ '--primary-color': primaryColor } as React.CSSProperties}
        >
          Enviar
        </TabsTrigger>
        <TabsTrigger
          value="historial"
          className="data-[state=active]:text-white data-[state=active]:bg-[var(--primary-color)]"
          style={{ '--primary-color': primaryColor } as React.CSSProperties}
        >
          Historial
        </TabsTrigger>
      </TabsList>

      <TabsContent value="enviar" className="mt-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h2
            className="text-xl font-semibold mb-4"
            style={{ color: primaryColor }}
          >
            Enviar Nuevo Feedback
          </h2>
          <FeedbackForm
            onSuccess={() => setRefreshKey((k) => k + 1)}
            primaryColor={primaryColor}
          />
        </div>
      </TabsContent>

      <TabsContent value="historial" className="mt-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h2
            className="text-xl font-semibold mb-4"
            style={{ color: primaryColor }}
          >
            Tu Feedback Enviado
          </h2>
          <FeedbackList key={refreshKey} primaryColor={primaryColor} />
        </div>
      </TabsContent>
    </Tabs>
  );
}
