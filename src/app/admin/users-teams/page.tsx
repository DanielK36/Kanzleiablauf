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
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

// User Interface
interface User {
  id: string;
  clerk_id: string;
  firstname: string;
  lastname: string;
  name: string;
  email: string;
  team_name: string;
  role: string;
  team_id: string;
  parent_leader_id: string;
  is_team_leader: boolean;
  personal_targets: any;
  created_at: string;
  updated_at: string;
}

// Team Interface
interface Team {
  id: string;
  name: string;
  parent_team_id: string;
  description: string;
  team_level: number;
  created_at: string;
  updated_at: string;
}

export default function AdminUsersTeamsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('users');

  // Users State
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showDeleteUserConfirm, setShowDeleteUserConfirm] = useState<{id: string, name: string} | null>(null);

  // Teams State
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [showEditTeamModal, setShowEditTeamModal] = useState(false);
  const [showDeleteTeamConfirm, setShowDeleteTeamConfirm] = useState<{id: string, name: string} | null>(null);

  // User Form Data
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    team_name: '',
    role: 'berater',
    is_team_leader: false,
    parent_leader_id: '',
    personal_targets: {}
  });

  // Team Form Data
  const [teamFormData, setTeamFormData] = useState({
    name: '',
    parent_team_id: '',
    description: ''
  });

  useEffect(() => {
    if (isLoaded) {
      checkAdminAccess();
      loadUsers();
      loadTeams();
    }
  }, [isLoaded]);

  const checkAdminAccess = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/admin/users');
      if (response.status === 403) {
        router.push('/simple-dashboard');
        return;
      }
      if (!response.ok) {
        router.push('/simple-dashboard');
        return;
      }
    } catch (error) {
      console.error('Admin access check failed:', error);
      router.push('/simple-dashboard');
    }
  };

  // Users Functions
  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const result = await response.json();
        setUsers(result.data || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const method = editingUser ? 'PUT' : 'POST';
      const body = editingUser ? { id: editingUser.id, ...userFormData } : userFormData;

      const response = await fetch('/api/admin/users', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        await loadUsers();
        setShowCreateUserModal(false);
        setShowEditUserModal(false);
        setEditingUser(null);
        resetUserForm();
      } else {
        const error = await response.json();
        alert(`Fehler beim ${editingUser ? 'Aktualisieren' : 'Erstellen'} des Benutzers: ` + error.error);
      }
    } catch (error) {
      console.error(`Error ${editingUser ? 'updating' : 'creating'} user:`, error);
      alert(`Fehler beim ${editingUser ? 'Aktualisieren' : 'Erstellen'} des Benutzers`);
    }
  };

  const resetUserForm = () => {
    setUserFormData({
      name: '',
      email: '',
      team_name: '',
      role: 'berater',
      is_team_leader: false,
      parent_leader_id: '',
      personal_targets: {}
    });
  };

  const handleUserEdit = (user: User) => {
    setEditingUser(user);
    setUserFormData({
      name: user.name,
      email: user.email,
      team_name: user.team_name,
      role: user.role,
      is_team_leader: user.is_team_leader,
      parent_leader_id: user.parent_leader_id || '',
      personal_targets: user.personal_targets || {}
    });
    setShowEditUserModal(true);
  };

  const handleUserDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/users?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadUsers();
        setShowDeleteUserConfirm(null);
      } else {
        const error = await response.json();
        alert('Fehler beim Löschen des Benutzers: ' + error.error);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Fehler beim Löschen des Benutzers');
    }
  };

  // Teams Functions
  const loadTeams = async () => {
    try {
      const response = await fetch('/api/admin/teams');
      if (response.ok) {
        const result = await response.json();
        setTeams(result.data || []);
      }
    } catch (error) {
      console.error('Error loading teams:', error);
    } finally {
      setTeamsLoading(false);
    }
  };

  const handleTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const method = editingTeam ? 'PUT' : 'POST';
      const body = editingTeam ? { id: editingTeam.id, ...teamFormData } : teamFormData;

      const response = await fetch('/api/admin/teams', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        await loadTeams();
        setShowCreateTeamModal(false);
        setShowEditTeamModal(false);
        setEditingTeam(null);
        resetTeamForm();
      } else {
        const error = await response.json();
        alert(`Fehler beim ${editingTeam ? 'Aktualisieren' : 'Erstellen'} des Teams: ` + error.error);
      }
    } catch (error) {
      console.error(`Error ${editingTeam ? 'updating' : 'creating'} team:`, error);
      alert(`Fehler beim ${editingTeam ? 'Aktualisieren' : 'Erstellen'} des Teams`);
    }
  };

  const resetTeamForm = () => {
    setTeamFormData({
      name: '',
      parent_team_id: '',
      description: ''
    });
  };

  const handleTeamEdit = (team: Team) => {
    setEditingTeam(team);
    setTeamFormData({
      name: team.name,
      parent_team_id: team.parent_team_id || '',
      description: team.description
    });
    setShowEditTeamModal(true);
  };

  const handleTeamDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/teams?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadTeams();
        setShowDeleteTeamConfirm(null);
      } else {
        const error = await response.json();
        alert('Fehler beim Löschen des Teams: ' + error.error);
      }
    } catch (error) {
      console.error('Error deleting team:', error);
      alert('Fehler beim Löschen des Teams');
    }
  };

  if (!isLoaded || usersLoading || teamsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">👥 Benutzer & Teams</h1>
          <p className="text-gray-600">Verwaltung von Benutzern und Teams</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users">👤 Benutzer</TabsTrigger>
            <TabsTrigger value="teams">👥 Teams</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Benutzer-Verwaltung</h2>
              <Button onClick={() => setShowCreateUserModal(true)}>
                + Neuer Benutzer
              </Button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      E-Mail
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Team
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rolle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.team_name || 'Kein Team'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.role}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.is_team_leader ? (
                          <Badge variant="default">Team-Leader</Badge>
                        ) : (
                          <Badge variant="secondary">Mitglied</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleUserEdit(user)}
                          >
                            Bearbeiten
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => setShowDeleteUserConfirm({id: user.id, name: user.name})}
                          >
                            Löschen
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {users.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="text-6xl mb-4">👤</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Keine Benutzer vorhanden</h3>
                  <p className="text-gray-600 mb-4">Erstellen Sie Ihren ersten Benutzer</p>
                  <Button onClick={() => setShowCreateUserModal(true)}>
                    + Benutzer erstellen
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Teams Tab */}
          <TabsContent value="teams" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Team-Verwaltung</h2>
              <Button onClick={() => setShowCreateTeamModal(true)}>
                + Neues Team
              </Button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Beschreibung
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Parent Team
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Erstellt
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {teams.map((team) => (
                    <tr key={team.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{team.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {team.description || 'Keine Beschreibung'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="outline">Level {team.team_level}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {team.parent_team_id || 'Kein Parent'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(team.created_at).toLocaleDateString('de-DE')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleTeamEdit(team)}
                          >
                            Bearbeiten
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => setShowDeleteTeamConfirm({id: team.id, name: team.name})}
                          >
                            Löschen
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {teams.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="text-6xl mb-4">👥</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Keine Teams vorhanden</h3>
                  <p className="text-gray-600 mb-4">Erstellen Sie Ihr erstes Team</p>
                  <Button onClick={() => setShowCreateTeamModal(true)}>
                    + Team erstellen
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* User Create Modal */}
        {showCreateUserModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full mx-4">
              <CardHeader>
                <CardTitle>👤 Neuen Benutzer erstellen</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUserSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={userFormData.name}
                      onChange={(e) => setUserFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">E-Mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={userFormData.email}
                      onChange={(e) => setUserFormData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="team_name">Team-Name</Label>
                    <Input
                      id="team_name"
                      value={userFormData.team_name}
                      onChange={(e) => setUserFormData(prev => ({ ...prev, team_name: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="role">Rolle</Label>
                    <Select value={userFormData.role} onValueChange={(value) => setUserFormData(prev => ({ ...prev, role: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="führungskraft">Führungskraft</SelectItem>
                        <SelectItem value="berater">Berater</SelectItem>
                        <SelectItem value="trainee">Trainee</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <Button type="submit" className="flex-1">
                      Benutzer erstellen
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setShowCreateUserModal(false);
                        resetUserForm();
                      }}
                      className="flex-1"
                    >
                      Abbrechen
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* User Edit Modal */}
        {showEditUserModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full mx-4">
              <CardHeader>
                <CardTitle>👤 Benutzer bearbeiten</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUserSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="edit-name">Name</Label>
                    <Input
                      id="edit-name"
                      value={userFormData.name}
                      onChange={(e) => setUserFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-email">E-Mail</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={userFormData.email}
                      onChange={(e) => setUserFormData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-team_name">Team-Name</Label>
                    <Input
                      id="edit-team_name"
                      value={userFormData.team_name}
                      onChange={(e) => setUserFormData(prev => ({ ...prev, team_name: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-role">Rolle</Label>
                    <Select value={userFormData.role} onValueChange={(value) => setUserFormData(prev => ({ ...prev, role: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="führungskraft">Führungskraft</SelectItem>
                        <SelectItem value="berater">Berater</SelectItem>
                        <SelectItem value="trainee">Trainee</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <Button type="submit" className="flex-1">
                      Benutzer aktualisieren
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setShowEditUserModal(false);
                        setEditingUser(null);
                        resetUserForm();
                      }}
                      className="flex-1"
                    >
                      Abbrechen
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* User Delete Confirmation Modal */}
        {showDeleteUserConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full mx-4">
              <CardHeader>
                <CardTitle>🗑️ Benutzer löschen</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">
                  Sind Sie sicher, dass Sie den Benutzer "{showDeleteUserConfirm.name}" löschen möchten?
                </p>
                <p className="text-sm text-red-600 mb-6">
                  Diese Aktion kann nicht rückgängig gemacht werden.
                </p>
                <div className="flex space-x-3">
                  <Button 
                    variant="destructive" 
                    onClick={() => handleUserDelete(showDeleteUserConfirm.id)}
                    className="flex-1"
                  >
                    Löschen
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowDeleteUserConfirm(null)}
                    className="flex-1"
                  >
                    Abbrechen
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Team Create Modal */}
        {showCreateTeamModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full mx-4">
              <CardHeader>
                <CardTitle>👥 Neues Team erstellen</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTeamSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="team-name">Team-Name</Label>
                    <Input
                      id="team-name"
                      value={teamFormData.name}
                      onChange={(e) => setTeamFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="team-description">Beschreibung</Label>
                    <Textarea
                      id="team-description"
                      value={teamFormData.description}
                      onChange={(e) => setTeamFormData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <Button type="submit" className="flex-1">
                      Team erstellen
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setShowCreateTeamModal(false);
                        resetTeamForm();
                      }}
                      className="flex-1"
                    >
                      Abbrechen
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Team Edit Modal */}
        {showEditTeamModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full mx-4">
              <CardHeader>
                <CardTitle>👥 Team bearbeiten</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTeamSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="edit-team-name">Team-Name</Label>
                    <Input
                      id="edit-team-name"
                      value={teamFormData.name}
                      onChange={(e) => setTeamFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-team-description">Beschreibung</Label>
                    <Textarea
                      id="edit-team-description"
                      value={teamFormData.description}
                      onChange={(e) => setTeamFormData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <Button type="submit" className="flex-1">
                      Team aktualisieren
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setShowEditTeamModal(false);
                        setEditingTeam(null);
                        resetTeamForm();
                      }}
                      className="flex-1"
                    >
                      Abbrechen
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Team Delete Confirmation Modal */}
        {showDeleteTeamConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full mx-4">
              <CardHeader>
                <CardTitle>🗑️ Team löschen</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">
                  Sind Sie sicher, dass Sie das Team "{showDeleteTeamConfirm.name}" löschen möchten?
                </p>
                <p className="text-sm text-red-600 mb-6">
                  Diese Aktion kann nicht rückgängig gemacht werden.
                </p>
                <div className="flex space-x-3">
                  <Button 
                    variant="destructive" 
                    onClick={() => handleTeamDelete(showDeleteTeamConfirm.id)}
                    className="flex-1"
                  >
                    Löschen
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowDeleteTeamConfirm(null)}
                    className="flex-1"
                  >
                    Abbrechen
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
