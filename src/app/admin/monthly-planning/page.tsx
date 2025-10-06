'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface MonthlyPlanningData {
  currentMonth: string;
  previousMonth: string;
  ownGoals: {
    fa_monthly_target: number;
    eh_monthly_target: number;
    new_appointments_monthly_target: number;
    recommendations_monthly_target: number;
    tiv_invitations_monthly_target: number;
    taa_invitations_monthly_target: number;
    tgs_registrations_monthly_target: number;
    bav_checks_monthly_target: number;
  };
  previousMonthMirror: {
    fa: { target: number; actual: number; percentage: number; color: string };
    eh: { target: number; actual: number; percentage: number; color: string };
    new_appointments: { target: number; actual: number; percentage: number; color: string };
    recommendations: { target: number; actual: number; percentage: number; color: string };
    tiv_invitations: { target: number; actual: number; percentage: number; color: string };
    taa_invitations: { target: number; actual: number; percentage: number; color: string };
    tgs_registrations: { target: number; actual: number; percentage: number; color: string };
    bav_checks: { target: number; actual: number; percentage: number; color: string };
  };
  directPartners: Array<{
    id: string;
    name: string;
    team_name: string;
    selfGoals: any;
    fkGoals: any;
    previousMonthActual: any;
    currentMonthActual: any;
    delta: number;
    color: string;
    expanded?: boolean;
    kpis: any;
    quotas: any;
  }>;
  validationMessages: string[];
  focusAreas: string[];
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

const FOCUS_AREAS = [
  'Neukunden',
  'Empfehlungen', 
  'TIV',
  'TGS',
  'bAV',
  'Qualität/Prozess'
];

export default function MonthlyPlanningPage() {
  const [planningData, setPlanningData] = useState<MonthlyPlanningData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [ownGoals, setOwnGoals] = useState<any>({});
  const [previousMonthMissedReason, setPreviousMonthMissedReason] = useState('');
  const [targetIncreaseReason, setTargetIncreaseReason] = useState('');
  const [focusArea, setFocusArea] = useState('');
  const [expandedPartners, setExpandedPartners] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadPlanningData();
  }, [selectedMonth]);

  const loadPlanningData = async () => {
    try {
      setLoading(true);
      const month = selectedMonth || getCurrentMonth();
      const response = await fetch(`/api/admin/monthly-planning?month=${month}`);
      if (response.ok) {
        const result = await response.json();
        setPlanningData(result.data);
        setOwnGoals(result.data.ownGoals || {});
        setPreviousMonthMissedReason(result.data.previousMonthMissedReason || '');
        setTargetIncreaseReason(result.data.targetIncreaseReason || '');
        setFocusArea(result.data.focusArea || '');
      }
    } catch (error) {
      console.error('Error loading planning data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const getMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('de-DE', { year: 'numeric', month: 'long' });
  };

  const getPreviousMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    date.setMonth(date.getMonth() - 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  const getNextMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    date.setMonth(date.getMonth() + 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  const updateOwnGoal = (metric: string, value: number) => {
    setOwnGoals({
      ...ownGoals,
      [`${metric}_monthly_target`]: value
    });
  };

  const savePlanning = async () => {
    if (!planningData) return;
    
    try {
      setSaving(true);
      const response = await fetch('/api/admin/monthly-planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: selectedMonth || getCurrentMonth(),
          goals: ownGoals,
          previousMonthMissedReason,
          targetIncreaseReason,
          focusArea
        })
      });

      if (response.ok) {
        alert('Monatsplanung erfolgreich gespeichert!');
        await loadPlanningData();
      } else {
        alert('Fehler beim Speichern der Monatsplanung');
      }
    } catch (error) {
      console.error('Error saving planning:', error);
      alert('Fehler beim Speichern der Monatsplanung');
    } finally {
      setSaving(false);
    }
  };

  const exportPDF = async () => {
    try {
      const response = await fetch(`/api/admin/monthly-planning/export?month=${selectedMonth || getCurrentMonth()}`, {
        method: 'GET'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Monats-Orga-${selectedMonth || getCurrentMonth()}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Fehler beim Exportieren des PDFs');
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Fehler beim Exportieren des PDFs');
    }
  };

  const togglePartnerExpansion = (partnerId: string) => {
    const newExpanded = new Set(expandedPartners);
    if (newExpanded.has(partnerId)) {
      newExpanded.delete(partnerId);
    } else {
      newExpanded.add(partnerId);
    }
    setExpandedPartners(newExpanded);
  };

  const getAmpelColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getAmpelIcon = (percentage: number) => {
    if (percentage >= 100) return '🟢';
    if (percentage >= 80) return '🟡';
    return '🔴';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Monatsplanung...</p>
        </div>
      </div>
    );
  }

  if (!planningData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-gray-600">Fehler beim Laden der Monatsplanung</p>
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
                <CardTitle className="text-2xl">📅 Monatsplanung - Orga/Planung</CardTitle>
                <p className="text-green-100 mt-2">Organisationsplanung (keine Änderung an operativen Monatszielen)</p>
              </div>
              <div className="flex space-x-3">
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => setSelectedMonth(getPreviousMonth(selectedMonth || getCurrentMonth()))}
                    variant="outline"
                    size="sm"
                    className="bg-white text-green-600 hover:bg-green-50"
                  >
                    ←
                  </Button>
                  <Select value={selectedMonth || getCurrentMonth()} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-48 bg-white text-gray-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => {
                        const date = new Date();
                        date.setMonth(date.getMonth() - i);
                        const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                        return (
                          <SelectItem key={monthStr} value={monthStr}>
                            {getMonthName(monthStr)}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => setSelectedMonth(getNextMonth(selectedMonth || getCurrentMonth()))}
                    variant="outline"
                    size="sm"
                    className="bg-white text-green-600 hover:bg-green-50"
                  >
                    →
                  </Button>
                </div>
                <Button 
                  onClick={exportPDF}
                  variant="outline"
                  className="bg-white text-green-600 hover:bg-green-50"
                >
                  📄 PDF Export
                </Button>
                <Button 
                  onClick={savePlanning}
                  disabled={saving}
                  className="bg-white text-green-600 hover:bg-green-50"
                >
                  {saving ? '💾 Speichere...' : '💾 Speichern'}
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Validation Messages */}
        {planningData.validationMessages && planningData.validationMessages.length > 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="space-y-2">
                {planningData.validationMessages.map((message, index) => (
                  <div key={index} className="text-yellow-800 text-sm">
                    ⚠️ {message}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="own-goals" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="own-goals" className="flex items-center gap-2">
              🎯 Eigene Ziele
            </TabsTrigger>
            <TabsTrigger value="mirror" className="flex items-center gap-2">
              🪞 Vormonat-Spiegel
            </TabsTrigger>
            <TabsTrigger value="partners" className="flex items-center gap-2">
              👥 Direkte Partner
            </TabsTrigger>
            <TabsTrigger value="risks" className="flex items-center gap-2">
              ⚠️ Risiken
            </TabsTrigger>
          </TabsList>

          {/* 1. Eigene Orga-Ziele */}
          <TabsContent value="own-goals" className="space-y-6">
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🎯 Eigene Monatsziele - {getMonthName(selectedMonth || getCurrentMonth())}
                </CardTitle>
                <p className="text-sm text-gray-600">Organisationsplanung für den aktuellen Monat</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {METRICS.map(metric => (
                    <div key={metric.key}>
                      <Label htmlFor={`${metric.key}-target`} className="flex items-center gap-2">
                        {metric.icon} {metric.label}
                      </Label>
                      <Input
                        id={`${metric.key}-target`}
                        type="number"
                        value={ownGoals[`${metric.key}_monthly_target`] || 0}
                        onChange={(e) => updateOwnGoal(metric.key, parseInt(e.target.value) || 0)}
                        className="mt-1"
                      />
                    </div>
                  ))}
                </div>

                {/* Pflichtfelder */}
                <div className="mt-6 space-y-4">
                  <div>
                    <Label htmlFor="previous-month-reason">Vormonat verfehlt - Begründung</Label>
                    <Textarea
                      id="previous-month-reason"
                      value={previousMonthMissedReason}
                      onChange={(e) => setPreviousMonthMissedReason(e.target.value)}
                      placeholder="Wie stellst du sicher, dass es diesen Monat erreicht wird?"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="target-increase-reason">Ziel-Steigerung - Potenziale</Label>
                    <Textarea
                      id="target-increase-reason"
                      value={targetIncreaseReason}
                      onChange={(e) => setTargetIncreaseReason(e.target.value)}
                      placeholder="Woher kommen die zusätzlichen Potenziale?"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="focus-area">Schwerpunkt-Bereich</Label>
                    <Select value={focusArea} onValueChange={setFocusArea}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Schwerpunkt wählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        {FOCUS_AREAS.map(area => (
                          <SelectItem key={area} value={area}>
                            {area}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

          </TabsContent>

          {/* 2. Vormonat-Spiegel */}
          <TabsContent value="mirror" className="space-y-6">
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🪞 Vormonat-Spiegel - {getMonthName(planningData.previousMonth)}
                </CardTitle>
                <p className="text-sm text-gray-600">Read-only Auswertung des Vormonats</p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">KPI</th>
                        <th className="text-center p-3 font-medium">Vormonats-Ziel</th>
                        <th className="text-center p-3 font-medium">Vormonats-IST</th>
                        <th className="text-center p-3 font-medium">Erfüllung %</th>
                        <th className="text-center p-3 font-medium">Ampel</th>
                      </tr>
                    </thead>
                    <tbody>
                      {METRICS.map(metric => {
                        const data = planningData.previousMonthMirror[metric.key as keyof typeof planningData.previousMonthMirror];
                        return (
                          <tr key={metric.key} className="border-b">
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <span>{metric.icon}</span>
                                <span className="font-medium">{metric.label}</span>
                              </div>
                            </td>
                            <td className="text-center p-3">{data.target}</td>
                            <td className="text-center p-3">{data.actual}</td>
                            <td className="text-center p-3">{Math.round(data.percentage)}%</td>
                            <td className="text-center p-3">
                              <Badge variant={data.color === 'green' ? 'default' : data.color === 'yellow' ? 'secondary' : 'destructive'}>
                                {getAmpelIcon(data.percentage)}
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

          {/* 3. Direkte Partner */}
          <TabsContent value="partners" className="space-y-6">
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  👥 Direkte Partner - Kompakte Übersicht
                </CardTitle>
                <p className="text-sm text-gray-600">Self vs. FK Ziele und IST-Vergleich</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {planningData.directPartners.map(partner => (
                    <div key={partner.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <h4 className="font-medium">{partner.name}</h4>
                          <p className="text-sm text-gray-600">{partner.team_name}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-center">
                            <div className="text-sm text-gray-600">Δ(FK-Self)</div>
                            <Badge variant={partner.color === 'green' ? 'default' : partner.color === 'yellow' ? 'secondary' : 'destructive'}>
                              {partner.delta > 0 ? '+' : ''}{partner.delta}%
                            </Badge>
                          </div>
                          <Button
                            onClick={() => togglePartnerExpansion(partner.id)}
                            variant="outline"
                            size="sm"
                          >
                            {expandedPartners.has(partner.id) ? '📉 Zuklappen' : '📈 Aufklappen'}
                          </Button>
                        </div>
                      </div>

                      {/* Kompakte Zahlen */}
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div className="text-center">
                          <div className="text-gray-600">Self-Ziel</div>
                          <div className="font-medium">{partner.selfGoals.fa_monthly_target || 0}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-600">FK-Ziel</div>
                          <div className="font-medium">{partner.fkGoals.fa_monthly_target || 0}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-600">IST (Vormonat)</div>
                          <div className="font-medium">{partner.previousMonthActual.fa || 0}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-600">IST (aktuell)</div>
                          <div className="font-medium">{partner.currentMonthActual.fa || 0}</div>
                        </div>
                      </div>

                      {/* Erweiterte Ansicht */}
                      {expandedPartners.has(partner.id) && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="grid md:grid-cols-2 gap-6">
                            
                            {/* KPIs */}
                            <div>
                              <h5 className="font-medium mb-3">📊 KPIs</h5>
                              <div className="space-y-2">
                                {METRICS.map(metric => (
                                  <div key={metric.key} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                    <div className="flex items-center gap-2">
                                      <span>{metric.icon}</span>
                                      <span className="text-sm">{metric.label}</span>
                                    </div>
                                    <div className="text-sm">
                                      {partner.kpis[metric.key]?.self || 0} / {partner.kpis[metric.key]?.fk || 0}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Quoten */}
                            <div>
                              <h5 className="font-medium mb-3">📈 Quoten</h5>
                              <div className="space-y-2">
                                {Object.entries(partner.quotas).map(([quota, value]) => (
                                  <div key={quota} className="flex justify-between items-center p-2 bg-blue-50 rounded">
                                    <div className="text-sm">{quota.replace('_', '/').toUpperCase()}</div>
                                    <div className="text-sm font-medium">{value}</div>
                                  </div>
                                ))}
                              </div>
                            </div>

                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

          </TabsContent>

          {/* 4. Risiken */}
          <TabsContent value="risks" className="space-y-6">
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  ⚠️ Top-3-Risiken
                </CardTitle>
                <p className="text-sm text-gray-600">Größte Abweichungen und Risiken identifiziert</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {planningData.directPartners
                    .filter(partner => partner.color === 'red' || partner.color === 'yellow')
                    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
                    .slice(0, 3)
                    .map((partner, index) => (
                      <div key={partner.id} className={`p-4 rounded-lg border ${
                        partner.color === 'red' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
                      }`}>
                        <div className="flex items-start gap-3">
                          <div className="text-2xl">{index + 1}</div>
                          <div className="flex-1">
                            <div className="font-medium mb-1">{partner.name}</div>
                            <div className="text-sm mb-2">
                              Δ(FK-Self): {partner.delta > 0 ? '+' : ''}{partner.delta}% | 
                              Aktueller IST: {partner.currentMonthActual.fa || 0} | 
                              Vormonat IST: {partner.previousMonthActual.fa || 0}
                            </div>
                            <div className="text-sm">
                              <strong>Risiko:</strong> {partner.delta > 0 ? 'FK-Ziel deutlich höher als Self-Ziel' : 'Self-Ziel deutlich höher als FK-Ziel'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  
                  {planningData.directPartners.filter(partner => partner.color === 'red' || partner.color === 'yellow').length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">✅</div>
                      <div>Keine kritischen Risiken identifiziert</div>
                      <div className="text-sm">Alle Partner sind im grünen Bereich</div>
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
