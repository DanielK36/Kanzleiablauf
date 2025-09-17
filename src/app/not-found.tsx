export default function NotFound() {
  return (
    <html lang="de">
      <head>
        <title>404 - Seite nicht gefunden</title>
      </head>
      <body className="antialiased">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
            <p className="text-gray-600 mb-8">Seite nicht gefunden</p>
            <div className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-block">
              Zur Startseite
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
