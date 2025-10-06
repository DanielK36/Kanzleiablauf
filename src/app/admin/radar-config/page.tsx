'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface ConfigData {
  fa_monthly_thresholds: { red: number; yellow: number; green: number; diamond: number };
  appointments_per_fa_thresholds: { red: number; yellow: number; green: number };
  recommendations_per_fa_thresholds: { red: number; yellow: number; green: number };
  tiv_per_fa_thresholds: { red: number; yellow: number; green: number };
  tgs_per_tiv_thresholds: { red: number; yellow: number; green: number };
  bav_per_fa_thresholds: { red: number; yellow: number; green: number };
  plan_consistency_tolerance: number;
  fk_self_delta_threshold_yellow: number;
  fk_self_delta_threshold_red: number;
  target_increase_threshold: number;
  promotion_levels: number[];
  cycles: Array<{ start: string; end: string; label: string }>;
  ist_basis_cutoff_month: number;
  ist_basis_cutoff_day: number;
  team_average_windows: { short: number; long: number };
  features: {
    hard_block_inconsistent_goals: boolean;
    show_team_averages: boolean;
    show_quota_analysis: boolean;
    enable_pdf_export: boolean;
  };
}

interface TeamAverage {
  team_name: string;
  metrics: {
    fa: { avg_30: number; avg_90: number; count: number };
    eh: { avg_30: number; avg_90: number; count: number };
    new_appointments: { avg_30: number; avg_90: number; count: number };
    recommendations: { avg_30: number; avg_90: number; count: number };
    tiv_invitations: { avg_30: number; avg_90: number; count: number };
    taa_invitations: { avg_30: number; avg_90: number; count: number };
    tgs_registrations: { avg_30: number; avg_90: number; count: number };
    bav_checks: { avg_30: number; avg_90: number; count: number };
  };
  quotas: {
    appointments_per_fa: { avg_30: number; avg_90: number };
    recommendations_per_fa: { avg_30: number; avg_90: number };
    tiv_per_fa: { avg_30: number; avg_90: number };
    tgs_per_tiv: { avg_30: number; avg_90: number };
    bav_per_fa: { avg_30: number; avg_90: number };
  };
}

interface DataIntegrityIssue {
  type: 'missing_goals' | 'inconsistent_data' | 'broken_quotas' | 'missing_entries';
  severity: 'high' | 'medium' | 'low';
  description: string;
  affected_users: string[];
  suggested_action: string;
}

export default function RadarConfigPage() {
  const [configData, setConfigData] = useState<ConfigData | null>(null);
  const [teamAverages, setTeamAverages] = useState<TeamAverage[]>([]);
  const [integrityIssues, setIntegrityIssues] = useState<DataIntegrityIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('thresholds');

  useEffect(() => {
    loadConfigData();
  }, []);

  const loadConfigData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/config');
      if (response.ok) {
        const result = await response.json();
        setConfigData(result.data);
      }
      
      // Load team averages
      const avgResponse = await fetch('/api/admin/team-averages');
      if (avgResponse.ok) {
        const avgResult = await avgResponse.json();
        setTeamAverages(avgResult.data || []);
      }
      
      // Load integrity issues
      const integrityResponse = await fetch('/api/admin/integrity-check');
      if (integrityResponse.ok) {
        const integrityResult = await integrityResponse.json();
        setIntegrityIssues(integrityResult.data || []);
      }
    } catch (error) {
      console.error('Error loading config data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!configData) return;
    
    try {
      setSaving(true);
      const response = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configs: Object.entries(configData).map(([key, value]) => ({
            key,
            value,
            description: getConfigDescription(key)
          }))
        })
      });

      if (response.ok) {
        alert('Konfiguration erfolgreich gespeichert!');
      } else {
        alert('Fehler beim Speichern der Konfiguration');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Fehler beim Speichern der Konfiguration');
    } finally {
      setSaving(false);
    }
  };

  const getConfigDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      fa_monthly_thresholds: 'Ampel-Grenzen für FA pro Monat',
      appointments_per_fa_thresholds: 'Termine pro FA Schwellen',
      recommendations_per_fa_thresholds: 'Empfehlungen pro FA Schwellen',
      tiv_per_fa_thresholds: 'TIV pro FA Schwellen',
      tgs_per_tiv_thresholds: 'TGS pro TIV Schwellen',
      bav_per_fa_thresholds: 'bAV pro FA Schwellen',
      plan_consistency_tolerance: 'Toleranz für Plan-Konsistenz (%)',
      fk_self_delta_threshold_yellow: 'FK-Self Delta Schwelle Gelb (%)',
      fk_self_delta_threshold_red: 'FK-Self Delta Schwelle Rot (%)',
      target_increase_threshold: 'Ziel-Steigerung Warnung (%)',
      promotion_levels: 'Beförderungsstufen (EH/Jahr)',
      cycles: 'Planungszyklen',
      ist_basis_cutoff_month: 'IST-Basis Cutoff Monat',
      ist_basis_cutoff_day: 'IST-Basis Cutoff Tag',
      team_average_windows: 'Team-Durchschnitt Fenster (Tage)',
      features: 'Feature-Flags'
    };
    return descriptions[key] || '';
  };

  const updateThreshold = (category: string, level: string, value: number) => {
    if (!configData) return;
    
    setConfigData({
      ...configData,
      [category]: {
        ...configData[category as keyof ConfigData] as any,
        [level]: value
      }
    });
  };

  const updateFeature = (feature: string, value: boolean) => {
    if (!configData) return;
    
    setConfigData({
      ...configData,
      features: {
        ...configData.features,
        [feature]: value
      }
    });
  };

  const getIntegrityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-50 border-red-200 text-red-800';
      case 'medium': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'low': return 'bg-blue-50 border-blue-200 text-blue-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getIntegrityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🔵';
      default: return '📋';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Konfiguration...</p>
        </div>
      </div>
    );
  }

  if (!configData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-gray-600">Fehler beim Laden der Konfiguration</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl">⚙️ Radar-Konfiguration</CardTitle>
                <p className="text-purple-100 mt-2">Admin-Einstellungen für Schwellen, Quoten und System-Verhalten</p>
              </div>
              <div className="flex space-x-3">
                <Button 
                  onClick={loadConfigData}
                  variant="outline"
                  className="bg-white text-purple-600 hover:bg-purple-50"
                >
                  🔄 Aktualisieren
                </Button>
                <Button 
                  onClick={saveConfig}
                  disabled={saving}
                  className="bg-white text-purple-600 hover:bg-purple-50"
                >
                  {saving ? '💾 Speichere...' : '💾 Speichern'}
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="thresholds" className="flex items-center gap-2">
              🚦 Schwellen
            </TabsTrigger>
            <TabsTrigger value="averages" className="flex items-center gap-2">
              📊 Team-Durchschnitte
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-2">
              ⚡ Features
            </TabsTrigger>
            <TabsTrigger value="integrity" className="flex items-center gap-2">
              🔍 Integrität
            </TabsTrigger>
          </TabsList>

          {/* 1. Schwellen-Konfiguration */}
          <TabsContent value="thresholds" className="space-y-6">
            
            {/* FA Monatlich */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  👥 FA pro Monat - Ampel-Grenzen
                </CardTitle>
                <p className="text-sm text-gray-600">Schwellen für Finanzanalysen pro Monat</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="fa-red">🔴 Rot (unter)</Label>
                    <Input
                      id="fa-red"
                      type="number"
                      value={configData.fa_monthly_thresholds.red}
                      onChange={(e) => updateThreshold('fa_monthly_thresholds', 'red', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fa-yellow">🟡 Gelb</Label>
                    <Input
                      id="fa-yellow"
                      type="number"
                      value={configData.fa_monthly_thresholds.yellow}
                      onChange={(e) => updateThreshold('fa_monthly_thresholds', 'yellow', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fa-green">🟢 Grün</Label>
                    <Input
                      id="fa-green"
                      type="number"
                      value={configData.fa_monthly_thresholds.green}
                      onChange={(e) => updateThreshold('fa_monthly_thresholds', 'green', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fa-diamond">💎 Diamant (über)</Label>
                    <Input
                      id="fa-diamond"
                      type="number"
                      value={configData.fa_monthly_thresholds.diamond}
                      onChange={(e) => updateThreshold('fa_monthly_thresholds', 'diamond', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quoten-Schwellen */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📊 Quoten-Schwellen
                </CardTitle>
                <p className="text-sm text-gray-600">Schwellen für verschiedene Performance-Quoten</p>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  
                  {/* Termine/FA */}
                  <div>
                    <h4 className="font-medium mb-3">📅 Termine pro FA</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="appointments-red" className="w-12">🔴</Label>
                        <Input
                          id="appointments-red"
                          type="number"
                          step="0.1"
                          value={configData.appointments_per_fa_thresholds.red}
                          onChange={(e) => updateThreshold('appointments_per_fa_thresholds', 'red', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="appointments-yellow" className="w-12">🟡</Label>
                        <Input
                          id="appointments-yellow"
                          type="number"
                          step="0.1"
                          value={configData.appointments_per_fa_thresholds.yellow}
                          onChange={(e) => updateThreshold('appointments_per_fa_thresholds', 'yellow', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="appointments-green" className="w-12">🟢</Label>
                        <Input
                          id="appointments-green"
                          type="number"
                          step="0.1"
                          value={configData.appointments_per_fa_thresholds.green}
                          onChange={(e) => updateThreshold('appointments_per_fa_thresholds', 'green', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Empfehlungen/FA */}
                  <div>
                    <h4 className="font-medium mb-3">⭐ Empfehlungen pro FA</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="recommendations-red" className="w-12">🔴</Label>
                        <Input
                          id="recommendations-red"
                          type="number"
                          step="0.1"
                          value={configData.recommendations_per_fa_thresholds.red}
                          onChange={(e) => updateThreshold('recommendations_per_fa_thresholds', 'red', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="recommendations-yellow" className="w-12">🟡</Label>
                        <Input
                          id="recommendations-yellow"
                          type="number"
                          step="0.1"
                          value={configData.recommendations_per_fa_thresholds.yellow}
                          onChange={(e) => updateThreshold('recommendations_per_fa_thresholds', 'yellow', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="recommendations-green" className="w-12">🟢</Label>
                        <Input
                          id="recommendations-green"
                          type="number"
                          step="0.1"
                          value={configData.recommendations_per_fa_thresholds.green}
                          onChange={(e) => updateThreshold('recommendations_per_fa_thresholds', 'green', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* TIV/FA */}
                  <div>
                    <h4 className="font-medium mb-3">🤝 TIV pro FA</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="tiv-red" className="w-12">🔴</Label>
                        <Input
                          id="tiv-red"
                          type="number"
                          step="0.1"
                          value={configData.tiv_per_fa_thresholds.red}
                          onChange={(e) => updateThreshold('tiv_per_fa_thresholds', 'red', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="tiv-yellow" className="w-12">🟡</Label>
                        <Input
                          id="tiv-yellow"
                          type="number"
                          step="0.1"
                          value={configData.tiv_per_fa_thresholds.yellow}
                          onChange={(e) => updateThreshold('tiv_per_fa_thresholds', 'yellow', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="tiv-green" className="w-12">🟢</Label>
                        <Input
                          id="tiv-green"
                          type="number"
                          step="0.1"
                          value={configData.tiv_per_fa_thresholds.green}
                          onChange={(e) => updateThreshold('tiv_per_fa_thresholds', 'green', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* TGS/TIV */}
                  <div>
                    <h4 className="font-medium mb-3">📋 TGS pro TIV</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="tgs-red" className="w-12">🔴</Label>
                        <Input
                          id="tgs-red"
                          type="number"
                          step="0.1"
                          value={configData.tgs_per_tiv_thresholds.red}
                          onChange={(e) => updateThreshold('tgs_per_tiv_thresholds', 'red', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="tgs-yellow" className="w-12">🟡</Label>
                        <Input
                          id="tgs-yellow"
                          type="number"
                          step="0.1"
                          value={configData.tgs_per_tiv_thresholds.yellow}
                          onChange={(e) => updateThreshold('tgs_per_tiv_thresholds', 'yellow', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="tgs-green" className="w-12">🟢</Label>
                        <Input
                          id="tgs-green"
                          type="number"
                          step="0.1"
                          value={configData.tgs_per_tiv_thresholds.green}
                          onChange={(e) => updateThreshold('tgs_per_tiv_thresholds', 'green', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* bAV/FA */}
                  <div>
                    <h4 className="font-medium mb-3">🏦 bAV pro FA</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="bav-red" className="w-12">🔴</Label>
                        <Input
                          id="bav-red"
                          type="number"
                          step="0.1"
                          value={configData.bav_per_fa_thresholds.red}
                          onChange={(e) => updateThreshold('bav_per_fa_thresholds', 'red', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="bav-yellow" className="w-12">🟡</Label>
                        <Input
                          id="bav-yellow"
                          type="number"
                          step="0.1"
                          value={configData.bav_per_fa_thresholds.yellow}
                          onChange={(e) => updateThreshold('bav_per_fa_thresholds', 'yellow', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="bav-green" className="w-12">🟢</Label>
                        <Input
                          id="bav-green"
                          type="number"
                          step="0.1"
                          value={configData.bav_per_fa_thresholds.green}
                          onChange={(e) => updateThreshold('bav_per_fa_thresholds', 'green', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Allgemeine Schwellen */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  ⚙️ Allgemeine Schwellen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="consistency-tolerance">Plan-Konsistenz Toleranz (%)</Label>
                    <Input
                      id="consistency-tolerance"
                      type="number"
                      value={configData.plan_consistency_tolerance}
                      onChange={(e) => setConfigData({...configData, plan_consistency_tolerance: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fk-delta-yellow">FK-Self Delta Gelb (%)</Label>
                    <Input
                      id="fk-delta-yellow"
                      type="number"
                      value={configData.fk_self_delta_threshold_yellow}
                      onChange={(e) => setConfigData({...configData, fk_self_delta_threshold_yellow: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fk-delta-red">FK-Self Delta Rot (%)</Label>
                    <Input
                      id="fk-delta-red"
                      type="number"
                      value={configData.fk_self_delta_threshold_red}
                      onChange={(e) => setConfigData({...configData, fk_self_delta_threshold_red: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="target-increase">Ziel-Steigerung Warnung (%)</Label>
                    <Input
                      id="target-increase"
                      type="number"
                      value={configData.target_increase_threshold}
                      onChange={(e) => setConfigData({...configData, target_increase_threshold: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

          </TabsContent>

          {/* 2. Team-Durchschnitte */}
          <TabsContent value="averages" className="space-y-6">
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📊 Team-Durchschnitte & Benchmarks
                </CardTitle>
                <p className="text-sm text-gray-600">Automatisch berechnete Mittelwerte (rolling 30/90 Tage)</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {teamAverages.map((team, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h4 className="font-medium text-lg mb-4">{team.team_name}</h4>
                      
                      {/* KPIs */}
                      <div className="mb-4">
                        <h5 className="font-medium mb-2">📈 KPIs</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {Object.entries(team.metrics).map(([metric, data]) => (
                            <div key={metric} className="text-center p-2 bg-gray-50 rounded">
                              <div className="text-sm font-medium text-gray-700 mb-1">
                                {metric.toUpperCase().replace('_', ' ')}
                              </div>
                              <div className="text-xs text-gray-600">
                                30d: {data.avg_30.toFixed(1)} | 90d: {data.avg_90.toFixed(1)}
                              </div>
                              <div className="text-xs text-gray-500">
                                ({data.count} Einträge)
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Quoten */}
                      <div>
                        <h5 className="font-medium mb-2">📊 Quoten</h5>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          {Object.entries(team.quotas).map(([quota, data]) => (
                            <div key={quota} className="text-center p-2 bg-blue-50 rounded">
                              <div className="text-sm font-medium text-blue-700 mb-1">
                                {quota.replace('_', '/').toUpperCase()}
                              </div>
                              <div className="text-xs text-blue-600">
                                30d: {data.avg_30.toFixed(2)} | 90d: {data.avg_90.toFixed(2)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {teamAverages.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">📊</div>
                      <div>Keine Team-Durchschnitte verfügbar</div>
                      <div className="text-sm">Daten werden automatisch berechnet</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

          </TabsContent>

          {/* 3. Features */}
          <TabsContent value="features" className="space-y-6">
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  ⚡ Feature-Flags
                </CardTitle>
                <p className="text-sm text-gray-600">System-Verhalten und Funktionen ein-/ausschalten</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Hard Block für inkonsistente Ziele</div>
                      <div className="text-sm text-gray-600">Blockiert das Speichern bei inkonsistenten Jahreszielen</div>
                    </div>
                    <Switch
                      checked={configData.features.hard_block_inconsistent_goals}
                      onCheckedChange={(checked) => updateFeature('hard_block_inconsistent_goals', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Team-Durchschnitte anzeigen</div>
                      <div className="text-sm text-gray-600">Zeigt Team-Durchschnitte in allen Dashboards</div>
                    </div>
                    <Switch
                      checked={configData.features.show_team_averages}
                      onCheckedChange={(checked) => updateFeature('show_team_averages', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Quoten-Analyse anzeigen</div>
                      <div className="text-sm text-gray-600">Zeigt Quoten-Analyse in Performance-Dashboards</div>
                    </div>
                    <Switch
                      checked={configData.features.show_quota_analysis}
                      onCheckedChange={(checked) => updateFeature('show_quota_analysis', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">PDF-Export aktivieren</div>
                      <div className="text-sm text-gray-600">Ermöglicht PDF-Export für Monats- und Jahrespläne</div>
                    </div>
                    <Switch
                      checked={configData.features.enable_pdf_export}
                      onCheckedChange={(checked) => updateFeature('enable_pdf_export', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

          </TabsContent>

          {/* 4. Integritäts-Checks */}
          <TabsContent value="integrity" className="space-y-6">
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🔍 Datenintegrität & System-Checks
                </CardTitle>
                <p className="text-sm text-gray-600">Identifiziert Datenlücken und System-Probleme</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {integrityIssues.map((issue, index) => (
                    <div key={index} className={`p-4 rounded-lg border ${getIntegrityColor(issue.severity)}`}>
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">{getIntegrityIcon(issue.severity)}</div>
                        <div className="flex-1">
                          <div className="font-medium mb-1">{issue.description}</div>
                          <div className="text-sm mb-2">{issue.suggested_action}</div>
                          <div className="text-xs">
                            Betrifft: {issue.affected_users.join(', ')} | 
                            <Badge variant={issue.severity === 'high' ? 'destructive' : issue.severity === 'medium' ? 'secondary' : 'outline'} className="ml-2">
                              {issue.severity === 'high' ? 'Hoch' : issue.severity === 'medium' ? 'Mittel' : 'Niedrig'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {integrityIssues.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">✅</div>
                      <div>Keine Integritäts-Probleme gefunden</div>
                      <div className="text-sm">Alle Daten sind konsistent</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

          </TabsContent>

        </Tabs>

      </div>
    </div>
  );
}
