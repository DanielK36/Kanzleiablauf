'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

interface Goals {
  fa: number;
  eh: number;
  newAppointments: number;
  recommendations: number;
  tivInvitations: number;
  bavChecks: number;
  taaInvitations: number;
  tgsRegistrations: number;
}

interface AllGoals {
  monthly: Goals;
  weekly: Goals;
  team: Goals;
}

export default function SimpleGoalsPage() {
  const { user, isLoaded } = useUser();
  const [allGoals, setAllGoals] = useState<AllGoals>({
    monthly: { fa: 0, eh: 0, newAppointments: 0, recommendations: 0, tivInvitations: 0, bavChecks: 0, taaInvitations: 0, tgsRegistrations: 0 },
    weekly: { fa: 0, eh: 0, newAppointments: 0, recommendations: 0, tivInvitations: 0, bavChecks: 0, taaInvitations: 0, tgsRegistrations: 0 },
    team: { fa: 0, eh: 0, newAppointments: 0, recommendations: 0, tivInvitations: 0, bavChecks: 0, taaInvitations: 0, tgsRegistrations: 0 },
  });

  const [activeTab, setActiveTab] = useState<'monthly' | 'weekly' | 'team'>('monthly');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // EINFACHE Funktion - Goals laden
  const loadGoals = async () => {
    try {
      console.log('🔄 Loading goals...');
      const response = await fetch('/api/simple-goals');
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Goals loaded:', data.data);
        setAllGoals(data.data);
      } else {
        console.error('❌ Error loading goals:', data.error);
        setMessage('Fehler beim Laden der Ziele');
      }
    } catch (error) {
      console.error('❌ Error:', error);
      setMessage('Fehler beim Laden der Ziele');
    } finally {
      setLoading(false);
    }
  };

  // EINFACHE Funktion - Goals speichern
  const saveGoals = async () => {
    try {
      setSaving(true);
      setMessage('');
      
      console.log('💾 Saving goals:', allGoals[activeTab]);
      const response = await fetch('/api/simple-goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: activeTab,
          ...allGoals[activeTab]
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Goals saved successfully');
        setMessage('✅ Ziele erfolgreich gespeichert!');
      } else {
        console.error('❌ Error saving goals:', data.error);
        setMessage('❌ Fehler beim Speichern');
      }
    } catch (error) {
      console.error('❌ Error:', error);
      setMessage('❌ Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  // Goals beim Laden der Seite laden
  useEffect(() => {
    if (isLoaded && user) {
      loadGoals();
    }
  }, [isLoaded, user]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Ziele...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Nicht angemeldet</h1>
          <p className="text-gray-600">Bitte melde dich an, um deine Ziele zu sehen.</p>
        </div>
      </div>
    );
  }

  const currentGoals = allGoals[activeTab];

  const updateGoal = (field: keyof Goals, value: number) => {
    setAllGoals(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [field]: value
      }
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            🎯 Meine Ziele
          </h1>

          {message && (
            <div className={`mb-6 p-4 rounded-md ${
              message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {message}
            </div>
          )}

          {/* Tabs */}
          <div className="mb-8">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('monthly')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                  activeTab === 'monthly'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📅 Monatsziele
              </button>
              <button
                onClick={() => setActiveTab('weekly')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                  activeTab === 'weekly'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📊 Wochenziele
              </button>
              <button
                onClick={() => setActiveTab('team')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                  activeTab === 'team'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                👥 Team-Ziele
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* FA */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                FA ({activeTab === 'monthly' ? 'Monat' : activeTab === 'weekly' ? 'Woche' : 'Team'})
              </label>
              <input
                type="number"
                value={currentGoals.fa}
                onChange={(e) => updateGoal('fa', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={activeTab === 'monthly' ? 'z.B. 250' : activeTab === 'weekly' ? 'z.B. 60' : 'z.B. 250'}
              />
            </div>

            {/* EH */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                EH ({activeTab === 'monthly' ? 'Monat' : activeTab === 'weekly' ? 'Woche' : 'Team'})
              </label>
              <input
                type="number"
                value={currentGoals.eh}
                onChange={(e) => updateGoal('eh', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={activeTab === 'monthly' ? 'z.B. 25000' : activeTab === 'weekly' ? 'z.B. 6000' : 'z.B. 25000'}
              />
            </div>

            {/* Neue Termine */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Neue Termine ({activeTab === 'monthly' ? 'Monat' : activeTab === 'weekly' ? 'Woche' : 'Team'})
              </label>
              <input
                type="number"
                value={currentGoals.newAppointments}
                onChange={(e) => updateGoal('newAppointments', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={activeTab === 'monthly' ? 'z.B. 1200' : activeTab === 'weekly' ? 'z.B. 300' : 'z.B. 1200'}
              />
            </div>

            {/* Empfehlungen */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Empfehlungen ({activeTab === 'monthly' ? 'Monat' : activeTab === 'weekly' ? 'Woche' : 'Team'})
              </label>
              <input
                type="number"
                value={currentGoals.recommendations}
                onChange={(e) => updateGoal('recommendations', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={activeTab === 'monthly' ? 'z.B. 300' : activeTab === 'weekly' ? 'z.B. 75' : 'z.B. 300'}
              />
            </div>

            {/* TIV Einladungen */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                TIV Einladungen ({activeTab === 'monthly' ? 'Monat' : activeTab === 'weekly' ? 'Woche' : 'Team'})
              </label>
              <input
                type="number"
                value={currentGoals.tivInvitations}
                onChange={(e) => updateGoal('tivInvitations', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={activeTab === 'monthly' ? 'z.B. 40' : activeTab === 'weekly' ? 'z.B. 10' : 'z.B. 40'}
              />
            </div>

            {/* BAV Checks */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                BAV Checks ({activeTab === 'monthly' ? 'Monat' : activeTab === 'weekly' ? 'Woche' : 'Team'})
              </label>
              <input
                type="number"
                value={currentGoals.bavChecks}
                onChange={(e) => updateGoal('bavChecks', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={activeTab === 'monthly' ? 'z.B. 100' : activeTab === 'weekly' ? 'z.B. 25' : 'z.B. 100'}
              />
            </div>

            {/* TAA Einladungen */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                TAA Einladungen ({activeTab === 'monthly' ? 'Monat' : activeTab === 'weekly' ? 'Woche' : 'Team'})
              </label>
              <input
                type="number"
                value={currentGoals.taaInvitations}
                onChange={(e) => updateGoal('taaInvitations', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={activeTab === 'monthly' ? 'z.B. 40' : activeTab === 'weekly' ? 'z.B. 10' : 'z.B. 40'}
              />
            </div>

            {/* TGS Registrierungen */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                TGS Registrierungen ({activeTab === 'monthly' ? 'Monat' : activeTab === 'weekly' ? 'Woche' : 'Team'})
              </label>
              <input
                type="number"
                value={currentGoals.tgsRegistrations}
                onChange={(e) => updateGoal('tgsRegistrations', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={activeTab === 'monthly' ? 'z.B. 30' : activeTab === 'weekly' ? 'z.B. 8' : 'z.B. 30'}
              />
            </div>
          </div>

          {/* Speichern Button */}
          <div className="mt-8 text-center">
            <button
              onClick={saveGoals}
              disabled={saving}
              className={`px-8 py-3 rounded-md font-medium text-white ${
                saving 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {saving ? '💾 Speichere...' : `💾 ${activeTab === 'monthly' ? 'Monatsziele' : activeTab === 'weekly' ? 'Wochenziele' : 'Team-Ziele'} speichern`}
            </button>
          </div>

          {/* Aktuelle Werte anzeigen */}
          <div className="mt-8 p-4 bg-gray-100 rounded-md">
            <h3 className="text-lg font-semibold mb-4">📊 Aktuelle Werte ({activeTab === 'monthly' ? 'Monatsziele' : activeTab === 'weekly' ? 'Wochenziele' : 'Team-Ziele'}):</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>FA: <span className="font-bold">{currentGoals.fa}</span></div>
              <div>EH: <span className="font-bold">{currentGoals.eh.toLocaleString()}</span></div>
              <div>Termine: <span className="font-bold">{currentGoals.newAppointments}</span></div>
              <div>Empfehlungen: <span className="font-bold">{currentGoals.recommendations}</span></div>
              <div>TIV: <span className="font-bold">{currentGoals.tivInvitations}</span></div>
              <div>BAV: <span className="font-bold">{currentGoals.bavChecks}</span></div>
              <div>TAA: <span className="font-bold">{currentGoals.taaInvitations}</span></div>
              <div>TGS: <span className="font-bold">{currentGoals.tgsRegistrations}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
