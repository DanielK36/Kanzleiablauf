'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';

interface AdminSectionProps {
  teamData: any;
  selectedTeam: string;
  onTeamChange: (team: string) => void;
}

export default function AdminSection({ teamData, selectedTeam, onTeamChange }: AdminSectionProps) {
  const [moodFeedback, setMoodFeedback] = useState("");

  if (teamData?.currentUser?.role !== 'admin') {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Admin Navigation */}
      <Card>
        <CardHeader>
          <CardTitle>🎯 Team-Ansicht wechseln</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamData?.availableTeamViews?.map((view: any) => (
              <Button
                key={view.id}
                variant={selectedTeam === view.id ? "default" : "outline"}
                onClick={() => onTeamChange(view.id)}
                className="h-auto p-4 flex flex-col items-start"
              >
                <div className="font-medium">{view.label}</div>
                <div className="text-xs opacity-70 mt-1">{view.description}</div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Admin Mood Feedback */}
      <Card>
        <CardHeader>
          <CardTitle>💭 Führungsfeedback</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Wie fühlst du dich damit?
            </label>
            <Textarea
              rows={3}
              value={moodFeedback}
              onChange={(e) => setMoodFeedback(e.target.value)}
              placeholder=""
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
