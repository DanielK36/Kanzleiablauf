"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser } from '@clerk/nextjs';
import { 
  getWeekdayQuestions, 
  calculateProgressWithColor, 
  calculateProjection, 
  generateRecommendations,
  calculateMonthlyAverages,
  generateAutoToDos
} from '@/lib/weekday-logic';

export default function BeraterPage() {
  const { user, isLoaded } = useUser();
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [expandedRecommendations, setExpandedRecommendations] = useState<string[]>([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Notification states
  const [showWeeklyGoalsModal, setShowWeeklyGoalsModal] = useState(false);
  const [showMonthlyGoalsModal, setShowMonthlyGoalsModal] = useState(false);
  
  // Real data states
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

  const [yesterdayGoals, setYesterdayGoals] = useState({
    fa_target: 0,
    eh_target: 0,
    new_appointments_target: 0,
    recommendations_target: 0,
    tiv_invitations_target: 0,
    taa_invitations_target: 0,
    tgs_registrations_target: 0,
    bav_checks_target: 0
  });

  const [yesterdayResults, setYesterdayResults] = useState({
    fa_achieved: 0,
    eh_achieved: 0,
    new_appointments_achieved: 0,
    recommendations_achieved: 0,
    tiv_invitations_achieved: 0,
    taa_invitations_achieved: 0,
    tgs_registrations_achieved: 0,
    bav_checks_achieved: 0,
    todos_completed: [false, false, false, false, false],
    highlight_yesterday: "",
    appointments_next_week: 0,
    improvement_today: "",
    weekly_improvement: "",
    charisma_training: false
  });

  const [yesterdayTodos, setYesterdayTodos] = useState<string[]>([]);

  const [monthlyData, setMonthlyData] = useState([]);
  const [monthlyProgress, setMonthlyProgress] = useState({
    fa_current: 0,
    fa_target: 0,
    eh_current: 0,
    eh_target: 0,
    new_appointments_current: 0,
    new_appointments_target: 0,
    recommendations_current: 0,
    recommendations_target: 0,
    tiv_invitations_current: 0,
    tiv_invitations_target: 0,
    taa_invitations_current: 0,
    taa_invitations_target: 0,
    tgs_registrations_current: 0,
    tgs_registrations_target: 0,
    bav_checks_current: 0,
    bav_checks_target: 0
  });

  const [weeklyProgress, setWeeklyProgress] = useState({
    fa_current: 0,
    fa_target: 0,
    eh_current: 0,
    eh_target: 0,
    new_appointments_current: 0,
    new_appointments_target: 0,
    recommendations_current: 0,
    recommendations_target: 0,
    tiv_invitations_current: 0,
    tiv_invitations_target: 0,
    taa_invitations_current: 0,
    taa_invitations_target: 0,
    tgs_registrations_current: 0,
    tgs_registrations_target: 0,
    bav_checks_current: 0,
    bav_checks_target: 0
  });

  const [todayGoals, setTodayGoals] = useState({
    fa_target: 5,
    eh_target: 3,
    new_appointments_target: 4,
    recommendations_target: 2,
    tiv_invitations_target: 1,
    taa_invitations_target: 1,
    tgs_registrations_target: 1,
    bav_checks_target: 2
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
    improvement_today: "",
    weekday_answer: ""
  });

  // Separate state for weekday questions
  const [weekdayAnswers, setWeekdayAnswers] = useState<{[key: number]: string}>({});

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  
  // Get current weekday (1=Monday, 5=Friday)
  const currentWeekday = new Date().getDay() || 7; // Convert Sunday (0) to 7
  const weekdayQuestions = getWeekdayQuestions(currentWeekday, false); // false = not trainee

  // Load user data on component mount
  useEffect(() => {
    if (isLoaded && user) {
      loadUserData();
    }
  }, [isLoaded, user]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      // Load user data
      const userResponse = await fetch('/api/users');
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUserData(userData);
      }

      // Load weekly goals and progress (same as dashboard)
      const goalsResponse = await fetch('/api/weekly-progress');
      if (goalsResponse.ok) {
        const goalsData = await goalsResponse.json();
        if (goalsData.weeklyGoals) {
          setWeeklyGoals(goalsData.weeklyGoals);
        }
        if (goalsData.weeklyProgress) {
          setWeeklyProgress(goalsData.weeklyProgress);
        }
        
        // Check if weekly goals need to be set (first login of the week)
        const currentWeekStart = new Date();
        currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay() + 1);
        const currentWeekStartStr = currentWeekStart.toISOString().split('T')[0];
        
        // Check if user has weekly goals for current week
        const hasWeeklyGoals = goalsData.weeklyGoals && (
          goalsData.weeklyGoals.fa_weekly_target > 0 ||
          goalsData.weeklyGoals.eh_weekly_target > 0 ||
          goalsData.weeklyGoals.new_appointments_weekly_target > 0 ||
          goalsData.weeklyGoals.recommendations_weekly_target > 0 ||
          goalsData.weeklyGoals.tiv_invitations_weekly_target > 0 ||
          goalsData.weeklyGoals.taa_invitations_weekly_target > 0 ||
          goalsData.weeklyGoals.tgs_registrations_weekly_target > 0 ||
          goalsData.weeklyGoals.bav_checks_weekly_target > 0
        );
        
        if (!hasWeeklyGoals) {
          console.log('🔔 User needs to set weekly goals for current week');
          setShowWeeklyGoalsModal(true);
        }
      }

      // Load yesterday's data - get real goals and results from yesterday
      const yesterdayResponse = await fetch('/api/daily-entries/yesterday');
      if (yesterdayResponse.ok) {
        const yesterdayData = await yesterdayResponse.json();
        console.log('Yesterday data loaded:', yesterdayData);
        
        if (yesterdayData.success && yesterdayData.data) {
          // Load yesterday's goals (what was planned for yesterday)
          if (yesterdayData.data.yesterdayGoals) {
            setYesterdayGoals(yesterdayData.data.yesterdayGoals);
            console.log('Yesterday goals loaded:', yesterdayData.data.yesterdayGoals);
          } else {
            console.log('No yesterday goals found, using default values');
            // Set default values if no yesterday data exists
            setYesterdayGoals({
              fa_target: 0,
              eh_target: 0,
              new_appointments_target: 0,
              recommendations_target: 0,
              tiv_invitations_target: 0,
              taa_invitations_target: 0,
              tgs_registrations_target: 0,
              bav_checks_target: 0
            });
          }
          
          // Load yesterday's results - show the ACTUAL data from yesterday
          const yesterdayResults = yesterdayData.data.yesterdayResults || {};
          setYesterdayResults({
            // Show the ACTUAL results from yesterday's entry
            fa_achieved: yesterdayResults.fa_achieved || 0,
            eh_achieved: yesterdayResults.eh_achieved || 0,
            new_appointments_achieved: yesterdayResults.new_appointments_achieved || 0,
            recommendations_achieved: yesterdayResults.recommendations_achieved || 0,
            tiv_invitations_achieved: yesterdayResults.tiv_invitations_achieved || 0,
            taa_invitations_achieved: yesterdayResults.taa_invitations_achieved || 0,
            tgs_registrations_achieved: yesterdayResults.tgs_registrations_achieved || 0,
            bav_checks_achieved: yesterdayResults.bav_checks_achieved || 0,
            highlight_yesterday: yesterdayResults.highlight_yesterday || "",
            appointments_next_week: yesterdayResults.appointments_next_week || 0,
            improvement_today: yesterdayResults.improvement_today || "",
            weekly_improvement: yesterdayResults.weekly_improvement || "",
            // Keep these fields from yesterday data
            todos_completed: yesterdayResults.todos_completed || [false, false, false, false, false],
            charisma_training: yesterdayResults.charisma_training || false
          });
          console.log('Yesterday results loaded from yesterday entry:', yesterdayResults);
          
          // Load yesterday's todos for the "Was war gestern" section
          if (yesterdayData.data.yesterdayTodos && yesterdayData.data.yesterdayTodos.length > 0) {
            setYesterdayTodos(yesterdayData.data.yesterdayTodos);
            console.log('Yesterday todos loaded for yesterday section:', yesterdayData.data.yesterdayTodos);
            
            // Ensure todos_completed array matches the length of yesterdayTodos
            const todosLength = yesterdayData.data.yesterdayTodos.length;
            const currentTodosCompleted = yesterdayData.data.yesterdayResults?.todos_completed || [];
            const adjustedTodosCompleted = Array.from({ length: todosLength }, (_, i) => 
              currentTodosCompleted[i] || false
            );
            
            // Update the todos_completed array in yesterdayResults
            setYesterdayResults(prev => ({
              ...prev,
              todos_completed: adjustedTodosCompleted
            }));
          } else {
            console.log('No yesterday todos found, using default empty todos');
            // Set default empty todos if no yesterday data exists
            const defaultTodos = ["", "", "", "", ""];
            setYesterdayTodos(defaultTodos);
            
            // Also reset todos_completed for empty todos
            setYesterdayResults(prev => ({
              ...prev,
              todos_completed: [false, false, false, false, false]
            }));
          }
        }
      }

      // Load today's data (current entry)
      const todayResponse = await fetch('/api/daily-entries/today');
      if (todayResponse.ok) {
        const todayData = await todayResponse.json();
        console.log('Today data loaded:', todayData);
        if (todayData.success && todayData.data) {
          // Load today's goals and answers
          if (todayData.data.todayGoals) {
            setTodayGoals(todayData.data.todayGoals);
          }
          if (todayData.data.todayAnswers) {
            setTodayAnswers(todayData.data.todayAnswers);
          }
          // Load weekday answers
          if (todayData.data.weekdayAnswers) {
            setWeekdayAnswers(todayData.data.weekdayAnswers);
          }
          // Load today's todos normally
          if (todayData.data.todayTodos) {
            setTodayTodos(todayData.data.todayTodos);
          }
          
          // Load yesterday's results that were entered today - but only if they were actually entered today
          if (todayData.data.yesterdayResults) {
            console.log('Loading yesterday results from today entry:', todayData.data.yesterdayResults);
            setYesterdayResults(todayData.data.yesterdayResults);
          } else {
            // If no "Was war gestern" data exists for today, reset to 0 for new day
            console.log('No "Was war gestern" data for today, resetting results to 0 for new day');
            setYesterdayResults(prev => ({
              ...prev,
              // Reset numerical results to 0 for new day
              fa_achieved: 0,
              eh_achieved: 0,
              new_appointments_achieved: 0,
              recommendations_achieved: 0,
              tiv_invitations_achieved: 0,
              taa_invitations_achieved: 0,
              tgs_registrations_achieved: 0,
              bav_checks_achieved: 0,
              appointments_next_week: 0,
              // Reset text fields to empty for new day
              highlight_yesterday: "",
              improvement_today: "",
              weekly_improvement: "",
              // Keep todos_completed and charisma_training from yesterday's actual data
              todos_completed: prev.todos_completed,
              charisma_training: prev.charisma_training
            }));
          }
        } else {
          // If no entry exists for today, reset today's fields to 0 (no fallback values)
          console.log('No entry for today found, setting all values to 0');
          setTodayGoals({
            fa_target: 0,
            eh_target: 0,
            new_appointments_target: 0,
            recommendations_target: 0,
            tiv_invitations_target: 0,
            taa_invitations_target: 0,
            tgs_registrations_target: 0,
            bav_checks_target: 0
          });
          setTodayAnswers({
            help_needed: "",
            training_focus: "",
            improvement_today: "",
            weekday_answer: ""
          });
          setWeekdayAnswers({});
          setTodayTodos(["", "", "", "", ""]);
          
          // Also reset yesterdayResults for new day
          setYesterdayResults(prev => ({
            ...prev,
            // Reset numerical results to 0 for new day
            fa_achieved: 0,
            eh_achieved: 0,
            new_appointments_achieved: 0,
            recommendations_achieved: 0,
            tiv_invitations_achieved: 0,
            taa_invitations_achieved: 0,
            tgs_registrations_achieved: 0,
            bav_checks_achieved: 0,
            appointments_next_week: 0,
            // Reset text fields to empty for new day
            highlight_yesterday: "",
            improvement_today: "",
            weekly_improvement: "",
            // Keep todos_completed and charisma_training from yesterday's actual data
            todos_completed: prev.todos_completed,
            charisma_training: prev.charisma_training
          }));
        }
      }

      // Load monthly progress (same as dashboard)
      const monthlyResponse = await fetch('/api/daily-entries/monthly-progress');
      if (monthlyResponse.ok) {
        const monthlyData = await monthlyResponse.json();
        if (monthlyData.progress) {
          setMonthlyProgress(monthlyData.progress);
        }
        if (monthlyData.monthlyData) {
          setMonthlyData(monthlyData.monthlyData);
        }
      }
      
      // Check if monthly goals need to be set (from 26th of month onwards)
      // This runs AFTER userData is loaded
      const today = new Date();
      const dayOfMonth = today.getDate();
      
      if (dayOfMonth >= 26) {
        console.log('📅 Checking monthly goals - day of month:', dayOfMonth);
        
        // Check if user has monthly targets set
        const hasMonthlyGoals = userData && userData.monthly_targets && (
          userData.monthly_targets.fa_target > 0 ||
          userData.monthly_targets.eh_target > 0 ||
          userData.monthly_targets.new_appointments_target > 0 ||
          userData.monthly_targets.recommendations_target > 0 ||
          userData.monthly_targets.tiv_invitations_target > 0 ||
          userData.monthly_targets.taa_invitations_target > 0 ||
          userData.monthly_targets.tgs_registrations_target > 0 ||
          userData.monthly_targets.bav_checks_target > 0
        );
        
        console.log('📅 Monthly goals check:', {
          userData: !!userData,
          monthly_targets: userData?.monthly_targets,
          hasMonthlyGoals
        });
        
        if (!hasMonthlyGoals) {
          console.log('🔔 User needs to set monthly goals for next month');
          setShowMonthlyGoalsModal(true);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate recommendations
  const monthlyAverages = calculateMonthlyAverages(monthlyData);
  const recommendations = generateRecommendations(monthlyAverages);
  const autoToDosObjects = generateAutoToDos(recommendations);
  const autoToDos = autoToDosObjects.map(todo => todo.text);


  const handleRecommendationToggle = (recommendationType: string) => {
    setExpandedRecommendations(prev => 
      prev.includes(recommendationType)
        ? prev.filter(type => type !== recommendationType)
        : [...prev, recommendationType]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage("");
    
    try {
      const entryDate = new Date().toISOString().split('T')[0];
      console.log('Saving with entry date:', entryDate);
      console.log('Saving yesterdayResults:', yesterdayResults);
      console.log('Saving todayGoals:', todayGoals);
      console.log('Saving todayAnswers:', todayAnswers);
      
      const response = await fetch('/api/daily-entries/berater', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          yesterdayResults,
          todayGoals,
          todayTodos,
          todayAnswers,
          weekday_answers: weekdayAnswers,
          entryDate: entryDate
        }),
      });

      const result = await response.json();
      console.log('Save response:', result);

      if (response.ok) {
        setSaveMessage("✅ Tageseintrag erfolgreich gespeichert!");
        // Reload data after saving to show updated values
        await loadUserData();
        // Optional: Weiterleitung zum Dashboard nach 2 Sekunden
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
      } else {
        setSaveMessage(`❌ Fehler beim Speichern: ${result.error}`);
        console.error('Save failed:', result);
      }
    } catch (error) {
      console.error('Error saving data:', error);
      setSaveMessage("❌ Fehler beim Speichern der Daten");
    } finally {
      setSaving(false);
    }
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
            <p className="text-gray-600">
              Sie müssen sich anmelden, um die Berater-Seite zu verwenden.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Weekly Goals Modal
  if (showWeeklyGoalsModal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">📅 Wochenziele festlegen</h2>
          <p className="text-gray-600 mb-6">
            Willkommen in der neuen Woche! Bitte legen Sie Ihre Wochenziele fest:
          </p>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Finanzanalysen</label>
              <input
                type="number"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={weeklyGoals.fa_weekly_target}
                onChange={(e) => setWeeklyGoals(prev => ({ ...prev, fa_weekly_target: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">EH</label>
              <input
                type="number"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={weeklyGoals.eh_weekly_target}
                onChange={(e) => setWeeklyGoals(prev => ({ ...prev, eh_weekly_target: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Neue Termine</label>
              <input
                type="number"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={weeklyGoals.new_appointments_weekly_target}
                onChange={(e) => setWeeklyGoals(prev => ({ ...prev, new_appointments_weekly_target: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Empfehlungen</label>
              <input
                type="number"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={weeklyGoals.recommendations_weekly_target}
                onChange={(e) => setWeeklyGoals(prev => ({ ...prev, recommendations_weekly_target: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">TIV</label>
              <input
                type="number"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={weeklyGoals.tiv_invitations_weekly_target}
                onChange={(e) => setWeeklyGoals(prev => ({ ...prev, tiv_invitations_weekly_target: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">TAA</label>
              <input
                type="number"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={weeklyGoals.taa_invitations_weekly_target}
                onChange={(e) => setWeeklyGoals(prev => ({ ...prev, taa_invitations_weekly_target: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">TGS</label>
              <input
                type="number"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={weeklyGoals.tgs_registrations_weekly_target}
                onChange={(e) => setWeeklyGoals(prev => ({ ...prev, tgs_registrations_weekly_target: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">bAV Checks</label>
              <input
                type="number"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={weeklyGoals.bav_checks_weekly_target}
                onChange={(e) => setWeeklyGoals(prev => ({ ...prev, bav_checks_weekly_target: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowWeeklyGoalsModal(false)}
            >
              Später
            </Button>
            <Button
              onClick={async () => {
                // Save weekly goals
                const response = await fetch('/api/weekly-progress', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(weeklyGoals)
                });
                if (response.ok) {
                  setShowWeeklyGoalsModal(false);
                  // Reload data
                  window.location.reload();
                }
              }}
            >
              Speichern
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Monthly Goals Modal
  if (showMonthlyGoalsModal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">📅 Monatsziele festlegen</h2>
          <p className="text-gray-600 mb-6">
            Es ist Zeit, Ihre Monatsziele für den nächsten Monat festzulegen:
          </p>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Finanzanalysen</label>
              <input
                type="number"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={userData?.monthly_targets?.fa_target || 0}
                onChange={(e) => setUserData(prev => ({ 
                  ...prev, 
                  monthly_targets: { 
                    ...prev.monthly_targets, 
                    fa_target: parseInt(e.target.value) || 0 
                  } 
                }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">EH</label>
              <input
                type="number"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={userData?.monthly_targets?.eh_target || 0}
                onChange={(e) => setUserData(prev => ({ 
                  ...prev, 
                  monthly_targets: { 
                    ...prev.monthly_targets, 
                    eh_target: parseInt(e.target.value) || 0 
                  } 
                }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Neue Termine</label>
              <input
                type="number"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={userData?.monthly_targets?.new_appointments_target || 0}
                onChange={(e) => setUserData(prev => ({ 
                  ...prev, 
                  monthly_targets: { 
                    ...prev.monthly_targets, 
                    new_appointments_target: parseInt(e.target.value) || 0 
                  } 
                }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Empfehlungen</label>
              <input
                type="number"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={userData?.monthly_targets?.recommendations_target || 0}
                onChange={(e) => setUserData(prev => ({ 
                  ...prev, 
                  monthly_targets: { 
                    ...prev.monthly_targets, 
                    recommendations_target: parseInt(e.target.value) || 0 
                  } 
                }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">TIV</label>
              <input
                type="number"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={userData?.monthly_targets?.tiv_invitations_target || 0}
                onChange={(e) => setUserData(prev => ({ 
                  ...prev, 
                  monthly_targets: { 
                    ...prev.monthly_targets, 
                    tiv_invitations_target: parseInt(e.target.value) || 0 
                  } 
                }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">TAA</label>
              <input
                type="number"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={userData?.monthly_targets?.taa_invitations_target || 0}
                onChange={(e) => setUserData(prev => ({ 
                  ...prev, 
                  monthly_targets: { 
                    ...prev.monthly_targets, 
                    taa_invitations_target: parseInt(e.target.value) || 0 
                  } 
                }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">TGS</label>
              <input
                type="number"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={userData?.monthly_targets?.tgs_registrations_target || 0}
                onChange={(e) => setUserData(prev => ({ 
                  ...prev, 
                  monthly_targets: { 
                    ...prev.monthly_targets, 
                    tgs_registrations_target: parseInt(e.target.value) || 0 
                  } 
                }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">bAV Checks</label>
              <input
                type="number"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={userData?.monthly_targets?.bav_checks_target || 0}
                onChange={(e) => setUserData(prev => ({ 
                  ...prev, 
                  monthly_targets: { 
                    ...prev.monthly_targets, 
                    bav_checks_target: parseInt(e.target.value) || 0 
                  } 
                }))}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowMonthlyGoalsModal(false)}
            >
              Später
            </Button>
            <Button
              onClick={async () => {
                // Save monthly targets
                const response = await fetch('/api/users', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    monthly_targets: userData.monthly_targets 
                  })
                });
                if (response.ok) {
                  setShowMonthlyGoalsModal(false);
                  // Reload data
                  window.location.reload();
                }
              }}
            >
              Speichern
            </Button>
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
            <div className="bg-green-50 p-3 rounded-lg border border-green-100">
              <p className="font-medium text-green-900 text-sm">{weeklyGoals.additional_goal}</p>
            </div>
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
                      { key: 'fa', label: 'Finanzanalysen', target: yesterdayGoals.fa_target, achieved: yesterdayResults.fa_achieved },
                      { key: 'eh', label: 'EH', target: yesterdayGoals.eh_target, achieved: yesterdayResults.eh_achieved },
                      { key: 'new_appointments', label: 'Neue Termine', target: yesterdayGoals.new_appointments_target, achieved: yesterdayResults.new_appointments_achieved },
                      { key: 'recommendations', label: 'Empfehlungen', target: yesterdayGoals.recommendations_target, achieved: yesterdayResults.recommendations_achieved },
                      { key: 'tiv_invitations', label: 'TIV', target: yesterdayGoals.tiv_invitations_target, achieved: yesterdayResults.tiv_invitations_achieved },
                      { key: 'taa_invitations', label: 'TAA', target: yesterdayGoals.taa_invitations_target, achieved: yesterdayResults.taa_invitations_achieved },
                      { key: 'tgs_registrations', label: 'TGS', target: yesterdayGoals.tgs_registrations_target, achieved: yesterdayResults.tgs_registrations_achieved },
                      { key: 'bav_checks', label: 'bAV Checks', target: yesterdayGoals.bav_checks_target, achieved: yesterdayResults.bav_checks_achieved }
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
                              [`${metric.key}_achieved`]: parseInt(e.target.value) || 0
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
                  {yesterdayResults.todos_completed.map((completed, index) => (
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
                      checked={yesterdayResults.charisma_training}
                      onChange={(e) => setYesterdayResults(prev => ({
                        ...prev,
                        charisma_training: e.target.checked
                      }))}
                      className="rounded"
                    />
                    <span className={yesterdayResults.charisma_training ? 'line-through text-gray-500' : ''}>
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
                      value={yesterdayResults.highlight_yesterday}
                      onChange={(e) => setYesterdayResults(prev => ({
                        ...prev,
                        highlight_yesterday: e.target.value
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
                    value={yesterdayResults.appointments_next_week}
                    onChange={(e) => setYesterdayResults(prev => ({
                      ...prev,
                      appointments_next_week: parseInt(e.target.value) || 0
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
                      value={yesterdayResults.weekly_improvement}
                      onChange={(e) => setYesterdayResults(prev => ({
                        ...prev,
                        weekly_improvement: e.target.value
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
                      { key: 'fa', label: 'Finanzanalysen', target: todayGoals.fa_target },
                      { key: 'eh', label: 'EH', target: todayGoals.eh_target },
                      { key: 'new_appointments', label: 'Neue Termine', target: todayGoals.new_appointments_target },
                      { key: 'recommendations', label: 'Empfehlungen', target: todayGoals.recommendations_target },
                      { key: 'tiv_invitations', label: 'TIV', target: todayGoals.tiv_invitations_target },
                      { key: 'taa_invitations', label: 'TAA', target: todayGoals.taa_invitations_target },
                      { key: 'tgs_registrations', label: 'TGS', target: todayGoals.tgs_registrations_target },
                      { key: 'bav_checks', label: 'bAV Checks', target: todayGoals.bav_checks_target }
                    ].map((metric) => (
                      <tr key={metric.key}>
                        <td className="border border-gray-300 p-2 font-medium">{metric.label}</td>
                        <td className="border border-gray-300 p-2 text-center">
                          <input
                            type="number"
                            value={metric.target}
                            onChange={(e) => setTodayGoals(prev => ({
                              ...prev,
                              [`${metric.key}_target`]: parseInt(e.target.value) || 0
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
                  <div className="grid grid-cols-2 gap-2">
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
                    value={todayAnswers.improvement_today || ""}
                    onChange={(e) => setTodayAnswers(prev => ({
                      ...prev,
                      improvement_today: e.target.value
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
                { key: 'fa', label: 'Finanzanalysen', current: monthlyProgress.fa_current, target: monthlyProgress.fa_target },
                { key: 'eh', label: 'EH', current: monthlyProgress.eh_current, target: monthlyProgress.eh_target },
                { key: 'new_appointments', label: 'Neue Termine', current: monthlyProgress.new_appointments_current, target: monthlyProgress.new_appointments_target },
                { key: 'recommendations', label: 'Empfehlungen', current: monthlyProgress.recommendations_current, target: monthlyProgress.recommendations_target },
                { key: 'tiv_invitations', label: 'TIV', current: monthlyProgress.tiv_invitations_current, target: monthlyProgress.tiv_invitations_target },
                { key: 'taa_invitations', label: 'TAA', current: monthlyProgress.taa_invitations_current, target: monthlyProgress.taa_invitations_target },
                { key: 'tgs_registrations', label: 'TGS', current: monthlyProgress.tgs_registrations_current, target: monthlyProgress.tgs_registrations_target },
                { key: 'bav_checks', label: 'bAV Checks', current: monthlyProgress.bav_checks_current, target: monthlyProgress.bav_checks_target }
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
          {saveMessage && (
            <div className={`p-3 rounded-lg ${
              saveMessage.includes('✅') 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {saveMessage}
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