"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

interface Team {
  id: number;
  name: string;
  parent_team_id: number | null;
  team_level: number;
  description: string;
  children?: Team[];
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  name: string;
  team_name: string;
  role: string;
  team_id: number | null;
  parent_leader_id: number | null;
}

export default function AdminPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTeamForm, setShowNewTeamForm] = useState(false);
  const [newTeamData, setNewTeamData] = useState({
    name: '',
    parent_team_id: null as number | null,
    description: ''
  });

  useEffect(() => {
    if (isLoaded && user) {
      checkAdminAccess();
      loadData();
    }
  }, [isLoaded, user]);

  const checkAdminAccess = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const userData = await response.json();
        if (userData.role !== 'admin') {
          router.push('/dashboard');
        }
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      router.push('/dashboard');
    }
  };

  const loadData = async () => {
    try {
      const [teamsResponse, usersResponse] = await Promise.all([
        fetch('/api/admin/teams'),
        fetch('/api/admin/users')
      ]);

      if (teamsResponse.ok) {
        const teamsData = await teamsResponse.json();
        setTeams(teamsData);
      }

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    try {
      const response = await fetch('/api/admin/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTeamData)
      });

      if (response.ok) {
        setNewTeamData({ name: '', parent_team_id: null, description: '' });
        setShowNewTeamForm(false);
        loadData();
      }
    } catch (error) {
      console.error('Error creating team:', error);
    }
  };

  const renderTeamTree = (team: Team, level = 0) => {
    const teamUsers = users.filter(u => u.team_name === team.name);
    
    return (
      <div key={team.id} className="ml-4">
        <div className="flex items-center space-x-2 py-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="font-medium">{team.name}</span>
          <span className="text-sm text-gray-500">({teamUsers.length} Mitglieder)</span>
        </div>
        
        {teamUsers.map(user => (
          <div key={user.id} className="ml-6 flex items-center space-x-2 py-1">
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <span className="text-sm">
              {user.firstName} {user.lastName} 
              <span className="text-gray-500 ml-2">({user.role})</span>
            </span>
          </div>
        ))}
        
        {team.children?.map(child => renderTeamTree(child, level + 1))}
      </div>
    );
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 p-4">Lädt...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-gray-600 mt-2">Team-Hierarchie und Benutzerverwaltung</p>
            </div>
            <Button onClick={() => setShowNewTeamForm(!showNewTeamForm)}>
              Neues Team erstellen
            </Button>
          </div>
        </div>

        {/* New Team Form */}
        {showNewTeamForm && (
          <Card>
            <CardHeader>
              <CardTitle>Neues Team erstellen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team-Name
                </label>
                <input
                  type="text"
                  value={newTeamData.name}
                  onChange={(e) => setNewTeamData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Team-Name eingeben"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Übergeordnetes Team
                </label>
                <select
                  value={newTeamData.parent_team_id || ''}
                  onChange={(e) => setNewTeamData(prev => ({ 
                    ...prev, 
                    parent_team_id: e.target.value ? parseInt(e.target.value) : null 
                  }))}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Kein übergeordnetes Team</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beschreibung
                </label>
                <textarea
                  value={newTeamData.description}
                  onChange={(e) => setNewTeamData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Team-Beschreibung"
                  rows={3}
                />
              </div>
              <div className="flex space-x-4">
                <Button onClick={handleCreateTeam}>Team erstellen</Button>
                <Button variant="outline" onClick={() => setShowNewTeamForm(false)}>
                  Abbrechen
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Team Hierarchy */}
        <Card>
          <CardHeader>
            <CardTitle>Team-Hierarchie (Organigramm)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {teams.filter(team => team.parent_team_id === null).map(rootTeam => 
                renderTeamTree(rootTeam)
              )}
            </div>
          </CardContent>
        </Card>

        {/* User Management */}
        <Card>
          <CardHeader>
            <CardTitle>Benutzerverwaltung</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Team
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rolle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map(user => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.team_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.role}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button size="sm" variant="outline">
                          Bearbeiten
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
