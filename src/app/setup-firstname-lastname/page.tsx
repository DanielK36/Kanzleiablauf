"use client";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SetupFirstNameLastNamePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const handleSetup = async () => {
    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/setup-firstname-lastname', {
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
            <CardTitle>Setup: firstName und lastName Spalten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Diese Seite fügt die Spalten <code>firstName</code> und <code>lastName</code> zur 
              <code>users</code> Tabelle hinzu und konvertiert bestehende Namen.
            </p>
            
            <div className="bg-gray-100 p-4 rounded-md">
              <h4 className="font-medium mb-2">SQL Script:</h4>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">
{`ALTER TABLE users ADD COLUMN IF NOT EXISTS firstName VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS lastName VARCHAR(100);

-- Update existing records to split name into firstName and lastName
UPDATE users 
SET 
  firstName = CASE 
    WHEN name IS NOT NULL AND name != '' THEN 
      CASE 
        WHEN position(' ' in name) > 0 THEN 
          substring(name from 1 for position(' ' in name) - 1)
        ELSE name
      END
    ELSE NULL
  END,
  lastName = CASE 
    WHEN name IS NOT NULL AND name != '' THEN 
      CASE 
        WHEN position(' ' in name) > 0 THEN 
          substring(name from position(' ' in name) + 1)
        ELSE NULL
      END
    ELSE NULL
  END
WHERE firstName IS NULL OR lastName IS NULL;`}
              </pre>
            </div>

            <Button 
              onClick={handleSetup} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Wird ausgeführt...' : 'firstName/lastName Spalten hinzufügen'}
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
