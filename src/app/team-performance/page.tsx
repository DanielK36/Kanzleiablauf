"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function TeamPerformancePage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  // Real data for team performance
  const [teamStats, setTeamStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    overallProgress: 0,
    monthlyTargets: {
      fa_target: 0,
      eh_target: 0,
      recommendations_target: 0,
      appointments_target: 0,
      tiv_invitations_target: 0,
      taa_invitations_target: 0,
      tgs_registrations_target: 0
    },
    monthlyCurrent: {
      fa_current: 0,
      eh_current: 0,
      recommendations_current: 0,
      appointments_current: 0,
      tiv_invitations_current: 0,
      taa_invitations_current: 0,
      tgs_registrations_current: 0
    }
  });

  // Load real team data
  useEffect(() => {
    loadTeamData();
  }, [selectedMonth, selectedYear]);

  const loadTeamData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/kanzleiablauf-data');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Calculate team stats from real data
          const members = data.teamMembers || [];
          const totals = data.teamTotals || {};
          
          setTeamStats({
            totalMembers: members.length,
            activeMembers: members.filter((m: any) => m.lastCheckin).length,
            overallProgress: totals.monthlyProgress || 0,
            monthlyTargets: {
              fa_target: totals.monthlyTargets?.fa_target || 0,
              eh_target: totals.monthlyTargets?.eh_target || 0,
              recommendations_target: totals.monthlyTargets?.recommendations_target || 0,
              appointments_target: totals.monthlyTargets?.new_appointments_target || 0,
              tiv_invitations_target: totals.monthlyTargets?.tiv_invitations_target || 0,
              taa_invitations_target: totals.monthlyTargets?.taa_invitations_target || 0,
              tgs_registrations_target: totals.monthlyTargets?.tgs_registrations_target || 0
            },
            monthlyCurrent: {
              fa_current: totals.monthlyCurrent?.fa_current || 0,
              eh_current: totals.monthlyCurrent?.eh_current || 0,
              recommendations_current: totals.monthlyCurrent?.recommendations_current || 0,
              appointments_current: totals.monthlyCurrent?.new_appointments_current || 0,
              tiv_invitations_current: totals.monthlyCurrent?.tiv_invitations_current || 0,
              taa_invitations_current: totals.monthlyCurrent?.taa_invitations_current || 0,
              tgs_registrations_current: totals.monthlyCurrent?.tgs_registrations_current || 0
            }
          });

          // Transform team members data
          const transformedMembers = members.map((member: any) => ({
            id: member.id,
            name: member.name,
            role: member.role,
            status: member.lastCheckin ? 'aktiv' : 'inaktiv',
            monthlyStats: {
              fa_current: member.monthlyProgress?.fa_current || 0,
              fa_target: member.monthlyProgress?.fa_target || 0,
              eh_current: member.monthlyProgress?.eh_current || 0,
              eh_target: member.monthlyProgress?.eh_target || 0,
              recommendations_current: member.monthlyProgress?.recommendations_current || 0,
              recommendations_target: member.monthlyProgress?.recommendations_target || 0,
              appointments_current: member.monthlyProgress?.new_appointments_current || 0,
              appointments_target: member.monthlyProgress?.new_appointments_target || 0,
              tiv_invitations_current: member.monthlyProgress?.tiv_invitations_current || 0,
              tiv_invitations_target: member.monthlyProgress?.tiv_invitations_target || 0,
              taa_invitations_current: member.monthlyProgress?.taa_invitations_current || 0,
              taa_invitations_target: member.monthlyProgress?.taa_invitations_target || 0,
              tgs_registrations_current: member.monthlyProgress?.tgs_registrations_current || 0,
              tgs_registrations_target: member.monthlyProgress?.tgs_registrations_target || 0
            },
            recommendations: member.recommendations || [],
            performanceTrend: member.performanceTrend || 'stable',
            trendPercentage: member.trendPercentage || 0
          }));
          setTeamMembers(transformedMembers);
        }
      }
    } catch (error) {
      console.error('Error loading team data:', error);
    } finally {
      setLoading(false);
    }
  };

  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const calculateProjection = (current: number, target: number) => {
    const today = new Date().getDate();
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const remainingDays = daysInMonth - today;
    
    if (today === 0) return target; // Avoid division by zero
    
    const dailyAverage = current / today;
    const projectedTotal = current + (dailyAverage * remainingDays);
    
    return Math.round(projectedTotal);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return '📈';
      case 'down':
        return '📉';
      default:
        return '➡️';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const months = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Team Performance - Monatsanalyse
          </h1>
          <p className="text-gray-600 mt-2">
            Detaillierte Performance-Analyse für {months[selectedMonth]} {selectedYear}
          </p>
        </div>

        {/* Month Selector */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monat</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {months.map((month, index) => (
                    <option key={index} value={index}>{month}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jahr</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[2024, 2025, 2026].map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📊 Team-Übersicht</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{teamStats.totalMembers}</div>
                <div className="text-sm text-gray-600">Team-Mitglieder</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{teamStats.activeMembers}</div>
                <div className="text-sm text-gray-600">Aktive Mitglieder</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{teamStats.overallProgress}%</div>
                <div className="text-sm text-gray-600">Gesamtfortschritt</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">7</div>
                <div className="text-sm text-gray-600">Empfehlungen</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Charts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📈 Team-Performance Charts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">FA</span>
                  <span>{teamStats.monthlyCurrent.fa_current}/{teamStats.monthlyTargets.fa_target}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full ${getProgressColor(calculateProgress(teamStats.monthlyCurrent.fa_current, teamStats.monthlyTargets.fa_target))}`}
                    style={{ width: `${calculateProgress(teamStats.monthlyCurrent.fa_current, teamStats.monthlyTargets.fa_target)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Hochrechnung: {calculateProjection(teamStats.monthlyCurrent.fa_current, teamStats.monthlyTargets.fa_target)}
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">EH</span>
                  <span>{teamStats.monthlyCurrent.eh_current}/{teamStats.monthlyTargets.eh_target}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full ${getProgressColor(calculateProgress(teamStats.monthlyCurrent.eh_current, teamStats.monthlyTargets.eh_target))}`}
                    style={{ width: `${calculateProgress(teamStats.monthlyCurrent.eh_current, teamStats.monthlyTargets.eh_target)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Hochrechnung: {calculateProjection(teamStats.monthlyCurrent.eh_current, teamStats.monthlyTargets.eh_target)}
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">Empfehlungen</span>
                  <span>{teamStats.monthlyCurrent.recommendations_current}/{teamStats.monthlyTargets.recommendations_target}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full ${getProgressColor(calculateProgress(teamStats.monthlyCurrent.recommendations_current, teamStats.monthlyTargets.recommendations_target))}`}
                    style={{ width: `${calculateProgress(teamStats.monthlyCurrent.recommendations_current, teamStats.monthlyTargets.recommendations_target)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Hochrechnung: {calculateProjection(teamStats.monthlyCurrent.recommendations_current, teamStats.monthlyTargets.recommendations_target)}
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">Termine</span>
                  <span>{teamStats.monthlyCurrent.appointments_current}/{teamStats.monthlyTargets.appointments_target}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full ${getProgressColor(calculateProgress(teamStats.monthlyCurrent.appointments_current, teamStats.monthlyTargets.appointments_target))}`}
                    style={{ width: `${calculateProgress(teamStats.monthlyCurrent.appointments_current, teamStats.monthlyTargets.appointments_target)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Hochrechnung: {calculateProjection(teamStats.monthlyCurrent.appointments_current, teamStats.monthlyTargets.appointments_target)}
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">TIV</span>
                  <span>{teamStats.monthlyCurrent.tiv_invitations_current}/{teamStats.monthlyTargets.tiv_invitations_target}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full ${getProgressColor(calculateProgress(teamStats.monthlyCurrent.tiv_invitations_current, teamStats.monthlyTargets.tiv_invitations_target))}`}
                    style={{ width: `${calculateProgress(teamStats.monthlyCurrent.tiv_invitations_current, teamStats.monthlyTargets.tiv_invitations_target)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Hochrechnung: {calculateProjection(teamStats.monthlyCurrent.tiv_invitations_current, teamStats.monthlyTargets.tiv_invitations_target)}
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">TAA</span>
                  <span>{teamStats.monthlyCurrent.taa_invitations_current}/{teamStats.monthlyTargets.taa_invitations_target}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full ${getProgressColor(calculateProgress(teamStats.monthlyCurrent.taa_invitations_current, teamStats.monthlyTargets.taa_invitations_target))}`}
                    style={{ width: `${calculateProgress(teamStats.monthlyCurrent.taa_invitations_current, teamStats.monthlyTargets.taa_invitations_target)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Hochrechnung: {calculateProjection(teamStats.monthlyCurrent.taa_invitations_current, teamStats.monthlyTargets.taa_invitations_target)}
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">TGS</span>
                  <span>{teamStats.monthlyCurrent.tgs_registrations_current}/{teamStats.monthlyTargets.tgs_registrations_target}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full ${getProgressColor(calculateProgress(teamStats.monthlyCurrent.tgs_registrations_current, teamStats.monthlyTargets.tgs_registrations_target))}`}
                    style={{ width: `${calculateProgress(teamStats.monthlyCurrent.tgs_registrations_current, teamStats.monthlyTargets.tgs_registrations_target)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Hochrechnung: {calculateProjection(teamStats.monthlyCurrent.tgs_registrations_current, teamStats.monthlyTargets.tgs_registrations_target)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Individual Member Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">👥 Einzelne Team-Mitglieder</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {teamMembers.map((member) => (
                <div key={member.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{member.name}</h3>
                      <p className="text-sm text-gray-600">{member.role}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded ${
                        member.status === 'aktiv' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {member.status}
                      </span>
                      <span className={`text-sm ${getTrendColor(member.performanceTrend)}`}>
                        {getTrendIcon(member.performanceTrend)} {member.trendPercentage}%
                      </span>
                    </div>
                  </div>

                  {/* Performance Charts */}
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>FA</span>
                        <span>{member.monthlyStats.fa_current}/{member.monthlyStats.fa_target}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getProgressColor(calculateProgress(member.monthlyStats.fa_current, member.monthlyStats.fa_target))}`}
                          style={{ width: `${calculateProgress(member.monthlyStats.fa_current, member.monthlyStats.fa_target)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Hochrechnung: {calculateProjection(member.monthlyStats.fa_current, member.monthlyStats.fa_target)}
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>EH</span>
                        <span>{member.monthlyStats.eh_current}/{member.monthlyStats.eh_target}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getProgressColor(calculateProgress(member.monthlyStats.eh_current, member.monthlyStats.eh_target))}`}
                          style={{ width: `${calculateProgress(member.monthlyStats.eh_current, member.monthlyStats.eh_target)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Hochrechnung: {calculateProjection(member.monthlyStats.eh_current, member.monthlyStats.eh_target)}
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Empfehlungen</span>
                        <span>{member.monthlyStats.recommendations_current}/{member.monthlyStats.recommendations_target}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getProgressColor(calculateProgress(member.monthlyStats.recommendations_current, member.monthlyStats.recommendations_target))}`}
                          style={{ width: `${calculateProgress(member.monthlyStats.recommendations_current, member.monthlyStats.recommendations_target)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Hochrechnung: {calculateProjection(member.monthlyStats.recommendations_current, member.monthlyStats.recommendations_target)}
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Termine</span>
                        <span>{member.monthlyStats.appointments_current}/{member.monthlyStats.appointments_target}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getProgressColor(calculateProgress(member.monthlyStats.appointments_current, member.monthlyStats.appointments_target))}`}
                          style={{ width: `${calculateProgress(member.monthlyStats.appointments_current, member.monthlyStats.appointments_target)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Hochrechnung: {calculateProjection(member.monthlyStats.appointments_current, member.monthlyStats.appointments_target)}
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>TIV</span>
                        <span>{member.monthlyStats.tiv_invitations_current}/{member.monthlyStats.tiv_invitations_target}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getProgressColor(calculateProgress(member.monthlyStats.tiv_invitations_current, member.monthlyStats.tiv_invitations_target))}`}
                          style={{ width: `${calculateProgress(member.monthlyStats.tiv_invitations_current, member.monthlyStats.tiv_invitations_target)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Hochrechnung: {calculateProjection(member.monthlyStats.tiv_invitations_current, member.monthlyStats.tiv_invitations_target)}
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>TAA</span>
                        <span>{member.monthlyStats.taa_invitations_current}/{member.monthlyStats.taa_invitations_target}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getProgressColor(calculateProgress(member.monthlyStats.taa_invitations_current, member.monthlyStats.taa_invitations_target))}`}
                          style={{ width: `${calculateProgress(member.monthlyStats.taa_invitations_current, member.monthlyStats.taa_invitations_target)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Hochrechnung: {calculateProjection(member.monthlyStats.taa_invitations_current, member.monthlyStats.taa_invitations_target)}
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>TGS</span>
                        <span>{member.monthlyStats.tgs_registrations_current}/{member.monthlyStats.tgs_registrations_target}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getProgressColor(calculateProgress(member.monthlyStats.tgs_registrations_current, member.monthlyStats.tgs_registrations_target))}`}
                          style={{ width: `${calculateProgress(member.monthlyStats.tgs_registrations_current, member.monthlyStats.tgs_registrations_target)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Hochrechnung: {calculateProjection(member.monthlyStats.tgs_registrations_current, member.monthlyStats.tgs_registrations_target)}
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-2">Empfehlungen für {member.name}</h4>
                    <div className="space-y-2">
                      {member.recommendations.map((recommendation, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <span className="text-blue-500 mt-1">•</span>
                          <span className="text-sm text-gray-700">{recommendation}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* General Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">💡 Allgemeine Empfehlungen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Neukunden</h4>
                <p className="text-sm text-blue-700">
                  Fokus auf Akquise neuer Kunden verstärken. Team ist 78% des Ziels erreicht.
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Neue Geschäftspartner</h4>
                <p className="text-sm text-green-700">
                  Empfehlungsquote verbessern. Aktuell bei 80% des Monatsziels.
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-semibold text-purple-900 mb-2">Empfehlungen</h4>
                <p className="text-sm text-purple-700">
                  Empfehlungsgespräche intensivieren. TGS-Anmeldungen steigern.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
