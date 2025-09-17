"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function WeeklyGoalsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [weeklyGoals, setWeeklyGoals] = useState({
    fa_weekly_target: 0,
    eh_weekly_target: 0,
    new_appointments_weekly_target: 0,
    recommendations_weekly_target: 0,
    tiv_invitations_weekly_target: 0,
    taa_invitations_weekly_target: 0,
    tgs_registrations_weekly_target: 0,
    bav_checks_weekly_target: 0,
    additional_goal: ''
  });

  const handleInputChange = (field: string, value: string | number) => {
    setWeeklyGoals(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      console.log('Saving weekly goals:', weeklyGoals);
      const response = await fetch('/api/weekly-goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(weeklyGoals),
      });

      const responseData = await response.text();
      console.log('Response status:', response.status);
      console.log('Response data:', responseData);

      if (response.ok) {
        console.log('Weekly goals saved successfully');
        router.push('/dashboard');
      } else {
        console.error('Failed to save weekly goals:', responseData);
        alert('Fehler beim Speichern der Wochenziele. Bitte versuchen Sie es erneut.');
      }
    } catch (error) {
      console.error('Error saving weekly goals:', error);
      alert('Fehler beim Speichern der Wochenziele. Bitte überprüfen Sie Ihre Internetverbindung.');
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Bitte melden Sie sich an
            </h1>
            <p className="text-gray-600">
              Sie müssen sich anmelden, um die Wochenziele zu verwenden.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Wochenziele setzen
          </h1>
          <p className="text-gray-600 mt-2">
            Definieren Sie Ihre Ziele für diese Woche.
          </p>
        </div>

        {/* Weekly Goals Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🎯 Wochenziele</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* 8 Standard-Metriken */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Finanzanalysen (FA) - Wochenziel
                  </label>
                  <input
                    type="number"
                    value={weeklyGoals.fa_weekly_target}
                    onChange={(e) => handleInputChange('fa_weekly_target', parseInt(e.target.value) || 0)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="z.B. 25"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    EH - Wochenziel
                  </label>
                  <input
                    type="number"
                    value={weeklyGoals.eh_weekly_target}
                    onChange={(e) => handleInputChange('eh_weekly_target', parseInt(e.target.value) || 0)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="z.B. 15"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Neue Termine - Wochenziel
                  </label>
                  <input
                    type="number"
                    value={weeklyGoals.new_appointments_weekly_target}
                    onChange={(e) => handleInputChange('new_appointments_weekly_target', parseInt(e.target.value) || 0)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="z.B. 20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Empfehlungen - Wochenziel
                  </label>
                  <input
                    type="number"
                    value={weeklyGoals.recommendations_weekly_target}
                    onChange={(e) => handleInputChange('recommendations_weekly_target', parseInt(e.target.value) || 0)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="z.B. 10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    TIV Einladungen - Wochenziel
                  </label>
                  <input
                    type="number"
                    value={weeklyGoals.tiv_invitations_weekly_target}
                    onChange={(e) => handleInputChange('tiv_invitations_weekly_target', parseInt(e.target.value) || 0)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="z.B. 8"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    TAA Einladungen - Wochenziel
                  </label>
                  <input
                    type="number"
                    value={weeklyGoals.taa_invitations_weekly_target}
                    onChange={(e) => handleInputChange('taa_invitations_weekly_target', parseInt(e.target.value) || 0)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="z.B. 5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    TGS Anmeldungen - Wochenziel
                  </label>
                  <input
                    type="number"
                    value={weeklyGoals.tgs_registrations_weekly_target}
                    onChange={(e) => handleInputChange('tgs_registrations_weekly_target', parseInt(e.target.value) || 0)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="z.B. 3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    bAV Checks - Wochenziel
                  </label>
                  <input
                    type="number"
                    value={weeklyGoals.bav_checks_weekly_target}
                    onChange={(e) => handleInputChange('bav_checks_weekly_target', parseInt(e.target.value) || 0)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="z.B. 12"
                  />
                </div>
              </div>

              {/* Zusätzliches Ziel */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Was willst du nächste Woche anders machen?
                </label>
                <textarea
                  value={weeklyGoals.additional_goal}
                  onChange={(e) => handleInputChange('additional_goal', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Beschreiben Sie Ihr zusätzliches Ziel für diese Woche..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button
            onClick={() => router.push('/dashboard')}
            variant="outline"
            className="px-6 py-2"
          >
            Zurück
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 disabled:opacity-50"
          >
            {loading ? 'Speichern...' : 'Speichern'}
          </Button>
        </div>
      </div>
    </div>
  );
}
