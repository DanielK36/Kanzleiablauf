'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { calculateProgressWithColor } from '@/lib/weekday-logic';

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string;
  event_type: string;
  is_recurring: boolean;
  recurrence_days: number[];
  event_speakers: Array<{
    id: string;
    role: string;
    topic: string;
    is_confirmed: boolean;
    speakers: {
      id: string;
      first_name: string;
      last_name: string;
      company: string;
      position: string;
    };
  }>;
}

function EventsSection() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await fetch('/api/events?upcoming=true&limit=5');
      if (response.ok) {
        const result = await response.json();
        setEvents(result.data || []);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const weekdays = [
    { value: 1, label: 'Mo' },
    { value: 2, label: 'Di' },
    { value: 3, label: 'Mi' },
    { value: 4, label: 'Do' },
    { value: 5, label: 'Fr' },
    { value: 6, label: 'Sa' },
    { value: 7, label: 'So' }
  ];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">📅 Veranstaltungen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Lade Veranstaltungen...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">📅 Veranstaltungen</CardTitle>
          <Link href="/speaker-registration">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              🎤 Als Referent bewerben
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-4">📅</div>
            <p>Keine kommenden Veranstaltungen</p>
            <p className="text-sm mt-2">Veranstaltungen werden hier angezeigt</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{event.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>📅 {new Date(event.event_date).toLocaleDateString('de-DE')}</span>
                      <span>🕐 {event.start_time} - {event.end_time}</span>
                      <span>📍 {event.location}</span>
                      {event.is_recurring && (
                        <span className="text-blue-600">
                          {event.recurrence_days.map(d => weekdays.find(w => w.value === d)?.label).join(', ')}
                        </span>
                      )}
                    </div>
                    {event.event_speakers && event.event_speakers.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">Referenten:</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {event.event_speakers.map((speaker, index) => (
                            <span 
                              key={index}
                              className={`px-2 py-1 rounded text-xs ${
                                speaker.is_confirmed 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {speaker.speakers.first_name} {speaker.speakers.last_name}
                              {speaker.speakers.company && ` (${speaker.speakers.company})`}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface DashboardData {
  user: {
    id: string;
    name: string;
    role: string;
    team_id: number;
    team_name: string;
  };
  weeklyGoals: {
    fa: number;
    eh: number;
    newAppointments: number;
    recommendations: number;
    tivInvitations: number;
    bavChecks: number;
    taaInvitations: number;
    tgsRegistrations: number;
  };
  monthlyGoals: {
    fa: number;
    eh: number;
    newAppointments: number;
    recommendations: number;
    tivInvitations: number;
    bavChecks: number;
    taaInvitations: number;
    tgsRegistrations: number;
  };
  teamGoals: {
    fa: number;
    eh: number;
    newAppointments: number;
    recommendations: number;
    tivInvitations: number;
    bavChecks: number;
    taaInvitations: number;
    tgsRegistrations: number;
  };
  ownMonthlyProgress: {
    fa: number;
    eh: number;
    newAppointments: number;
    recommendations: number;
    tivInvitations: number;
    bavChecks: number;
    taaInvitations: number;
    tgsRegistrations: number;
  };
  teamMonthlyProgress: {
    fa: number;
    eh: number;
    newAppointments: number;
    recommendations: number;
    tivInvitations: number;
    bavChecks: number;
    taaInvitations: number;
    tgsRegistrations: number;
  };
  ownWeeklyProgress: {
    fa_current: number;
    eh_current: number;
    new_appointments_current: number;
    recommendations_current: number;
    tiv_invitations_current: number;
    bav_checks_current: number;
    taa_invitations_current: number;
    tgs_registrations_current: number;
  };
  monthlyProgress: {
    fa: number;
    eh: number;
    newAppointments: number;
    recommendations: number;
    tivInvitations: number;
    bavChecks: number;
    taaInvitations: number;
    tgsRegistrations: number;
  };
}
export default function SimpleDashboardPage() {
  const { user, isLoaded } = useUser();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const loadDashboardData = async () => {
    try {
      console.log('🔍 DEBUG: Starting API call to /api/dashboard-data');
      const response = await fetch('/api/dashboard-data');
      console.log('🔍 DEBUG: API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 DEBUG: API response data:', data);
        
        if (data.success) {
          setDashboardData(data.data);
          console.log('🔍 DEBUG: Dashboard data set successfully');
          console.log('🔍 DEBUG: teamMonthlyProgress:', data.data.teamMonthlyProgress);
          console.log('🔍 DEBUG: teamGoals:', data.data.teamGoals);
        } else {
          console.error('❌ API returned success: false', data);
          setError('Fehler beim Laden der Dashboard-Daten');
        }
      } else {
        console.error('❌ API response not ok:', response.status, response.statusText);
        setError('Fehler beim Laden der Dashboard-Daten');
      }
    } catch (error) {
      console.error('❌ API call failed:', error);
      setError('Fehler beim Laden der Dashboard-Daten');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (isLoaded && user) {
      loadDashboardData();
    }
  }, [isLoaded, user]);
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Dashboard...</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Fehler</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadDashboardData}>Erneut versuchen</Button>
        </div>
      </div>
    );
  }
  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Keine Daten</h1>
          <p className="text-gray-600">Dashboard-Daten konnten nicht geladen werden.</p>
        </div>
      </div>
    );
  }
  const { user: userInfo, weeklyGoals, monthlyGoals, teamGoals, ownMonthlyProgress, teamMonthlyProgress, ownWeeklyProgress } = dashboardData;
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Wochenziele */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">📊 Wochenziele</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                { key: 'fa', label: 'Finanzanalysen', current: ownWeeklyProgress?.fa_current || 0, target: weeklyGoals.fa },
                { key: 'eh', label: 'EH', current: ownWeeklyProgress?.eh_current || 0, target: weeklyGoals.eh },
                { key: 'new_appointments', label: 'Neue Termine', current: ownWeeklyProgress?.new_appointments_current || 0, target: weeklyGoals.newAppointments },
                { key: 'recommendations', label: 'Empfehlungen', current: ownWeeklyProgress?.recommendations_current || 0, target: weeklyGoals.recommendations },
                { key: 'tiv_invitations', label: 'TIV', current: ownWeeklyProgress?.tiv_invitations_current || 0, target: weeklyGoals.tivInvitations },
                { key: 'taa_invitations', label: 'TAA', current: ownWeeklyProgress?.taa_invitations_current || 0, target: weeklyGoals.taaInvitations },
                { key: 'tgs_registrations', label: 'TGS', current: ownWeeklyProgress?.tgs_registrations_current || 0, target: weeklyGoals.tgsRegistrations },
                { key: 'bav_checks', label: 'bAV Checks', current: ownWeeklyProgress?.bav_checks_current || 0, target: weeklyGoals.bavChecks }
              ].map((metric) => (
                <div key={metric.key} className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="text-xs text-gray-600 mb-1">{metric.label}</div>
                  <div className="text-lg font-bold text-blue-700">{metric.current} / {metric.target}</div>
                  <div className="text-xs text-gray-500">
                    {metric.target > 0 ? Math.round((metric.current / metric.target) * 100) : 0}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        {/* Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <Link href="/simple-kanzleiablauf-team">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 text-center">
                <div className="text-3xl mb-2">📊</div>
                <div className="font-semibold text-sm">Team-Dashboard</div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/simple-goals">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 text-center">
                <div className="text-3xl mb-2">🎯</div>
                <div className="font-semibold text-sm">Ziele</div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/simple-kanzleiablauf-v3">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 text-center">
                <div className="text-3xl mb-2">📝</div>
                <div className="font-semibold text-sm">Tageseintrag</div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/weekly-review">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 text-center">
                <div className="text-3xl mb-2">📝</div>
                <div className="font-semibold text-sm">Wochenrückblick</div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/simple-kanzleiablauf-team">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 text-center">
                <div className="text-3xl mb-2">👥</div>
                <div className="font-semibold text-sm">Team Performance</div>
              </CardContent>
            </Card>
          </Link>
        </div>
        {/* Monatsfortschritt */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>📈 Monatsfortschritt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Eigene Monatsziele */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-4">Eigene Monatsziele</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>FA</span>
                      <span>{ownMonthlyProgress?.fa || 0}/{monthlyGoals.fa}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      {(() => {
                        const progress = calculateProgressWithColor(ownMonthlyProgress?.fa || 0, monthlyGoals.fa);
                        return (
                          <div 
                            className={`${progress.color} h-2 rounded-full transition-all duration-300`}
                            style={{ width: `${progress.progress}%` }}
                          ></div>
                        );
                      })()}
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>EH</span>
                      <span>{(ownMonthlyProgress?.eh || 0).toLocaleString()}/{monthlyGoals.eh.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      {(() => {
                        const progress = calculateProgressWithColor(ownMonthlyProgress?.eh || 0, monthlyGoals.eh);
                        return (
                          <div 
                            className={`${progress.color} h-2 rounded-full transition-all duration-300`}
                            style={{ width: `${progress.progress}%` }}
                          ></div>
                        );
                      })()}
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Termine</span>
                      <span>{ownMonthlyProgress?.newAppointments || 0}/{monthlyGoals.newAppointments}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      {(() => {
                        const progress = calculateProgressWithColor(ownMonthlyProgress?.newAppointments || 0, monthlyGoals.newAppointments);
                        return (
                          <div 
                            className={`${progress.color} h-2 rounded-full transition-all duration-300`}
                            style={{ width: `${progress.progress}%` }}
                          ></div>
                        );
                      })()}
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Empfehlungen</span>
                      <span>{ownMonthlyProgress?.recommendations || 0}/{monthlyGoals.recommendations}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      {(() => {
                        const progress = calculateProgressWithColor(ownMonthlyProgress?.recommendations || 0, monthlyGoals.recommendations);
                        return (
                          <div 
                            className={`${progress.color} h-2 rounded-full transition-all duration-300`}
                            style={{ width: `${progress.progress}%` }}
                          ></div>
                        );
                      })()}
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>TIV</span>
                      <span>{ownMonthlyProgress?.tivInvitations || 0}/{monthlyGoals.tivInvitations}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      {(() => {
                        const progress = calculateProgressWithColor(ownMonthlyProgress?.tivInvitations || 0, monthlyGoals.tivInvitations);
                        return (
                          <div 
                            className={`${progress.color} h-2 rounded-full transition-all duration-300`}
                            style={{ width: `${progress.progress}%` }}
                          ></div>
                        );
                      })()}
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>BAV</span>
                      <span>{ownMonthlyProgress?.bavChecks || 0}/{monthlyGoals.bavChecks}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      {(() => {
                        const progress = calculateProgressWithColor(ownMonthlyProgress?.bavChecks || 0, monthlyGoals.bavChecks);
                        return (
                          <div 
                            className={`${progress.color} h-2 rounded-full transition-all duration-300`}
                            style={{ width: `${progress.progress}%` }}
                          ></div>
                        );
                      })()}
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>TAA</span>
                      <span>{ownMonthlyProgress?.taaInvitations || 0}/{monthlyGoals.taaInvitations}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      {(() => {
                        const progress = calculateProgressWithColor(ownMonthlyProgress?.taaInvitations || 0, monthlyGoals.taaInvitations);
                        return (
                          <div 
                            className={`${progress.color} h-2 rounded-full transition-all duration-300`}
                            style={{ width: `${progress.progress}%` }}
                          ></div>
                        );
                      })()}
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>TGS</span>
                      <span>{ownMonthlyProgress?.tgsRegistrations || 0}/{monthlyGoals.tgsRegistrations}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      {(() => {
                        const progress = calculateProgressWithColor(ownMonthlyProgress?.tgsRegistrations || 0, monthlyGoals.tgsRegistrations);
                        return (
                          <div 
                            className={`${progress.color} h-2 rounded-full transition-all duration-300`}
                            style={{ width: `${progress.progress}%` }}
                          ></div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
              {/* Orga Monatsziele */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-4">Orga Monatsziele</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>FA</span>
                      <span>{teamMonthlyProgress?.fa || 0}/{teamGoals.fa}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      {(() => {
                        const progress = calculateProgressWithColor(teamMonthlyProgress?.fa || 0, teamGoals.fa);
                        return (
                          <div 
                            className={`${progress.color} h-2 rounded-full transition-all duration-300`}
                            style={{ width: `${progress.progress}%` }}
                          ></div>
                        );
                      })()}
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>EH</span>
                      <span>{(teamMonthlyProgress?.eh || 0).toLocaleString()}/{teamGoals.eh.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      {(() => {
                        const progress = calculateProgressWithColor(teamMonthlyProgress?.eh || 0, teamGoals.eh);
                        return (
                          <div 
                            className={`${progress.color} h-2 rounded-full transition-all duration-300`}
                            style={{ width: `${progress.progress}%` }}
                          ></div>
                        );
                      })()}
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Termine</span>
                      <span>{teamMonthlyProgress?.newAppointments || 0}/{teamGoals.newAppointments}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      {(() => {
                        const progress = calculateProgressWithColor(teamMonthlyProgress?.newAppointments || 0, teamGoals.newAppointments);
                        return (
                          <div 
                            className={`${progress.color} h-2 rounded-full transition-all duration-300`}
                            style={{ width: `${progress.progress}%` }}
                          ></div>
                        );
                      })()}
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Empfehlungen</span>
                      <span>{teamMonthlyProgress?.recommendations || 0}/{teamGoals.recommendations}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      {(() => {
                        const progress = calculateProgressWithColor(teamMonthlyProgress?.recommendations || 0, teamGoals.recommendations);
                        return (
                          <div 
                            className={`${progress.color} h-2 rounded-full transition-all duration-300`}
                            style={{ width: `${progress.progress}%` }}
                          ></div>
                        );
                      })()}
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>TIV</span>
                      <span>{teamMonthlyProgress?.tivInvitations || 0}/{teamGoals.tivInvitations}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      {(() => {
                        const progress = calculateProgressWithColor(teamMonthlyProgress?.tivInvitations || 0, teamGoals.tivInvitations);
                        return (
                          <div 
                            className={`${progress.color} h-2 rounded-full transition-all duration-300`}
                            style={{ width: `${progress.progress}%` }}
                          ></div>
                        );
                      })()}
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>BAV</span>
                      <span>{teamMonthlyProgress?.bavChecks || 0}/{teamGoals.bavChecks}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      {(() => {
                        const progress = calculateProgressWithColor(teamMonthlyProgress?.bavChecks || 0, teamGoals.bavChecks);
                        return (
                          <div 
                            className={`${progress.color} h-2 rounded-full transition-all duration-300`}
                            style={{ width: `${progress.progress}%` }}
                          ></div>
                        );
                      })()}
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>TAA</span>
                      <span>{teamMonthlyProgress?.taaInvitations || 0}/{teamGoals.taaInvitations}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      {(() => {
                        const progress = calculateProgressWithColor(teamMonthlyProgress?.taaInvitations || 0, teamGoals.taaInvitations);
                        return (
                          <div 
                            className={`${progress.color} h-2 rounded-full transition-all duration-300`}
                            style={{ width: `${progress.progress}%` }}
                          ></div>
                        );
                      })()}
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>TGS</span>
                      <span>{teamMonthlyProgress?.tgsRegistrations || 0}/{teamGoals.tgsRegistrations}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      {(() => {
                        const progress = calculateProgressWithColor(teamMonthlyProgress?.tgsRegistrations || 0, teamGoals.tgsRegistrations);
                        return (
                          <div 
                            className={`${progress.color} h-2 rounded-full transition-all duration-300`}
                            style={{ width: `${progress.progress}%` }}
                          ></div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Veranstaltungen */}
        <EventsSection />
      </div>
    </div>
  );
}
