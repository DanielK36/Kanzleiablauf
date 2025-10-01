'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { 
  getWeekdayQuestions, 
  calculateProgressWithColor, 
  calculateProjection, 
  generateRecommendations,
  calculateMonthlyAverages,
  generateAutoToDos
} from '@/lib/weekday-logic';

export default function SimpleKanzleiablaufPage() {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  // Get current weekday (1=Monday, 7=Sunday)
  const currentWeekday = new Date().getDay() || 7;
  
  // Weekday questions
  const [weekdayQuestions, setWeekdayQuestions] = useState({
    yesterday: "Was sind deine drei Diamanten von den Samstagsschulungen?",
    today: ["Welche Beratungen sollen diese Woche durchgesprochen werden?"],
    trainee: "Ein großer Test"
  });

  // Weekly Goals & Progress
  const [weeklyGoals, setWeeklyGoals] = useState({
    fa_weekly_target: 0,
    eh_weekly_target: 0,
    new_appointments_weekly_target: 0,
    recommendations_weekly_target: 0,
    tiv_invitations_weekly_target: 0,
    taa_invitations_weekly_target: 0,
    tgs_registrations_weekly_target: 0,
    bav_checks_weekly_target: 0,
    additional_goal: ""
  });

  const [weeklyProgress, setWeeklyProgress] = useState({
    fa_current: 0,
    fa_weekly_target: 0,
    eh_current: 0,
    eh_weekly_target: 0,
    new_appointments_current: 0,
    new_appointments_weekly_target: 0,
    recommendations_current: 0,
    recommendations_weekly_target: 0,
    tiv_invitations_current: 0,
    tiv_invitations_weekly_target: 0,
    taa_invitations_current: 0,
    taa_invitations_weekly_target: 0,
    tgs_registrations_current: 0,
    tgs_registrations_weekly_target: 0,
    bav_checks_current: 0,
    bav_checks_weekly_target: 0
  });

  // Yesterday's Goals & Results
  const [yesterdayGoals, setYesterdayGoals] = useState({
    fa_daily_target: 0,
    eh_daily_target: 0,
    new_appointments_daily_target: 0,
    recommendations_daily_target: 0,
    tiv_invitations_daily_target: 0,
    taa_invitations_daily_target: 0,
    tgs_registrations_daily_target: 0,
    bav_checks_daily_target: 0
  });

  const [yesterdayResults, setYesterdayResults] = useState({
    fa: 0,
    eh: 0,
    newAppointments: 0,
    recommendations: 0,
    tivInvitations: 0,
    taaInvitations: 0,
    tgsRegistrations: 0,
    bavChecks: 0,
    todos_completed: [false, false, false, false, false],
    highlightYesterday: "",
    appointmentsNextWeek: 0,
    improvementToday: "",
    weeklyImprovement: "",
    charismaTraining: false
  });

  const [yesterdayTodos, setYesterdayTodos] = useState<string[]>([]);

  // Today's Goals & Todos
  const [todayGoals, setTodayGoals] = useState({
    fa: 0,
    eh: 0,
    newAppointments: 0,
    recommendations: 0,
    tivInvitations: 0,
    taaInvitations: 0,
    tgsRegistrations: 0,
    bavChecks: 0
  });

  const [todayTodos, setTodayTodos] = useState([
    "",
    "",
    "",
    "",
    ""
  ]);

  const [todayAnswers, setTodayAnswers] = useState({
    help_needed: "",
    training_focus: "",
    improvementToday: "",
    improvement_focus: ""
  });

  const [weekdayAnswers, setWeekdayAnswers] = useState<{[key: number]: string}>({});

  // Monthly Progress
  const [monthlyProgress, setMonthlyProgress] = useState({
    fa_current: 0,
    fa_monthly_target: 0,
    eh_current: 0,
    eh_monthly_target: 0,
    new_appointments_current: 0,
    new_appointments_monthly_target: 0,
    recommendations_current: 0,
    recommendations_monthly_target: 0,
    tiv_invitations_current: 0,
    tiv_invitations_monthly_target: 0,
    taa_invitations_current: 0,
    taa_invitations_monthly_target: 0,
    tgs_registrations_current: 0,
    tgs_registrations_monthly_target: 0,
    bav_checks_current: 0,
    bav_checks_monthly_target: 0
  });

  const [monthlyData, setMonthlyData] = useState([]);

  // Recommendations
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [expandedRecommendations, setExpandedRecommendations] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  // Load data on component mount
  useEffect(() => {
    if (isLoaded && user) {
      loadUserData();
    }
  }, [isLoaded, user]);

  const loadWeekdayQuestions = async () => {
    try {
      const questions = await getWeekdayQuestions(currentWeekday, false);
      setWeekdayQuestions(questions);
    } catch (error) {
    }
  };

  const loadUserData = async () => {
    setLoading(true);
    try {
      console.log('🔄 Loading user data...');
      
      // Load weekly goals and progress from dashboard-data
      const dashboardResponse = await fetch('/api/dashboard-data');
      
      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json();
        console.log('📊 Dashboard data:', dashboardData);
        
        if (dashboardData.success) {
          // Set weekly goals
          const weeklyGoalsData = dashboardData.data.weeklyGoals;
          if (weeklyGoalsData) {
            setWeeklyGoals({
              fa_weekly_target: weeklyGoalsData.fa || 0,
              eh_weekly_target: weeklyGoalsData.eh || 0,
              new_appointments_weekly_target: weeklyGoalsData.newAppointments || 0,
              recommendations_weekly_target: weeklyGoalsData.recommendations || 0,
              tiv_invitations_weekly_target: weeklyGoalsData.tivInvitations || 0,
              taa_invitations_weekly_target: weeklyGoalsData.taaInvitations || 0,
              tgs_registrations_weekly_target: weeklyGoalsData.tgsRegistrations || 0,
              bav_checks_weekly_target: weeklyGoalsData.bavChecks || 0,
              additional_goal: ""
            });
          }
          
          // Set weekly progress
          const weeklyProgressData = dashboardData.data.ownWeeklyProgress;
          if (weeklyProgressData) {
            setWeeklyProgress({
              fa_current: weeklyProgressData.fa_current || 0,
              fa_weekly_target: weeklyGoalsData.fa || 0,
              eh_current: weeklyProgressData.eh_current || 0,
              eh_weekly_target: weeklyGoalsData.eh || 0,
              new_appointments_current: weeklyProgressData.new_appointments_current || 0,
              new_appointments_weekly_target: weeklyGoalsData.newAppointments || 0,
              recommendations_current: weeklyProgressData.recommendations_current || 0,
              recommendations_weekly_target: weeklyGoalsData.recommendations || 0,
              tiv_invitations_current: weeklyProgressData.tiv_invitations_current || 0,
              tiv_invitations_weekly_target: weeklyGoalsData.tivInvitations || 0,
              taa_invitations_current: weeklyProgressData.taa_invitations_current || 0,
              taa_invitations_weekly_target: weeklyGoalsData.taaInvitations || 0,
              tgs_registrations_current: weeklyProgressData.tgs_registrations_current || 0,
              tgs_registrations_weekly_target: weeklyGoalsData.tgsRegistrations || 0,
              bav_checks_current: weeklyProgressData.bav_checks_current || 0,
              bav_checks_weekly_target: weeklyGoalsData.bavChecks || 0
            });
          }

          // Set monthly progress
          const monthlyProgressData = dashboardData.data.ownMonthlyProgress;
          if (monthlyProgressData) {
            setMonthlyProgress({
              fa_current: monthlyProgressData.fa || 0,
              fa_monthly_target: dashboardData.data.monthlyGoals?.fa || 0,
              eh_current: monthlyProgressData.eh || 0,
              eh_monthly_target: dashboardData.data.monthlyGoals?.eh || 0,
              new_appointments_current: monthlyProgressData.newAppointments || 0,
              new_appointments_monthly_target: dashboardData.data.monthlyGoals?.newAppointments || 0,
              recommendations_current: monthlyProgressData.recommendations || 0,
              recommendations_monthly_target: dashboardData.data.monthlyGoals?.recommendations || 0,
              tiv_invitations_current: monthlyProgressData.tivInvitations || 0,
              tiv_invitations_monthly_target: dashboardData.data.monthlyGoals?.tivInvitations || 0,
              taa_invitations_current: monthlyProgressData.taaInvitations || 0,
              taa_invitations_monthly_target: dashboardData.data.monthlyGoals?.taaInvitations || 0,
              tgs_registrations_current: monthlyProgressData.tgsRegistrations || 0,
              tgs_registrations_monthly_target: dashboardData.data.monthlyGoals?.tgsRegistrations || 0,
              bav_checks_current: monthlyProgressData.bavChecks || 0,
              bav_checks_monthly_target: dashboardData.data.monthlyGoals?.bavChecks || 0
            });
          }
          
          // Generate recommendations from monthly progress
          const averages = calculateMonthlyAverages([monthlyProgressData]);
          const recs = generateRecommendations(averages);
          setRecommendations(recs);
        }
      }

      // Load yesterday's data
      const yesterdayResponse = await fetch('/api/simple-daily-entry');
      if (yesterdayResponse.ok) {
        const yesterdayData = await yesterdayResponse.json();
        console.log('📅 Yesterday data:', yesterdayData);
        
        if (yesterdayData.success && yesterdayData.data) {
          // Load yesterday's results (these are the actual achieved values)
          if (yesterdayData.data.yesterdayResults) {
            console.log('📊 Setting yesterdayResults:', yesterdayData.data.yesterdayResults);
            setYesterdayResults(yesterdayData.data.yesterdayResults);
          }
          
          // Load yesterday's goals (what was planned for yesterday)
          if (yesterdayData.data.yesterdayGoals) {
            console.log('🎯 Setting yesterdayGoals:', yesterdayData.data.yesterdayGoals);
            setYesterdayGoals(yesterdayData.data.yesterdayGoals);
          }
          
          // Load today's goals (these should be set from yesterday's results)
          if (yesterdayData.data.todayGoals) {
            setTodayGoals(yesterdayData.data.todayGoals);
          }
          
          // Load todos von gestern
          if (yesterdayData.data.todos) {
            setYesterdayTodos(yesterdayData.data.todos);
          }
          
          // Load todos für heute
          if (yesterdayData.data.todayTodos) {
            setTodayTodos(yesterdayData.data.todayTodos);
          }
          
          // Load todos completed status
          if (yesterdayData.data.todosCompleted) {
            setYesterdayResults(prev => ({
              ...prev,
              todos_completed: yesterdayData.data.todosCompleted
            }));
          }
          
          // Load charisma training
          if (yesterdayData.data.charismaTraining !== undefined) {
            setYesterdayResults(prev => ({
              ...prev,
              charismaTraining: yesterdayData.data.charismaTraining
            }));
          }
          
          // Load highlight yesterday
          if (yesterdayData.data.highlightYesterday !== undefined) {
            setYesterdayResults(prev => ({
              ...prev,
              highlightYesterday: yesterdayData.data.highlightYesterday || ""
            }));
          }
          
          // Load appointments next week
          if (yesterdayData.data.appointmentsNextWeek !== undefined) {
            setYesterdayResults(prev => ({
              ...prev,
              appointmentsNextWeek: yesterdayData.data.appointmentsNextWeek || 0
            }));
          }
          
          // Load weekly improvement
          if (yesterdayData.data.weeklyImprovement !== undefined) {
            setYesterdayResults(prev => ({
              ...prev,
              weeklyImprovement: yesterdayData.data.weeklyImprovement || ""
            }));
          }
          
          // Load today's answers (questions)
          if (yesterdayData.data.improvementToday !== undefined) {
            setTodayAnswers(prev => ({
              ...prev,
              improvementToday: yesterdayData.data.improvementToday || "",
              help_needed: yesterdayData.data.help_needed || "",
              training_focus: yesterdayData.data.training_focus || "",
              improvement_focus: yesterdayData.data.improvement_focus || ""
            }));
          }
          
          // Load weekday answers
          if (yesterdayData.data.weekdayAnswers) {
            setWeekdayAnswers(yesterdayData.data.weekdayAnswers);
          }
        } else {
        }
      } else {
        const errorText = await dashboardResponse.text();
      }

    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    
    try {
      const response = await fetch('/api/simple-daily-entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          yesterdayResults,
          todayGoals,
          todos: yesterdayTodos, // Todos von gestern (zum Abhaken)
          todosCompleted: yesterdayResults.todos_completed, // Status der Todos von gestern
          todayTodos: todayTodos, // Todos für heute (die du heute eingegeben hast)
          charismaTraining: yesterdayResults.charismaTraining,
          highlightYesterday: yesterdayResults.highlightYesterday,
          appointmentsNextWeek: yesterdayResults.appointmentsNextWeek,
          improvementToday: todayAnswers.improvementToday,
          help_needed: todayAnswers.help_needed,
          training_focus: todayAnswers.training_focus,
          improvement_focus: todayAnswers.improvement_focus || "",
          weekdayAnswers: weekdayAnswers,
          weeklyImprovement: yesterdayResults.weeklyImprovement,
          entryDate: new Date().toISOString().split('T')[0]
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage("✅ Tageseintrag erfolgreich gespeichert!");
        // Daten nach dem Speichern neu laden
        await loadUserData();
        setTimeout(() => {
          setMessage("");
        }, 3000);
      } else {
        setMessage(`❌ Fehler beim Speichern: ${result.error}`);
      }
    } catch (error) {
      setMessage("❌ Fehler beim Speichern der Daten");
    } finally {
      setSaving(false);
    }
  };

  const handleRecommendationToggle = (recommendationType: string) => {
    setExpandedRecommendations(prev => 
      prev.includes(recommendationType)
        ? prev.filter(type => type !== recommendationType)
        : [...prev, recommendationType]
    );
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
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
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Bitte melden Sie sich an
            </h1>
            <p className="text-gray-600 mb-4">
              Sie müssen sich anmelden, um die Berater-Seite zu verwenden.
            </p>
            <Link href="/sign-in">
              <Button>Zur Anmeldung</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📝 Berater-Tageseintrag</h1>
          <p className="text-gray-600">Strukturiert durch den Tag mit klaren Zielen und Fokus</p>
        </div>

        {/* Navigation */}
        <div className="flex justify-center space-x-4 mb-6">
          <Link href="/simple-dashboard">
            <Button variant="outline" className="text-sm">
              ← Zurück zum Dashboard
            </Button>
          </Link>
        </div>

        {/* Weekly Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">🎯 Wochenziel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                { key: 'fa', label: 'Finanzanalysen', current: weeklyProgress.fa_current, target: weeklyGoals.fa_weekly_target },
                { key: 'eh', label: 'EH', current: weeklyProgress.eh_current, target: weeklyGoals.eh_weekly_target },
                { key: 'new_appointments', label: 'Neue Termine', current: weeklyProgress.new_appointments_current, target: weeklyGoals.new_appointments_weekly_target },
                { key: 'recommendations', label: 'Empfehlungen', current: weeklyProgress.recommendations_current, target: weeklyGoals.recommendations_weekly_target },
                { key: 'tiv_invitations', label: 'TIV', current: weeklyProgress.tiv_invitations_current, target: weeklyGoals.tiv_invitations_weekly_target },
                { key: 'taa_invitations', label: 'TAA', current: weeklyProgress.taa_invitations_current, target: weeklyGoals.taa_invitations_weekly_target },
                { key: 'tgs_registrations', label: 'TGS', current: weeklyProgress.tgs_registrations_current, target: weeklyGoals.tgs_registrations_weekly_target },
                { key: 'bav_checks', label: 'bAV Checks', current: weeklyProgress.bav_checks_current, target: weeklyGoals.bav_checks_weekly_target }
              ].map((metric) => (
                <div key={metric.key} className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="text-xs text-gray-600 mb-1">{metric.label}</div>
                  <div className="text-lg font-bold text-blue-700">{metric.current} / {metric.target}</div>
                  <div className="text-xs text-gray-500">
                    {metric.target > 0 ? Math.round((metric.current / metric.target) * 100) : 0}%
                  </div>
                </div>
              ))}
            </div>
            {weeklyGoals.additional_goal && (
              <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                <p className="font-medium text-green-900 text-sm">{weeklyGoals.additional_goal}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* What was yesterday */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">📅 Was war gestern?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Results Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 p-2 text-left">Kennzahl</th>
                      <th className="border border-gray-300 p-2 text-center">Ziel</th>
                      <th className="border border-gray-300 p-2 text-center">Ergebnis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { key: 'fa', label: 'Finanzanalysen', target: yesterdayGoals.fa_daily_target, achieved: yesterdayResults.fa },
                      { key: 'eh', label: 'EH', target: yesterdayGoals.eh_daily_target, achieved: yesterdayResults.eh },
                      { key: 'new_appointments', label: 'Neue Termine', target: yesterdayGoals.new_appointments_daily_target, achieved: yesterdayResults.newAppointments },
                      { key: 'recommendations', label: 'Empfehlungen', target: yesterdayGoals.recommendations_daily_target, achieved: yesterdayResults.recommendations },
                      { key: 'tiv_invitations', label: 'TIV', target: yesterdayGoals.tiv_invitations_daily_target, achieved: yesterdayResults.tivInvitations },
                      { key: 'taa_invitations', label: 'TAA', target: yesterdayGoals.taa_invitations_daily_target, achieved: yesterdayResults.taaInvitations },
                      { key: 'tgs_registrations', label: 'TGS', target: yesterdayGoals.tgs_registrations_daily_target, achieved: yesterdayResults.tgsRegistrations },
                      { key: 'bav_checks', label: 'bAV Checks', target: yesterdayGoals.bav_checks_daily_target, achieved: yesterdayResults.bavChecks }
                    ].map((metric) => (
                      <tr key={metric.key}>
                        <td className="border border-gray-300 p-2 font-medium">{metric.label}</td>
                        <td className="border border-gray-300 p-2 text-center">{metric.target}</td>
                        <td className="border border-gray-300 p-2 text-center">
                          <input
                            type="number"
                            value={metric.achieved}
                            onChange={(e) => setYesterdayResults(prev => ({
                              ...prev,
                              [metric.key === 'new_appointments' ? 'newAppointments' : 
                               metric.key === 'tiv_invitations' ? 'tivInvitations' :
                               metric.key === 'taa_invitations' ? 'taaInvitations' :
                               metric.key === 'tgs_registrations' ? 'tgsRegistrations' :
                               metric.key === 'bav_checks' ? 'bavChecks' : metric.key]: parseInt(e.target.value) || 0
                            }))}
                            className="w-16 text-center border-none bg-transparent"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ToDos */}
              <div>
                <h3 className="font-semibold mb-2">ToDos abhaken:</h3>
                <div className="space-y-2">
                  {(yesterdayResults.todos_completed || []).map((completed, index) => (
                    <label key={index} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={completed}
                        onChange={(e) => setYesterdayResults(prev => ({
                          ...prev,
                          todos_completed: prev.todos_completed.map((todo, i) => 
                            i === index ? e.target.checked : todo
                          )
                        }))}
                        className="rounded"
                      />
                      <span className={completed ? 'line-through text-gray-500' : ''}>
                        {yesterdayTodos[index] || `ToDo ${index + 1}`}
                      </span>
                    </label>
                  ))}
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={yesterdayResults.charismaTraining || false}
                      onChange={(e) => setYesterdayResults(prev => ({
                        ...prev,
                        charismaTraining: e.target.checked
                      }))}
                      className="rounded"
                    />
                    <span className={yesterdayResults.charismaTraining ? 'line-through text-gray-500' : ''}>
                      Charismatraining
                    </span>
                  </label>
                </div>
              </div>

              {/* Yesterday's Question (from weekday logic) - Only show on Monday */}
              <div className="space-y-3">
                {currentWeekday === 1 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {weekdayQuestions.yesterday}
                    </label>
                    <input
                      type="text"
                      value={yesterdayResults.highlightYesterday || ""}
                      onChange={(e) => setYesterdayResults(prev => ({
                        ...prev,
                        highlightYesterday: e.target.value
                      }))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Ihre Antwort hier eingeben..."
                    />
                  </div>
                )}
                
                {/* Additional standard questions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Wie viele Termine stehen für nächste Woche an?
                  </label>
                  <input
                    type="number"
                    value={yesterdayResults.appointmentsNextWeek || 0}
                    onChange={(e) => setYesterdayResults(prev => ({
                      ...prev,
                      appointmentsNextWeek: parseInt(e.target.value) || 0
                    }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                {/* Only show on Friday */}
                {currentWeekday === 5 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Worin hast du dich die Woche besonders verbessert?
                    </label>
                    <input
                      type="text"
                      value={yesterdayResults.weeklyImprovement || ""}
                      onChange={(e) => setYesterdayResults(prev => ({
                        ...prev,
                        weeklyImprovement: e.target.value
                      }))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Opportunity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">🚀 Zur heutigen Chance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Today's Goals Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 p-2 text-left">Kennzahl</th>
                      <th className="border border-gray-300 p-2 text-center">Ziel heute</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { key: 'fa', label: 'Finanzanalysen', target: todayGoals.fa },
                      { key: 'eh', label: 'EH', target: todayGoals.eh },
                      { key: 'new_appointments', label: 'Neue Termine', target: todayGoals.newAppointments },
                      { key: 'recommendations', label: 'Empfehlungen', target: todayGoals.recommendations },
                      { key: 'tiv_invitations', label: 'TIV', target: todayGoals.tivInvitations },
                      { key: 'taa_invitations', label: 'TAA', target: todayGoals.taaInvitations },
                      { key: 'tgs_registrations', label: 'TGS', target: todayGoals.tgsRegistrations },
                      { key: 'bav_checks', label: 'bAV Checks', target: todayGoals.bavChecks }
                    ].map((metric) => (
                      <tr key={metric.key}>
                        <td className="border border-gray-300 p-2 font-medium">{metric.label}</td>
                        <td className="border border-gray-300 p-2 text-center">
                          <input
                            type="number"
                            value={metric.target}
                            onChange={(e) => setTodayGoals(prev => ({
                              ...prev,
                              [metric.key === 'new_appointments' ? 'newAppointments' : 
                               metric.key === 'tiv_invitations' ? 'tivInvitations' :
                               metric.key === 'taa_invitations' ? 'taaInvitations' :
                               metric.key === 'tgs_registrations' ? 'tgsRegistrations' :
                               metric.key === 'bav_checks' ? 'bavChecks' : metric.key]: parseInt(e.target.value) || 0
                            }))}
                            className="w-16 text-center border-none bg-transparent"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Today's ToDos and Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ToDos */}
                <div>
                  <h3 className="font-semibold mb-2">Heutige ToDos:</h3>
                  <div className="space-y-2">
                    {todayTodos.map((todo, index) => (
                      <input
                        key={index}
                        type="text"
                        value={todo}
                        onChange={(e) => {
                          const newTodos = [...todayTodos];
                          newTodos[index] = e.target.value;
                          setTodayTodos(newTodos);
                        }}
                        placeholder={`ToDo ${index + 1}`}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                      />
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div>
                  <h3 className="font-semibold mb-2">Empfehlungen:</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {recommendations.map((rec, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-2">
                        <button
                          onClick={() => handleRecommendationToggle(rec.type)}
                          className="w-full text-left font-medium text-blue-600 hover:text-blue-800 text-xs"
                        >
                          {expandedRecommendations.includes(rec.type) ? '▼' : '▶'} {rec.title}
                        </button>
                        {expandedRecommendations.includes(rec.type) && (
                          <div className="mt-1 text-xs text-gray-600">
                            <p className="mb-1">{rec.description}</p>
                            <ul className="list-disc list-inside space-y-0.5">
                              {rec.suggestions.map((suggestion: string, idx: number) => (
                                <li key={idx}>{suggestion}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Standard Daily Questions */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Wobei brauchst du heute Hilfe?
                  </label>
                  <input
                    type="text"
                    value={todayAnswers.help_needed}
                    onChange={(e) => setTodayAnswers(prev => ({
                      ...prev,
                      help_needed: e.target.value
                    }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Was willst du heute trainieren?
                  </label>
                  <input
                    type="text"
                    value={todayAnswers.training_focus}
                    onChange={(e) => setTodayAnswers(prev => ({
                      ...prev,
                      training_focus: e.target.value
                    }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Was willst du heute noch besser machen?
                  </label>
                  <input
                    type="text"
                    value={todayAnswers.improvementToday || ""}
                    onChange={(e) => setTodayAnswers(prev => ({
                      ...prev,
                      improvementToday: e.target.value
                    }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                {/* Weekday-specific questions for TODAY */}
                {weekdayQuestions.today.map((question, index) => (
                  <div key={index}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {question}
                    </label>
                    <input
                      type="text"
                      value={weekdayAnswers[index] || ""}
                      onChange={(e) => setWeekdayAnswers(prev => ({
                        ...prev,
                        [index]: e.target.value
                      }))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Projection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">📊 Monatshochrechnung</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { key: 'fa', label: 'Finanzanalysen', current: monthlyProgress.fa_current, target: monthlyProgress.fa_monthly_target },
                { key: 'eh', label: 'EH', current: monthlyProgress.eh_current, target: monthlyProgress.eh_monthly_target },
                { key: 'new_appointments', label: 'Neue Termine', current: monthlyProgress.new_appointments_current, target: monthlyProgress.new_appointments_monthly_target },
                { key: 'recommendations', label: 'Empfehlungen', current: monthlyProgress.recommendations_current, target: monthlyProgress.recommendations_monthly_target },
                { key: 'tiv_invitations', label: 'TIV', current: monthlyProgress.tiv_invitations_current, target: monthlyProgress.tiv_invitations_monthly_target },
                { key: 'taa_invitations', label: 'TAA', current: monthlyProgress.taa_invitations_current, target: monthlyProgress.taa_invitations_monthly_target },
                { key: 'tgs_registrations', label: 'TGS', current: monthlyProgress.tgs_registrations_current, target: monthlyProgress.tgs_registrations_monthly_target },
                { key: 'bav_checks', label: 'bAV Checks', current: monthlyProgress.bav_checks_current, target: monthlyProgress.bav_checks_monthly_target }
              ].map((metric) => {
                const progress = calculateProgressWithColor(metric.current, metric.target);
                const projection = calculateProjection(metric.current, metric.target);
                return (
                  <div key={metric.key} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm font-medium">{metric.label}</div>
                      <div className="text-sm text-gray-600">{metric.current} / {metric.target}</div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                      <div 
                        className={`h-2 rounded-full ${progress.color}`}
                        style={{ width: `${progress.progress}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{progress.progress.toFixed(0)}% erreicht</span>
                      <span>Prognose: {projection}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="text-center space-y-4">
          {message && (
            <div className={`p-3 rounded-lg ${
              message.includes('✅') 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {message}
            </div>
          )}
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold disabled:opacity-50"
          >
            {saving ? 'Speichern...' : 'Fertig'}
          </Button>
        </div>
      </div>
    </div>
  );
}
