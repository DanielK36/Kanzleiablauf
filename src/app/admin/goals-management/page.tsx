'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface User {
  id: string;
  name: string;
  team_name: string;
  role: string;
  personal_targets: any;
}

interface Team {
  id: string;
  name: string;
  members: User[];
}

interface GoalTemplate {
  name: string;
  targets: {
    fa_daily: number;
    eh_daily: number;
    new_appointments_daily: number;
    recommendations_daily: number;
    tiv_invitations_daily: number;
    taa_invitations_daily: number;
    tgs_registrations_daily: number;
    bav_checks_daily: number;
    fa_weekly: number;
    eh_weekly: number;
    new_appointments_weekly: number;
    recommendations_weekly: number;
    tiv_invitations_weekly: number;
    taa_invitations_weekly: number;
    tgs_registrations_weekly: number;
    bav_checks_weekly: number;
    fa_monthly_target: number;
    eh_monthly_target: number;
    new_appointments_monthly_target: number;
    recommendations_monthly_target: number;
    tiv_invitations_monthly_target: number;
    taa_invitations_monthly_target: number;
    tgs_registrations_monthly_target: number;
    bav_checks_monthly_target: number;
  };
}

const GOAL_TEMPLATES: GoalTemplate[] = [
  {
    name: 'Trainee',
    targets: {
      fa_daily: 1, eh_daily: 50, new_appointments_daily: 2, recommendations_daily: 1,
      tiv_invitations_daily: 0, taa_invitations_daily: 0, tgs_registrations_daily: 0, bav_checks_daily: 0,
      fa_weekly: 5, eh_weekly: 250, new_appointments_weekly: 10, recommendations_weekly: 5,
      tiv_invitations_weekly: 0, taa_invitations_weekly: 0, tgs_registrations_weekly: 0, bav_checks_weekly: 0,
      fa_monthly_target: 20, eh_monthly_target: 1000, new_appointments_monthly_target: 40, recommendations_monthly_target: 20,
      tiv_invitations_monthly_target: 0, taa_invitations_monthly_target: 0, tgs_registrations_monthly_target: 0, bav_checks_monthly_target: 0
    }
  },
  {
    name: 'Berater',
    targets: {
      fa_daily: 2, eh_daily: 200, new_appointments_daily: 3, recommendations_daily: 2,
      tiv_invitations_daily: 1, taa_invitations_daily: 1, tgs_registrations_daily: 0, bav_checks_daily: 1,
      fa_weekly: 10, eh_weekly: 1000, new_appointments_weekly: 15, recommendations_weekly: 10,
      tiv_invitations_weekly: 5, taa_invitations_weekly: 5, tgs_registrations_weekly: 0, bav_checks_weekly: 5,
      fa_monthly_target: 40, eh_monthly_target: 4000, new_appointments_monthly_target: 60, recommendations_monthly_target: 40,
      tiv_invitations_monthly_target: 20, taa_invitations_monthly_target: 20, tgs_registrations_monthly_target: 0, bav_checks_monthly_target: 20
    }
  },
  {
    name: 'Top-Performer',
    targets: {
      fa_daily: 3, eh_daily: 500, new_appointments_daily: 5, recommendations_daily: 3,
      tiv_invitations_daily: 2, taa_invitations_daily: 2, tgs_registrations_daily: 1, bav_checks_daily: 2,
      fa_weekly: 15, eh_weekly: 2500, new_appointments_weekly: 25, recommendations_weekly: 15,
      tiv_invitations_weekly: 10, taa_invitations_weekly: 10, tgs_registrations_weekly: 5, bav_checks_weekly: 10,
      fa_monthly_target: 60, eh_monthly_target: 10000, new_appointments_monthly_target: 100, recommendations_monthly_target: 60,
      tiv_invitations_monthly_target: 40, taa_invitations_monthly_target: 40, tgs_registrations_monthly_target: 20, bav_checks_monthly_target: 40
    }
  }
];

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

export default function GoalsManagementPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customGoals, setCustomGoals] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/teams');
      if (response.ok) {
        const teamsData = await response.json();
        
        // Load users for each team
        const usersResponse = await fetch('/api/admin/users');
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          
          const teamsWithUsers = teamsData.map((team: any) => ({
            ...team,
            members: usersData.filter((user: any) => user.team_name === team.name)
          }));
          
          setTeams(teamsWithUsers);
        }
      }
    } catch (error) {
      console.error('Error loading teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = (templateName: string) => {
    const template = GOAL_TEMPLATES.find(t => t.name === templateName);
    if (template) {
      setCustomGoals(template.targets);
    }
  };

  const updateCustomGoal = (key: string, value: number) => {
    setCustomGoals(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveGoals = async () => {
    if (selectedUsers.length === 0) {
      alert('Bitte wähle mindestens einen Benutzer aus!');
      return;
    }

    try {
      setSaving(true);
      
      const promises = selectedUsers.map(userId => 
        fetch('/api/admin/users', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: userId,
            personal_targets: customGoals
          })
        })
      );

      await Promise.all(promises);
      alert('Ziele erfolgreich gespeichert!');
      
      // Reload teams to show updated data
      await loadTeams();
      
    } catch (error) {
      console.error('Error saving goals:', error);
      alert('Fehler beim Speichern der Ziele!');
    } finally {
      setSaving(false);
    }
  };

  const selectAllTeamMembers = () => {
    const team = teams.find(t => t.id === selectedTeam);
    if (team) {
      setSelectedUsers(team.members.map(m => m.id));
    }
  };

  const clearSelection = () => {
    setSelectedUsers([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Teams...</p>
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
            <CardTitle className="text-2xl">🎯 Ziele-Management</CardTitle>
            <p className="text-green-100 mt-2">Individuelle und Team-Ziele für das Performance-Radar setzen</p>
          </CardHeader>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          
          {/* Team & User Selection */}
          <Card>
            <CardHeader>
              <CardTitle>👥 Team & Benutzer auswählen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Team Selection */}
              <div>
                <Label htmlFor="team-select">Team auswählen:</Label>
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger>
                    <SelectValue placeholder="Team wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map(team => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name} ({team.members.length} Mitglieder)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* User Selection */}
              {selectedTeam && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label>Benutzer auswählen:</Label>
                    <div className="space-x-2">
                      <Button size="sm" variant="outline" onClick={selectAllTeamMembers}>
                        Alle auswählen
                      </Button>
                      <Button size="sm" variant="outline" onClick={clearSelection}>
                        Auswahl löschen
                      </Button>
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto border rounded p-2 space-y-1">
                    {teams.find(t => t.id === selectedTeam)?.members.map(member => (
                      <label key={member.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(member.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers(prev => [...prev, member.id]);
                            } else {
                              setSelectedUsers(prev => prev.filter(id => id !== member.id));
                            }
                          }}
                        />
                        <span className="text-sm">
                          {member.name} 
                          <Badge variant="secondary" className="ml-2">{member.role}</Badge>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected Users Summary */}
              {selectedUsers.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <div className="font-medium text-blue-800">
                    {selectedUsers.length} Benutzer ausgewählt
                  </div>
                  <div className="text-sm text-blue-600">
                    {teams.find(t => t.id === selectedTeam)?.members
                      .filter(m => selectedUsers.includes(m.id))
                      .map(m => m.name)
                      .join(', ')}
                  </div>
                </div>
              )}

            </CardContent>
          </Card>

          {/* Goal Templates */}
          <Card>
            <CardHeader>
              <CardTitle>📋 Ziel-Templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Template Selection */}
              <div>
                <Label htmlFor="template-select">Template auswählen:</Label>
                <Select value={selectedTemplate} onValueChange={(value) => {
                  setSelectedTemplate(value);
                  applyTemplate(value);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Template wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {GOAL_TEMPLATES.map(template => (
                      <SelectItem key={template.name} value={template.name}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Template Preview */}
              {selectedTemplate && (
                <div className="bg-gray-50 border rounded p-3">
                  <div className="font-medium mb-2">Template "{selectedTemplate}" Ziele:</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {METRICS.map(metric => {
                      const template = GOAL_TEMPLATES.find(t => t.name === selectedTemplate);
                      const daily = template?.targets[`${metric.key}_daily`] || 0;
                      const weekly = template?.targets[`${metric.key}_weekly`] || 0;
                      const monthly = template?.targets[`${metric.key}_monthly_target`] || 0;
                      
                      return (
                        <div key={metric.key} className="flex justify-between">
                          <span>{metric.icon} {metric.label}:</span>
                          <span>{daily}/{weekly}/{monthly}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </CardContent>
          </Card>

        </div>

        {/* Custom Goals Editor */}
        <Card>
          <CardHeader>
            <CardTitle>✏️ Ziele anpassen</CardTitle>
            <p className="text-sm text-gray-600">Bearbeite die Ziele nach Bedarf (Täglich / Wöchentlich / Monatlich)</p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="daily" className="space-y-4">
              <TabsList>
                <TabsTrigger value="daily">📅 Täglich</TabsTrigger>
                <TabsTrigger value="weekly">📊 Wöchentlich</TabsTrigger>
                <TabsTrigger value="monthly">📈 Monatlich</TabsTrigger>
              </TabsList>
              
              {['daily', 'weekly', 'monthly'].map(period => (
                <TabsContent key={period} value={period}>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {METRICS.map(metric => {
                      const key = period === 'monthly' 
                        ? `${metric.key}_monthly_target` 
                        : `${metric.key}_${period}`;
                      
                      return (
                        <div key={metric.key} className="space-y-2">
                          <Label className="flex items-center gap-2">
                            {metric.icon} {metric.label}
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            value={customGoals[key] || 0}
                            onChange={(e) => updateCustomGoal(key, parseInt(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">
                  {selectedUsers.length > 0 ? `${selectedUsers.length} Benutzer` : 'Keine Benutzer'} ausgewählt
                </div>
                <div className="text-sm text-gray-600">
                  {selectedTemplate ? `Template: ${selectedTemplate}` : 'Kein Template ausgewählt'}
                </div>
              </div>
              <Button 
                onClick={saveGoals}
                disabled={selectedUsers.length === 0 || saving}
                className="bg-green-600 hover:bg-green-700"
              >
                {saving ? 'Speichere...' : '🎯 Ziele speichern'}
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
