"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Team {
  id: string;
  name: string;
  leader_id: string;
  leader_name: string;
  members: TeamMember[];
  level: number;
  parent_team_id?: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: 'leader' | 'advisor';
  permissions: {
    canViewTeamData: boolean;
    canViewAllTeams: boolean;
    canManageUsers: boolean;
    canManageTeams: boolean;
  };
}

export default function TeamsAdmin() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const teamLevels = [
    { value: 1, label: 'Level 1 - GameChanger (Admin)' },
    { value: 2, label: 'Level 2 - Führungsteams' },
    { value: 3, label: 'Level 3 - Unterteams' }
  ];

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      // TODO: Implement API endpoint
      const mockTeams: Team[] = [
        {
          id: '1',
          name: 'GameChanger',
          leader_id: '1',
          leader_name: 'Admin',
          level: 1,
          members: [
            {
              id: '1',
              name: 'Admin',
              role: 'leader',
              permissions: {
                canViewTeamData: true,
                canViewAllTeams: true,
                canManageUsers: true,
                canManageTeams: true
              }
            }
          ]
        },
        {
          id: '2',
          name: 'Goalgetter',
          leader_id: '2',
          leader_name: 'Daniel',
          level: 2,
          parent_team_id: '1',
          members: [
            {
              id: '2',
              name: 'Daniel',
              role: 'leader',
              permissions: {
                canViewTeamData: true,
                canViewAllTeams: false,
                canManageUsers: true,
                canManageTeams: false
              }
            }
          ]
        }
      ];
      setTeams(mockTeams);
    } catch (error) {
      console.error('Error loading teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveTeam = async (team: Team) => {
    try {
      // TODO: Implement API endpoint
      console.log('Saving team:', team);
      await loadTeams();
      setEditingTeam(null);
    } catch (error) {
      console.error('Error saving team:', error);
    }
  };

  const deleteTeam = async (id: string) => {
    try {
      // TODO: Implement API endpoint
      console.log('Deleting team:', id);
      await loadTeams();
    } catch (error) {
      console.error('Error deleting team:', error);
    }
  };

  const updateMemberPermissions = async (teamId: string, memberId: string, permissions: TeamMember['permissions']) => {
    try {
      // TODO: Implement API endpoint
      console.log('Updating permissions:', { teamId, memberId, permissions });
      await loadTeams();
    } catch (error) {
      console.error('Error updating permissions:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Lade Teams...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Team Management
        </h1>
        <p className="text-gray-600">
          Verwalte Teams, Leiter und Berechtigungen
        </p>
      </div>

      {/* Teams List */}
      <div className="grid gap-6">
        {teams.map(team => (
          <Card key={team.id}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl">{team.name}</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    Level {team.level} • Leiter: {team.leader_name}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingTeam(team)}
                  >
                    Bearbeiten
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteTeam(team.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Löschen
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Team-Mitglieder</h4>
                  <div className="space-y-2">
                    {team.members.map(member => (
                      <div key={member.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{member.name}</div>
                          <div className="text-sm text-gray-500">
                            Rolle: {member.role === 'leader' ? 'Leiter' : 'Berater'}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // TODO: Open permissions modal
                              console.log('Edit permissions for:', member.id);
                            }}
                          >
                            Berechtigungen
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Permissions Summary */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Berechtigungen</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {team.members.map(member => (
                      <div key={member.id} className="p-2 bg-blue-50 rounded text-sm">
                        <div className="font-medium">{member.name}</div>
                        <div className="text-xs text-gray-600">
                          {member.permissions.canViewTeamData && '✓ Team-Daten '}
                          {member.permissions.canViewAllTeams && '✓ Alle Teams '}
                          {member.permissions.canManageUsers && '✓ User-Management '}
                          {member.permissions.canManageTeams && '✓ Team-Management'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add New Team Button */}
      <div className="mt-8">
        <Button
          onClick={() => {
            // TODO: Open new team modal
            console.log('Add new team');
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Neues Team hinzufügen
        </Button>
      </div>
    </div>
  );
}
