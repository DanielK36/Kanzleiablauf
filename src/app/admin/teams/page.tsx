'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Team {
  id: string;
  name: string;
  description?: string;
  team_level: number;
  created_at: string;
  member_count?: number;
}

interface User {
  id: string;
  name: string;
  team_name: string;
  role: string;
  is_team_leader: boolean;
}

export default function TeamManagementPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [teamsResponse, usersResponse] = await Promise.all([
        fetch('/api/admin/teams'),
        fetch('/api/admin/users')
      ]);

      if (teamsResponse.ok) {
        const result = await teamsResponse.json();
        const teamsData = result.success ? result.data : result;
        setTeams(Array.isArray(teamsData) ? teamsData : []);
      }

      if (usersResponse.ok) {
        const result = await usersResponse.json();
        const usersData = result.success ? result.data : result;
        setUsers(Array.isArray(usersData) ? usersData : []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
    setShowCreateForm(false);
  };

  const handleCreateTeam = () => {
    setEditingTeam(null);
    setShowCreateForm(true);
  };

  const handleSaveTeam = async (teamData: Partial<Team>) => {
    try {
      const response = await fetch('/api/admin/teams', {
        method: editingTeam ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teamData),
      });

      if (response.ok) {
        await loadData();
        setEditingTeam(null);
        setShowCreateForm(false);
        alert(`Team ${editingTeam ? 'aktualisiert' : 'erstellt'}!`);
      } else {
        const errorData = await response.json();
        alert('Fehler: ' + (errorData.error || 'Unbekannter Fehler'));
      }
    } catch (error) {
      console.error('Error saving team:', error);
      alert('Fehler beim Speichern des Teams');
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Möchten Sie dieses Team wirklich löschen?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/teams?id=${teamId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadData();
        alert('Team gelöscht!');
      } else {
        const errorData = await response.json();
        alert('Fehler: ' + (errorData.error || 'Unbekannter Fehler'));
      }
    } catch (error) {
      console.error('Error deleting team:', error);
      alert('Fehler beim Löschen des Teams');
    }
  };

  const getTeamMembers = (teamName: string) => {
    return users.filter(user => user.team_name === teamName);
  };

  const getTeamLeader = (teamName: string) => {
    return users.find(user => user.team_name === teamName && user.is_team_leader);
  };

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Team-Daten...</p>
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
                <CardTitle className="text-2xl">👥 Team-Management</CardTitle>
                <p className="text-green-100 mt-2">Teams erstellen, bearbeiten und verwalten</p>
              </div>
              <Button 
                onClick={handleCreateTeam}
                className="bg-white text-green-600 hover:bg-green-50"
              >
                ➕ Neues Team erstellen
              </Button>
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="list" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">📋 Team-Liste</TabsTrigger>
            <TabsTrigger value="form">✏️ Team-Formular</TabsTrigger>
          </TabsList>

          {/* Team-Liste */}
          <TabsContent value="list" className="space-y-6">
            
            {/* Suche */}
            <Card>
              <CardHeader>
                <CardTitle>🔍 Suche</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="search">Team-Name</Label>
                    <Input
                      id="search"
                      placeholder="Team-Name suchen..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      variant="outline" 
                      onClick={() => setSearchTerm('')}
                    >
                      🔄 Zurücksetzen
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Team-Karten */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTeams.map(team => {
                const members = getTeamMembers(team.name);
                const leader = getTeamLeader(team.name);
                
                return (
                  <Card key={team.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{team.name}</CardTitle>
                          <div className="text-sm text-gray-600 mt-1">
                            Level {team.team_level}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditTeam(team)}
                          >
                            ✏️
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteTeam(team.id)}
                          >
                            🗑️
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {team.description && (
                          <div className="text-sm text-gray-600">
                            {team.description}
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Mitglieder:</span>
                          <Badge variant="outline">{members.length}</Badge>
                        </div>
                        
                        {leader && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Team-Leader:</span>
                            <Badge variant="default">{leader.name}</Badge>
                          </div>
                        )}
                        
                        <div className="text-xs text-gray-500">
                          Erstellt: {new Date(team.created_at).toLocaleDateString('de-DE')}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredTeams.length === 0 && (
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4">🔍</div>
                  <h3 className="text-lg font-medium mb-2">Keine Teams gefunden</h3>
                  <p className="text-gray-600">
                    {searchTerm ? 'Versuchen Sie einen anderen Suchbegriff.' : 'Erstellen Sie Ihr erstes Team.'}
                  </p>
                </CardContent>
              </Card>
            )}

          </TabsContent>

          {/* Team-Formular */}
          <TabsContent value="form" className="space-y-6">
            
            {(editingTeam || showCreateForm) && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {editingTeam ? '✏️ Team bearbeiten' : '➕ Neues Team erstellen'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TeamForm
                    team={editingTeam}
                    onSave={handleSaveTeam}
                    onCancel={() => {
                      setEditingTeam(null);
                      setShowCreateForm(false);
                    }}
                  />
                </CardContent>
              </Card>
            )}

            {!editingTeam && !showCreateForm && (
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4">👥</div>
                  <h3 className="text-lg font-medium mb-2">Team bearbeiten oder erstellen</h3>
                  <p className="text-gray-600 mb-4">
                    Wählen Sie ein Team aus der Liste zum Bearbeiten oder erstellen Sie ein neues Team.
                  </p>
                  <Button onClick={handleCreateTeam}>
                    ➕ Neues Team erstellen
                  </Button>
                </CardContent>
              </Card>
            )}

          </TabsContent>

        </Tabs>

      </div>
    </div>
  );
}

interface TeamFormProps {
  team: Team | null;
  onSave: (teamData: Partial<Team>) => void;
  onCancel: () => void;
}

function TeamForm({ team, onSave, onCancel }: TeamFormProps) {
  const [formData, setFormData] = useState({
    name: team?.name || '',
    description: team?.description || '',
    team_level: team?.team_level || 1
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...(team && { id: team.id }),
      ...formData
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Team-Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Beschreibung</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Team-Beschreibung (optional)"
        />
      </div>

      <div>
        <Label htmlFor="team_level">Team-Level *</Label>
        <Input
          id="team_level"
          type="number"
          min="1"
          max="10"
          value={formData.team_level}
          onChange={(e) => setFormData(prev => ({ ...prev, team_level: parseInt(e.target.value) || 1 }))}
          required
        />
        <div className="text-sm text-gray-600 mt-1">
          Level 1 = Basis-Team, Level 2+ = Führungsteams
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit">
          💾 {team ? 'Aktualisieren' : 'Erstellen'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          ❌ Abbrechen
        </Button>
      </div>
    </form>
  );
}

