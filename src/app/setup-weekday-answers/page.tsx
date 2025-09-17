"use client";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SetupWeekdayAnswers() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAddColumn = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/setup-weekday-answers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('✅ weekday_answers Spalte erfolgreich hinzugefügt!');
      } else {
        if (result.manualSql) {
          setMessage(`❌ Automatisches Setup fehlgeschlagen. Bitte führe diesen SQL-Befehl manuell in deiner Datenbank aus:\n\n${result.details}`);
        } else {
          setMessage(`❌ Fehler: ${result.error || 'Unbekannter Fehler'}\n\nDetails: ${result.details || 'Keine Details verfügbar'}`);
        }
      }
    } catch (error) {
      setMessage(`❌ Fehler beim Hinzufügen der Spalte: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Setup: weekday_answers Spalte</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">Was wird gemacht?</h3>
              <p className="text-yellow-700">
                Diese Seite fügt die fehlende <code className="bg-yellow-100 px-1 rounded">weekday_answers</code> Spalte 
                zur <code className="bg-yellow-100 px-1 rounded">daily_entries</code> Tabelle hinzu.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">SQL Befehl:</h3>
              <pre className="bg-blue-100 p-3 rounded text-sm overflow-x-auto">
{`ALTER TABLE daily_entries 
ADD COLUMN weekday_answers JSONB DEFAULT '{}';`}
              </pre>
            </div>

            <Button 
              onClick={handleAddColumn}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Spalte wird hinzugefügt...' : 'weekday_answers Spalte hinzufügen'}
            </Button>

            {message && (
              <div className={`p-4 rounded-lg ${
                message.includes('✅') 
                  ? 'bg-green-50 border border-green-200 text-green-800' 
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                {message}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
