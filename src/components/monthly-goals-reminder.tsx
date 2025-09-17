"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

interface MonthlyGoalsReminderProps {
  onSetGoals: (goals: any) => void;
}

export function MonthlyGoalsReminder({ onSetGoals }: MonthlyGoalsReminderProps) {
  const [showReminder, setShowReminder] = useState(false);
  const [goals, setGoals] = useState({
    fa_monthly: 100,
    eh_monthly: 60,
    appointments_monthly: 80,
    recommendations_monthly: 20
  });

  useEffect(() => {
    // Check if it's after the 25th of the month
    const today = new Date();
    const isAfter25th = today.getDate() >= 25;
    
    // Check if goals are already set for next month
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const nextMonthKey = nextMonth.toISOString().slice(0, 7); // YYYY-MM format
    
    // Check localStorage for existing goals
    const existingGoals = localStorage.getItem(`monthly_goals_${nextMonthKey}`);
    
    if (isAfter25th && !existingGoals) {
      setShowReminder(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthKey = nextMonth.toISOString().slice(0, 7);
    
    // Save to localStorage
    localStorage.setItem(`monthly_goals_${nextMonthKey}`, JSON.stringify(goals));
    
    // Call parent function
    onSetGoals(goals);
    setShowReminder(false);
  };

  if (!showReminder) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="max-w-md mx-4">
        <CardHeader>
          <CardTitle className="text-xl text-center">
            📅 Monatsziele für nächsten Monat
          </CardTitle>
          <p className="text-center text-gray-600">
            Bitte setze deine Ziele für den nächsten Monat
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                FA (Monatsziel)
              </label>
              <input
                type="number"
                value={goals.fa_monthly}
                onChange={(e) => setGoals(prev => ({ ...prev, fa_monthly: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                EH (Monatsziel)
              </label>
              <input
                type="number"
                value={goals.eh_monthly}
                onChange={(e) => setGoals(prev => ({ ...prev, eh_monthly: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Termine (Monatsziel)
              </label>
              <input
                type="number"
                value={goals.appointments_monthly}
                onChange={(e) => setGoals(prev => ({ ...prev, appointments_monthly: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Empfehlungen (Monatsziel)
              </label>
              <input
                type="number"
                value={goals.recommendations_monthly}
                onChange={(e) => setGoals(prev => ({ ...prev, recommendations_monthly: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
            
            <div className="flex space-x-3 pt-4">
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Ziele setzen
              </Button>
              <Button
                type="button"
                onClick={() => setShowReminder(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-600"
              >
                Später
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
