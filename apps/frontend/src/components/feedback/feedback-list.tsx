'use client';

import { useState, useEffect } from 'react';
import { FeedbackDto, FEEDBACK_CATEGORIES } from '@suba-go/shared-validation';

export default function FeedbackList() {
  const [feedbackList, setFeedbackList] = useState<FeedbackDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/feedback');

      if (!res.ok) {
        throw new Error('Error al cargar feedback');
      }

      const data = await res.json();
      setFeedbackList(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar feedback');
    } finally {
      setLoading(false);
    }
  };

  const filteredFeedback =
    filter === 'all'
      ? feedbackList
      : feedbackList.filter((f) => f.category === filter);

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      REVIEWED: 'bg-blue-100 text-blue-800 border-blue-200',
      RESOLVED: 'bg-green-100 text-green-800 border-green-200',
    };

    const labels = {
      PENDING: 'Pendiente',
      REVIEWED: 'Revisado',
      RESOLVED: 'Resuelto',
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full border ${
          styles[status as keyof typeof styles] || styles.PENDING
        }`}
      >
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      Comentarios: '💬',
      Feedback: '📝',
      Consejos: '💡',
      Críticas: '⚠️',
    };
    return icons[category] || '📋';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Todos ({feedbackList.length})
        </button>
        {FEEDBACK_CATEGORIES.map((category) => {
          const count = feedbackList.filter((f) => f.category === category).length;
          return (
            <button
              key={category}
              onClick={() => setFilter(category)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {getCategoryIcon(category)} {category} ({count})
            </button>
          );
        })}
      </div>

      {/* Feedback List */}
      {filteredFeedback.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-600">
            {filter === 'all'
              ? 'No has enviado ningún feedback aún'
              : `No hay feedback en la categoría "${filter}"`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFeedback.map((feedback) => (
            <div
              key={feedback.id}
              className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getCategoryIcon(feedback.category)}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{feedback.title}</h3>
                    <p className="text-xs text-gray-500">
                      {new Date(feedback.createdAt as any).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                {getStatusBadge(feedback.status)}
              </div>

              <p className="text-gray-700 text-sm whitespace-pre-wrap">{feedback.message}</p>

              <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                <span className="px-2 py-1 bg-gray-100 rounded">
                  {feedback.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
