'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { calculateProgressWithColor } from '@/lib/weekday-logic';

interface AnalyticsData {
  overall_stats: any;
  team_performance: any[];
  user_activity: any[];
  trends: any;
  alerts: any[];
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

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly'>('weekly');
  const [selectedMetric, setSelectedMetric] = useState<string>('fa');

  useEffect(() => {
    loadAnalyticsData();
  }, [timeframe]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/analytics?timeframe=${timeframe}`);
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      }
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return '📈';
    if (trend < 0) return '📉';
    return '➡️';
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Analytics-Daten...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <Card className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl">📊 Analytics Dashboard</CardTitle>
                <p className="text-green-100 mt-2">Team-Performance und Benutzer-Aktivitäts-Analyse</p>
              </div>
              <div className="flex space-x-3">
                <Button 
                  onClick={() => setTimeframe('weekly')}
                  className={timeframe === 'weekly' ? 'bg-white text-green-600' : 'bg-green-500 text-white'}
                >
                  📅 Wöchentlich
                </Button>
                <Button 
                  onClick={() => setTimeframe('monthly')}
                  className={timeframe === 'monthly' ? 'bg-white text-green-600' : 'bg-green-500 text-white'}
                >
                  📊 Monatlich
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {analyticsData && (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                📊 Übersicht
              </TabsTrigger>
              <TabsTrigger value="teams" className="flex items-center gap-2">
                👥 Teams
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                👤 Benutzer
              </TabsTrigger>
              <TabsTrigger value="trends" className="flex items-center gap-2">
                📈 Trends
              </TabsTrigger>
            </TabsList>

            {/* 1. Übersicht */}
            <TabsContent value="overview" className="space-y-6">
              
              {/* Key Performance Indicators */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    🎯 Key Performance Indicators ({timeframe === 'weekly' ? 'Woche' : 'Monat'})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                    {METRICS.map(metric => {
                      const overall = analyticsData.overall_stats || {};
                      const target = overall[`${metric.key}_target`] || 0;
                      const current = overall[metric.key] || 0;
                      const { progress, color } = calculateProgressWithColor(current, target);
                      const trend = analyticsData.trends?.[metric.key] || 0;
                      
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
                          <div className={`text-xs mt-1 ${getTrendColor(trend)}`}>
                            {getTrendIcon(trend)} {trend > 0 ? '+' : ''}{trend}%
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* System Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    🚨 System-Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analyticsData.alerts?.map((alert, index) => (
                      <div key={index} className={`p-3 rounded-lg border ${
                        alert.severity === 'critical' 
                          ? 'bg-red-50 border-red-200 text-red-800' 
                          : alert.severity === 'warning'
                          ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                          : 'bg-blue-50 border-blue-200 text-blue-800'
                      }`}>
                        <div className="font-medium">
                          {alert.severity === 'critical' ? '🔴' : alert.severity === 'warning' ? '🟡' : '🔵'} {alert.title}
                        </div>
                        <div className="text-sm">{alert.description}</div>
                        <div className="text-xs mt-1">Betrifft: {alert.affected_users?.join(', ')}</div>
                      </div>
                    ))}
                    
                    {(!analyticsData.alerts || analyticsData.alerts.length === 0) && (
                      <div className="text-center py-8 text-gray-500">
                        <div className="text-4xl mb-2">✅</div>
                        <div>Keine Alerts</div>
                        <div className="text-sm">Alles läuft reibungslos</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

            </TabsContent>

            {/* 2. Teams */}
            <TabsContent value="teams" className="space-y-6">
              
              {/* Team Performance Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    👥 Team-Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr>
                          <th className="text-left p-2 font-medium">Team</th>
                          <th className="text-center p-2 font-medium">Mitglieder</th>
                          <th className="text-center p-2 font-medium">Performance</th>
                          <th className="text-center p-2 font-medium">Trend</th>
                          <th className="text-center p-2 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analyticsData.team_performance?.map((team, index) => (
                          <tr key={index} className="border-t hover:bg-gray-50">
                            <td className="p-2">
                              <div className="font-medium">{team.name}</div>
                              <div className="text-sm text-gray-600">{team.leader}</div>
                            </td>
                            <td className="text-center p-2">
                              <div className="text-sm">{team.member_count}</div>
                            </td>
                            <td className="text-center p-2">
                              <div className="text-sm">{Math.round(team.performance)}%</div>
                              <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                                <div 
                                  className={`h-1 rounded-full ${team.performance >= 80 ? 'bg-green-500' : team.performance >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                  style={{ width: `${Math.min(team.performance, 100)}%` }}
                                ></div>
                              </div>
                            </td>
                            <td className="text-center p-2">
                              <div className={`text-sm ${getTrendColor(team.trend)}`}>
                                {getTrendIcon(team.trend)} {team.trend > 0 ? '+' : ''}{team.trend}%
                              </div>
                            </td>
                            <td className="text-center p-2">
                              <Badge 
                                variant={team.performance >= 80 ? 'default' : team.performance >= 50 ? 'secondary' : 'destructive'}
                              >
                                {team.performance >= 80 ? '🟢' : team.performance >= 50 ? '🟡' : '🔴'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

            </TabsContent>

            {/* 3. Benutzer */}
            <TabsContent value="users" className="space-y-6">
              
              {/* User Activity Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    👤 Benutzer-Aktivität
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr>
                          <th className="text-left p-2 font-medium">Benutzer</th>
                          <th className="text-center p-2 font-medium">Team</th>
                          <th className="text-center p-2 font-medium">Rolle</th>
                          <th className="text-center p-2 font-medium">Aktivität</th>
                          <th className="text-center p-2 font-medium">Letzte Aktivität</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analyticsData.user_activity?.map((user, index) => (
                          <tr key={index} className="border-t hover:bg-gray-50">
                            <td className="p-2">
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-gray-600">{user.email}</div>
                            </td>
                            <td className="text-center p-2">
                              <div className="text-sm">{user.team}</div>
                            </td>
                            <td className="text-center p-2">
                              <Badge variant="outline">{user.role}</Badge>
                            </td>
                            <td className="text-center p-2">
                              <div className="text-sm">{user.activity_score}%</div>
                              <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                                <div 
                                  className={`h-1 rounded-full ${user.activity_score >= 80 ? 'bg-green-500' : user.activity_score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                  style={{ width: `${Math.min(user.activity_score, 100)}%` }}
                                ></div>
                              </div>
                            </td>
                            <td className="text-center p-2">
                              <div className="text-sm text-gray-600">{user.last_activity}</div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

            </TabsContent>

            {/* 4. Trends */}
            <TabsContent value="trends" className="space-y-6">
              
              {/* Trend Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    📈 Trend-Analyse
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    
                    {/* Positive Trends */}
                    <div>
                      <h4 className="font-medium text-green-800 mb-3">📈 Positive Trends</h4>
                      <div className="space-y-2">
                        {Object.entries(analyticsData.trends || {})
                          .filter(([_, trend]) => (trend as number) > 0)
                          .map(([metric, trend]) => {
                            const metricInfo = METRICS.find(m => m.key === metric);
                            return (
                              <div key={metric} className="flex justify-between items-center p-2 bg-green-50 rounded">
                                <div className="flex items-center gap-2">
                                  <span>{metricInfo?.icon}</span>
                                  <span className="text-sm">{metricInfo?.label}</span>
                                </div>
                                <div className="text-sm font-medium text-green-600">
                                  +{trend}%
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    {/* Negative Trends */}
                    <div>
                      <h4 className="font-medium text-red-800 mb-3">📉 Negative Trends</h4>
                      <div className="space-y-2">
                        {Object.entries(analyticsData.trends || {})
                          .filter(([_, trend]) => (trend as number) < 0)
                          .map(([metric, trend]) => {
                            const metricInfo = METRICS.find(m => m.key === metric);
                            return (
                              <div key={metric} className="flex justify-between items-center p-2 bg-red-50 rounded">
                                <div className="flex items-center gap-2">
                                  <span>{metricInfo?.icon}</span>
                                  <span className="text-sm">{metricInfo?.label}</span>
                                </div>
                                <div className="text-sm font-medium text-red-600">
                                  {trend}%
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    💡 Empfehlungen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="font-medium text-blue-800">🎯 Fokus-Bereiche</div>
                      <div className="text-sm text-blue-700 mt-1">
                        Basierend auf den Trend-Analysen sollten folgende Bereiche verstärkt werden
                      </div>
                    </div>
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="font-medium text-green-800">💪 Stärken nutzen</div>
                      <div className="text-sm text-green-700 mt-1">
                        Positive Trends als Vorbild für andere Teams nutzen
                      </div>
                    </div>
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="font-medium text-orange-800">⚠️ Risiko-Management</div>
                      <div className="text-sm text-orange-700 mt-1">
                        Negative Trends frühzeitig angehen und Gegenmaßnahmen einleiten
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </TabsContent>

          </Tabs>
        )}

      </div>
    </div>
  );
}

