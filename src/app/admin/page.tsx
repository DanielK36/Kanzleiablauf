'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface Team {
  id: number;
  name: string;
  parent_team_id: number | null;
  team_level: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface User {
  id: number;
  firstname?: string;
  lastname?: string;
  name: string;
  team_name: string;
  role: string;
  team_id: number | null;
  parent_leader_id: number | null;
  is_authorized_leader?: boolean;
  can_create_subteams?: boolean;
}

interface OrgNode {
  id: string;
  name: string;
  type: 'team' | 'user';
  role?: string;
  teamId?: number;
  userId?: number;
  children: OrgNode[];
  level: number;
  parentId?: string;
}

function AdminPageContent() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState<OrgNode | null>(null);
  const [viewMode, setViewMode] = useState<'tree' | 'table' | 'grid'>('tree');
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{type: 'team' | 'user', id: number, name: string} | null>(null);
  const [showLeaderModal, setShowLeaderModal] = useState(false);
  const [selectedUserForLeader, setSelectedUserForLeader] = useState<number | null>(null);
  const [selectedTeamForLeader, setSelectedTeamForLeader] = useState<number | null>(null);
  const [showNewTeamModal, setShowNewTeamModal] = useState(false);
  const [newTeamData, setNewTeamData] = useState({
    name: '',
    parent_team_id: null as number | null,
    description: ''
  });
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // Check admin access
  const checkAdminAccess = async () => {
    if (!user) return false;
    
    try {
      const response = await fetch('/api/admin/users');
      if (response.status === 403) {
        router.push('/simple-dashboard');
        return false;
      }
      return response.ok;
    } catch (error) {
      console.error('Admin access check failed:', error);
      return false;
    }
  };

  // Load all data
  const loadData = async () => {
    try {
      setLoading(true);

      // Load teams
      const teamsResponse = await fetch('/api/admin/teams');
      if (teamsResponse.ok) {
        const teamsData = await teamsResponse.json();
        setTeams(teamsData);
      }

      // Load users
      const usersResponse = await fetch('/api/admin/users');
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show notification
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Create team
  const createTeam = async () => {
    try {
      const response = await fetch('/api/admin/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTeamData)
      });

      if (response.ok) {
        await loadData();
        setShowNewTeamModal(false);
        setNewTeamData({ name: '', parent_team_id: null, description: '' });
        showNotification('success', 'Team erfolgreich erstellt!');
      } else {
        const error = await response.json();
        showNotification('error', error.error || 'Fehler beim Erstellen des Teams');
      }
    } catch (error) {
      console.error('Error creating team:', error);
      showNotification('error', 'Fehler beim Erstellen des Teams');
    }
  };

  // Update team
  const updateTeam = async (teamId: number, updatedData: Partial<Team>) => {
    try {
      const response = await fetch('/api/admin/teams', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: teamId, ...updatedData })
      });

      if (response.ok) {
        await loadData();
        setEditingTeam(null);
        showNotification('success', 'Team erfolgreich aktualisiert!');
      } else {
        const error = await response.json();
        showNotification('error', error.error || 'Fehler beim Aktualisieren des Teams');
      }
    } catch (error) {
      console.error('Error updating team:', error);
      showNotification('error', 'Fehler beim Aktualisieren des Teams');
    }
  };

  // Delete team
  const deleteTeam = async (teamId: number) => {
    try {
      // Check if team has sub-teams
      const subTeams = teams.filter(t => t.parent_team_id === teamId);
      if (subTeams.length > 0) {
        showNotification('error', 'Dieses Team hat Sub-Teams. Bitte lösche zuerst die Sub-Teams.');
        return;
      }

      // Check if team has users
      const teamUsers = users.filter(u => u.team_id === teamId);
      if (teamUsers.length > 0) {
        showNotification('error', 'Dieses Team hat noch Benutzer. Bitte verschiebe die Benutzer zuerst in andere Teams.');
        return;
      }

      const response = await fetch('/api/admin/teams', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: teamId })
      });

      if (response.ok) {
        await loadData();
        setShowDeleteConfirm(null);
        showNotification('success', 'Team erfolgreich gelöscht!');
      } else {
        const error = await response.json();
        showNotification('error', error.error || 'Fehler beim Löschen des Teams');
      }
    } catch (error) {
      console.error('Error deleting team:', error);
      showNotification('error', 'Fehler beim Löschen des Teams');
    }
  };


  // Assign user to team
  const assignUserToTeam = async (userId: number, teamId: number) => {
    try {
      const team = teams.find(t => t.id === teamId);
      const response = await fetch('/api/admin/assign-user-to-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          teamId, 
          teamName: team?.name 
        })
      });

      if (response.ok) {
        await loadData();
        showNotification('success', 'Benutzer erfolgreich dem Team zugeordnet!');
      } else {
        const error = await response.json();
        showNotification('error', error.error || 'Fehler bei der Team-Zuordnung');
      }
    } catch (error) {
      console.error('Error assigning user to team:', error);
      showNotification('error', 'Fehler bei der Team-Zuordnung');
    }
  };
  const setTeamLeader = async (teamId: number, userId: number) => {
    try {
      const response = await fetch('/api/admin/set-team-leader', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, userId })
      });

      if (response.ok) {
        await loadData();
        showNotification('success', 'Team-Leader erfolgreich gesetzt!');
      } else {
        const error = await response.json();
        showNotification('error', error.error || 'Fehler beim Setzen des Team-Leaders');
      }
    } catch (error) {
      console.error('Error setting team leader:', error);
      showNotification('error', 'Fehler beim Setzen des Team-Leaders');
    }
  };


  // Build org chart
  const buildOrgChart = (): OrgNode[] => {
    const rootTeams = teams.filter(team => team.parent_team_id === null);
    
    const buildTeamNode = (team: Team): OrgNode => {
      const teamUsers = users.filter(user => user.team_id === team.id);
      const subTeams = teams.filter(t => t.parent_team_id === team.id);
      
      const userNodes: OrgNode[] = teamUsers.map(user => ({
        id: `user-${user.id}`,
        name: user.firstname || user.name,
        type: 'user' as const,
        role: user.role,
        userId: user.id,
        children: [],
        level: team.team_level + 1,
        parentId: `team-${team.id}`
      }));

      const subTeamNodes: OrgNode[] = subTeams.map(subTeam => buildTeamNode(subTeam));

      return {
        id: `team-${team.id}`,
        name: team.name,
        type: 'team' as const,
        teamId: team.id,
        children: [...userNodes, ...subTeamNodes],
        level: team.team_level,
        parentId: team.parent_team_id ? `team-${team.parent_team_id}` : undefined
      };
    };

    return rootTeams.map(team => buildTeamNode(team));
  };

  // Move user between teams
  const moveUserToTeam = async (userId: number, newTeamId: number) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: userId, 
          team_id: newTeamId,
          team_name: teams.find(t => t.id === newTeamId)?.name || ''
        })
      });

      if (response.ok) {
        await loadData();
        showNotification('success', 'Benutzer erfolgreich verschoben!');
      } else {
        const error = await response.json();
        showNotification('error', error.error || 'Fehler beim Verschieben des Benutzers');
      }
    } catch (error) {
      console.error('Error moving user:', error);
      showNotification('error', 'Fehler beim Verschieben des Benutzers');
    }
  };

  // Render team members as simple text list
  const renderTeamMembers = (teamId: number) => {
    const teamUsers = users.filter(u => u.team_id === teamId);
    const leaders = teamUsers.filter(u => u.is_authorized_leader);
    const advisors = teamUsers.filter(u => !u.is_authorized_leader);
    
    return (
      <div className="mt-2 space-y-1">
        {/* Leaders first */}
        {leaders.map(leader => (
          <div 
            key={`leader-${leader.id}`}
            className="text-xs text-yellow-700 font-medium flex items-center justify-center cursor-pointer hover:bg-yellow-50 px-2 py-1 rounded"
            draggable
            onDragStart={(e) => {
              setDraggedItem({
                id: `user-${leader.id}`,
                name: leader.firstname || leader.name,
                type: 'user',
                role: leader.role,
                userId: leader.id,
                children: [],
                level: 0
              });
              e.dataTransfer.effectAllowed = 'move';
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (draggedItem && draggedItem.type === 'user' && draggedItem.userId !== leader.id) {
                moveUserToTeam(draggedItem.userId!, teamId);
              }
            }}
          >
            👑 {leader.firstname || leader.name}
          </div>
        ))}
        
        {/* Advisors */}
        {advisors.map(advisor => (
          <div 
            key={`advisor-${advisor.id}`}
            className="text-xs text-gray-600 flex items-center justify-center cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
            draggable
            onDragStart={(e) => {
              setDraggedItem({
                id: `user-${advisor.id}`,
                name: advisor.firstname || advisor.name,
                type: 'user',
                role: advisor.role,
                userId: advisor.id,
                children: [],
                level: 0
              });
              e.dataTransfer.effectAllowed = 'move';
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (draggedItem && draggedItem.type === 'user' && draggedItem.userId !== advisor.id) {
                moveUserToTeam(draggedItem.userId!, teamId);
              }
            }}
          >
            👤 {advisor.firstname || advisor.name}
          </div>
        ))}
      </div>
    );
  };

  // Render tree node
  const renderTreeNode = (node: OrgNode, level = 0) => {
    const isTeam = node.type === 'team';
    
    if (isTeam) {
      return (
        <div 
          key={node.id}
          className="flex flex-col items-center group"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (draggedItem && draggedItem.type === 'user') {
              moveUserToTeam(draggedItem.userId!, node.teamId!);
            }
          }}
        >
          {/* Team Card - Smaller */}
          <div className="relative p-2 rounded-lg border-2 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 text-blue-800 cursor-move hover:shadow-md transition-all duration-200 min-w-[100px] max-w-[120px] group">
            <div className="text-center">
              <div className="font-medium text-xs truncate" title={node.name}>
                🏢 {node.name}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="absolute -top-1 -right-1 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTeamForLeader(node.teamId!);
                  setShowLeaderModal(true);
                }}
                className="w-4 h-4 bg-yellow-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-yellow-600 transition-colors"
                title="Leader autorisieren"
              >
                👑
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setNewTeamData({ name: '', parent_team_id: node.teamId!, description: '' });
                  setShowNewTeamModal(true);
                }}
                className="w-4 h-4 bg-green-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-green-600 transition-colors"
                title="Sub-Team erstellen"
              >
                +
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const team = teams.find(t => t.id === node.teamId);
                  if (team) setEditingTeam(team);
                }}
                className="w-4 h-4 bg-gray-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-gray-600 transition-colors"
                title="Bearbeiten"
              >
                ✏️
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm({ type: 'team', id: node.teamId!, name: node.name });
                }}
                className="w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 transition-colors"
                title="Löschen"
              >
                🗑️
              </button>
            </div>
        </div>
        
          {/* Team Members */}
          {renderTeamMembers(node.teamId!)}
          
          {/* Connection Line */}
          {node.children.filter(child => child.type === 'team').length > 0 && (
            <div className="w-px h-3 bg-gray-300 mt-2"></div>
          )}
          
          {/* Sub-Teams */}
          {node.children.filter(child => child.type === 'team').length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {node.children.filter(child => child.type === 'team').map(child => renderTreeNode(child, level + 1))}
            </div>
          )}
        </div>
      );
    }
    
    // User nodes are now handled in renderTeamMembers
    return null;
  };

  // Render table view with integrated team members
  const renderTableView = () => {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-xl shadow-sm">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Team</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Mitglieder</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Level</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Sub-Teams</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {teams.map(team => {
              const teamUsers = users.filter(u => u.team_id === team.id);
              const leaders = teamUsers.filter(u => u.is_authorized_leader);
              const advisors = teamUsers.filter(u => !u.is_authorized_leader);
              const subTeams = teams.filter(t => t.parent_team_id === team.id);
              
              return (
                <tr key={`team-${team.id}`} className="hover:bg-blue-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <Badge className="bg-blue-100 text-blue-800 mr-2">
                        🏢 Team
                      </Badge>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{team.name}</div>
                        <div className="text-xs text-gray-500">
                          {team.parent_team_id ? `Sub-Team von ${teams.find(t => t.id === team.parent_team_id)?.name}` : 'Haupt-Team'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      {/* Leaders */}
                      {leaders.map(leader => (
                        <div key={leader.id} className="text-xs text-yellow-700 font-medium">
                          👑 {leader.firstname || leader.name}
                        </div>
                      ))}
                      {/* Advisors */}
                      {advisors.map(advisor => (
                        <div key={advisor.id} className="text-xs text-gray-600">
                          👤 {advisor.firstname || advisor.name}
                        </div>
                      ))}
                      {teamUsers.length === 0 && (
                        <div className="text-xs text-gray-400 italic">Keine Mitglieder</div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Badge variant="outline" className="text-blue-600 border-blue-200">
                      Level {team.team_level}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      {subTeams.map(subTeam => (
                        <div key={subTeam.id} className="text-xs text-green-600">
                          🏢 {subTeam.name}
          </div>
        ))}
                      {subTeams.length === 0 && (
                        <div className="text-xs text-gray-400 italic">Keine Sub-Teams</div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingTeam(team)}
                        className="text-blue-600 hover:text-blue-800 text-xs"
                      >
                        ✏️
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowDeleteConfirm({ type: 'team', id: team.id, name: team.name })}
                        className="text-red-600 hover:text-red-800 text-xs"
                      >
                        🗑️
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setNewTeamData({ name: '', parent_team_id: team.id, description: '' });
                          setShowNewTeamModal(true);
                        }}
                        className="text-green-600 hover:text-green-800 text-xs"
                      >
                        +
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedTeamForLeader(team.id);
                          setShowLeaderModal(true);
                        }}
                        className="text-yellow-600 hover:text-yellow-800 text-xs"
                      >
                        👑
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // Render grid view
  const renderGridView = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {teams.map(team => (
          <Card key={team.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center">
                  🏢 {team.name}
                </CardTitle>
                <Badge variant="outline">
                  Level {team.team_level}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Mitglieder:</p>
                  <p className="font-semibold">{users.filter(u => u.team_id === team.id).length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Sub-Teams:</p>
                  <p className="font-semibold">{teams.filter(t => t.parent_team_id === team.id).length}</p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingTeam(team)}
                    className="flex-1"
                  >
                    ✏️ Bearbeiten
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowDeleteConfirm({ type: 'team', id: team.id, name: team.name })}
                    className="flex-1 text-red-600"
                  >
                    🗑️ Löschen
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  useEffect(() => {
    if (isLoaded && user) {
      checkAdminAccess().then(hasAccess => {
        if (hasAccess) {
          loadData();
        }
      });
    }
  }, [isLoaded, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lädt Organigramm...</p>
        </div>
      </div>
    );
  }

  const orgChart = buildOrgChart();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardHeader>
          <div className="flex justify-between items-center">
            <div>
                <CardTitle className="text-2xl">🏢 Admin Panel - Organigramm</CardTitle>
                <p className="text-blue-100 mt-2">Vollständige Team-Hierarchie mit Drag & Drop Verwaltung</p>
            </div>
              <div className="flex space-x-3">
                <Button 
                  onClick={() => setShowNewTeamModal(true)}
                  className="bg-white text-blue-600 hover:bg-blue-50"
                >
                  + Neues Team
            </Button>
          </div>
            </div>
          </CardHeader>
        </Card>

        {/* Team Assignment Section */}
        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <CardHeader>
            <CardTitle className="text-xl text-indigo-800">👥 Team-Zuordnung</CardTitle>
            <p className="text-sm text-indigo-600">Benutzer ohne Team-Zuordnung verwalten</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.filter(u => !u.team_id).map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
                      {(user.firstname || user.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{user.firstname || user.name}</p>
                      <p className="text-sm text-gray-500">{user.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <select
                      onChange={(e) => {
                        const teamId = e.target.value;
                        if (teamId) {
                          assignUserToTeam(user.id, parseInt(teamId));
                        }
                      }}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                      defaultValue=""
                    >
                      <option value="">Team auswählen</option>
                      {teams.map(team => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
              {users.filter(u => !u.team_id).length === 0 && (
                <p className="text-center text-gray-500 py-4">Alle Benutzer sind Teams zugeordnet</p>
              )}
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="text-3xl font-bold text-blue-600">{teams.length}</div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-800">Teams</p>
                  <p className="text-xs text-blue-600">
                    {teams.filter(t => t.parent_team_id === null).length} Haupt-Teams
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="text-3xl font-bold text-green-600">{users.length}</div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-green-800">Benutzer</p>
                  <p className="text-xs text-green-600">
                    {users.filter(u => u.role === 'top_leader').length} Leader
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="text-3xl font-bold text-yellow-600">
                  {users.filter(u => u.is_authorized_leader).length}
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-yellow-800">Autorisierte Leader</p>
                  <p className="text-xs text-yellow-600">
                    {users.filter(u => u.can_create_subteams).length} können Sub-Teams erstellen
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="text-3xl font-bold text-purple-600">
                  {teams.filter(t => t.parent_team_id !== null).length}
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-purple-800">Sub-Teams</p>
                  <p className="text-xs text-purple-600">
                    Max Level: {Math.max(...teams.map(t => t.team_level), 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
          <Card>
            <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Organigramm</CardTitle>
                <p className="text-sm text-gray-600">
                  {viewMode === 'tree' && 'Kompakte Baumstruktur mit Drag & Drop Funktionalität'}
                  {viewMode === 'table' && 'Tabellenansicht für kompakte Übersicht aller Teams und Benutzer'}
                  {viewMode === 'grid' && 'Kartenansicht für visuelle Team-Übersicht'}
                </p>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant={viewMode === 'tree' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('tree')}
                >
                  🌳 Baum
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                >
                  📊 Tabelle
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  🎴 Karten
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="min-h-96 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-x-auto">
              {viewMode === 'tree' && (
                orgChart.length > 0 ? (
                  <div className="flex justify-center">
                    <div className="space-y-4">
                      {orgChart.map(node => renderTreeNode(node))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-12">
                    <div className="text-6xl mb-4">🏢</div>
                    <p className="text-lg">Keine Teams vorhanden</p>
                    <p className="text-sm">Erstelle zuerst ein Team um das Organigramm zu sehen</p>
                  </div>
                )
              )}
              {viewMode === 'table' && renderTableView()}
              {viewMode === 'grid' && renderGridView()}
            </div>
          </CardContent>
        </Card>

        {/* Modals */}
        {/* New Team Modal */}
        {showNewTeamModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full mx-4 bg-white">
              <CardHeader>
                <CardTitle className="text-gray-900">🏢 Neues Team erstellen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team-Name
                </label>
                <input
                  type="text"
                  value={newTeamData.name}
                    onChange={(e) => setNewTeamData({...newTeamData, name: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Team-Name eingeben"
                />
              </div>
                
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Übergeordnetes Team (Parent Team)
                </label>
                <select
                  value={newTeamData.parent_team_id || ''}
                  onChange={(e) => setNewTeamData({...newTeamData, parent_team_id: e.target.value ? parseInt(e.target.value) : null})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">🏢 Haupt-Team (Level 1)</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>
                      {team.parent_team_id ? '  └─ ' : ''}🏢 {team.name} (Level {team.team_level})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Wähle ein Parent-Team um ein Sub-Team zu erstellen, oder lasse es leer für ein Haupt-Team.
                </p>
              </div>
                
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beschreibung
                </label>
                <textarea
                  value={newTeamData.description}
                    onChange={(e) => setNewTeamData({...newTeamData, description: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Team-Beschreibung"
                  rows={3}
                />
              </div>
                
                <div className="flex space-x-3">
                  <Button onClick={createTeam} className="flex-1">
                    Team erstellen
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowNewTeamModal(false)}
                    className="flex-1"
                  >
                  Abbrechen
                </Button>
              </div>
            </CardContent>
          </Card>
          </div>
        )}


        {/* Leader Authorization Modal */}
        {showLeaderModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full mx-4 bg-white">
          <CardHeader>
                <CardTitle className="text-gray-900">👑 Leader autorisieren</CardTitle>
                <p className="text-sm text-gray-600">
                  Wähle einen Benutzer aus dem Team "{teams.find(t => t.id === selectedTeamForLeader)?.name}" aus:
                </p>
          </CardHeader>
          <CardContent>
                <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
                  {users.filter(u => u.team_id === selectedTeamForLeader).map(user => (
                    <label key={user.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer border">
                      <input
                        type="radio"
                        name="selectedUser"
                        value={user.id}
                        checked={selectedUserForLeader === user.id}
                        onChange={() => setSelectedUserForLeader(user.id)}
                        className="text-blue-600"
                      />
                      <div>
                        <div className="font-medium">{user.firstname || user.name}</div>
                        <div className="text-sm text-gray-500">{user.role}</div>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="flex space-x-3">
                  <Button
                    onClick={() => {
                      if (selectedUserForLeader && selectedTeamForLeader) {
                        setTeamLeader(selectedTeamForLeader, selectedUserForLeader);
                        setShowLeaderModal(false);
                        setSelectedUserForLeader(null);
                        setSelectedTeamForLeader(null);
                      }
                    }}
                    disabled={!selectedUserForLeader}
                    className="flex-1"
                  >
                    Leader autorisieren
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowLeaderModal(false);
                      setSelectedUserForLeader(null);
                      setSelectedTeamForLeader(null);
                    }}
                    className="flex-1"
                  >
                    Abbrechen
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Team Edit Modal */}
        {editingTeam && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full mx-4 bg-white">
              <CardHeader>
                <CardTitle className="text-gray-900">✏️ Team bearbeiten</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team-Name
                  </label>
                  <input
                    type="text"
                    value={editingTeam.name}
                    onChange={(e) => setEditingTeam({...editingTeam, name: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Beschreibung
                  </label>
                  <textarea
                    value={editingTeam.description || ''}
                    onChange={(e) => setEditingTeam({...editingTeam, description: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>
                
                <div className="flex space-x-3">
                  <Button 
                    onClick={() => {
                      updateTeam(editingTeam.id, {
                        name: editingTeam.name,
                        description: editingTeam.description
                      });
                    }}
                    className="flex-1"
                  >
                    Speichern
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setEditingTeam(null)}
                    className="flex-1"
                  >
                    Abbrechen
                  </Button>
            </div>
          </CardContent>
        </Card>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full mx-4 bg-white">
          <CardHeader>
                <CardTitle className="text-red-600">🗑️ {showDeleteConfirm.type === 'team' ? 'Team' : 'Benutzer'} löschen</CardTitle>
          </CardHeader>
          <CardContent>
                <p className="text-sm text-gray-600 mb-6">
                  Möchten Sie {showDeleteConfirm.type === 'team' ? 'das Team' : 'den Benutzer'} "{showDeleteConfirm.name}" wirklich löschen?
                  <br /><br />
                  <strong className="text-red-600">Warnung:</strong> Diese Aktion kann nicht rückgängig gemacht werden.
                </p>
                
                <div className="flex space-x-3">
                  <Button 
                    onClick={() => {
                      if (showDeleteConfirm.type === 'team') {
                        deleteTeam(showDeleteConfirm.id);
                      }
                      // TODO: Implement user deletion
                    }}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    Ja, löschen
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1"
                  >
                    Abbrechen
                        </Button>
            </div>
          </CardContent>
        </Card>
          </div>
        )}

        {/* Notification */}
        {notification && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
            notification.type === 'success' 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}>
            <div className="flex items-center space-x-2">
              <span>{notification.type === 'success' ? '✅' : '❌'}</span>
              <span>{notification.message}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <>
      <SignedIn>
        <AdminPageContent />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
