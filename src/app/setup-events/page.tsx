'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SetupEventsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSetupTable = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/create-events-table', {
        method: 'POST',
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: 'Network error',
        details: 'Could not connect to the API'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copySQLToClipboard = () => {
    const sql = `CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  day VARCHAR(20) NOT NULL,
  time VARCHAR(20) NOT NULL,
  location VARCHAR(255) NOT NULL,
  topic VARCHAR(255),
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_type VARCHAR(20) DEFAULT 'none',
  custom_type VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events are viewable by authenticated users" ON events
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Events are manageable by leaders" ON events
  FOR ALL USING (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM users 
    WHERE users.clerk_id = auth.uid()::text 
    AND users.role IN ('top_leader', 'sub_leader')
  ));

INSERT INTO events (type, date, day, time, location, topic, is_recurring, recurring_type) VALUES
('TIV', '2024-01-13', 'Samstag', '09:00 Uhr', 'Hauptbüro', '', false, 'none'),
('TAA', '2024-01-20', 'Samstag', '10:00 Uhr', 'Konferenzraum', '', false, 'none'),
('Telefonparty', '2024-01-16', 'Dienstag', '14:00-16:00 Uhr', 'Büro', 'Wöchentliche Telefonparty', true, 'weekly')
ON CONFLICT DO NOTHING;`;

    navigator.clipboard.writeText(sql);
    alert('SQL-Script in die Zwischenablage kopiert!');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Events-Tabelle Setup</h1>
          <p className="text-gray-600 mt-2">Richten Sie die Events-Tabelle in Ihrer Supabase-Datenbank ein</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Automatisches Setup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                🤖 Automatisches Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Versuchen Sie, die Tabelle automatisch zu erstellen:
              </p>
              
              <Button 
                onClick={handleSetupTable}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? '⏳ Erstelle Tabelle...' : '🚀 Tabelle automatisch erstellen'}
              </Button>

              {result && (
                <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <h4 className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                    {result.success ? '✅ Erfolg!' : '❌ Fehler'}
                  </h4>
                  <p className={`text-sm mt-1 ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                    {result.message || result.error}
                  </p>
                  {result.details && (
                    <p className="text-xs mt-2 text-gray-600">
                      {result.details}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Manuelles Setup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                📝 Manuelles Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Falls das automatische Setup nicht funktioniert:
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">1</span>
                  <span>Öffnen Sie Ihr <a href="https://supabase.com/dashboard" target="_blank" className="text-blue-600 hover:underline">Supabase Dashboard</a></span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">2</span>
                  <span>Gehen Sie zum "SQL Editor"</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">3</span>
                  <span>Kopieren Sie das SQL-Script</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">4</span>
                  <span>Führen Sie es aus</span>
                </div>
              </div>

              <Button 
                onClick={copySQLToClipboard}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                📋 SQL-Script kopieren
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* SQL Script Anzeige */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>📄 SQL-Script</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  day VARCHAR(20) NOT NULL,
  time VARCHAR(20) NOT NULL,
  location VARCHAR(255) NOT NULL,
  topic VARCHAR(255),
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_type VARCHAR(20) DEFAULT 'none',
  custom_type VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events are viewable by authenticated users" ON events
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Events are manageable by leaders" ON events
  FOR ALL USING (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM users 
    WHERE users.clerk_id = auth.uid()::text 
    AND users.role IN ('top_leader', 'sub_leader')
  ));

INSERT INTO events (type, date, day, time, location, topic, is_recurring, recurring_type) VALUES
('TIV', '2024-01-13', 'Samstag', '09:00 Uhr', 'Hauptbüro', '', false, 'none'),
('TAA', '2024-01-20', 'Samstag', '10:00 Uhr', 'Konferenzraum', '', false, 'none'),
('Telefonparty', '2024-01-16', 'Dienstag', '14:00-16:00 Uhr', 'Büro', 'Wöchentliche Telefonparty', true, 'weekly')
ON CONFLICT DO NOTHING;`}
            </pre>
          </CardContent>
        </Card>

        {/* Nach dem Setup */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>🎉 Nach dem Setup</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Nach dem erfolgreichen Setup können Sie:
            </p>
            <ul className="space-y-2 text-gray-600">
              <li>✅ Neue Veranstaltungen erstellen</li>
              <li>✅ Veranstaltungen bearbeiten</li>
              <li>✅ Veranstaltungen löschen</li>
              <li>✅ Wochentag wird automatisch berechnet</li>
              <li>✅ Wiederkehrende Veranstaltungen einrichten</li>
            </ul>
            <div className="mt-4">
              <a 
                href="/admin/events" 
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                🚀 Zur Events-Verwaltung
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
