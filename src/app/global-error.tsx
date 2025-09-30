'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global Application Error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <svg className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                Kritischer Fehler
              </h1>
              <p className="text-gray-600 mb-6">
                Die Anwendung konnte nicht geladen werden. Bitte laden Sie die Seite neu.
              </p>
              
              {process.env.NODE_ENV === 'development' && (
                <div className="bg-gray-100 p-3 rounded text-xs text-gray-700 mb-4 text-left">
                  <strong>Development Error:</strong>
                  <br />
                  {error.message}
                </div>
              )}
              
              <div className="space-y-3">
                <button
                  onClick={reset}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
                >
                  Seite neu laden
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded"
                >
                  Zur Startseite
                </button>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
