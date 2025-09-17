"use client";
import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface OnboardingFormProps {
  onSubmit: (data: OnboardingData) => void;
}

interface OnboardingData {
  name: string;
  team_name: string;
  role: 'advisor' | 'sub_leader' | 'top_leader';
  parent_leader_id?: string;
  personal_targets: {
    fa_daily: number;
    eh_daily: number;
    tiv_weekly: number;
  };
}

export const OnboardingForm = ({ onSubmit }: OnboardingFormProps) => {
  const [formData, setFormData] = useState<OnboardingData>({
    name: '',
    team_name: '',
    role: 'advisor',
    personal_targets: {
      fa_daily: 5,
      eh_daily: 3,
      tiv_weekly: 8
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field: string, value: string | number) => {
    if (field.startsWith('personal_targets.')) {
      const targetField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        personal_targets: {
          ...prev.personal_targets,
          [targetField]: typeof value === 'string' ? parseInt(value) || 0 : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Willkommen im Leadership System</CardTitle>
        <p className="text-center text-gray-600">
          Bitte vervollständige dein Profil, um das System zu nutzen
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Team Name
            </label>
            <select
              value={formData.team_name}
              onChange={(e) => handleInputChange('team_name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Bitte Team auswählen...</option>
              <option value="Team Alpha">Team Alpha</option>
              <option value="Team Beta">Team Beta</option>
              <option value="Team Gamma">Team Gamma</option>
              <option value="Team Delta">Team Delta</option>
              <option value="Team Echo">Team Echo</option>
              <option value="Team Foxtrot">Team Foxtrot</option>
              <option value="Team Golf">Team Golf</option>
              <option value="Team Hotel">Team Hotel</option>
              <option value="Team India">Team India</option>
              <option value="Team Juliet">Team Juliet</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rolle
            </label>
            <select
              value={formData.role}
              onChange={(e) => handleInputChange('role', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="advisor">Berater</option>
              <option value="sub_leader">Sub-Leader</option>
              <option value="top_leader">Top-Leader</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Persönliche Ziele
            </label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">FA täglich</label>
                <input
                  type="number"
                  value={formData.personal_targets.fa_daily}
                  onChange={(e) => handleInputChange('personal_targets.fa_daily', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">EH täglich</label>
                <input
                  type="number"
                  value={formData.personal_targets.eh_daily}
                  onChange={(e) => handleInputChange('personal_targets.eh_daily', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">TIV wöchentlich</label>
                <input
                  type="number"
                  value={formData.personal_targets.tiv_weekly}
                  onChange={(e) => handleInputChange('personal_targets.tiv_weekly', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Profil erstellen
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
