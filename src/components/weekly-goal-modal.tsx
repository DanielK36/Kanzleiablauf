"use client";
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface WeeklyGoalModalProps {
  onSubmit: (data: any) => void;
  onClose: () => void;
}

export function WeeklyGoalModal({ onSubmit, onClose }: WeeklyGoalModalProps) {
  const [goalData, setGoalData] = useState({
    weekly_goal: '',
    goal_category: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!goalData.weekly_goal || !goalData.goal_category) {
      alert('Bitte fülle alle Felder aus');
      return;
    }
    
    const weekStartDate = getWeekStartDate();
    
    onSubmit({
      ...goalData,
      week_start_date: weekStartDate
    });
  };

  const getWeekStartDate = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 1, Sunday = 0
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysToSubtract);
    return monday.toISOString().split('T')[0];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Wochenziel setzen 🎯
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Was ist dein Ziel für diese Woche?
            </label>
            <textarea
              value={goalData.weekly_goal}
              onChange={(e) => setGoalData(prev => ({ ...prev, weekly_goal: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Beschreibe dein konkretes Ziel für diese Woche..."
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategorie
            </label>
            <select
              value={goalData.goal_category}
              onChange={(e) => setGoalData(prev => ({ ...prev, goal_category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Bitte wählen...</option>
              <option value="Neukunden">Neukunden</option>
              <option value="neue Berater">Neue Berater</option>
              <option value="mehr Empfehlungen">Mehr Empfehlungen</option>
            </select>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Ziel setzen
            </Button>
            <Button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-2 px-4 rounded"
            >
              Später
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
