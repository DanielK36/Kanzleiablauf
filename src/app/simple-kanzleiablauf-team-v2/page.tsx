'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@clerk/nextjs';
import { 
  calculateProgressWithColor
} from '@/lib/weekday-logic';

// Simplified Interface - much cleaner!
interface TeamMember {
  id: string;
  name: string;
  firstName?: string;
  role: string;
  teamName?: string;
  isTrainee?: boolean;
  isTeamLeader?: boolean;
  todayGoals: {
    fa_daily_target: number;
    eh_daily_target: number;
    new_appointments_daily_target: number;
    recommendations_daily_target: number;
    tiv_invitations_daily_target: number;
    bav_checks_daily_target: number;
    taa_invitations_daily_target: number;
    tgs_registrations_daily_target: number;
  };
  yesterdayResults: {
    fa_actual: number;
    eh_actual: number;
    new_appointments_actual: number;
    recommendations_actual: number;
    tiv_invitations_actual: number;
    bav_checks_actual: number;
    taa_invitations_actual: number;
    tgs_registrations_actual: number;
    todos?: string[];
    mood_feedback?: string;
    highlight_yesterday?: string;
    appointments_next_week?: number;
    weekly_improvement?: string;
    charisma_training?: boolean;
  };
  weeklyProgress: {
    fa_weekly_target: number;
    fa_actual: number;
    eh_weekly_target: number;
    eh_actual: number;
    new_appointments_weekly_target: number;
    new_appointments_actual: number;
    recommendations_weekly_target: number;
    recommendations_actual: number;
    tiv_invitations_weekly_target: number;
    tiv_invitations_actual: number;
    bav_checks_weekly_target: number;
    bav_checks_actual: number;
    taa_invitations_weekly_target: number;
    taa_invitations_actual: number;
    tgs_registrations_weekly_target: number;
    tgs_registrations_actual: number;
  };
  monthlyProgress: {
    fa_monthly_target: number;
    fa_actual: number;
    eh_monthly_target: number;
    eh_actual: number;
    new_appointments_monthly_target: number;
    new_appointments_actual: number;
    recommendations_monthly_target: number;
    recommendations_actual: number;
    tiv_invitations_monthly_target: number;
    tiv_invitations_actual: number;
    bav_checks_monthly_target: number;
    bav_checks_actual: number;
    taa_invitations_monthly_target: number;
    taa_invitations_actual: number;
    tgs_registrations_monthly_target: number;
    tgs_registrations_actual: number;
  };
}

interface TeamData {
  currentUser: any;
  teamViewName: string;
  teamMembers: TeamMember[];
  teamTotalGoals: any;
  teamYesterdayResults: any;
  teamWeeklyProgress: any;
  availableTeams: Array<{
    id: string;
    name: string;
    role: string;
  }>;
}

// Metrics definition - shared constant
const METRICS = [
  { key: 'fa', label: 'FA', fullLabel: 'Finanzanalysen' },
  { key: 'eh', label: 'EH', fullLabel: 'EH' },
  { key: 'new_appointments', label: 'Ter', fullLabel: 'Neue Termine' },
  { key: 'recommendations', label: 'Empf', fullLabel: 'Empfehlungen' },
  { key: 'tiv_invitations', label: 'TIV', fullLabel: 'TIV' },
  { key: 'taa_invitations', label: 'TAA', fullLabel: 'TAA' },
  { key: 'tgs_registrations', label: 'TGS', fullLabel: 'TGS' },
  { key: 'bav_checks', label: 'bAV', fullLabel: 'bAV Checks' }
];

export default function SimpleKanzleiablaufTeamV2Page() {
  const { user, isLoaded } = useUser();
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [activeTeam, setActiveTeam] = useState<string>('mine');
  const [loading, setLoading] = useState(true);
  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set());

  // Progress calculation helper
  const getProgress = (achieved: number, target: number) => {
    if (!target || target === 0) return { progress: 0, color: 'text-gray-500' };
    const result = calculateProgressWithColor(achieved, target);
    return {
      progress: Math.round(result.progress),
      color: result.color.replace('bg-', 'text-')
    };
  };

  // Load team data
  const loadTeamData = async (teamView = 'mine') => {
    setLoading(true);
    try {
      let url = '/api/team-view-v2?';
      
      if (teamView === 'mine') {
        url += 'role=leader';
      } else if (teamView === 'all') {
        url += 'role=admin';
      } else {
        url += `team=${teamView}&include_hierarchy=true`;
      }

      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        setTeamData(result.data);
        console.log('✅ V2 Team data loaded:', result.data);
      } else {
        console.error('❌ Failed to load V2 team data:', result.error);
      }
    } catch (error) {
      console.error('❌ Error loading V2 team data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle team view change
  const handleTeamChange = (teamId: string) => {
    setActiveTeam(teamId);
    loadTeamData(teamId);
  };

  useEffect(() => {
    if (isLoaded && user) {
      loadTeamData();
    }
  }, [isLoaded, user]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Team-Daten...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Nicht angemeldet</h1>
          <p className="text-gray-600">Bitte melde dich an, um die Team-Daten zu sehen.</p>
        </div>
      </div>
    );
  }

  if (!teamData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Keine Team-Daten verfügbar.</p>
          <Button onClick={() => loadTeamData()} className="mt-4">
            Erneut laden
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 Team-Übersicht V2</h1>
          <p className="text-gray-600">Saubere Architektur - {teamData.teamViewName}</p>
        </div>

        {/* Team Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">🎯 Team-Ansicht auswählen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {teamData.availableTeams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => handleTeamChange(team.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTeam === team.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <div className="text-left">
                    <div>{team.name}</div>
                    <div className="text-xs opacity-75">{team.role}</div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Team Yesterday Results */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">📊 Team Gesamt Ergebnis von Gestern</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {METRICS.map((metric) => {
                const achieved = teamData.teamYesterdayResults?.[`${metric.key}_actual`] || 0;
                const target = teamData.teamMembers.reduce((sum: number, member) => {
                  const memberTarget = member.todayGoals[`${metric.key}_daily_target` as keyof typeof member.todayGoals];
                  return sum + (memberTarget || 0);
                }, 0);
                const progress = getProgress(achieved, target);
                
                return (
                  <div key={metric.key} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm font-medium">{metric.fullLabel}</div>
                      <div className="text-sm text-gray-600">{achieved} / {target}</div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                      <div 
                        className={`h-2 rounded-full ${progress.color.replace('text-', 'bg-')}`}
                        style={{ width: `${progress.progress}%` }}
                      ></div>
                    </div>
                    <div className={`text-xs ${progress.color}`}>{progress.progress}%</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Team Today Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">🎯 Team Gesamt Ziel Heute</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {METRICS.map((metric) => {
                const target = teamData.teamTotalGoals?.[`${metric.key}_daily_target`] || 0;
                
                return (
                  <div key={metric.key} className="p-3 bg-gray-50 rounded-lg text-center">
                    <div className="text-sm font-medium mb-2">{metric.fullLabel}</div>
                    <div className="text-2xl font-bold text-blue-600">{target}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Individual Members */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">👥 Team-Mitglieder ({teamData.teamMembers.length})</h3>
          
          {teamData.teamMembers.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">Keine Team-Mitglieder gefunden.</p>
              </CardContent>
            </Card>
          ) : (
            teamData.teamMembers.map((member) => {
              const isExpanded = expandedMembers.has(member.id);
              
              return (
                <Card 
                  key={member.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow duration-200"
                  onClick={() => {
                    const newExpanded = new Set(expandedMembers);
                    if (isExpanded) {
                      newExpanded.delete(member.id);
                    } else {
                      newExpanded.add(member.id);
                    }
                    setExpandedMembers(newExpanded);
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg">
                          {member.firstName || member.name?.split(' ')[0] || member.name}
                        </CardTitle>
                        
                        {member.isTrainee && (
                          <Badge variant="secondary" className="text-xs">Trainee</Badge>
                        )}
                        
                        {member.isTeamLeader && (
                          <Badge variant="default" className="text-xs bg-blue-600">Team-Leader</Badge>
                        )}

                        {member.teamName && (
                          <Badge variant="outline" className="text-xs">{member.teamName}</Badge>
                        )}
                        
                        {/* Yesterday Results - Small Cards */}
                        <div className="grid grid-cols-8 gap-1">
                          {METRICS.map((metric) => {
                            const achieved = member.yesterdayResults[`${metric.key}_actual` as keyof typeof member.yesterdayResults];
                            const target = member.todayGoals[`${metric.key}_daily_target` as keyof typeof member.todayGoals];
                            const hasResults = achieved > 0;
                            
                            return (
                              <div 
                                key={metric.key} 
                                className={`text-center px-1 py-1 rounded text-xs w-10 h-10 flex flex-col justify-center ${
                                  hasResults ? 'bg-green-100 border border-green-200' : 'bg-gray-100 border border-gray-200'
                                }`}
                              >
                                <div className="font-medium text-gray-600 text-xs">{metric.label}</div>
                                <div className="font-bold text-gray-900 text-xs">{achieved}/{target}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-400">
                        {isExpanded ? '▼' : '▶'}
                      </div>
                    </div>
                  </CardHeader>
                
                  {/* Expandable Content */}
                  {isExpanded && (
                    <CardContent className="space-y-4">
                      {/* Detailed Progress Table */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Zielzahlen und Ergebnisse</h4>
                        
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse border border-gray-300">
                            <thead>
                              <tr className="bg-gray-50">
                                <th className="border border-gray-300 p-2 text-left">Kennzahl</th>
                                <th className="border border-gray-300 p-2 text-center">Heute Ziel</th>
                                <th className="border border-gray-300 p-2 text-center">Gestern Ist</th>
                                <th className="border border-gray-300 p-2 text-center">Woche Ist</th>
                                <th className="border border-gray-300 p-2 text-center">Monat Ist</th>
                                <th className="border border-gray-300 p-2 text-center">Progress</th>
                              </tr>
                            </thead>
                            <tbody>
                              {METRICS.map((metric) => {
                                const todayTarget = member.todayGoals[`${metric.key}_daily_target` as keyof typeof member.todayGoals];
                                const yesterdayActual = member.yesterdayResults[`${metric.key}_actual` as keyof typeof member.yesterdayResults];
                                const weeklyActual = member.weeklyProgress[`${metric.key}_actual` as keyof typeof member.weeklyProgress];
                                const monthlyActual = member.monthlyProgress[`${metric.key}_actual` as keyof typeof member.monthlyProgress];
                                
                                const yesterdayProgress = getProgress(yesterdayActual, todayTarget);
                                
                                return (
                                  <tr key={metric.key}>
                                    <td className="border border-gray-300 p-2 font-medium">{metric.fullLabel}</td>
                                    <td className="border border-gray-300 p-2 text-center">{todayTarget}</td>
                                    <td className="border border-gray-300 p-2 text-center">
                                      <span className={`font-semibold ${yesterdayProgress.color}`}>{yesterdayActual}</span>
                                    </td>
                                    <td className="border border-gray-300 p-2 text-center">{weeklyActual}</td>
                                    <td className="border border-gray-300 p-2 text-center">{monthlyActual}</td>
                                    <td className="border border-gray-300 p-2 text-center">
                                      <span className={`font-semibold ${yesterdayProgress.color}`}>{yesterdayProgress.progress}%</span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Todos from Yesterday */}
                      {member.yesterdayResults.todos && member.yesterdayResults.todos.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">ToDos von gestern:</h4>
                          <div className="space-y-2">
                            {member.yesterdayResults.todos.map((todo: string, index: number) => (
                              <div key={index} className="flex items-center space-x-2">
                                <span className="text-green-600">✓</span>
                                <span className="line-through text-gray-500">{todo}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Charisma Training */}
                      {member.yesterdayResults.charisma_training && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Gestern abgeschlossen:</h4>
                          <div className="flex items-center space-x-2">
                            <span className="text-green-600">✓</span>
                            <span className="line-through text-gray-500">Charisma-Training</span>
                          </div>
                        </div>
                      )}

                      {/* Questions from Yesterday */}
                      {(member.yesterdayResults.highlight_yesterday || 
                        member.yesterdayResults.appointments_next_week || 
                        member.yesterdayResults.weekly_improvement) && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Fragen von gestern:</h4>
                          <div className="space-y-3">
                            {member.yesterdayResults.highlight_yesterday && (
                              <div>
                                <p className="text-sm font-medium text-gray-700">Diamanten:</p>
                                <p className="text-sm text-gray-600">{member.yesterdayResults.highlight_yesterday}</p>
                              </div>
                            )}
                            {member.yesterdayResults.appointments_next_week && member.yesterdayResults.appointments_next_week > 0 && (
                              <div>
                                <p className="text-sm font-medium text-gray-700">Termine nächste Woche:</p>
                                <p className="text-sm text-gray-600">{member.yesterdayResults.appointments_next_week}</p>
                              </div>
                            )}
                            {member.yesterdayResults.weekly_improvement && (
                              <div>
                                <p className="text-sm font-medium text-gray-700">Wöchentliche Verbesserung:</p>
                                <p className="text-sm text-gray-600">{member.yesterdayResults.weekly_improvement}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Weekly & Monthly Progress */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Wochen- & Monatsergebnis</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {METRICS.map((metric) => {
                            const weeklyActual = member.weeklyProgress[`${metric.key}_actual` as keyof typeof member.weeklyProgress];
                            const weeklyTarget = member.weeklyProgress[`${metric.key}_weekly_target` as keyof typeof member.weeklyProgress];
                            const monthlyActual = member.monthlyProgress[`${metric.key}_actual` as keyof typeof member.monthlyProgress];
                            const monthlyTarget = member.monthlyProgress[`${metric.key}_monthly_target` as keyof typeof member.monthlyProgress];
                            
                            const weeklyProgress = getProgress(weeklyActual, weeklyTarget);
                            const monthlyProgress = getProgress(monthlyActual, monthlyTarget);
                            
                            return (
                              <div key={metric.key} className="p-3 bg-gray-50 rounded-lg">
                                <div className="text-sm font-medium mb-3 text-center">{metric.fullLabel}</div>
                                
                                {/* Weekly Progress */}
                                <div className="mb-3">
                                  <div className="text-xs text-gray-600 mb-1">
                                    Woche: {weeklyActual} / {weeklyTarget}
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full ${weeklyProgress.color.replace('text-', 'bg-')}`}
                                      style={{ width: `${weeklyProgress.progress}%` }}
                                    ></div>
                                  </div>
                                </div>
                                
                                {/* Monthly Progress */}
                                <div>
                                  <div className="text-xs text-gray-600 mb-1">
                                    Monat: {monthlyActual} / {monthlyTarget}
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full ${monthlyProgress.color.replace('text-', 'bg-')}`}
                                      style={{ width: `${monthlyProgress.progress}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })
          )}
        </div>

        {/* Debug Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">🔍 Debug Info</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
              {JSON.stringify({
                viewName: teamData.teamViewName,
                memberCount: teamData.teamMembers.length,
                members: teamData.teamMembers.map(m => ({
                  name: m.name,
                  teamName: m.teamName,
                  isLeader: m.isTeamLeader
                }))
              }, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
