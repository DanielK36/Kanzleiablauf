"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export function MonthlyProgress() {
  const [progressData, setProgressData] = useState({
    fa_progress: 0,
    eh_progress: 0,
    recommendations_progress: 0,
    appointments_progress: 0,
    tiv_invitations_progress: 0,
    taa_invitations_progress: 0,
    tgs_registrations_progress: 0,
    fa_target: 100,
    eh_target: 60,
    recommendations_target: 20,
    appointments_target: 80,
    tiv_invitations_target: 30,
    taa_invitations_target: 25,
    tgs_registrations_target: 15,
    fa_current: 0,
    eh_current: 0,
    recommendations_current: 0,
    appointments_current: 0,
    tiv_invitations_current: 0,
    taa_invitations_current: 0,
    tgs_registrations_current: 0,
    reminders: []
  });

  useEffect(() => {
    loadMonthlyProgress();
  }, []);

  const loadMonthlyProgress = async () => {
    try {
      const response = await fetch('/api/daily-entries/monthly-progress');
      const data = await response.json();
      
      if (data.success) {
        setProgressData(data.progress);
      }
    } catch (error) {
      console.error('Error loading monthly progress:', error);
    }
  };

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getReminderColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'danger':
        return 'text-red-600 bg-red-50';
      case 'success':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Monatsfortschritt</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* FA Progress */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">FA</span>
            <span className="text-sm text-gray-600">
              {progressData.fa_current} / {progressData.fa_target}
            </span>
          </div>
          <Progress 
            value={calculateProgress(progressData.fa_current, progressData.fa_target)} 
            className="h-2"
          />
        </div>

        {/* EH Progress */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">EH</span>
            <span className="text-sm text-gray-600">
              {progressData.eh_current} / {progressData.eh_target}
            </span>
          </div>
          <Progress 
            value={calculateProgress(progressData.eh_current, progressData.eh_target)} 
            className="h-2"
          />
        </div>

        {/* Recommendations Progress */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Empfehlungen</span>
            <span className="text-sm text-gray-600">
              {progressData.recommendations_current} / {progressData.recommendations_target}
            </span>
          </div>
          <Progress 
            value={calculateProgress(progressData.recommendations_current, progressData.recommendations_target)} 
            className="h-2"
          />
        </div>

        {/* Appointments Progress */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Neue Termine</span>
            <span className="text-sm text-gray-600">
              {progressData.appointments_current} / {progressData.appointments_target}
            </span>
          </div>
          <Progress 
            value={calculateProgress(progressData.appointments_current, progressData.appointments_target)} 
            className="h-2"
          />
        </div>

        {/* TIV Invitations Progress */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">TIV Einladungen</span>
            <span className="text-sm text-gray-600">
              {progressData.tiv_invitations_current} / {progressData.tiv_invitations_target}
            </span>
          </div>
          <Progress 
            value={calculateProgress(progressData.tiv_invitations_current, progressData.tiv_invitations_target)} 
            className="h-2"
          />
        </div>

        {/* TAA Invitations Progress */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">TAA Einladungen</span>
            <span className="text-sm text-gray-600">
              {progressData.taa_invitations_current} / {progressData.taa_invitations_target}
            </span>
          </div>
          <Progress 
            value={calculateProgress(progressData.taa_invitations_current, progressData.taa_invitations_target)} 
            className="h-2"
          />
        </div>

        {/* TGS Registrations Progress */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">TGS Anmeldungen</span>
            <span className="text-sm text-gray-600">
              {progressData.tgs_registrations_current} / {progressData.tgs_registrations_target}
            </span>
          </div>
          <Progress 
            value={calculateProgress(progressData.tgs_registrations_current, progressData.tgs_registrations_target)} 
            className="h-2"
          />
        </div>

        {/* Reminders */}
        {progressData.reminders.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Erinnerungen</h4>
            <div className="space-y-2">
              {progressData.reminders.map((reminder: any, index: number) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg text-sm ${getReminderColor(reminder.type)}`}
                >
                  {reminder.message}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {progressData.fa_current}
              </div>
              <div className="text-xs text-gray-600">FA diesen Monat</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {progressData.eh_current}
              </div>
              <div className="text-xs text-gray-600">EH diesen Monat</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
