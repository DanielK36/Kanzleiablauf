'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { calculateProgressWithColor } from '@/lib/weekday-logic';

interface TeamMember {
  id: string;
  name: string;
  team_name: string;
  role: string;
  personal_targets: any;
  weekly_progress: any;
  monthly_progress: any;
  daily_entries: any[];
  highlight_yesterday?: string;
  help_needed?: string;
  improvement_today?: string;
}

interface TeamData {
  id: string;
  name: string;
  members: TeamMember[];
  weekly_totals: any;
  monthly_totals: any;
}

interface RadarData {
  teams: TeamData[];
  overall_stats: any;
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

export default function TeamRadarPage() {
  const [radarData, setRadarData] = useState<RadarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly'>('weekly');

  useEffect(() => {
    loadRadarData();
  }, [timeframe]);

  const loadRadarData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/team-radar?timeframe=${timeframe}`);
      if (response.ok) {
        const data = await response.json();
        setRadarData(data);
      }
    } catch (error) {
      console.error('Error loading radar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTeamPerformanceColor = (team: TeamData, metric: string) => {
    const totals = timeframe === 'weekly' ? team.weekly_totals : team.monthly_totals;
    const target = totals[`${metric}_target`] || 0;
    const current = totals[metric] || 0;
    
    if (target === 0) return 'bg-gray-400';
    
    const progress = (current / target) * 100;
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getMemberPerformanceColor = (member: TeamMember, metric: string) => {
    const progress = timeframe === 'weekly' ? member.weekly_progress : member.monthly_progress;
    const target = progress[`${metric}_target`] || 0;
    const current = progress[metric] || 0;
    
    if (target === 0) return 'bg-gray-400';
    
    const progressPercent = (current / target) * 100;
    if (progressPercent >= 80) return 'bg-green-500';
    if (progressPercent >= 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTrendIcon = (team: TeamData, metric: string) => {
    // Simplified trend calculation - in real implementation, compare with previous period
    const totals = timeframe === 'weekly' ? team.weekly_totals : team.monthly_totals;
    const target = totals[`${metric}_target`] || 0;
    const current = totals[metric] || 0;
    
    if (target === 0) return '➖';
    const progress = (current / target) * 100;
    
    if (progress >= 100) return '📈';
    if (progress >= 80) return '➡️';
    return '📉';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Team-Radar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl">⚡ Team-Performance-Radar</CardTitle>
                <p className="text-blue-100 mt-2">Führungs-Instrument für Energie-Flow und Performance-Tracking</p>
              </div>
              <div className="flex space-x-3">
                <Button 
                  onClick={() => setTimeframe('weekly')}
                  className={timeframe === 'weekly' ? 'bg-white text-blue-600' : 'bg-blue-500 text-white'}
                >
                  📅 Wöchentlich
                </Button>
                <Button 
                  onClick={() => setTimeframe('monthly')}
                  className={timeframe === 'monthly' ? 'bg-white text-blue-600' : 'bg-blue-500 text-white'}
                >
                  📊 Monatlich
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Overall Radar - Donut Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🎯 Gesamt-Radar ({timeframe === 'weekly' ? 'Woche' : 'Monat'})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {METRICS.map(metric => {
                const overall = radarData?.overall_stats || {};
                const target = overall[`${metric.key}_target`] || 0;
                const current = overall[metric.key] || 0;
                const { progress, color } = calculateProgressWithColor(current, target);
                
                return (
                  <div key={metric.key} className="text-center">
                    <div className="text-2xl mb-2">{metric.icon}</div>
                    <div className="text-sm font-medium text-gray-700">{metric.label}</div>
                    <div className="text-xs text-gray-500">{current}/{target}</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className={`h-2 rounded-full ${color}`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">{Math.round(progress)}%</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Team Heatmap */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔥 Team-Heatmap
            </CardTitle>
            <p className="text-sm text-gray-600">Teams × Metriken - % Zielerreichung mit Trend</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left p-2 font-medium">Team</th>
                    {METRICS.map(metric => (
                      <th key={metric.key} className="text-center p-2 font-medium">
                        {metric.icon} {metric.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {radarData?.teams.map(team => (
                    <tr key={team.id} className="border-t hover:bg-gray-50">
                      <td className="p-2">
                        <Button 
                          variant="ghost" 
                          className="font-medium"
                          onClick={() => setSelectedTeam(selectedTeam === team.id ? null : team.id)}
                        >
                          {team.name} ({team.members.length})
                        </Button>
                      </td>
                      {METRICS.map(metric => {
                        const color = getTeamPerformanceColor(team, metric.key);
                        const trend = getTrendIcon(team, metric.key);
                        const totals = timeframe === 'weekly' ? team.weekly_totals : team.monthly_totals;
                        const target = totals[`${metric.key}_target`] || 0;
                        const current = totals[metric.key] || 0;
                        const progress = target > 0 ? Math.round((current / target) * 100) : 0;
                        
                        return (
                          <td key={metric.key} className="text-center p-2">
                            <div className={`inline-block w-8 h-8 rounded ${color} flex items-center justify-center text-white text-xs font-bold`}>
                              {progress}%
                            </div>
                            <div className="text-xs mt-1">{trend}</div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Team Drilldown */}
        {selectedTeam && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                👥 Team-Drilldown: {radarData?.teams.find(t => t.id === selectedTeam)?.name}
              </CardTitle>
              <p className="text-sm text-gray-600">Partner-Ampel mit Highlights und Hilfen</p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {radarData?.teams.find(t => t.id === selectedTeam)?.members.map(member => (
                  <div key={member.id} className="border rounded-lg p-4 bg-white">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium">{member.name}</h4>
                        <p className="text-sm text-gray-600">{member.role}</p>
                      </div>
                      <div className="flex gap-2">
                        {METRICS.map(metric => {
                          const color = getMemberPerformanceColor(member, metric.key);
                          const progress = timeframe === 'weekly' ? member.weekly_progress : member.monthly_progress;
                          const target = progress[`${metric.key}_target`] || 0;
                          const current = progress[metric.key] || 0;
                          const progressPercent = target > 0 ? Math.round((current / target) * 100) : 0;
                          
                          return (
                            <div key={metric.key} className="text-center">
                              <div className={`w-6 h-6 rounded ${color} flex items-center justify-center text-white text-xs`}>
                                {progressPercent}%
                              </div>
                              <div className="text-xs text-gray-500">{metric.icon}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Highlight Boxes */}
                    <div className="grid md:grid-cols-3 gap-3 text-sm">
                      {member.highlight_yesterday && (
                        <div className="bg-green-50 border border-green-200 rounded p-2">
                          <div className="font-medium text-green-800">✨ Highlight gestern:</div>
                          <div className="text-green-700">{member.highlight_yesterday}</div>
                        </div>
                      )}
                      {member.help_needed && (
                        <div className="bg-blue-50 border border-blue-200 rounded p-2">
                          <div className="font-medium text-blue-800">🆘 Hilfe gebraucht:</div>
                          <div className="text-blue-700">{member.help_needed}</div>
                        </div>
                      )}
                      {member.improvement_today && (
                        <div className="bg-orange-50 border border-orange-200 rounded p-2">
                          <div className="font-medium text-orange-800">🎯 Fokus heute:</div>
                          <div className="text-orange-700">{member.improvement_today}</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* System Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🚨 System-Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {radarData?.teams.map(team => {
                const alerts = [];
                const totals = timeframe === 'weekly' ? team.weekly_totals : team.monthly_totals;
                
                METRICS.forEach(metric => {
                  const target = totals[`${metric.key}_target`] || 0;
                  const current = totals[metric.key] || 0;
                  const progress = target > 0 ? (current / target) * 100 : 0;
                  
                  if (progress < 50) {
                    alerts.push({
                      team: team.name,
                      metric: metric.label,
                      progress: Math.round(progress),
                      severity: progress < 30 ? 'critical' : 'warning'
                    });
                  }
                });
                
                return alerts.map((alert, index) => (
                  <div key={index} className={`p-3 rounded-lg border ${
                    alert.severity === 'critical' 
                      ? 'bg-red-50 border-red-200 text-red-800' 
                      : 'bg-yellow-50 border-yellow-200 text-yellow-800'
                  }`}>
                    <div className="font-medium">
                      {alert.severity === 'critical' ? '🔴' : '🟡'} {alert.team} &lt; 50% bei {alert.metric}
                    </div>
                    <div className="text-sm">Aktuell: {alert.progress}% - Fokus setzen!</div>
                  </div>
                ));
              })}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
