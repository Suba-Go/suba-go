'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function DebugSessionPage() {
  const { data: session, status } = useSession();
  const [cookies, setCookies] = useState('');

  useEffect(() => {
    // Get all cookies
    setCookies(document.cookie);

    // Log cookies to console for debugging
    console.log('[DebugSession] All cookies:', document.cookie);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Debug Session</h1>

        <div className="space-y-6">
          {/* Session Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Session Status
            </h2>
            <div className="space-y-2">
              <p>
                <strong>Status:</strong> {status}
              </p>
              <p>
                <strong>Has Session:</strong> {session ? 'Yes' : 'No'}
              </p>
              {session && (
                <div>
                  <p>
                    <strong>User Email:</strong> {session.user?.email}
                  </p>
                  <p>
                    <strong>User Name:</strong> {session.user?.name}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Cookies */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Cookies
            </h2>
            <div className="bg-gray-100 p-4 rounded text-sm font-mono break-all">
              {cookies || 'No cookies found'}
            </div>

            <div className="mt-4 space-y-2">
              <p>
                <strong>Has authjs.session-token:</strong>{' '}
                {cookies.includes('authjs.session-token') ? 'Yes' : 'No'}
              </p>
              <p>
                <strong>Has authjs.csrf-token:</strong>{' '}
                {cookies.includes('authjs.csrf-token') ? 'Yes' : 'No'}
              </p>
            </div>
          </div>

          {/* Current URL */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Current URL Info
            </h2>
            <div className="space-y-2">
              <p>
                <strong>Hostname:</strong>{' '}
                {typeof window !== 'undefined'
                  ? window.location.hostname
                  : 'N/A'}
              </p>
              <p>
                <strong>Port:</strong>{' '}
                {typeof window !== 'undefined' ? window.location.port : 'N/A'}
              </p>
              <p>
                <strong>Protocol:</strong>{' '}
                {typeof window !== 'undefined'
                  ? window.location.protocol
                  : 'N/A'}
              </p>
              <p>
                <strong>Full URL:</strong>{' '}
                {typeof window !== 'undefined' ? window.location.href : 'N/A'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Actions
            </h2>
            <div className="space-x-4">
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Refresh Page
              </button>
              <button
                onClick={() => {
                  // Clear all possible cookie variations
                  document.cookie =
                    'authjs.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                  document.cookie =
                    'authjs.csrf-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                  document.cookie =
                    'authjs.callback-url=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                  document.cookie =
                    'authjs.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.localhost;';
                  document.cookie =
                    'authjs.csrf-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.localhost;';
                  document.cookie =
                    'authjs.callback-url=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.localhost;';
                  window.location.reload();
                }}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Clear All Cookies & Refresh
              </button>
              <a
                href="/login"
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 inline-block"
              >
                Go to Login
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
