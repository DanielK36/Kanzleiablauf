"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ActionGuideComponent } from './action-guide';

export const AdvisorDashboard = () => {
  const [currentWeekday, setCurrentWeekday] = useState('');
  const [checkinCompleted, setCheckinCompleted] = useState(false);
  const [actionGuideCompleted, setActionGuideCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [todayData, setTodayData] = useState<any>(null);
  const [checkinData, setCheckinData] = useState({
    energy_level: 'medium',
    daily_targets: '',
    challenges: '',
    support_needed: '',
    mood_rating: 7
  });

  useEffect(() => {
    const today = new Date().toLocaleDateString('de-DE', { weekday: 'long' });
    setCurrentWeekday(today);
    loadTodayData();
  }, []);

  const loadTodayData = async () => {
    try {
      const response = await fetch('/api/daily-entries/today');
      const data = await response.json();
      if (data.success && data.data) {
        setTodayData(data.data);
        setCheckinCompleted(true);
      }
    } catch (error) {
      console.error('Error loading today data:', error);
    }
  };

  const handleCheckinSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/daily-entries/berater', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          yesterdayResults: {
            fa_achieved: 0,
            eh_achieved: 0,
            new_appointments_achieved: 0,
            recommendations_achieved: 0,
            tiv_invitations_achieved: 0,
            taa_invitations_achieved: 0,
            tgs_registrations_achieved: 0,
            bav_checks_achieved: 0
          },
          todayGoals: {
            fa_target: 5,
            eh_target: 3,
            new_appointments_target: 3,
            recommendations_target: 2,
            tiv_invitations_target: 2,
            taa_invitations_target: 1,
            tgs_registrations_target: 1,
            bav_checks_target: 2
          },
          todayTodos: [],
          todayAnswers: {
            energy_level: checkinData.energy_level,
            daily_targets: checkinData.daily_targets,
            challenges: checkinData.challenges,
            support_needed: checkinData.support_needed,
            mood_rating: checkinData.mood_rating
          }
        }),
      });

      if (response.ok) {
        setCheckinCompleted(true);
        loadTodayData();
      }
    } catch (error) {
      console.error('Error submitting check-in:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActionGuideComplete = () => {
    setActionGuideCompleted(true);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setCheckinData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="advisor-dashboard min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Berater Dashboard
          </h1>
          <p className="text-gray-600">
            {currentWeekday} - Starte deinen Tag mit Struktur
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Check-in Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Täglicher Check-in</CardTitle>
            </CardHeader>
            <CardContent>
              {!checkinCompleted ? (
                <form onSubmit={(e) => { e.preventDefault(); handleCheckinSubmit(); }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Energielevel heute
                    </label>
                    <select
                      value={checkinData.energy_level}
                      onChange={(e) => handleInputChange('energy_level', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="high">Hoch - Voll motiviert</option>
                      <option value="medium">Mittel - Normal</option>
                      <option value="low">Niedrig - Brauche Unterstützung</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tagesziele
                    </label>
                    <textarea
                      value={checkinData.daily_targets}
                      onChange={(e) => handleInputChange('daily_targets', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Was willst du heute erreichen?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Herausforderungen
                    </label>
                    <textarea
                      value={checkinData.challenges}
                      onChange={(e) => handleInputChange('challenges', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Was beschäftigt dich heute?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unterstützung benötigt
                    </label>
                    <textarea
                      value={checkinData.support_needed}
                      onChange={(e) => handleInputChange('support_needed', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder="Wobei brauchst du Hilfe?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stimmung (1-10)
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={checkinData.mood_rating}
                      onChange={(e) => handleInputChange('mood_rating', parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>1 (schlecht)</span>
                      <span className="font-semibold">{checkinData.mood_rating}</span>
                      <span>10 (exzellent)</span>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                  >
                    {loading ? 'Wird gespeichert...' : 'Check-in abschicken'}
                  </Button>
                </form>
              ) : (
                <div className="text-center py-8">
                  <div className="text-green-600 text-6xl mb-4">✓</div>
                  <h3 className="text-xl font-semibold mb-2">Check-in abgeschlossen!</h3>
                  <p className="text-gray-600 mb-4">
                    Dein Teamleiter wurde informiert.
                  </p>
                  <Button 
                    onClick={() => setCheckinCompleted(false)}
                    variant="outline"
                  >
                    Check-in bearbeiten
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Tägliche Aufgaben</CardTitle>
            </CardHeader>
            <CardContent>
              {!actionGuideCompleted ? (
                <ActionGuideComponent
                  weekday={currentWeekday}
                  role="advisor"
                  onComplete={handleActionGuideComplete}
                />
              ) : (
                <div className="text-center py-8">
                  <div className="text-green-600 text-6xl mb-4">✓</div>
                  <h3 className="text-xl font-semibold mb-2">Alle Aufgaben erledigt!</h3>
                  <p className="text-gray-600 mb-4">
                    Du bist bereit für deinen Tag.
                  </p>
                  <Button 
                    onClick={() => setActionGuideCompleted(false)}
                    variant="outline"
                  >
                    Nochmal durchgehen
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-xl">Deine Woche</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">5</div>
                <div className="text-sm text-gray-600">FA heute</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">3</div>
                <div className="text-sm text-gray-600">EH heute</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">8</div>
                <div className="text-sm text-gray-600">TIV diese Woche</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">85%</div>
                <div className="text-sm text-gray-600">Zielerreichung</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
