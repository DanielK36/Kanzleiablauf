"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { calculateProgressWithColor, calculateProjection } from '@/lib/weekday-logic';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [userRole, setUserRole] = useState('advisor');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [weeklyProgress, setWeeklyProgress] = useState(null);

  // Load user data on component mount
  useEffect(() => {
    if (isLoaded && user) {
      loadUserData();
      loadEvents();
    }
  }, [isLoaded, user]);

  const loadUserData = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
        setUserRole(data.role || 'advisor');
        
        // Check if user needs onboarding
        const onboardingCheck = await fetch('/api/onboarding-check');
        if (onboardingCheck.ok) {
          const onboardingData = await onboardingCheck.json();
          if (onboardingData.needsOnboarding) {
            router.push('/onboarding');
            return;
          }
        }

        // Check if user needs monthly goal update
        const monthlyGoalsCheck = await fetch('/api/monthly-goals');
        if (monthlyGoalsCheck.ok) {
          const monthlyGoalsData = await monthlyGoalsCheck.json();
          if (monthlyGoalsData.needsMonthlyGoalUpdate) {
            router.push('/onboarding?monthly=true');
            return;
          }
        }

        // Load real team data for leaders
        if (data.role === 'top_leader' || data.role === 'sub_leader') {
          const teamResponse = await fetch('/api/kanzleiablauf-data');
          if (teamResponse.ok) {
            const teamData = await teamResponse.json();
            if (teamData.success && teamData.teamTotals) {
              setTeamData(teamData.teamTotals);
            }
          }
        }

        // Load weekly progress
        const weeklyResponse = await fetch('/api/weekly-progress');
        if (weeklyResponse.ok) {
          const weeklyData = await weeklyResponse.json();
          console.log('Weekly progress data:', weeklyData);
          setWeeklyProgress(weeklyData.weeklyProgress);
          
          // Update advisor data with weekly goals
          setAdvisorData(prev => ({
            ...prev,
            weeklyGoals: weeklyData.weeklyGoals || prev.weeklyGoals
          }));
        } else {
          console.error('Failed to load weekly progress:', weeklyResponse.status);
        }

        // Load monthly progress
        const monthlyResponse = await fetch('/api/daily-entries/monthly-progress');
        if (monthlyResponse.ok) {
          const monthlyData = await monthlyResponse.json();
          console.log('Monthly progress data:', monthlyData);
          setAdvisorData(prev => ({
            ...prev,
            monthlyProgress: monthlyData.progress || prev.monthlyProgress
          }));
        }
      } else {
        console.error('Failed to load user data');
        // Fallback to mock data
        setUserRole('advisor');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      // Fallback to mock data
      setUserRole('advisor');
    } finally {
      setLoading(false);
    }
  };
  const [upcomingEvents, setUpcomingEvents] = useState([]);

  // Load events from database
  const loadEvents = async () => {
    try {
      const response = await fetch('/api/events');
      if (response.ok) {
        const data = await response.json();
        setUpcomingEvents(data.events || []);
      } else {
        console.error('Failed to load events:', response.status);
        // Fallback to mock data
        setUpcomingEvents([
          {
            id: '1',
            type: 'TIV',
            date: '2024-01-13',
            day: 'Samstag',
            time: '09:00 Uhr',
            location: 'Hauptbüro',
            topic: ''
          },
          {
            id: '2',
            type: 'TAA',
            date: '2024-01-20',
            day: 'Samstag',
            time: '10:00 Uhr',
            location: 'Konferenzraum',
            topic: ''
          },
          {
            id: '3',
            type: 'Powermeeting',
            date: '2024-01-27',
            day: 'Samstag',
            time: '14:00 Uhr',
            topic: 'Neue Vertriebsstrategien',
            location: 'Hauptbüro'
          },
          {
            id: '4',
            type: 'Direktionsmeeting',
            date: '2024-01-15',
            day: 'Montag',
            time: '16:00 Uhr',
            location: 'Konferenzraum',
            topic: ''
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  // Real team data for leader dashboard
  const [teamData, setTeamData] = useState({
    fa_current: 0,
    fa_target: 0,
    eh_current: 0,
    eh_target: 0,
    new_appointments_current: 0,
    new_appointments_target: 0,
    recommendations_current: 0,
    recommendations_target: 0,
    tiv_invitations_current: 0,
    tiv_invitations_target: 0,
    taa_invitations_current: 0,
    taa_invitations_target: 0,
    tgs_registrations_current: 0,
    tgs_registrations_target: 0,
    bav_checks_current: 0,
    bav_checks_target: 0
  });

  // Mock advisor data for advisor dashboard
  const [advisorData, setAdvisorData] = useState({
    weeklyGoals: {
      fa_weekly_target: 0,
      eh_weekly_target: 0,
      new_appointments_weekly_target: 0,
      recommendations_weekly_target: 0,
      tiv_invitations_weekly_target: 0,
      taa_invitations_weekly_target: 0,
      tgs_registrations_weekly_target: 0,
      bav_checks_weekly_target: 0,
      additional_goal: ""
    },
    monthlyProgress: {
      fa_current: 0,
      fa_target: 0,
      eh_current: 0,
      eh_target: 0,
      new_appointments_current: 0,
      new_appointments_target: 0,
      recommendations_current: 0,
      recommendations_target: 0,
      tiv_invitations_current: 0,
      tiv_invitations_target: 0,
      taa_invitations_current: 0,
      taa_invitations_target: 0,
      tgs_registrations_current: 0,
      tgs_registrations_target: 0,
      bav_checks_current: 0,
      bav_checks_target: 0
    }
  });

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Bitte melden Sie sich an
            </h1>
            <p className="text-gray-600">
              Sie müssen sich anmelden, um das Dashboard zu verwenden.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  // Leader Dashboard
  if (userRole === 'leader') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Dashboard - Führungskraft
            </h1>
            <p className="text-gray-600 mt-2">
              Willkommen zurück! Hier ist Ihr Überblick über das Team.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/kanzleiablauf">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-3xl mb-2">📊</div>
                    <h3 className="font-semibold text-lg">Kanzleiablauf</h3>
                    <p className="text-sm text-gray-600">Team-Meeting & Tagesplanung</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/wochenrueckblick">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-3xl mb-2">📋</div>
                    <h3 className="font-semibold text-lg">Wochenrückblick</h3>
                    <p className="text-sm text-gray-600">Führungsreflexion</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/team-performance">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-3xl mb-2">📈</div>
                    <h3 className="font-semibold text-lg">Team Performance</h3>
                    <p className="text-sm text-gray-600">Monatsübersicht</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Team Performance - 8 Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🏆 Team Performance</CardTitle>
              <p className="text-sm text-gray-600">Aktuelle Teamzahlen im Verhältnis zum Ziel</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { key: 'fa', label: 'FA', current: teamData.fa_current, target: teamData.fa_target },
                  { key: 'eh', label: 'EH', current: teamData.eh_current, target: teamData.eh_target },
                  { key: 'new_appointments', label: 'Neue Termine', current: teamData.new_appointments_current, target: teamData.new_appointments_target },
                  { key: 'recommendations', label: 'Empfehlungen', current: teamData.recommendations_current, target: teamData.recommendations_target },
                  { key: 'tiv_invitations', label: 'TIV', current: teamData.tiv_invitations_current, target: teamData.tiv_invitations_target },
                  { key: 'taa_invitations', label: 'TAA', current: teamData.taa_invitations_current, target: teamData.taa_invitations_target },
                  { key: 'tgs_registrations', label: 'TGS', current: teamData.tgs_registrations_current, target: teamData.tgs_registrations_target },
                  { key: 'bav_checks', label: 'bAV Checks', current: teamData.bav_checks_current, target: teamData.bav_checks_target }
                ].map((metric) => {
                  const { progress, color } = calculateProgressWithColor(metric.current, metric.target);
                  return (
                    <div key={metric.key} className="text-center">
                      <div className="bg-blue-100 rounded-t-lg p-2">
                        <div className="text-2xl font-bold text-blue-700">{metric.current}</div>
                        <div className="text-xs text-gray-600">{metric.label}</div>
                      </div>
                      <div className="bg-blue-50 rounded-b-lg p-2 border-t border-blue-200">
                        <div className="text-xs text-gray-500">Ziel: {metric.target}</div>
                        <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                          <div 
                            className={`h-1 rounded-full ${color}`}
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          {progress.toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📅 Nächste Veranstaltungen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingEvents.map((event, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">
                        {event.icon || '📅'}
                      </div>
                      <div>
                        <div className="font-semibold">{event.custom_type && event.type === 'custom' ? event.custom_type : event.type}</div>
                        <div className="text-sm text-gray-600">
                          {event.day}, {formatDate(event.date)} • {event.time}
                        </div>
                        {event.topic && (
                          <div className="text-sm text-blue-600">Thema: {event.topic}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">{event.location}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Advisor Dashboard
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Dashboard - {userData?.name?.split(' ')[0] || user?.firstName || user?.fullName || user?.emailAddresses?.[0]?.emailAddress?.split('@')?.[0] || 'Berater'}
              </h1>
              {console.log('DEBUG - User Object:', user)}
              {console.log('DEBUG - User firstName:', user?.firstName)}
              {console.log('DEBUG - User fullName:', user?.fullName)}
              {console.log('DEBUG - User emailAddresses:', user?.emailAddresses)}
              <p className="text-gray-600 mt-2">
                Willkommen zurück! Hier ist Ihr persönlicher Überblick.
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-gray-900">
                {new Date().toLocaleDateString('de-DE', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/berater">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-3xl mb-2">📝</div>
                  <h3 className="font-semibold text-lg">Tageseintrag</h3>
                  <p className="text-sm text-gray-600">Heute bearbeiten</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/weekly-goals">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-3xl mb-2">🎯</div>
                  <h3 className="font-semibold text-lg">Wochenziel</h3>
                  <p className="text-sm text-gray-600">Wochenziele setzen</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Weekly Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🎯 Wochenziel</CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyProgress ? (
              <div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {[
                    { key: 'fa', label: 'Finanzanalysen', current: weeklyProgress.fa_current, target: weeklyProgress.fa_target },
                    { key: 'eh', label: 'EH', current: weeklyProgress.eh_current, target: weeklyProgress.eh_target },
                    { key: 'new_appointments', label: 'Neue Termine', current: weeklyProgress.new_appointments_current, target: weeklyProgress.new_appointments_target },
                    { key: 'recommendations', label: 'Empfehlungen', current: weeklyProgress.recommendations_current, target: weeklyProgress.recommendations_target },
                    { key: 'tiv_invitations', label: 'TIV', current: weeklyProgress.tiv_invitations_current, target: weeklyProgress.tiv_invitations_target },
                    { key: 'taa_invitations', label: 'TAA', current: weeklyProgress.taa_invitations_current, target: weeklyProgress.taa_invitations_target },
                    { key: 'tgs_registrations', label: 'TGS', current: weeklyProgress.tgs_registrations_current, target: weeklyProgress.tgs_registrations_target },
                    { key: 'bav_checks', label: 'bAV Checks', current: weeklyProgress.bav_checks_current, target: weeklyProgress.bav_checks_target }
                  ].map((metric) => (
                    <div key={metric.key} className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="text-xs text-gray-600 mb-1">{metric.label}</div>
                      <div className="text-lg font-bold text-blue-700">{metric.current} / {metric.target}</div>
                    </div>
                  ))}
                </div>
                {weeklyProgress.additional_goal && (
                  <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                    <p className="font-medium text-green-900 text-sm">{weeklyProgress.additional_goal}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">Keine Wochenziele gesetzt</p>
                <Link href="/weekly-goals">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    Wochenziele setzen
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events and Monthly Progress */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📅 Nächste Veranstaltungen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingEvents.map((event, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">
                        {event.icon || '📅'}
                      </div>
                      <div>
                        <div className="font-semibold">{event.custom_type && event.type === 'custom' ? event.custom_type : event.type}</div>
                        <div className="text-sm text-gray-600">
                          {event.day}, {formatDate(event.date)} • {event.time}
                        </div>
                        {event.topic && (
                          <div className="text-sm text-blue-600">Thema: {event.topic}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">{event.location}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📊 Monatsfortschritt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {[
                  { key: 'fa', label: 'Finanzanalysen', current: advisorData.monthlyProgress.fa_current, target: advisorData.monthlyProgress.fa_target },
                  { key: 'eh', label: 'EH', current: advisorData.monthlyProgress.eh_current, target: advisorData.monthlyProgress.eh_target },
                  { key: 'new_appointments', label: 'Neue Termine', current: advisorData.monthlyProgress.new_appointments_current, target: advisorData.monthlyProgress.new_appointments_target },
                  { key: 'recommendations', label: 'Empfehlungen', current: advisorData.monthlyProgress.recommendations_current, target: advisorData.monthlyProgress.recommendations_target },
                  { key: 'tiv_invitations', label: 'TIV', current: advisorData.monthlyProgress.tiv_invitations_current, target: advisorData.monthlyProgress.tiv_invitations_target },
                  { key: 'taa_invitations', label: 'TAA', current: advisorData.monthlyProgress.taa_invitations_current, target: advisorData.monthlyProgress.taa_invitations_target },
                  { key: 'tgs_registrations', label: 'TGS', current: advisorData.monthlyProgress.tgs_registrations_current, target: advisorData.monthlyProgress.tgs_registrations_target },
                  { key: 'bav_checks', label: 'bAV Checks', current: advisorData.monthlyProgress.bav_checks_current, target: advisorData.monthlyProgress.bav_checks_target }
                ].map((metric) => {
                  const progress = calculateProgressWithColor(metric.current, metric.target);
                  return (
                    <div key={metric.key} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-sm font-medium">{metric.label}</div>
                        <div className="text-sm text-gray-600">{metric.current} / {metric.target}</div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${progress.color}`}
                          style={{ width: `${progress.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
