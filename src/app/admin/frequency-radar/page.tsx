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
  personal_targets: any;
  weekly_progress: any;
  monthly_progress: any;
  daily_entries: any[];
  highlight_yesterday?: string;
  help_needed?: string;
  improvement_today?: string;
  quotas: {
    appointments_per_fa: number;
    recommendations_per_fa: number;
    tiv_per_fa: number;
    tgs_per_tiv: number;
    bav_per_fa: number;
  };
  quotaAnalysis: {
    appointments_per_fa: { status: string; message: string };
    recommendations_per_fa: { status: string; message: string };
    tiv_per_fa: { status: string; message: string };
    tgs_per_tiv: { status: string; message: string };
    bav_per_fa: { status: string; message: string };
  };
}

interface TeamData {
  id: string;
  name: string;
  members: TeamMember[];
  weekly_totals: any;
  monthly_totals: any;
  teamAverages: {
    appointments_per_fa: number;
    recommendations_per_fa: number;
    tiv_per_fa: number;
    tgs_per_tiv: number;
    bav_per_fa: number;
  };
  quotaBenchmarks: {
    appointments_per_fa: { min: number; max: number; avg: number };
    recommendations_per_fa: { min: number; max: number; avg: number };
    tiv_per_fa: { min: number; max: number; avg: number };
    tgs_per_tiv: { min: number; max: number; avg: number };
    bav_per_fa: { min: number; max: number; avg: number };
  };
}

interface RadarData {
  teams: TeamData[];
  overall_stats: any;
}

interface MirrorInsight {
  type: 'strength' | 'focus' | 'risk' | 'opportunity';
  title: string;
  description: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
  members: string[];
}

interface FrequencyPattern {
  partner: string;
  energy_level: 'high' | 'medium' | 'low';
  consistency: 'stable' | 'volatile' | 'declining';
  resonance_axis: string;
  risk_factors: string[];
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

export default function FrequencyRadarPage() {
  const [radarData, setRadarData] = useState<RadarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly'>('weekly');
  const [mirrorInsights, setMirrorInsights] = useState<MirrorInsight[]>([]);
  const [frequencyPatterns, setFrequencyPatterns] = useState<FrequencyPattern[]>([]);

  useEffect(() => {
    loadRadarData();
  }, [timeframe]);

  useEffect(() => {
    if (radarData && selectedTeam) {
      generateMirrorInsights();
      generateFrequencyPatterns();
    }
  }, [radarData, selectedTeam]);

  const loadRadarData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/team-radar?timeframe=${timeframe}`);
      if (response.ok) {
        const data = await response.json();
        setRadarData(data);
        if (data.teams.length > 0 && !selectedTeam) {
          setSelectedTeam(data.teams[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading radar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMirrorInsights = () => {
    const team = radarData?.teams.find(t => t.id === selectedTeam);
    if (!team) return;

    const insights: MirrorInsight[] = [];

    // Analyze each member
    team.members.forEach(member => {
      const progress = timeframe === 'weekly' ? member.weekly_progress : member.monthly_progress;
      const personalTargets = member.personal_targets || {};
      
      // Check for strengths and weaknesses
      const strengths: string[] = [];
      const weaknesses: string[] = [];
      
      METRICS.forEach(metric => {
        const target = personalTargets[`${metric.key}_${timeframe === 'weekly' ? 'weekly' : 'monthly_target'}`] || 0;
        const current = progress[metric.key] || 0;
        const progressPercent = target > 0 ? (current / target) * 100 : 0;
        
        if (progressPercent >= 100) {
          strengths.push(metric.label);
        } else if (progressPercent < 50) {
          weaknesses.push(metric.label);
        }
      });

      // Generate insights based on patterns
      if (strengths.length > 0) {
        insights.push({
          type: 'strength',
          title: `💪 ${member.name} - Stärke als Vorbild nutzen`,
          description: `Stark in: ${strengths.join(', ')}`,
          action: `Setze ihn als Mentor für andere Partner ein`,
          priority: 'medium',
          members: [member.name]
        });
      }

      if (weaknesses.length > 0) {
        insights.push({
          type: 'focus',
          title: `🎯 ${member.name} - Fokus setzen`,
          description: `Schwäche in: ${weaknesses.join(', ')}`,
          action: `Coaching-Gespräch: ${weaknesses[0]} trainieren`,
          priority: 'high',
          members: [member.name]
        });
      }

      // Check for risk patterns
      const hasHighNumbers = progress.fa > 0 || progress.eh > 0 || progress.new_appointments > 0;
      const hasLowSoftSkills = progress.recommendations === 0 && progress.tiv_invitations === 0;
      
      if (hasHighNumbers && hasLowSoftSkills) {
        insights.push({
          type: 'risk',
          title: `⚠️ ${member.name} - Burnout-Risiko`,
          description: `Hohe Zahlen, aber keine Empfehlungen/TIV → Gefahr der Stagnation`,
          action: `Fokus auf Transfer-Training und Energie-Management`,
          priority: 'high',
          members: [member.name]
        });
      }
    });

    // Team-level insights
    const teamTotals = timeframe === 'weekly' ? team.weekly_totals : team.monthly_totals;
    
    // Check for team resonance patterns
    const highMetrics: string[] = [];
    const lowMetrics: string[] = [];
    
    METRICS.forEach(metric => {
      const target = teamTotals[`${metric.key}_target`] || 0;
      const current = teamTotals[metric.key] || 0;
      const progressPercent = target > 0 ? (current / target) * 100 : 0;
      
      if (progressPercent >= 100) {
        highMetrics.push(metric.label);
      } else if (progressPercent < 50) {
        lowMetrics.push(metric.label);
      }
    });

    if (highMetrics.length > 0 && lowMetrics.length > 0) {
      insights.push({
        type: 'opportunity',
        title: `🔄 Team-Resonanz: Energie-Umleitung`,
        description: `Stark in: ${highMetrics.join(', ')} | Schwach in: ${lowMetrics.join(', ')}`,
        action: `Team-Training: Transfer von ${highMetrics[0]} zu ${lowMetrics[0]}`,
        priority: 'medium',
        members: team.members.map(m => m.name)
      });
    }

    setMirrorInsights(insights);
  };

  const generateFrequencyPatterns = () => {
    const team = radarData?.teams.find(t => t.id === selectedTeam);
    if (!team) return;

    const patterns: FrequencyPattern[] = [];

    team.members.forEach(member => {
      const progress = timeframe === 'weekly' ? member.weekly_progress : member.monthly_progress;
      const personalTargets = member.personal_targets || {};
      
      // Calculate energy level
      let totalProgress = 0;
      let metricCount = 0;
      
      METRICS.forEach(metric => {
        const target = personalTargets[`${metric.key}_${timeframe === 'weekly' ? 'weekly' : 'monthly_target'}`] || 0;
        const current = progress[metric.key] || 0;
        if (target > 0) {
          totalProgress += (current / target) * 100;
          metricCount++;
        }
      });
      
      const avgProgress = metricCount > 0 ? totalProgress / metricCount : 0;
      
      let energyLevel: 'high' | 'medium' | 'low';
      if (avgProgress >= 80) energyLevel = 'high';
      else if (avgProgress >= 50) energyLevel = 'medium';
      else energyLevel = 'low';

      // Determine consistency (simplified - in real implementation, analyze historical data)
      const consistency: 'stable' | 'volatile' | 'declining' = 'stable';

      // Find resonance axis (strongest metric)
      let strongestMetric = '';
      let strongestValue = 0;
      
      METRICS.forEach(metric => {
        const target = personalTargets[`${metric.key}_${timeframe === 'weekly' ? 'weekly' : 'monthly_target'}`] || 0;
        const current = progress[metric.key] || 0;
        if (target > 0) {
          const value = (current / target) * 100;
          if (value > strongestValue) {
            strongestValue = value;
            strongestMetric = metric.label;
          }
        }
      });

      // Identify risk factors
      const riskFactors: string[] = [];
      if (progress.eh > 0 && progress.recommendations === 0) {
        riskFactors.push('Hohe EH, keine Empfehlungen');
      }
      if (progress.new_appointments > 0 && progress.tiv_invitations === 0) {
        riskFactors.push('Viele Termine, keine TIV');
      }
      if (avgProgress > 100 && riskFactors.length > 0) {
        riskFactors.push('Überperformance mit Schwächen');
      }

      patterns.push({
        partner: member.name,
        energy_level: energyLevel,
        consistency,
        resonance_axis: strongestMetric,
        risk_factors: riskFactors
      });
    });

    setFrequencyPatterns(patterns);
  };

  const getTeamPerformanceColor = (team: TeamData, metric: string) => {
    const totals = timeframe === 'weekly' ? team.weekly_totals : team.monthly_totals;
    const target = totals[`${metric}_target`] || 0;
    const current = totals[metric] || 0;
    
    if (target === 0) return 'bg-gray-400';
    
    const progress = (current / target) * 100;
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getMirrorInsightColor = (type: string) => {
    switch (type) {
      case 'strength': return 'bg-green-50 border-green-200 text-green-800';
      case 'focus': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'risk': return 'bg-red-50 border-red-200 text-red-800';
      case 'opportunity': return 'bg-purple-50 border-purple-200 text-purple-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getMirrorInsightIcon = (type: string) => {
    switch (type) {
      case 'strength': return '💪';
      case 'focus': return '🎯';
      case 'risk': return '⚠️';
      case 'opportunity': return '🔄';
      default: return '📋';
    }
  };

  const getEnergyLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Frequenz-Radar...</p>
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
                <CardTitle className="text-2xl">🌌 Frequenz-Radar</CardTitle>
                <p className="text-blue-100 mt-2">Führungs-Instrument für Energie-Flow und Performance-Tracking</p>
              </div>
              <div className="flex space-x-3">
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger className="w-48 bg-white text-gray-900">
                    <SelectValue placeholder="Team wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {radarData?.teams.map(team => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name} ({team.members.length} Mitglieder)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

        {/* Five-Level Radar Tabs */}
        <Tabs defaultValue="numbers" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="numbers" className="flex items-center gap-2">
              📊 Zahlen-Radar
            </TabsTrigger>
            <TabsTrigger value="averages" className="flex items-center gap-2">
              📈 Team-Durchschnitte
            </TabsTrigger>
            <TabsTrigger value="quotas" className="flex items-center gap-2">
              📊 Quoten-Analyse
            </TabsTrigger>
            <TabsTrigger value="mirror" className="flex items-center gap-2">
              🪞 Spiegel-Radar
            </TabsTrigger>
            <TabsTrigger value="frequency" className="flex items-center gap-2">
              🌌 Frequenz-Radar
            </TabsTrigger>
          </TabsList>

          {/* 1. Zahlen-Radar (Basis) */}
          <TabsContent value="numbers" className="space-y-6">
            
            {/* Gesamtteam-Zielerreichung */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📊 Gesamtteam-Zielerreichung ({timeframe === 'weekly' ? 'Woche' : 'Monat'})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                  {METRICS.map(metric => {
                    const team = radarData?.teams.find(t => t.id === selectedTeam);
                    const totals = team ? (timeframe === 'weekly' ? team.weekly_totals : team.monthly_totals) : {};
                    const target = totals[`${metric.key}_target`] || 0;
                    const current = totals[metric.key] || 0;
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

            {/* Partner-Tabelle */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  👥 Partner-Tabelle
                </CardTitle>
                <p className="text-sm text-gray-600">Klick auf Partner für Detailansicht</p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-left p-2 font-medium">Partner</th>
                        <th className="text-center p-2 font-medium">Persönlich</th>
                        <th className="text-center p-2 font-medium">Team-Beitrag</th>
                        <th className="text-center p-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {radarData?.teams.find(t => t.id === selectedTeam)?.members.map(member => {
                        const progress = timeframe === 'weekly' ? member.weekly_progress : member.monthly_progress;
                        const personalTargets = member.personal_targets || {};
                        
                        // Calculate overall performance
                        let totalProgress = 0;
                        let metricCount = 0;
                        
                        METRICS.forEach(metric => {
                          const target = personalTargets[`${metric.key}_${timeframe === 'weekly' ? 'weekly' : 'monthly_target'}`] || 0;
                          const current = progress[metric.key] || 0;
                          if (target > 0) {
                            totalProgress += (current / target) * 100;
                            metricCount++;
                          }
                        });
                        
                        const overallProgress = metricCount > 0 ? totalProgress / metricCount : 0;
                        
                        return (
                          <tr key={member.id} className="border-t hover:bg-gray-50 cursor-pointer">
                            <td className="p-2">
                              <div className="font-medium">{member.name}</div>
                              <div className="text-sm text-gray-600">{member.role}</div>
                            </td>
                            <td className="text-center p-2">
                              <div className="text-sm">{Math.round(overallProgress)}%</div>
                              <div className={`w-full bg-gray-200 rounded-full h-1 mt-1`}>
                                <div 
                                  className={`h-1 rounded-full ${overallProgress >= 80 ? 'bg-green-500' : overallProgress >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                  style={{ width: `${Math.min(overallProgress, 100)}%` }}
                                ></div>
                              </div>
                            </td>
                            <td className="text-center p-2">
                              <div className="text-sm">Team-Beitrag</div>
                              <div className="text-xs text-gray-500">Berechnung</div>
                            </td>
                            <td className="text-center p-2">
                              <Badge 
                                variant={overallProgress >= 80 ? 'default' : overallProgress >= 50 ? 'secondary' : 'destructive'}
                              >
                                {overallProgress >= 80 ? '🟢' : overallProgress >= 50 ? '🟡' : '🔴'}
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

          </TabsContent>

          {/* 2. Team-Durchschnitte */}
          <TabsContent value="averages" className="space-y-6">
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📈 Team-Durchschnitte & Benchmarks
                </CardTitle>
                <p className="text-sm text-gray-600">Rolling 30/90 Tage Durchschnitte für alle KPIs</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {radarData?.teams.find(t => t.id === selectedTeam) && (
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-lg mb-4">
                        {radarData.teams.find(t => t.id === selectedTeam)?.name}
                      </h4>
                      
                      {/* Team-Durchschnitte */}
                      <div className="mb-4">
                        <h5 className="font-medium mb-2">📊 Team-Durchschnitte (30 Tage)</h5>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          {Object.entries(radarData.teams.find(t => t.id === selectedTeam)?.teamAverages || {}).map(([quota, value]) => (
                            <div key={quota} className="text-center p-3 bg-blue-50 rounded-lg">
                              <div className="text-sm font-medium text-blue-700 mb-1">
                                {quota.replace('_', '/').toUpperCase()}
                              </div>
                              <div className="text-lg font-bold text-blue-900">
                                {typeof value === 'number' ? value.toFixed(2) : '0.00'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Quoten-Benchmarks */}
                      <div>
                        <h5 className="font-medium mb-2">📈 Quoten-Benchmarks</h5>
                        <div className="space-y-3">
                          {Object.entries(radarData.teams.find(t => t.id === selectedTeam)?.quotaBenchmarks || {}).map(([quota, benchmark]) => (
                            <div key={quota} className="p-3 bg-gray-50 rounded-lg">
                              <div className="flex justify-between items-center mb-2">
                                <div className="text-sm font-medium text-gray-700">
                                  {quota.replace('_', '/').toUpperCase()}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Min: {benchmark.min.toFixed(2)} | Max: {benchmark.max.toFixed(2)}
                                </div>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full"
                                  style={{ width: `${(benchmark.avg / benchmark.max) * 100}%` }}
                                ></div>
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                Durchschnitt: {benchmark.avg.toFixed(2)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

          </TabsContent>

          {/* 3. Quoten-Analyse */}
          <TabsContent value="quotas" className="space-y-6">
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📊 Quoten-Analyse & Performance-Vergleich
                </CardTitle>
                <p className="text-sm text-gray-600">Individuelle Quoten vs. Team-Durchschnitt</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {radarData?.teams.find(t => t.id === selectedTeam)?.members.map(member => (
                    <div key={member.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <h4 className="font-medium">{member.name}</h4>
                          <p className="text-sm text-gray-600">{member.role}</p>
                        </div>
                        <div className="text-sm text-gray-500">
                          Team: {member.team_name}
                        </div>
                      </div>

                      {/* Quoten-Vergleich */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {Object.entries(member.quotas).map(([quota, value]) => {
                          const teamAvg = radarData.teams.find(t => t.id === selectedTeam)?.teamAverages[quota as keyof typeof radarData.teams[0]['teamAverages']] || 0;
                          const analysis = member.quotaAnalysis[quota as keyof typeof member.quotaAnalysis];
                          const delta = teamAvg > 0 ? ((value - teamAvg) / teamAvg) * 100 : 0;
                          
                          return (
                            <div key={quota} className="text-center p-2 bg-gray-50 rounded">
                              <div className="text-xs font-medium text-gray-700 mb-1">
                                {quota.replace('_', '/').toUpperCase()}
                              </div>
                              <div className="text-sm font-bold text-gray-900 mb-1">
                                {value.toFixed(2)}
                              </div>
                              <div className="text-xs text-gray-600 mb-1">
                                Team: {teamAvg.toFixed(2)}
                              </div>
                              <div className="text-xs">
                                <span className={`font-medium ${
                                  delta > 10 ? 'text-green-600' : 
                                  delta < -10 ? 'text-red-600' : 
                                  'text-gray-600'
                                }`}>
                                  {delta > 0 ? '+' : ''}{delta.toFixed(0)}%
                                </span>
                              </div>
                              <Badge 
                                variant={analysis.status === 'good' ? 'default' : analysis.status === 'warning' ? 'secondary' : 'destructive'}
                                className="mt-1 text-xs"
                              >
                                {analysis.status === 'good' ? '🟢' : analysis.status === 'warning' ? '🟡' : '🔴'}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>

                      {/* Quoten-Insights */}
                      <div className="mt-3 p-2 bg-blue-50 rounded">
                        <div className="text-xs font-medium text-blue-800 mb-1">💡 Quoten-Insights:</div>
                        <div className="text-xs text-blue-700">
                          {Object.entries(member.quotaAnalysis).map(([quota, analysis]) => (
                            <div key={quota}>
                              {quota.replace('_', '/').toUpperCase()}: {analysis.message}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

          </TabsContent>

          {/* 4. Spiegel-Radar (Bedeutung + Handlung) */}
          <TabsContent value="mirror" className="space-y-6">
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🪞 Spiegel-Radar - Handlungsempfehlungen
                </CardTitle>
                <p className="text-sm text-gray-600">Automatisch generierte Führungsimpulse</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mirrorInsights.map((insight, index) => (
                    <div key={index} className={`p-4 rounded-lg border ${getMirrorInsightColor(insight.type)}`}>
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">{getMirrorInsightIcon(insight.type)}</div>
                        <div className="flex-1">
                          <div className="font-medium mb-1">{insight.title}</div>
                          <div className="text-sm mb-2">{insight.description}</div>
                          <div className="text-sm font-medium">💡 Aktion: {insight.action}</div>
                          <div className="text-xs mt-1">
                            Betrifft: {insight.members.join(', ')} | 
                            <Badge variant={insight.priority === 'high' ? 'destructive' : insight.priority === 'medium' ? 'secondary' : 'outline'} className="ml-2">
                              {insight.priority === 'high' ? 'Hoch' : insight.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {mirrorInsights.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">🪞</div>
                      <div>Keine besonderen Spiegel-Erkenntnisse</div>
                      <div className="text-sm">Alle Partner sind im Gleichgewicht</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

          </TabsContent>

          {/* 5. Frequenz-Radar (Resonanz + Energie) */}
          <TabsContent value="frequency" className="space-y-6">
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🌌 Frequenz-Radar - Energieflüsse & Resonanzachsen
                </CardTitle>
                <p className="text-sm text-gray-600">Energie-Muster und Resonanz-Analyse</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {frequencyPatterns.map((pattern, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-white">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium">{pattern.partner}</h4>
                          <p className="text-sm text-gray-600">Resonanz-Achse: {pattern.resonance_axis}</p>
                        </div>
                        <div className="flex gap-2">
                          <div className={`w-6 h-6 rounded ${getEnergyLevelColor(pattern.energy_level)} flex items-center justify-center text-white text-xs`}>
                            {pattern.energy_level === 'high' ? 'H' : pattern.energy_level === 'medium' ? 'M' : 'L'}
                          </div>
                          <Badge variant="outline">{pattern.consistency}</Badge>
                        </div>
                      </div>
                      
                      {pattern.risk_factors.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded p-2">
                          <div className="font-medium text-red-800">⚠️ Risiko-Faktoren:</div>
                          <div className="text-sm text-red-700">
                            {pattern.risk_factors.map((risk, i) => (
                              <span key={i}>
                                {risk}{i < pattern.risk_factors.length - 1 ? ', ' : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Team-Resonanz-Diagramm */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🔄 Team-Resonanz-Diagramm
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📊</div>
                  <div>Resonanz-Diagramm wird geladen...</div>
                  <div className="text-sm">Zeigt Energieflüsse zwischen Partnern</div>
                </div>
              </CardContent>
            </Card>

          </TabsContent>

        </Tabs>

      </div>
    </div>
  );
}
