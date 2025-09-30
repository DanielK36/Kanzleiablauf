'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { calculateProgressWithColor } from '@/lib/weekday-logic';

interface Partner {
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

interface PartnerDetailData {
  partner: Partner;
  performance_history: any[];
  team_comparison: any;
  insights: any[];
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

export default function PartnerDetailPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<string>('');
  const [partnerData, setPartnerData] = useState<PartnerDetailData | null>(null);
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly'>('weekly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPartners();
  }, []);

  useEffect(() => {
    if (selectedPartner) {
      loadPartnerDetail();
    }
  }, [selectedPartner, timeframe]);

  const loadPartners = async () => {
    try {
      const response = await fetch('/api/admin/team-radar?timeframe=weekly');
      if (response.ok) {
        const data = await response.json();
        const allPartners = data.teams.flatMap((team: any) => team.members);
        setPartners(allPartners);
        if (allPartners.length > 0 && !selectedPartner) {
          setSelectedPartner(allPartners[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading partners:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPartnerDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/partner-detail?partnerId=${selectedPartner}&timeframe=${timeframe}`);
      if (response.ok) {
        const data = await response.json();
        setPartnerData(data);
      }
    } catch (error) {
      console.error('Error loading partner detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (current: number, target: number) => {
    if (target === 0) return 'bg-gray-400';
    const progress = (current / target) * 100;
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getPerformanceText = (current: number, target: number) => {
    if (target === 0) return 'Kein Ziel';
    const progress = (current / target) * 100;
    if (progress >= 100) return 'Übererfüllt';
    if (progress >= 80) return 'Gut';
    if (progress >= 50) return 'Mittel';
    return 'Schwach';
  };

  if (loading && !partnerData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Partner-Details...</p>
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
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl">👤 Partner-Detail-Radar</CardTitle>
                <p className="text-purple-100 mt-2">Drei-Ebenen-Analyse für individuelle Partner</p>
              </div>
              <div className="flex space-x-3">
                <Select value={selectedPartner} onValueChange={setSelectedPartner}>
                  <SelectTrigger className="w-64 bg-white text-gray-900">
                    <SelectValue placeholder="Partner wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {partners.map(partner => (
                      <SelectItem key={partner.id} value={partner.id}>
                        {partner.name} ({partner.team_name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={() => setTimeframe('weekly')}
                  className={timeframe === 'weekly' ? 'bg-white text-purple-600' : 'bg-purple-500 text-white'}
                >
                  📅 Wöchentlich
                </Button>
                <Button 
                  onClick={() => setTimeframe('monthly')}
                  className={timeframe === 'monthly' ? 'bg-white text-purple-600' : 'bg-purple-500 text-white'}
                >
                  📊 Monatlich
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {partnerData && (
          <Tabs defaultValue="numbers" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="numbers" className="flex items-center gap-2">
                📊 Zahlen-Radar
              </TabsTrigger>
              <TabsTrigger value="mirror" className="flex items-center gap-2">
                🪞 Spiegel-Radar
              </TabsTrigger>
              <TabsTrigger value="frequency" className="flex items-center gap-2">
                🌌 Frequenz-Radar
              </TabsTrigger>
            </TabsList>

            {/* 1. Zahlen-Radar */}
            <TabsContent value="numbers" className="space-y-6">
              
              {/* Partner-Übersicht */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    📊 {partnerData.partner.name} - Performance ({timeframe === 'weekly' ? 'Woche' : 'Monat'})
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    {partnerData.partner.role} in Team {partnerData.partner.team_name}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                    {METRICS.map(metric => {
                      const progress = timeframe === 'weekly' ? partnerData.partner.weekly_progress : partnerData.partner.monthly_progress;
                      const current = progress[metric.key] || 0;
                      const target = progress[`${metric.key}_target`] || 0;
                      const { progress: progressPercent, color } = calculateProgressWithColor(current, target);
                      
                      return (
                        <div key={metric.key} className="text-center">
                          <div className="text-2xl mb-2">{metric.icon}</div>
                          <div className="text-sm font-medium text-gray-700">{metric.label}</div>
                          <div className="text-xs text-gray-500">{current}/{target}</div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className={`h-2 rounded-full ${color}`}
                              style={{ width: `${Math.min(progressPercent, 100)}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-600 mt-1">{Math.round(progressPercent)}%</div>
                          <Badge 
                            variant={progressPercent >= 80 ? 'default' : progressPercent >= 50 ? 'secondary' : 'destructive'}
                            className="text-xs mt-1"
                          >
                            {getPerformanceText(current, target)}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Performance-Historie */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    📈 Performance-Historie
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📊</div>
                    <div>Performance-Historie wird geladen...</div>
                    <div className="text-sm">Zeigt Entwicklung über Zeit</div>
                  </div>
                </CardContent>
              </Card>

            </TabsContent>

            {/* 2. Spiegel-Radar */}
            <TabsContent value="mirror" className="space-y-6">
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    🪞 Spiegel-Radar - Handlungsempfehlungen für {partnerData.partner.name}
                  </CardTitle>
                  <p className="text-sm text-gray-600">Individuelle Führungsimpulse</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {partnerData.insights.map((insight, index) => (
                      <div key={index} className="p-4 rounded-lg border bg-blue-50 border-blue-200 text-blue-800">
                        <div className="flex items-start gap-3">
                          <div className="text-2xl">💡</div>
                          <div className="flex-1">
                            <div className="font-medium mb-1">{insight.title}</div>
                            <div className="text-sm mb-2">{insight.description}</div>
                            <div className="text-sm font-medium">🎯 Aktion: {insight.action}</div>
                            <div className="text-xs mt-1">
                              <Badge variant={insight.priority === 'high' ? 'destructive' : insight.priority === 'medium' ? 'secondary' : 'outline'}>
                                {insight.priority === 'high' ? 'Hoch' : insight.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {partnerData.insights.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <div className="text-4xl mb-2">🪞</div>
                        <div>Keine besonderen Spiegel-Erkenntnisse</div>
                        <div className="text-sm">Partner ist im Gleichgewicht</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

            </TabsContent>

            {/* 3. Frequenz-Radar */}
            <TabsContent value="frequency" className="space-y-6">
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    🌌 Frequenz-Radar - Energieflüsse für {partnerData.partner.name}
                  </CardTitle>
                  <p className="text-sm text-gray-600">Individuelle Energie-Muster und Resonanz-Analyse</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4 bg-white">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium">{partnerData.partner.name}</h4>
                          <p className="text-sm text-gray-600">Resonanz-Achse: FA (Stärkste Metrik)</p>
                        </div>
                        <div className="flex gap-2">
                          <div className="w-6 h-6 rounded bg-green-500 flex items-center justify-center text-white text-xs">
                            H
                          </div>
                          <Badge variant="outline">Stabil</Badge>
                        </div>
                      </div>
                      
                      <div className="bg-green-50 border border-green-200 rounded p-2">
                        <div className="font-medium text-green-800">💪 Stärken:</div>
                        <div className="text-sm text-green-700">
                          Hohe FA-Zahlen, konsistente Performance
                        </div>
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