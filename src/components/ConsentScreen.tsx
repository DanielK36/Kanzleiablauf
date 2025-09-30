'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ConsentScreenProps {
  onConsent: (consentGiven: boolean) => void;
}

export default function ConsentScreen({ onConsent }: ConsentScreenProps) {
  const [consentGiven, setConsentGiven] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleConsent = async (accepted: boolean) => {
    setLoading(true);
    try {
      const response = await fetch('/api/consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          consentGiven: accepted,
          consentVersion: '2025-09'
        }),
      });

      if (response.ok) {
        onConsent(accepted);
        if (accepted) {
          // Weiterleitung zum Onboarding
          router.push('/onboarding');
        } else {
          // Logout bei Ablehnung
          window.location.href = '/api/auth/logout';
        }
      } else {
        console.error('Fehler beim Speichern der Einwilligung');
      }
    } catch (error) {
      console.error('Fehler beim Speichern der Einwilligung:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Einwilligung erforderlich</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-gray-700 mb-4">
              Um dieses Portal zu nutzen, ist Ihre Zustimmung zu den Nutzungsbedingungen und zur Datenschutzerklärung erforderlich.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="consent"
                checked={consentGiven}
                onCheckedChange={(checked) => setConsentGiven(checked as boolean)}
              />
              <label htmlFor="consent" className="text-sm text-gray-700 leading-relaxed">
                Ich habe die{' '}
                <Link href="/privacy" className="text-blue-600 hover:underline" target="_blank">
                  Datenschutzerklärung
                </Link>{' '}
                und die{' '}
                <Link href="/terms" className="text-blue-600 hover:underline" target="_blank">
                  Nutzungsbedingungen
                </Link>{' '}
                gelesen und stimme zu.
              </label>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => handleConsent(true)}
              disabled={!consentGiven || loading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? 'Speichere...' : 'Zustimmen und fortfahren'}
            </Button>
            <Button
              onClick={() => handleConsent(false)}
              disabled={loading}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              Ablehnen
            </Button>
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>
              Bei Ablehnung werden Sie automatisch abgemeldet und können das Portal nicht nutzen.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
