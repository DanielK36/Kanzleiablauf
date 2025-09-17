"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SetupDailyEntriesPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<string>('');

  const runSQL = async () => {
    setIsRunning(true);
    setResult('');

    try {
      const response = await fetch('/api/setup-daily-entries', {
        method: 'POST',
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(`✅ Erfolgreich! ${data.message}`);
      } else {
        setResult(`❌ Fehler: ${data.error}`);
      }
    } catch (error) {
      setResult(`❌ Fehler beim Ausführen: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">🔧 Daily Entries Schema Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Wichtig:</h3>
              <p className="text-yellow-700">
                Diese Seite fügt die fehlenden Spalten zur <code>daily_entries</code> Tabelle hinzu.
                Das ist notwendig, damit die Berater-Seite funktioniert.
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2">📋 Was wird hinzugefügt:</h3>
              <ul className="text-blue-700 space-y-1">
                <li>• <code>weekday_answer</code> - Für wochentagsspezifische Fragen</li>
                <li>• <code>help_needed</code> - "Wobei brauchst du heute Hilfe?"</li>
                <li>• <code>training_focus</code> - "Was willst du heute trainieren?"</li>
                <li>• <code>improvement_today</code> - "Was willst du heute noch besser machen?"</li>
                <li>• <code>today_goals</code> - Heutige Ziele (JSON)</li>
                <li>• <code>today_todos</code> - Heutige ToDos (JSON)</li>
                <li>• <code>todos_completed</code> - Abgehakte ToDos (JSON)</li>
                <li>• <code>highlight_yesterday</code> - "Was war gestern?"</li>
                <li>• <code>appointments_next_week</code> - Termine nächste Woche</li>
                <li>• <code>weekly_improvement</code> - Wochenverbesserung</li>
                <li>• <code>charisma_training</code> - Charismatraining</li>
                <li>• <code>tgs_registrations</code> - TGS Registrierungen</li>
                <li>• <code>bav_checks</code> - bAV Checks</li>
                <li>• <code>tiv_invitations</code> - TIV Einladungen</li>
                <li>• <code>taa_invitations</code> - TAA Einladungen</li>
              </ul>
            </div>

            <Button 
              onClick={runSQL}
              disabled={isRunning}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
            >
              {isRunning ? 'Führe SQL aus...' : 'Fehlende Spalten hinzufügen'}
            </Button>

            {result && (
              <div className={`p-4 rounded-lg ${
                result.includes('✅') 
                  ? 'bg-green-50 border border-green-200 text-green-800' 
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                <pre className="whitespace-pre-wrap">{result}</pre>
              </div>
            )}

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">📝 SQL-Befehle:</h3>
              <pre className="text-sm text-gray-700 overflow-x-auto">
{`ALTER TABLE daily_entries 
ADD COLUMN IF NOT EXISTS weekday_answer TEXT,
ADD COLUMN IF NOT EXISTS help_needed TEXT,
ADD COLUMN IF NOT EXISTS training_focus TEXT,
ADD COLUMN IF NOT EXISTS improvement_today TEXT,
ADD COLUMN IF NOT EXISTS today_goals JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS today_todos JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS todos_completed JSONB DEFAULT '[false, false, false, false, false]',
ADD COLUMN IF NOT EXISTS highlight_yesterday TEXT,
ADD COLUMN IF NOT EXISTS appointments_next_week INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS weekly_improvement TEXT,
ADD COLUMN IF NOT EXISTS charisma_training BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tgs_registrations INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bav_checks INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tiv_invitations INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS taa_invitations INTEGER DEFAULT 0;`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
