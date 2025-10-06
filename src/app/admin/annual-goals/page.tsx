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
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';

interface AnnualGoalsData {
  currentCycle: {
    start: string;
    end: string;
    label: string;
  };
  istBasis: {
    fa_actual: number;
    eh_actual: number;
    new_appointments_actual: number;
    recommendations_actual: number;
    tiv_invitations_actual: number;
    taa_invitations_actual: number;
    tgs_registrations_actual: number;
    bav_checks_actual: number;
    is_editable: boolean;
  };
  selfGoals: {
    fa_yearly_target: number;
    eh_yearly_target: number;
    new_appointments_yearly_target: number;
    recommendations_yearly_target: number;
    tiv_invitations_yearly_target: number;
    taa_invitations_yearly_target: number;
    tgs_registrations_yearly_target: number;
    bav_checks_yearly_target: number;
  };
  fkGoals: {
    fa_yearly_target: number;
    eh_yearly_target: number;
    new_appointments_yearly_target: number;
    recommendations_yearly_target: number;
    tiv_invitations_yearly_target: number;
    taa_invitations_yearly_target: number;
    tgs_registrations_yearly_target: number;
    bav_checks_yearly_target: number;
    fk_comment: string;
  };
  planMonths: Array<{
    month: string;
    monthName: string;
    fa_plan: number;
    eh_plan: number;
    new_appointments_plan: number;
    recommendations_plan: number;
    tiv_invitations_plan: number;
    taa_invitations_plan: number;
    tgs_registrations_plan: number;
    bav_checks_plan: number;
  }>;
  consistencyCheck: {
    isConsistent: boolean;
    tolerance: number;
    deviations: Array<{
      metric: string;
      self: number;
      fk: number;
      delta: number;
      color: string;
    }>;
  };
  teamOverview: Array<{
    id: string;
    name: string;
    team_name: string;
    selfGoals: any;
    fkGoals: any;
    istBasis: any;
    istCurrent: any;
    pathExpectation: any;
    onTrack: boolean;
    color: string;
  }>;
  isLocked: boolean;
  lockExpiry: string | null;
}

const METRICS = [
  { key: 'fa', label: 'FA', icon: '👥', unit: 'Stück' },
  { key: 'eh', label: 'EH', icon: '💰', unit: '€' },
  { key: 'new_appointments', label: 'Termine', icon: '📅', unit: 'Stück' },
  { key: 'recommendations', label: 'Empfehlungen', icon: '⭐', unit: 'Stück' },
  { key: 'tiv_invitations', label: 'TIV', icon: '🤝', unit: 'Stück' },
  { key: 'taa_invitations', label: 'TAA', icon: '📞', unit: 'Stück' },
  { key: 'tgs_registrations', label: 'TGS', icon: '📋', unit: 'Stück' },
  { key: 'bav_checks', label: 'bAV', icon: '🏦', unit: 'Stück' }
];

const CYCLES = [
  { start: '2025-01-01', end: '2025-12-31', label: 'bis 30.12.2025' },
  { start: '2025-07-01', end: '2026-06-30', label: 'bis 30.06.2026' }
];

export default function AnnualGoalsPage() {
  const [goalsData, setGoalsData] = useState<AnnualGoalsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [istBasis, setIstBasis] = useState<any>({});
  const [selfGoals, setSelfGoals] = useState<any>({});
  const [fkGoals, setFkGoals] = useState<any>({});
  const [fkComment, setFkComment] = useState('');
  const [planMonths, setPlanMonths] = useState<any[]>([]);
  const [isFinalized, setIsFinalized] = useState(false);

  useEffect(() => {
    loadGoalsData();
  }, [selectedCycle]);

  const loadGoalsData = async () => {
    try {
      setLoading(true);
      const cycle = selectedCycle || CYCLES[0].label;
      const response = await fetch(`/api/admin/annual-goals?cycle=${encodeURIComponent(cycle)}`);
      if (response.ok) {
        const result = await response.json();
        setGoalsData(result.data);
        setIstBasis(result.data.istBasis || {});
        setSelfGoals(result.data.selfGoals || {});
        setFkGoals(result.data.fkGoals || {});
        setFkComment(result.data.fkGoals?.fk_comment || '');
        setPlanMonths(result.data.planMonths || []);
        setIsFinalized(result.data.isLocked || false);
      }
    } catch (error) {
      console.error('Error loading goals data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateIstBasis = (metric: string, value: number) => {
    setIstBasis({
      ...istBasis,
      [`${metric}_actual`]: value
    });
  };

  const updateSelfGoal = (metric: string, value: number) => {
    setSelfGoals({
      ...selfGoals,
      [`${metric}_yearly_target`]: value
    });
  };

  const updateFkGoal = (metric: string, value: number) => {
    setFkGoals({
      ...fkGoals,
      [`${metric}_yearly_target`]: value
    });
  };

  const updatePlanMonth = (monthIndex: number, metric: string, value: number) => {
    const newPlanMonths = [...planMonths];
    newPlanMonths[monthIndex] = {
      ...newPlanMonths[monthIndex],
      [`${metric}_plan`]: value
    };
    setPlanMonths(newPlanMonths);
  };

  const saveStep = async (step: number) => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/annual-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cycle: selectedCycle || CYCLES[0].label,
          step,
          istBasis,
          selfGoals,
          fkGoals: { ...fkGoals, fk_comment: fkComment },
          planMonths
        })
      });

      if (response.ok) {
        if (step < 4) {
          setCurrentStep(step + 1);
        } else {
          setIsFinalized(true);
          alert('Jahresplan erfolgreich finalisiert!');
        }
        await loadGoalsData();
      } else {
        alert('Fehler beim Speichern');
      }
    } catch (error) {
      console.error('Error saving step:', error);
      alert('Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const exportPDF = async () => {
    try {
      const response = await fetch(`/api/admin/annual-goals/export?cycle=${encodeURIComponent(selectedCycle || CYCLES[0].label)}`, {
        method: 'GET'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Jahresplan-${selectedCycle || CYCLES[0].label}.pdf`;
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

  const getConsistencyStatus = () => {
    if (!goalsData) return { isConsistent: true, deviations: [] };
    
    const deviations = [];
    METRICS.forEach(metric => {
      const self = selfGoals[`${metric.key}_yearly_target`] || 0;
      const fk = fkGoals[`${metric.key}_yearly_target`] || 0;
      const delta = self > 0 ? Math.abs(fk - self) / self * 100 : 0;
      
      if (delta >= 25) {
        deviations.push({
          metric: metric.label,
          self,
          fk,
          delta: Math.round(delta),
          color: delta >= 50 ? 'red' : 'yellow'
        });
      }
    });

    return {
      isConsistent: deviations.length === 0,
      deviations
    };
  };

  const getAmpelColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getAmpelIcon = (percentage: number) => {
    if (percentage >= 90) return '🟢';
    if (percentage >= 70) return '🟡';
    return '🔴';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Jahresziele...</p>
        </div>
      </div>
    );
  }

  if (!goalsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-gray-600">Fehler beim Laden der Jahresziele</p>
        </div>
      </div>
    );
  }

  const consistencyStatus = getConsistencyStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl">🎯 Jahresziele - Planer & Spiegel</CardTitle>
                <p className="text-blue-100 mt-2">Einmaliges Planungs-Dokument pro Zyklus</p>
              </div>
              <div className="flex space-x-3">
                <Select value={selectedCycle || CYCLES[0].label} onValueChange={setSelectedCycle}>
                  <SelectTrigger className="w-64 bg-white text-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CYCLES.map(cycle => (
                      <SelectItem key={cycle.label} value={cycle.label}>
                        {cycle.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={exportPDF}
                  variant="outline"
                  className="bg-white text-blue-600 hover:bg-blue-50"
                >
                  📄 PDF Export
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Progress Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Fortschritt</span>
              <span className="text-sm text-gray-600">Schritt {currentStep} von 4</span>
            </div>
            <Progress value={(currentStep / 4) * 100} className="h-2" />
          </CardContent>
        </Card>

        <Tabs value={`step-${currentStep}`} onValueChange={(value) => setCurrentStep(parseInt(value.split('-')[1]))} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="step-1" className="flex items-center gap-2">
              📊 IST-Basis
            </TabsTrigger>
            <TabsTrigger value="step-2" className="flex items-center gap-2">
              🎯 Jahresziele
            </TabsTrigger>
            <TabsTrigger value="step-3" className="flex items-center gap-2">
              📅 Plan-Monate
            </TabsTrigger>
            <TabsTrigger value="step-4" className="flex items-center gap-2">
              🔒 Commit & Lock
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-2">
              👥 Team-Übersicht
            </TabsTrigger>
          </TabsList>

          {/* Schritt 1: IST-Basis */}
          <TabsContent value="step-1" className="space-y-6">
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📊 IST-Basis (bis 01.10.)
                </CardTitle>
                <p className="text-sm text-gray-600">Auto-Summen je KPI (Zyklusstart → 01.10.) - Editierbar falls Reportabweichung</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {METRICS.map(metric => (
                    <div key={metric.key}>
                      <Label htmlFor={`ist-${metric.key}`} className="flex items-center gap-2">
                        {metric.icon} {metric.label}
                      </Label>
                      <Input
                        id={`ist-${metric.key}`}
                        type="number"
                        value={istBasis[`${metric.key}_actual`] || 0}
                        onChange={(e) => updateIstBasis(metric.key, parseInt(e.target.value) || 0)}
                        disabled={!goalsData.istBasis.is_editable}
                        className="mt-1"
                      />
                      <div className="text-xs text-gray-500 mt-1">{metric.unit}</div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6">
                  <Button 
                    onClick={() => saveStep(1)}
                    disabled={saving || !goalsData.istBasis.is_editable}
                    className="w-full"
                  >
                    {saving ? '💾 Speichere...' : '💾 IST-Basis speichern'}
                  </Button>
                </div>
              </CardContent>
            </Card>

          </TabsContent>

          {/* Schritt 2: Jahresziele */}
          <TabsContent value="step-2" className="space-y-6">
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🎯 Jahresziele (Self & FK)
                </CardTitle>
                <p className="text-sm text-gray-600">8 KPIs: nebeneinander (Self, FK) mit Sofort-Spiegel</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {METRICS.map(metric => {
                    const selfValue = selfGoals[`${metric.key}_yearly_target`] || 0;
                    const fkValue = fkGoals[`${metric.key}_yearly_target`] || 0;
                    const delta = selfValue > 0 ? ((fkValue - selfValue) / selfValue) * 100 : 0;
                    const color = Math.abs(delta) >= 50 ? 'red' : Math.abs(delta) >= 25 ? 'yellow' : 'green';
                    
                    return (
                      <div key={metric.key} className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-xl">{metric.icon}</span>
                          <span className="font-medium text-lg">{metric.label}</span>
                          <span className="text-sm text-gray-500">({metric.unit})</span>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`self-${metric.key}`}>Self-Ziel</Label>
                            <Input
                              id={`self-${metric.key}`}
                              type="number"
                              value={selfValue}
                              onChange={(e) => updateSelfGoal(metric.key, parseInt(e.target.value) || 0)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`fk-${metric.key}`}>FK-Ziel</Label>
                            <Input
                              id={`fk-${metric.key}`}
                              type="number"
                              value={fkValue}
                              onChange={(e) => updateFkGoal(metric.key, parseInt(e.target.value) || 0)}
                              className="mt-1"
                            />
                          </div>
                        </div>
                        
                        <div className="mt-3 flex items-center justify-between">
                          <div className="text-sm">
                            Δ%: <span className={`font-medium ${color === 'red' ? 'text-red-600' : color === 'yellow' ? 'text-yellow-600' : 'text-green-600'}`}>
                              {delta > 0 ? '+' : ''}{Math.round(delta)}%
                            </span>
                          </div>
                          <Badge variant={color === 'red' ? 'destructive' : color === 'yellow' ? 'secondary' : 'default'}>
                            {color === 'red' ? '🔴' : color === 'yellow' ? '🟡' : '🟢'}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* FK-Kommentar bei großer Abweichung */}
                {consistencyStatus.deviations.length > 0 && (
                  <div className="mt-6">
                    <Label htmlFor="fk-comment">FK-Kommentar (Pflicht bei großer Abweichung)</Label>
                    <Textarea
                      id="fk-comment"
                      value={fkComment}
                      onChange={(e) => setFkComment(e.target.value)}
                      placeholder="Begründung für Abweichungen zwischen Self und FK Zielen..."
                      className="mt-1"
                    />
                  </div>
                )}

                <div className="mt-6">
                  <Button 
                    onClick={() => saveStep(2)}
                    disabled={saving}
                    className="w-full"
                  >
                    {saving ? '💾 Speichere...' : '💾 Jahresziele speichern'}
                  </Button>
                </div>
              </CardContent>
            </Card>

          </TabsContent>

          {/* Schritt 3: Plan-Monatskacheln */}
          <TabsContent value="step-3" className="space-y-6">
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📅 Plan-Monatskacheln (Restmonate)
                </CardTitle>
                <p className="text-sm text-gray-600">Kacheln pro verbleibendem Monat bis Zyklusende</p>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {planMonths.map((month, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-3">{month.monthName}</h4>
                      <div className="space-y-2">
                        {METRICS.map(metric => (
                          <div key={metric.key}>
                            <Label htmlFor={`plan-${index}-${metric.key}`} className="text-xs">
                              {metric.icon} {metric.label}
                            </Label>
                            <Input
                              id={`plan-${index}-${metric.key}`}
                              type="number"
                              value={month[`${metric.key}_plan`] || 0}
                              onChange={(e) => updatePlanMonth(index, metric.key, parseInt(e.target.value) || 0)}
                              className="h-8 text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Plan-Konsistenz Check */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h5 className="font-medium text-blue-800 mb-2">📊 Plan-Konsistenz Check</h5>
                  <div className="text-sm text-blue-700">
                    <p>Echtzeit-Prüfung: (IST-Basis + Σ Restmonate) = Jahresziel (pro KPI)</p>
                    <p>Toleranz: ±2% (Admin-änderbar)</p>
                  </div>
                </div>

                {/* Heuristik-Checks */}
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h5 className="font-medium text-yellow-800 mb-2">💡 Heuristik-Checks (nur Hinweise)</h5>
                  <div className="text-sm text-yellow-700 space-y-1">
                    <p>• TIV/FA zu niedrig (&lt;0.4) → "Netzwerkaufbau zu schwach"</p>
                    <p>• TGS/TIV &lt; 1/5 → "Conversion zu schwach"</p>
                    <p>• Empf/FA &lt;1 → "Empfehlungsgespräch schwach"</p>
                    <p>• bAV/FA &lt;0.5 → "Qualitätsanker fehlt"</p>
                  </div>
                </div>

                <div className="mt-6">
                  <Button 
                    onClick={() => saveStep(3)}
                    disabled={saving}
                    className="w-full"
                  >
                    {saving ? '💾 Speichere...' : '💾 Plan-Monate speichern'}
                  </Button>
                </div>
              </CardContent>
            </Card>

          </TabsContent>

          {/* Schritt 4: Commit & Lock */}
          <TabsContent value="step-4" className="space-y-6">
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🔒 Commit & Lock
                </CardTitle>
                <p className="text-sm text-gray-600">Plan finalisieren und schreibgeschützt machen</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="finalize-plan"
                      checked={isFinalized}
                      onCheckedChange={setIsFinalized}
                    />
                    <Label htmlFor="finalize-plan" className="text-sm">
                      Plan finalisieren (Schreibschutz aktivieren)
                    </Label>
                  </div>
                  
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="font-medium text-red-800 mb-2">⚠️ Wichtiger Hinweis</div>
                    <div className="text-sm text-red-700">
                      Nach der Finalisierung ist der Plan schreibgeschützt. Änderungen sind nur noch mit Admin-Override möglich.
                      Änderungsfenster: 7 Tage offen (Admin override).
                    </div>
                  </div>

                  {goalsData.lockExpiry && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="font-medium text-blue-800 mb-2">🔓 Lock-Status</div>
                      <div className="text-sm text-blue-700">
                        Plan ist gesperrt bis: {new Date(goalsData.lockExpiry).toLocaleDateString('de-DE')}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <Button 
                    onClick={() => saveStep(4)}
                    disabled={saving || !isFinalized}
                    className="w-full"
                  >
                    {saving ? '💾 Finalisiere...' : '🔒 Plan finalisieren & sperren'}
                  </Button>
                </div>
              </CardContent>
            </Card>

          </TabsContent>

          {/* Team-Übersicht Tab */}
          <TabsContent value="team" className="space-y-6">
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  👥 Team-Übersicht
                </CardTitle>
                <p className="text-sm text-gray-600">Partner | Self-Jahresziel | FK-Jahresziel | Δ% | IST-Basis | IST aktuell | Pfad-Erwartung</p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">Partner</th>
                        <th className="text-center p-3 font-medium">Self-Ziel</th>
                        <th className="text-center p-3 font-medium">FK-Ziel</th>
                        <th className="text-center p-3 font-medium">Δ%</th>
                        <th className="text-center p-3 font-medium">IST-Basis</th>
                        <th className="text-center p-3 font-medium">IST aktuell</th>
                        <th className="text-center p-3 font-medium">Pfad-Erwartung</th>
                        <th className="text-center p-3 font-medium">Auf Kurs?</th>
                        <th className="text-center p-3 font-medium">Aktionen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {goalsData.teamOverview.map((partner) => (
                        <tr key={partner.id} className="border-b hover:bg-gray-50">
                          <td className="p-3">
                            <div className="font-medium">{partner.name}</div>
                            <div className="text-sm text-gray-600">{partner.team_name}</div>
                          </td>
                          <td className="text-center p-3">{partner.selfGoals.fa_yearly_target || 0}</td>
                          <td className="text-center p-3">{partner.fkGoals.fa_yearly_target || 0}</td>
                          <td className="text-center p-3">
                            <Badge variant={partner.color === 'red' ? 'destructive' : partner.color === 'yellow' ? 'secondary' : 'default'}>
                              {partner.delta > 0 ? '+' : ''}{partner.delta}%
                            </Badge>
                          </td>
                          <td className="text-center p-3">{partner.istBasis.fa_actual || 0}</td>
                          <td className="text-center p-3">{partner.istCurrent.fa_actual || 0}</td>
                          <td className="text-center p-3">{partner.pathExpectation.fa_expected || 0}</td>
                          <td className="text-center p-3">
                            <Badge variant={partner.onTrack ? 'default' : 'destructive'}>
                              {partner.onTrack ? '🟢' : '🔴'}
                            </Badge>
                          </td>
                          <td className="text-center p-3">
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                💬 Gespräch
                              </Button>
                              <Button size="sm" variant="outline">
                                📧 Hinweis
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

          </TabsContent>

        </Tabs>

      </div>
    </div>
  );
}
