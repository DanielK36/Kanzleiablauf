"use client";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SetupTeamsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const handleSetup = async () => {
    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/setup-teams', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setResult(`✅ Erfolgreich! ${data.message}`);
      } else {
        setResult(`❌ Fehler: ${data.error}`);
        if (data.details) {
          setResult(prev => prev + `\nDetails: ${data.details}`);
        }
      }
    } catch (error) {
      setResult(`❌ Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Setup: Teams Tabelle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Diese Seite erstellt die Teams-Tabelle mit der korrekten Hierarchie.
            </p>
            
            <div className="bg-gray-100 p-4 rounded-md">
              <h4 className="font-medium mb-2">Team-Hierarchie:</h4>
              <div className="text-sm text-gray-700">
                <div>GameChanger (Level 1 - Admin only)</div>
                <div className="ml-4">├── Goalgetter (Level 2)</div>
                <div className="ml-8">│   ├── Straw Hats (Level 3)</div>
                <div className="ml-8">│   └── Eys Breaker (Level 3)</div>
                <div className="ml-4">├── Proud (Level 2)</div>
                <div className="ml-4">├── Eagles (Level 2)</div>
                <div className="ml-4">├── Visionäre (Level 2)</div>
                <div className="ml-4">├── Hurricane (Level 2)</div>
                <div className="ml-4">└── Alpha (Level 2)</div>
              </div>
            </div>

            <Button 
              onClick={handleSetup} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Wird ausgeführt...' : 'Teams-Tabelle erstellen'}
            </Button>

            {result && (
              <div className="mt-4 p-4 bg-gray-100 rounded-md">
                <pre className="whitespace-pre-wrap text-sm">{result}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
