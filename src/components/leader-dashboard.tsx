"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ActionGuideComponent } from './action-guide';
import { TeamMemberCard } from './team-member-card';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  team_name: string;
  last_checkin?: string;
  energy_level?: 'high' | 'medium' | 'low';
  status?: 'excellent' | 'good' | 'needs_attention';
}

export const LeaderDashboard = () => {
  const [currentWeekday, setCurrentWeekday] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [actionGuideCompleted, setActionGuideCompleted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const today = new Date().toLocaleDateString('de-DE', { weekday: 'long' });
    setCurrentWeekday(today);
    loadTeamData();
  }, []);

  const loadTeamData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/kanzleiablauf-data');
      const data = await response.json();
      
      if (data.success && data.teamMembers) {
        const transformedMembers = data.teamMembers.map((member: any) => ({
          id: member.id,
          name: member.name,
          role: member.role,
          team_name: member.team_name || 'Team Alpha',
          last_checkin: member.lastCheckin || 'Noch nicht eingeloggt',
          energy_level: member.energy_level || 'medium',
          status: member.status || 'good'
        }));
        setTeamMembers(transformedMembers);
      }
    } catch (error) {
      console.error('Error loading team data:', error);
      // Fallback to empty array if API fails
      setTeamMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionGuideComplete = () => {
    setActionGuideCompleted(true);
  };

  const handleMemberSelect = (member: TeamMember) => {
    setSelectedMember(member);
  };

  return (
    <div className="leader-dashboard min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Leadership Dashboard
          </h1>
          <p className="text-gray-600">
            {currentWeekday} - Bereite dich auf deine Führungsaufgaben vor
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Action Guide */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-xl">Tägliche Führungsaufgaben</CardTitle>
              </CardHeader>
              <CardContent>
                {!actionGuideCompleted ? (
                  <ActionGuideComponent
                    weekday={currentWeekday}
                    role="leader"
                    onComplete={handleActionGuideComplete}
                  />
                ) : (
                  <div className="text-center py-8">
                    <div className="text-green-600 text-6xl mb-4">✓</div>
                    <h3 className="text-xl font-semibold mb-2">Alle Aufgaben erledigt!</h3>
                    <p className="text-gray-600 mb-4">
                      Du bist bereit für deine Führungsaufgaben heute.
                    </p>
                    <Button 
                      onClick={() => setActionGuideCompleted(false)}
                      variant="outline"
                    >
                      Nochmal durchgehen
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Team Status */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl">Team Status</CardTitle>
                  <Button 
                    onClick={loadTeamData} 
                    disabled={loading}
                    variant="outline" 
                    size="sm"
                  >
                    {loading ? 'Lädt...' : 'Aktualisieren'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {teamMembers.map((member) => (
                    <TeamMemberCard
                      key={member.id}
                      member={member}
                      onSelect={handleMemberSelect}
                    />
                  ))}
                </div>
                {teamMembers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {loading ? 'Lade Team-Daten...' : 'Keine Team-Mitglieder gefunden'}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Team Übersicht</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Team Mitglieder:</span>
                    <span className="font-semibold">{teamMembers.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Check-ins heute:</span>
                    <span className="font-semibold">
                      {teamMembers.filter(m => m.last_checkin?.includes('Heute')).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Aufmerksamkeit nötig:</span>
                    <span className="font-semibold text-yellow-600">
                      {teamMembers.filter(m => m.status === 'needs_attention').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Selected Member Details */}
            {selectedMember && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Mitglied Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold">{selectedMember.name}</h4>
                      <p className="text-sm text-gray-600">{selectedMember.role}</p>
                    </div>
                    <div>
                      <p className="text-sm">
                        <span className="font-medium">Letzter Check-in:</span> {selectedMember.last_checkin}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm">
                        <span className="font-medium">Energielevel:</span> {selectedMember.energy_level}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm">
                        <span className="font-medium">Status:</span> {selectedMember.status}
                      </p>
                    </div>
                    <Button className="w-full mt-4">
                      Check-in durchführen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
