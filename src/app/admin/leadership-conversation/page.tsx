'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { calculateProgressWithColor } from '@/lib/weekday-logic';

interface TeamMember {
  id: string;
  name: string;
  team_name: string;
  role: string;
  daily_entries: any[];
  personal_targets: any;
}

interface TeamData {
  id: string;
  name: string;
  members: TeamMember[];
}

interface LeadershipInsight {
  type: 'success' | 'warning' | 'critical' | 'opportunity';
  title: string;
  description: string;
  action: string;
  members: string[];
}

const METRICS = [
  { key: 'fa', label: 'FA', icon: '👥' },
  { key: 'eh', label: 'EH', icon: '💰' },
  { key: 'new_appointments', label: 'Termine', icon: '📅' },
  { key: 'recommendations', label: 'Empfehlungen', icon: '⭐' },
  { key: 'tiv_invitations', label: 'TIV', icon: '🤝' },
  { key: 'taa_invitations', label: 'TAA', icon: '📞' },
  { key: 'tgs_registrations', label: 'TGS', icon: '📋' },
  { key: 'bav_checks', label: 'bAV', icon: '🏦' }
];

export default function LeadershipConversationPage() {
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<LeadershipInsight[]>([]);

  useEffect(() => {
    loadTeams();
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      generateInsights();
    }
  }, [selectedTeam, teams]);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/leadership-data');
      if (response.ok) {
        const data = await response.json();
        setTeams(data.teams);
      }
    } catch (error) {
      console.error('Error loading teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = () => {
    const team = teams.find(t => t.id === selectedTeam);
    if (!team) return;

    const newInsights: LeadershipInsight[] = [];

    // Analyze each member's performance
    team.members.forEach(member => {
      const latestEntry = member.daily_entries[0];
      if (!latestEntry) return;

      const personalTargets = member.personal_targets || {};
      
      // Check each metric
      METRICS.forEach(metric => {
        const target = personalTargets[`${metric.key}_daily`] || 0;
        const current = latestEntry[`${metric.key}_count`] || latestEntry[metric.key] || 0;
        const { progress } = calculateProgressWithColor(current, target);

        if (target > 0) {
          if (progress >= 100) {
            newInsights.push({
              type: 'success',
              title: `🎉 ${member.name} übertrifft Ziel bei ${metric.label}`,
              description: `${current}/${target} (${Math.round(progress)}%)`,
              action: 'Als Vorbild für andere nutzen',
              members: [member.name]
            });
          } else if (progress < 30) {
            newInsights.push({
              type: 'critical',
              title: `🚨 ${member.name} weit unter Ziel bei ${metric.label}`,
              description: `${current}/${target} (${Math.round(progress)}%)`,
              action: 'Sofortiges Coaching-Gespräch führen',
              members: [member.name]
            });
          } else if (progress < 50) {
            newInsights.push({
              type: 'warning',
              title: `⚠️ ${member.name} unter Ziel bei ${metric.label}`,
              description: `${current}/${target} (${Math.round(progress)}%)`,
              action: 'Unterstützung anbieten und Hindernisse besprechen',
              members: [member.name]
            });
          }
        }
      });

      // Check for help requests
      if (latestEntry.help_needed) {
        newInsights.push({
          type: 'opportunity',
          title: `🤝 ${member.name} braucht Hilfe`,
          description: latestEntry.help_needed,
          action: 'Hilfe anbieten und Ressourcen bereitstellen',
          members: [member.name]
        });
      }

      // Check for improvements
      if (latestEntry.improvement_today) {
        newInsights.push({
          type: 'opportunity',
          title: `🎯 ${member.name} hat Fokus gesetzt`,
          description: latestEntry.improvement_today,
          action: 'Fortschritt verfolgen und unterstützen',
          members: [member.name]
        });
      }
    });

    // Team-level insights
    const teamTotals = team.members.reduce((acc, member) => {
      const latestEntry = member.daily_entries[0];
      if (!latestEntry) return acc;

      METRICS.forEach(metric => {
        const current = latestEntry[`${metric.key}_count`] || latestEntry[metric.key] || 0;
        acc[metric.key] = (acc[metric.key] || 0) + current;
      });
      return acc;
    }, {} as any);

    const teamTargets = team.members.reduce((acc, member) => {
      const personalTargets = member.personal_targets || {};
      METRICS.forEach(metric => {
        const target = personalTargets[`${metric.key}_daily`] || 0;
        acc[metric.key] = (acc[metric.key] || 0) + target;
      });
      return acc;
    }, {} as any);

    METRICS.forEach(metric => {
      const teamTotal = teamTotals[metric.key] || 0;
      const teamTarget = teamTargets[metric.key] || 0;
      
      if (teamTarget > 0) {
        const teamProgress = (teamTotal / teamTarget) * 100;
        
        if (teamProgress < 50) {
          newInsights.push({
            type: 'critical',
            title: `🔥 Team ${team.name} < 50% bei ${metric.label}`,
            description: `${teamTotal}/${teamTarget} (${Math.round(teamProgress)}%)`,
            action: 'Team-Meeting einberufen und Strategie besprechen',
            members: team.members.map(m => m.name)
          });
        }
      }
    });

    setInsights(newInsights);
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'critical': return 'bg-red-50 border-red-200 text-red-800';
      case 'opportunity': return 'bg-blue-50 border-blue-200 text-blue-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success': return '🎉';
      case 'warning': return '⚠️';
      case 'critical': return '🚨';
      case 'opportunity': return '🤝';
      default: return '📋';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Führungsdaten...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <CardHeader>
            <CardTitle className="text-2xl">💬 Führungsgespräch-Vorbereitung</CardTitle>
            <p className="text-purple-100 mt-2">Tägliche Daten für gezielte Führungsgespräche</p>
          </CardHeader>
        </Card>

        {/* Team Selection */}
        <Card>
          <CardHeader>
            <CardTitle>👥 Team auswählen</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Team für Führungsgespräch wählen..." />
              </SelectTrigger>
              <SelectContent>
                {teams.map(team => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name} ({team.members.length} Mitglieder)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedTeam && (
          <>
            {/* Leadership Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🧠 Führungs-Insights
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Automatisch generierte Erkenntnisse für dein Führungsgespräch
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {insights.map((insight, index) => (
                    <div key={index} className={`p-4 rounded-lg border ${getInsightColor(insight.type)}`}>
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">{getInsightIcon(insight.type)}</div>
                        <div className="flex-1">
                          <div className="font-medium mb-1">{insight.title}</div>
                          <div className="text-sm mb-2">{insight.description}</div>
                          <div className="text-sm font-medium">💡 Aktion: {insight.action}</div>
                          <div className="text-xs mt-1">
                            Betrifft: {insight.members.join(', ')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {insights.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">📊</div>
                      <div>Keine besonderen Erkenntnisse für heute</div>
                      <div className="text-sm">Alle Ziele werden erreicht oder es gibt keine Einträge</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Team Performance Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📊 Team-Performance Heute
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-left p-2 font-medium">Mitglied</th>
                        {METRICS.map(metric => (
                          <th key={metric.key} className="text-center p-2 font-medium">
                            {metric.icon} {metric.label}
                          </th>
                        ))}
                        <th className="text-center p-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teams.find(t => t.id === selectedTeam)?.members.map(member => {
                        const latestEntry = member.daily_entries[0];
                        const personalTargets = member.personal_targets || {};
                        
                        // Calculate overall performance
                        let totalProgress = 0;
                        let metricCount = 0;
                        
                        METRICS.forEach(metric => {
                          const target = personalTargets[`${metric.key}_daily`] || 0;
                          const current = latestEntry?.[`${metric.key}_count`] || latestEntry?.[metric.key] || 0;
                          if (target > 0) {
                            totalProgress += (current / target) * 100;
                            metricCount++;
                          }
                        });
                        
                        const overallProgress = metricCount > 0 ? totalProgress / metricCount : 0;
                        
                        return (
                          <tr key={member.id} className="border-t hover:bg-gray-50">
                            <td className="p-2">
                              <div className="font-medium">{member.name}</div>
                              <div className="text-sm text-gray-600">{member.role}</div>
                            </td>
                            {METRICS.map(metric => {
                              const target = personalTargets[`${metric.key}_daily`] || 0;
                              const current = latestEntry?.[`${metric.key}_count`] || latestEntry?.[metric.key] || 0;
                              const { progress, color } = calculateProgressWithColor(current, target);
                              
                              return (
                                <td key={metric.key} className="text-center p-2">
                                  <div className="text-sm">{current}/{target}</div>
                                  <div className={`w-full bg-gray-200 rounded-full h-1 mt-1`}>
                                    <div 
                                      className={`h-1 rounded-full ${color}`}
                                      style={{ width: `${Math.min(progress, 100)}%` }}
                                    ></div>
                                  </div>
                                  <div className="text-xs text-gray-500">{Math.round(progress)}%</div>
                                </td>
                              );
                            })}
                            <td className="text-center p-2">
                              <Badge 
                                variant={overallProgress >= 80 ? 'default' : overallProgress >= 50 ? 'secondary' : 'destructive'}
                              >
                                {Math.round(overallProgress)}%
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Individual Member Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  👤 Einzelne Mitglieder
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {teams.find(t => t.id === selectedTeam)?.members.map(member => {
                    const latestEntry = member.daily_entries[0];
                    if (!latestEntry) return null;
                    
                    return (
                      <div key={member.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium">{member.name}</h4>
                            <p className="text-sm text-gray-600">{member.role}</p>
                          </div>
                          <Badge variant="outline">
                            {latestEntry.entry_date}
                          </Badge>
                        </div>
                        
                        {/* Daily Results */}
                        <div className="grid md:grid-cols-4 gap-3 mb-3">
                          {METRICS.map(metric => {
                            const target = member.personal_targets?.[`${metric.key}_daily`] || 0;
                            const current = latestEntry[`${metric.key}_count`] || latestEntry[metric.key] || 0;
                            const { progress, color } = calculateProgressWithColor(current, target);
                            
                            return (
                              <div key={metric.key} className="text-center">
                                <div className="text-lg">{metric.icon}</div>
                                <div className="text-sm font-medium">{metric.label}</div>
                                <div className="text-xs text-gray-600">{current}/{target}</div>
                                <div className={`w-full bg-gray-200 rounded-full h-1 mt-1`}>
                                  <div 
                                    className={`h-1 rounded-full ${color}`}
                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                  ></div>
                                </div>
                                <div className="text-xs text-gray-500">{Math.round(progress)}%</div>
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Qualitative Data */}
                        <div className="grid md:grid-cols-3 gap-3 text-sm">
                          {latestEntry.highlight_yesterday && (
                            <div className="bg-green-50 border border-green-200 rounded p-2">
                              <div className="font-medium text-green-800">✨ Highlight gestern:</div>
                              <div className="text-green-700">{latestEntry.highlight_yesterday}</div>
                            </div>
                          )}
                          {latestEntry.help_needed && (
                            <div className="bg-blue-50 border border-blue-200 rounded p-2">
                              <div className="font-medium text-blue-800">🆘 Hilfe gebraucht:</div>
                              <div className="text-blue-700">{latestEntry.help_needed}</div>
                            </div>
                          )}
                          {latestEntry.improvement_today && (
                            <div className="bg-orange-50 border border-orange-200 rounded p-2">
                              <div className="font-medium text-orange-800">🎯 Fokus heute:</div>
                              <div className="text-orange-700">{latestEntry.improvement_today}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

          </>
        )}

      </div>
    </div>
  );
}
