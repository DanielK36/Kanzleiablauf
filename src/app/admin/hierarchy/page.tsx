'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface User {
  id: string;
  name: string;
  email?: string;
  role: string;
  team_name?: string;
  parent_leader_id?: string;
  is_team_leader?: boolean;
  team_id?: string;
}

interface Team {
  id: string;
  name: string;
}

export default function HierarchyManagementPage() {
  const { user, isLoaded } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedParent, setSelectedParent] = useState<string>('');
  const [isTeamLeader, setIsTeamLeader] = useState<boolean>(false);

  useEffect(() => {
    if (isLoaded) {
      loadData();
    }
  }, [isLoaded]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading hierarchy data...');
      
      // Load users
      const usersResponse = await fetch('/api/admin/users');
      console.log('🔍 Users response status:', usersResponse.status);
      
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        console.log('🔍 Users data:', usersData);
        setUsers(usersData.users || []);
      } else {
        console.error('Failed to load users:', usersResponse.status);
      }

      // Load teams
      const teamsResponse = await fetch('/api/admin/teams');
      console.log('🔍 Teams response status:', teamsResponse.status);
      
      if (teamsResponse.ok) {
        const teamsData = await teamsResponse.json();
        console.log('🔍 Teams data:', teamsData);
        setTeams(teamsData.teams || []);
      } else {
        console.error('Failed to load teams:', teamsResponse.status);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserHierarchy = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch('/api/admin/update-hierarchy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: selectedUser,
          parent_leader_id: selectedParent === 'none' ? null : selectedParent,
          is_team_leader: isTeamLeader,
        }),
      });

      if (response.ok) {
        alert('Hierarchie erfolgreich aktualisiert!');
        loadData(); // Reload data
        setSelectedUser('');
        setSelectedParent('');
        setIsTeamLeader(false);
      } else {
        const error = await response.json();
        alert(`Fehler: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating hierarchy:', error);
      alert('Fehler beim Aktualisieren der Hierarchie');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'führungskraft': return 'bg-blue-100 text-blue-800';
      case 'berater': return 'bg-green-100 text-green-800';
      case 'trainee': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getParentName = (parentId: string) => {
    const parent = users.find(u => u.id === parentId);
    return parent ? parent.name : 'Unbekannt';
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-8">
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-8">
            <p className="text-gray-500">Please sign in to access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-8">
            <p className="text-gray-500">Lade Hierarchie-Daten...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🏢 Hierarchie-Management</h1>
              <p className="text-gray-600 mt-2">Verwaltung der Team-Hierarchie und Führungsstruktur</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Willkommen zurück,</p>
              <p className="font-semibold">{user?.firstName || user?.name?.split(' ')[0] || user?.firstName}</p>
            </div>
          </div>
        </div>

        {/* Current Hierarchy Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">📊 Aktuelle Hierarchie-Übersicht</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((user) => {
                const subordinates = users.filter(u => u.parent_leader_id === user.id);
                return (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="font-medium text-gray-900">{user.name}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        {subordinates.length > 0 && (
                          <p className="text-xs text-blue-600">
                            {subordinates.length} Untergebene: {subordinates.map(s => s.name).join(', ')}
                          </p>
                        )}
                      </div>
                      <Badge className={getRoleColor(user.role)}>
                        {user.role}
                      </Badge>
                      {user.is_team_leader && (
                        <Badge className="bg-purple-100 text-purple-800">
                          Team-Leader
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {user.parent_leader_id ? (
                          <>Vorgesetzter: {getParentName(user.parent_leader_id)}</>
                        ) : (
                          <span className="text-gray-400">Kein Vorgesetzter</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-600">
                        Team: {user.team_name || 'Kein Team'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Hierarchy Management */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">⚙️ Hierarchie bearbeiten</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* User Selection */}
              <div>
                <Label htmlFor="user-select">Benutzer auswählen</Label>
                <Select value={selectedUser} onValueChange={(value) => {
                  setSelectedUser(value);
                  // Auto-fill current values when user is selected
                  const user = users.find(u => u.id === value);
                  if (user) {
                    setSelectedParent(user.parent_leader_id || 'none');
                    setIsTeamLeader(user.is_team_leader || false);
                  }
                }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Benutzer auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.role}) - {user.team_name || 'Kein Team'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Parent Selection */}
              <div>
                <Label htmlFor="parent-select">Vorgesetzter auswählen</Label>
                <Select value={selectedParent} onValueChange={setSelectedParent}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Vorgesetzten auswählen (optional)..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Kein Vorgesetzter</SelectItem>
                    {users
                      .filter(u => u.id !== selectedUser && (u.role === 'führungskraft' || u.role === 'admin'))
                      .map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.role}) - {user.team_name || 'Kein Team'}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Team Leader Checkbox */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="team-leader"
                  checked={isTeamLeader}
                  onChange={(e) => setIsTeamLeader(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="team-leader">Team-Leader (kann Untergebene haben)</Label>
              </div>

              {/* Update Button */}
              <Button 
                onClick={updateUserHierarchy}
                disabled={!selectedUser}
                className="w-full"
              >
                Hierarchie aktualisieren
              </Button>
              
              {/* Success Message */}
              {selectedUser && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✅ Änderungen werden sofort in der kanzleiablauf-team Seite sichtbar
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">📋 Anweisungen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-gray-600">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Hierarchie-Struktur:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Admin:</strong> Höchste Ebene, kann alle verwalten</li>
                  <li><strong>Führungskraft:</strong> Kann Team-Leader sein und Untergebene haben</li>
                  <li><strong>Berater:</strong> Normale Mitarbeiter, haben Vorgesetzte</li>
                  <li><strong>Trainee:</strong> Auszubildende, haben Vorgesetzte</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Team-Leader:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Team-Leader haben automatisch die Rolle "Führungskraft"</li>
                  <li>Sie können Subteams verwalten</li>
                  <li>Ihre Untergebenen werden in der kanzleiablauf-team Seite als Subteam angezeigt</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Hierarchie-Logik:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Admin:</strong> Sieht alle Teams (GameChanger, Visionäre, Goalgetter)</li>
                  <li><strong>Team-Leader mit Untergebenen:</strong> Sieht eigenes Team + Teams der Untergebenen</li>
                  <li><strong>Team-Leader ohne Untergebene:</strong> Sieht nur eigenes Team (ohne Vorgesetzten)</li>
                  <li><strong>Normale Mitarbeiter:</strong> Sieht nur eigenes Team</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
