"use client";
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  team_name: string;
  last_checkin?: string;
  energy_level?: 'high' | 'medium' | 'low';
  status?: 'excellent' | 'good' | 'needs_attention';
}

interface TeamMemberCardProps {
  member: TeamMember;
  onSelect?: (member: TeamMember) => void;
}

export const TeamMemberCard = ({ member, onSelect }: TeamMemberCardProps) => {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'good':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'needs_attention':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEnergyColor = (energy?: string) => {
    switch (energy) {
      case 'high':
        return 'bg-green-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card 
      className={`team-member-card cursor-pointer transition-all hover:shadow-md ${
        member.status === 'needs_attention' ? 'ring-2 ring-yellow-400' : ''
      } ${member.status === 'excellent' ? 'ring-2 ring-green-400' : ''}`}
      onClick={() => onSelect?.(member)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{member.name}</CardTitle>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${getEnergyColor(member.energy_level)}`}></div>
            <Badge variant="outline" className={getStatusColor(member.status)}>
              {member.status || 'Standard'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Rolle:</span> {member.role}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Team:</span> {member.team_name}
          </p>
          {member.last_checkin && (
            <p className="text-sm text-gray-600">
              <span className="font-medium">Letzter Check-in:</span> {member.last_checkin}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
