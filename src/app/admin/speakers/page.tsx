'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

interface Speaker {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  bio: string;
  expertise_areas: string[];
  selected_topics: string[];
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminSpeakersPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded) {
      checkAdminAccess();
      loadSpeakers();
    }
  }, [isLoaded]);

  const checkAdminAccess = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/admin/users');
      if (response.status === 403) {
        router.push('/simple-dashboard');
        return;
      }
      if (!response.ok) {
        router.push('/simple-dashboard');
        return;
      }
    } catch (error) {
      console.error('Admin access check failed:', error);
      router.push('/simple-dashboard');
    }
  };

  const loadSpeakers = async () => {
    try {
      const response = await fetch('/api/speakers');
      if (response.ok) {
        const result = await response.json();
        setSpeakers(result.data || []);
      }
    } catch (error) {
      console.error('Error loading speakers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (speakerId: string, approved: boolean) => {
    try {
      const response = await fetch('/api/speakers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: speakerId,
          is_approved: approved
        })
      });

      if (response.ok) {
        await loadSpeakers();
      } else {
        const error = await response.json();
        alert('Fehler beim Aktualisieren: ' + error.error);
      }
    } catch (error) {
      console.error('Error updating speaker:', error);
      alert('Fehler beim Aktualisieren des Referenten');
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Referenten...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">🎤 Referenten-Verwaltung</h1>
          <div className="text-sm text-gray-600">
            {speakers.filter(s => !s.is_approved).length} ausstehende Bewerbungen
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {speakers.map((speaker) => (
            <Card key={speaker.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {speaker.first_name} {speaker.last_name}
                    </CardTitle>
                    <p className="text-sm text-gray-600">{speaker.email}</p>
                  </div>
                  <Badge variant={speaker.is_approved ? "default" : "secondary"}>
                    {speaker.is_approved ? "Autorisiert" : "Ausstehend"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {speaker.bio && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Biografie</h4>
                      <p className="text-sm text-gray-700 line-clamp-3">{speaker.bio}</p>
                    </div>
                  )}

                  {speaker.expertise_areas && speaker.expertise_areas.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Expertise</h4>
                      <div className="flex flex-wrap gap-1">
                        {speaker.expertise_areas.map((area, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {speaker.selected_topics && speaker.selected_topics.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Ausgewählte Themen</h4>
                      <div className="flex flex-wrap gap-1">
                        {speaker.selected_topics.map((topic, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-gray-500">
                    Registriert: {new Date(speaker.created_at).toLocaleDateString('de-DE')}
                  </div>

                  <div className="flex space-x-2 pt-4">
                    {!speaker.is_approved ? (
                      <>
                        <Button 
                          size="sm" 
                          onClick={() => handleApproval(speaker.id, true)}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          ✅ Autorisieren
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleApproval(speaker.id, false)}
                          className="flex-1"
                        >
                          ❌ Ablehnen
                        </Button>
                      </>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleApproval(speaker.id, false)}
                        className="flex-1"
                      >
                        🔄 Autorisierung widerrufen
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {speakers.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-6xl mb-4">🎤</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Keine Referenten vorhanden</h3>
              <p className="text-gray-600">Es haben sich noch keine Referenten registriert</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
