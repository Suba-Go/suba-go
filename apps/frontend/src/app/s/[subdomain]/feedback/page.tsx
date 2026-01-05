import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import ClientFeedbackTabs from '@/components/feedback/feedback-tabs-wrapper';

export default async function FeedbackPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const session = await auth();
  const { subdomain } = await params;

  // Only AUCTION_MANAGER can access this page
  if (!session || session.user.role !== 'AUCTION_MANAGER') {
    redirect(`/s/${subdomain}`);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Feedback para el equipo de Suba&Go
        </h1>
        <p className="text-gray-600">
          Comparte tus comentarios, sugerencias, consejos o críticas con nuestro
          equipo. Tu opinión nos ayuda a mejorar la plataforma.
        </p>
      </div>

      <ClientFeedbackTabs />

      <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          ¿Cómo funciona el feedback?
        </h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span>
              <strong>Comentarios:</strong> Observaciones generales sobre la
              plataforma
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span>
              <strong>Feedback:</strong> Opiniones sobre funcionalidades
              específicas
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span>
              <strong>Consejos:</strong> Sugerencias para mejorar la experiencia
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span>
              <strong>Críticas:</strong> Problemas o aspectos que necesitan
              atención
            </span>
          </li>
        </ul>
        <p className="mt-4 text-sm text-blue-700">
          Tu feedback será revisado por nuestro equipo y te notificaremos cuando
          sea procesado.
        </p>
      </div>
    </div>
  );
}
