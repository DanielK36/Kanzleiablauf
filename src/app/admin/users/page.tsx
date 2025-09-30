'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface User {
  id: string;
  name: string;
  email: string;
  team_name: string;
  role: string;
  personal_targets: any;
  parent_leader_id?: string;
  is_team_leader: boolean;
  created_at: string;
}

interface Team {
  id: string;
  name: string;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterTeam, setFilterTeam] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersResponse, teamsResponse] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/teams')
      ]);

      if (usersResponse.ok) {
        const result = await usersResponse.json();
        const usersData = result.success ? result.data : result;
        setUsers(Array.isArray(usersData) ? usersData : []);
      }

      if (teamsResponse.ok) {
        const result = await teamsResponse.json();
        const teamsData = result.success ? result.data : result;
        setTeams(Array.isArray(teamsData) ? teamsData : []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowCreateForm(false);
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setShowCreateForm(true);
  };

  const handleSaveUser = async (userData: Partial<User>) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: editingUser ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        await loadData();
        setEditingUser(null);
        setShowCreateForm(false);
        alert(`Benutzer ${editingUser ? 'aktualisiert' : 'erstellt'}!`);
      } else {
        const errorData = await response.json();
        alert('Fehler: ' + (errorData.error || 'Unbekannter Fehler'));
      }
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Fehler beim Speichern des Benutzers');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Möchten Sie diesen Benutzer wirklich löschen?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadData();
        alert('Benutzer gelöscht!');
      } else {
        const errorData = await response.json();
        alert('Fehler: ' + (errorData.error || 'Unbekannter Fehler'));
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Fehler beim Löschen des Benutzers');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesTeam = filterTeam === 'all' || user.team_name === filterTeam;
    
    return matchesSearch && matchesRole && matchesTeam;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Benutzer-Daten...</p>
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
                <CardTitle className="text-2xl">👤 User-Management</CardTitle>
                <p className="text-blue-100 mt-2">Benutzer erstellen, bearbeiten und verwalten</p>
              </div>
              <Button 
                onClick={handleCreateUser}
                className="bg-white text-blue-600 hover:bg-blue-50"
              >
                ➕ Neuen Benutzer erstellen
              </Button>
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="list" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">📋 Benutzer-Liste</TabsTrigger>
            <TabsTrigger value="form">✏️ Benutzer-Formular</TabsTrigger>
          </TabsList>

          {/* Benutzer-Liste */}
          <TabsContent value="list" className="space-y-6">
            
            {/* Filter und Suche */}
            <Card>
              <CardHeader>
                <CardTitle>🔍 Filter & Suche</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="search">Suche</Label>
                    <Input
                      id="search"
                      placeholder="Name oder E-Mail..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="role-filter">Rolle</Label>
                    <Select value={filterRole} onValueChange={setFilterRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Rolle wählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle Rollen</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="führungskraft">Führungskraft</SelectItem>
                        <SelectItem value="berater">Berater</SelectItem>
                        <SelectItem value="trainee">Trainee</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="team-filter">Team</Label>
                    <Select value={filterTeam} onValueChange={setFilterTeam}>
                      <SelectTrigger>
                        <SelectValue placeholder="Team wählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle Teams</SelectItem>
                        {teams.map(team => (
                          <SelectItem key={team.id} value={team.name}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSearchTerm('');
                        setFilterRole('all');
                        setFilterTeam('all');
                      }}
                    >
                      🔄 Filter zurücksetzen
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Benutzer-Tabelle */}
            <Card>
              <CardHeader>
                <CardTitle>
                  👥 Benutzer ({filteredUsers.length} von {users.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-left p-2 font-medium">Name</th>
                        <th className="text-left p-2 font-medium">E-Mail</th>
                        <th className="text-center p-2 font-medium">Team</th>
                        <th className="text-center p-2 font-medium">Rolle</th>
                        <th className="text-center p-2 font-medium">Team-Leader</th>
                        <th className="text-center p-2 font-medium">Erstellt</th>
                        <th className="text-center p-2 font-medium">Aktionen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(user => (
                        <tr key={user.id} className="border-t hover:bg-gray-50">
                          <td className="p-2">
                            <div className="font-medium">{user.name}</div>
                          </td>
                          <td className="p-2">
                            <div className="text-sm text-gray-600">{user.email}</div>
                          </td>
                          <td className="text-center p-2">
                            <Badge variant="outline">{user.team_name}</Badge>
                          </td>
                          <td className="text-center p-2">
                            <Badge 
                              variant={user.role === 'admin' ? 'default' : user.role === 'führungskraft' ? 'secondary' : 'outline'}
                            >
                              {user.role}
                            </Badge>
                          </td>
                          <td className="text-center p-2">
                            {user.is_team_leader ? (
                              <Badge variant="default">✅</Badge>
                            ) : (
                              <Badge variant="outline">❌</Badge>
                            )}
                          </td>
                          <td className="text-center p-2">
                            <div className="text-sm text-gray-600">
                              {new Date(user.created_at).toLocaleDateString('de-DE')}
                            </div>
                          </td>
                          <td className="text-center p-2">
                            <div className="flex gap-2 justify-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditUser(user)}
                              >
                                ✏️ Bearbeiten
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                🗑️ Löschen
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

          {/* Benutzer-Formular */}
          <TabsContent value="form" className="space-y-6">
            
            {(editingUser || showCreateForm) && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {editingUser ? '✏️ Benutzer bearbeiten' : '➕ Neuen Benutzer erstellen'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <UserForm
                    user={editingUser}
                    teams={teams}
                    onSave={handleSaveUser}
                    onCancel={() => {
                      setEditingUser(null);
                      setShowCreateForm(false);
                    }}
                  />
                </CardContent>
              </Card>
            )}

            {!editingUser && !showCreateForm && (
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4">👤</div>
                  <h3 className="text-lg font-medium mb-2">Benutzer bearbeiten oder erstellen</h3>
                  <p className="text-gray-600 mb-4">
                    Wählen Sie einen Benutzer aus der Liste zum Bearbeiten oder erstellen Sie einen neuen Benutzer.
                  </p>
                  <Button onClick={handleCreateUser}>
                    ➕ Neuen Benutzer erstellen
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

interface UserFormProps {
  user: User | null;
  teams: Team[];
  onSave: (userData: Partial<User>) => void;
  onCancel: () => void;
}

function UserForm({ user, teams, onSave, onCancel }: UserFormProps) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    team_name: user?.team_name || '',
    role: user?.role || 'berater',
    is_team_leader: user?.is_team_leader || false,
    parent_leader_id: user?.parent_leader_id || '',
    personal_targets: user?.personal_targets || {}
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...(user && { id: user.id }),
      ...formData
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="email">E-Mail *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="team">Team *</Label>
          <Select value={formData.team_name} onValueChange={(value) => setFormData(prev => ({ ...prev, team_name: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Team wählen..." />
            </SelectTrigger>
            <SelectContent>
              {teams.map(team => (
                <SelectItem key={team.id} value={team.name}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="role">Rolle *</Label>
          <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Rolle wählen..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="führungskraft">Führungskraft</SelectItem>
              <SelectItem value="berater">Berater</SelectItem>
              <SelectItem value="trainee">Trainee</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="is_team_leader"
          checked={formData.is_team_leader}
          onChange={(e) => setFormData(prev => ({ ...prev, is_team_leader: e.target.checked }))}
          className="rounded"
        />
        <Label htmlFor="is_team_leader">Team-Leader</Label>
      </div>

      <div className="flex gap-2">
        <Button type="submit">
          💾 {user ? 'Aktualisieren' : 'Erstellen'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          ❌ Abbrechen
        </Button>
      </div>
    </form>
  );
}

