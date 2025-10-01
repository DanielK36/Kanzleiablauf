'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useUser } from '@clerk/nextjs';

interface EventTopic {
  id: string;
  event_category: string;
  topic_name: string;
  description: string;
}

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string;
  event_category: string;
  topic: string;
  is_recurring: boolean;
  recurrence_days: number[];
}

export default function SpeakerRegistrationPage() {
  const { user, isLoaded } = useUser();
  const [eventTopics, setEventTopics] = useState<EventTopic[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [formData, setFormData] = useState({
    bio: '',
    expertise_areas: [] as string[]
  });

  const expertiseOptions = [
    'Finanzanalysen',
    'Telefonakquise',
    'Verkaufstechniken',
    'Kundenberatung',
    'Produktschulung',
    'Führungskompetenz',
    'Teammanagement',
    'Vertriebsstrategien'
  ];

  const weekdays = [
    { value: 1, label: 'Montag' },
    { value: 2, label: 'Dienstag' },
    { value: 3, label: 'Mittwoch' },
    { value: 4, label: 'Donnerstag' },
    { value: 5, label: 'Freitag' },
    { value: 6, label: 'Samstag' },
    { value: 7, label: 'Sonntag' }
  ];

  useEffect(() => {
    if (isLoaded) {
      loadEventTopics();
      checkSpeakerStatus();
    }
  }, [isLoaded]);

  const loadEventTopics = async () => {
    try {
      const response = await fetch('/api/event-topics');
      if (response.ok) {
        const result = await response.json();
        setEventTopics(result.data || []);
      }
    } catch (error) {
      console.error('Error loading event topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkSpeakerStatus = async () => {
    try {
      const response = await fetch('/api/speakers');
      if (response.ok) {
        const result = await response.json();
        const speaker = result.data?.find((s: any) => s.user_id);
        if (speaker && speaker.is_approved) {
          setIsAuthorized(true);
        }
      }
    } catch (error) {
      console.error('Error checking speaker status:', error);
    }
  };

  const handleTopicSelection = (topicId: string, checked: boolean) => {
    if (checked) {
      setSelectedTopics(prev => [...prev, topicId]);
    } else {
      setSelectedTopics(prev => prev.filter(id => id !== topicId));
    }
  };

  const handleExpertiseChange = (expertise: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        expertise_areas: [...prev.expertise_areas, expertise]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        expertise_areas: prev.expertise_areas.filter(e => e !== expertise)
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Create speaker profile with selected topics
      const speakerResponse = await fetch('/api/speakers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          selected_topics: selectedTopics
        })
      });

      if (!speakerResponse.ok) {
        const error = await speakerResponse.json();
        throw new Error(error.error || 'Fehler beim Erstellen des Referenten-Profils');
      }

      setSuccess(true);
    } catch (error) {
      console.error('Error submitting registration:', error);
      alert('Fehler: ' + (error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Registrierung erfolgreich!</h2>
            <p className="text-gray-600 mb-6">
              Ihr Referenten-Profil wurde erstellt und Sie haben sich für {selectedTopics.length} Themen registriert.
              Ein Administrator wird Ihre Registrierung prüfen und freigeben.
            </p>
            <Button onClick={() => window.location.href = '/simple-dashboard'}>
              Zum Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🎤 Referenten-Registrierung</h1>
          <p className="text-lg text-gray-600 mb-2">
            Werden Sie Teil unseres Referenten-Teams
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>👤 Persönliche Informationen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="bio">Kurze Biografie</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Erzählen Sie kurz über sich und Ihre Erfahrungen..."
                  rows={4}
                />
              </div>

              <div>
                <Label>Expertise-Bereiche</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                  {expertiseOptions.map((expertise) => (
                    <div key={expertise} className="flex items-center space-x-2">
                      <Checkbox
                        id={`expertise-${expertise}`}
                        checked={formData.expertise_areas.includes(expertise)}
                        onCheckedChange={(checked) => handleExpertiseChange(expertise, checked as boolean)}
                      />
                      <Label htmlFor={`expertise-${expertise}`} className="text-sm">{expertise}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Event Topics Selection */}
          <Card>
            <CardHeader>
              <CardTitle>📅 Veranstaltungstypen auswählen</CardTitle>
              <p className="text-sm text-gray-600">
                Wählen Sie die Veranstaltungstypen aus, für die Sie sich als Referent bewerben möchten
              </p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Lade Veranstaltungstypen...</p>
                </div>
              ) : eventTopics.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📅</div>
                  <p className="text-gray-600">Keine Veranstaltungstypen verfügbar</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {['TIV', 'TAA', 'Powermeeting'].map((category) => {
                    const categoryTopics = eventTopics.filter(topic => topic.event_category === category);
                    
                    return (
                      <div key={category} className="border rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-4 text-lg">
                          {category === 'TIV' ? '🎯 TIV' : 
                           category === 'TAA' ? '📞 TAA' : 
                           '⚡ Powermeeting'}
                        </h3>
                        
                        {category === 'TAA' ? (
                          categoryTopics.length === 0 ? (
                            <div className="text-center py-6 text-gray-500">
                              <div className="mt-4">
                                <Checkbox
                                  id={`category-${category}`}
                                  checked={selectedTopics.includes(`category-${category}`)}
                                  onCheckedChange={(checked) => handleTopicSelection(`category-${category}`, checked as boolean)}
                                />
                                <Label htmlFor={`category-${category}`} className="ml-2">
                                  Für alle {category}-Veranstaltungen bewerben
                                </Label>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {categoryTopics.map((topic) => (
                                  <div key={topic.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                                    <Checkbox
                                      id={`topic-${topic.id}`}
                                      checked={selectedTopics.includes(topic.id)}
                                      onCheckedChange={(checked) => handleTopicSelection(topic.id, checked as boolean)}
                                    />
                                    <div className="flex-1">
                                      <h4 className="font-medium text-gray-900">{topic.topic_name}</h4>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        ) : (
                          <div className="text-center py-6 text-gray-500">
                            <div className="mt-4">
                              <Checkbox
                                id={`category-${category}`}
                                checked={selectedTopics.includes(`category-${category}`)}
                                onCheckedChange={(checked) => handleTopicSelection(`category-${category}`, checked as boolean)}
                              />
                              <Label htmlFor={`category-${category}`} className="ml-2">
                                Für alle {category}-Veranstaltungen bewerben
                              </Label>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="text-center">
            <Button 
              type="submit" 
              size="lg" 
              disabled={submitting || selectedTopics.length === 0}
              className="px-12 py-4 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {submitting ? 'Registriere...' : `🎤 Als Referent registrieren (${selectedTopics.length} Themen)`}
            </Button>
            {selectedTopics.length === 0 && (
              <p className="text-sm text-gray-500 mt-2">
                Bitte wählen Sie mindestens ein Thema aus
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
