'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  getWeekdayQuestions, 
  calculateProgressWithColor, 
  calculateProjection 
} from '@/lib/weekday-logic';

export default function KanzleiablaufPage() {
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [teamTotals, setTeamTotals] = useState<any>(null);
  const [weeklyProgress, setWeeklyProgress] = useState<any>(null);
  const [monthlyProgress, setMonthlyProgress] = useState<any>(null);
  const [todayFocus, setTodayFocus] = useState({
    training: "",
    phoneParty: "",
    trainingResponsible: "Daniel",
    phonePartyResponsible: "Daniel"
  });
  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set());
  const [showTodayOpportunity, setShowTodayOpportunity] = useState<boolean>(false);

  // Toggle expanded state for a member
  const toggleMemberExpansion = (memberId: string) => {
    setExpandedMembers(prev => {
      const newSet = new Set(prev);
      const wasExpanded = newSet.has(memberId);
      
      if (wasExpanded) {
        newSet.delete(memberId);
        // Scroll to top of the collapsed card
        setTimeout(() => {
          const cardElement = document.querySelector(`[data-member-id="${memberId}"]`);
          if (cardElement) {
            cardElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start',
              inline: 'nearest'
            });
          }
        }, 100); // Small delay to allow animation to start
      } else {
        newSet.add(memberId);
      }
      
      return newSet;
    });
  };

  // Toggle visibility of all content below button
  const toggleTodayOpportunity = () => {
    if (showTodayOpportunity) {
      // Hide all content and collapse all members
      setShowTodayOpportunity(false);
      setExpandedMembers(new Set());
    } else {
      // Show all content, but keep individual members collapsed
      setShowTodayOpportunity(true);
      setExpandedMembers(new Set()); // Keep individual members collapsed initially
    }
  };

  // Get current weekday (1=Monday, 5=Friday)
  const currentWeekday = new Date().getDay() || 7; // Convert Sunday (0) to 7
  const weekdayQuestions = getWeekdayQuestions(currentWeekday, false); // false = not trainee

  // Load team data
  const loadTeamData = async () => {
    try {
      const response = await fetch('/api/kanzleiablauf-data');
      const data = await response.json();
      
      console.log('Real team data loaded:', data);
      
      if (data.success) {
        // Transform the API data to match our expected format
        const transformedMembers = data.teamMembers?.map((member: any) => ({
          id: member.id,
          name: member.name,
          role: member.role,
          mood: member.mood || '😊',
          isTrainee: member.role === 'trainee',
          yesterdayResults: member.yesterdayResults || {},
          yesterdayGoals: member.yesterdayGoals || {},
          todayGoals: member.todayGoals || {},
          todayAnswers: member.todayAnswers || {},
          todayTodos: member.todayTodos || [],
          yesterdayTodos: member.yesterdayTodos || [],
          todayWeekdayAnswers: member.todayWeekdayAnswers || {},
          yesterdayWeekdayAnswers: member.yesterdayWeekdayAnswers || {},
          weeklyProgress: member.weeklyProgress || {},
          monthlyProgress: member.monthlyProgress || {},
          // Debug fields
          _debug_yesterdayEntry: member._debug_yesterdayEntry,
          _debug_yesterdayTodos: member._debug_yesterdayTodos,
          _debug_yesterdayEntryRaw: member._debug_yesterdayEntryRaw,
          _debug_todayWeekdayAnswers: member._debug_todayWeekdayAnswers,
          _debug_todayWeekdayAnswer: member._debug_todayWeekdayAnswer
        })) || [];
        
        setTeamMembers(transformedMembers);
        setTeamTotals(data.teamTotals || null);
        setWeeklyProgress(data.weeklyProgress || null);
        setMonthlyProgress(data.monthlyProgress || null);
        
        console.log('Transformed data:', {
          members: transformedMembers.length,
          teamTotals: data.teamTotals,
          weeklyProgress: data.weeklyProgress,
          monthlyProgress: data.monthlyProgress
        });
        
        // Debug: Show weekly progress values
        console.log('Weekly Progress Debug:', {
          fa_current: data.weeklyProgress?.fa_current,
          fa_target: data.weeklyProgress?.fa_target,
          eh_current: data.weeklyProgress?.eh_current,
          eh_target: data.weeklyProgress?.eh_target,
          new_appointments_current: data.weeklyProgress?.new_appointments_current,
          new_appointments_target: data.weeklyProgress?.new_appointments_target
        });
        
        // Debug: Show team totals
        console.log('Team Totals Debug:', {
          yesterday: data.teamTotals?.yesterday,
          today: data.teamTotals?.today
        });
        
        // Debug: Show team members from API
        console.log('API Team Members Debug:', data.teamMembers?.map((member: any) => ({
          name: member.name,
          yesterdayGoals: member.yesterdayGoals,
          yesterdayResults: member.yesterdayResults,
          todayGoals: member.todayGoals
        })));
        
        // Debug: Show weekly progress from API
        console.log('API Weekly Progress Debug:', {
          fa_current: data.weeklyProgress?.fa_current,
          fa_target: data.weeklyProgress?.fa_target,
          eh_current: data.weeklyProgress?.eh_current,
          eh_target: data.weeklyProgress?.eh_target
        });
        
        // Debug: Show team totals from API
        console.log('API Team Totals Debug:', {
          yesterday: data.teamTotals?.yesterday,
          today: data.teamTotals?.today
        });
        console.log('Real team data loaded:', data);
      }
    } catch (error) {
      console.error('Failed to load team data:', error);
    }
  };

  useEffect(() => {
    loadTeamData();
  }, []);

  // Use useMemo to ensure displayTeamMembers updates when teamMembers changes
  const displayTeamMembers = React.useMemo(() => teamMembers, [teamMembers]);

  console.log('Display team members:', displayTeamMembers.length, 'real data:', teamMembers.length > 0);
  
  // Debug: Show team member data
  if (displayTeamMembers.length > 0) {
    console.log('Team Member Debug:', displayTeamMembers.map(member => ({
      name: member.name,
      todayGoals: member.todayGoals,
      yesterdayResults: member.yesterdayResults,
      yesterdayGoals: member.yesterdayGoals
    })));
  }

  // Use the imported function from weekday-logic (same as berater page)
  const calculateProgressWithColorLocal = (achieved: number, target: number) => {
    if (!target || target === 0) return { progress: 0, color: 'text-gray-500' };
    const result = calculateProgressWithColor(achieved, target);
    return {
      progress: Math.round(result.progress), // Round to whole percentage
      color: result.color.replace('bg-', 'text-') // Convert bg- to text- for text color
    };
  };

  const getTodayQuestions = (member: any) => {
    const questions = [];
    
    // Fixed questions (always shown)
    if (member.todayAnswers?.help_needed) {
      questions.push({ q: "Wobei brauchst du heute Hilfe?", a: member.todayAnswers.help_needed });
    }
    if (member.todayAnswers?.training_focus) {
      questions.push({ q: "Was willst du heute trainieren?", a: member.todayAnswers.training_focus });
    }
    if (member.todayAnswers?.improvement_today) {
      questions.push({ q: "Was willst du heute noch besser machen?", a: member.todayAnswers.improvement_today });
    }
    
    // Weekday-specific questions for today
    if (member.todayWeekdayAnswers && weekdayQuestions.today && Array.isArray(weekdayQuestions.today) && weekdayQuestions.today.length > 0) {
      weekdayQuestions.today.forEach((question, index) => {
        const answer = member.todayWeekdayAnswers[index];
        if (answer) {
          questions.push({ q: question, a: answer });
        }
      });
    }
    
    return questions;
  };

  const getYesterdayQuestions = (member: any) => {
    const questions = [];
    
    // Use yesterdayResults from the API response (matching berater page structure)
    if (member.yesterdayResults?.highlight_yesterday) {
      questions.push({ q: "Was war dein Highlight gestern?", a: member.yesterdayResults.highlight_yesterday });
    }
    if (member.yesterdayResults?.appointments_next_week) {
      questions.push({ q: "Wie viele Termine stehen für nächste Woche an?", a: member.yesterdayResults.appointments_next_week });
    }
    if (currentWeekday === 5 && member.yesterdayResults?.weekly_improvement) {
      questions.push({ q: "Worin hast du dich die Woche besonders verbessert?", a: member.yesterdayResults.weekly_improvement });
    }
    if (member.yesterdayResults?.charisma_training !== undefined) {
      questions.push({ q: "Charisma-Training gemacht?", a: member.yesterdayResults.charisma_training ? "Ja" : "Nein" });
    }
    
    // Add weekday-specific questions for yesterday (from yesterday's entry)
    // These are the questions that were asked yesterday and answered yesterday
    if (member.yesterdayWeekdayAnswers && weekdayQuestions.yesterday && Array.isArray(weekdayQuestions.yesterday) && weekdayQuestions.yesterday.length > 0) {
      weekdayQuestions.yesterday.forEach((question, index) => {
        const answer = member.yesterdayWeekdayAnswers[index];
        if (answer) {
          questions.push({ q: question, a: answer });
        }
      });
    }
    
    return questions;
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/kanzleiablauf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ todayFocus })
      });
      
      if (response.ok) {
        alert('Daten erfolgreich gespeichert!');
      } else {
        alert('Fehler beim Speichern der Daten.');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Fehler beim Speichern der Daten.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Kanzleiablauf</h1>
          <p className="text-gray-600">Teamübersicht und Tagesplanung</p>
        </div>

        {/* Team Gesamt Ergebnis von Gestern - Like Wochenziel on Dashboard */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">📊 Team Gesamt Ergebnis von Gestern</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { key: 'fa', label: 'Finanzanalysen', target: teamTotals?.yesterday?.fa_target || 0, achieved: teamTotals?.yesterday?.fa_achieved || 0 },
                { key: 'eh', label: 'EH', target: teamTotals?.yesterday?.eh_target || 0, achieved: teamTotals?.yesterday?.eh_achieved || 0 },
                { key: 'new_appointments', label: 'Neue Termine', target: teamTotals?.yesterday?.new_appointments_target || 0, achieved: teamTotals?.yesterday?.new_appointments_achieved || 0 },
                { key: 'recommendations', label: 'Empfehlungen', target: teamTotals?.yesterday?.recommendations_target || 0, achieved: teamTotals?.yesterday?.recommendations_achieved || 0 },
                { key: 'tiv_invitations', label: 'TIV', target: teamTotals?.yesterday?.tiv_invitations_target || 0, achieved: teamTotals?.yesterday?.tiv_invitations_achieved || 0 },
                { key: 'taa_invitations', label: 'TAA', target: teamTotals?.yesterday?.taa_invitations_target || 0, achieved: teamTotals?.yesterday?.taa_invitations_achieved || 0 },
                { key: 'tgs_registrations', label: 'TGS', target: teamTotals?.yesterday?.tgs_registrations_target || 0, achieved: teamTotals?.yesterday?.tgs_registrations_achieved || 0 },
                { key: 'bav_checks', label: 'bAV Checks', target: teamTotals?.yesterday?.bav_checks_target || 0, achieved: teamTotals?.yesterday?.bav_checks_achieved || 0 }
              ].map((metric) => {
                const progress = calculateProgressWithColorLocal(metric.achieved, metric.target);
                return (
                  <div key={metric.key} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm font-medium">{metric.label}</div>
                      <div className="text-sm text-gray-600">{metric.achieved} / {metric.target}</div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                      <div 
                        className={`h-2 rounded-full ${progress.color.replace('text-', 'bg-')}`}
                        style={{ width: `${progress.progress}%` }}
                      ></div>
                    </div>
                    <div className={`text-xs ${progress.color}`}>{progress.progress}%</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Individual Member Results */}
        <div className="space-y-6">
          {displayTeamMembers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>DEBUG: displayTeamMembers.length = {displayTeamMembers.length}</p>
              <p>DEBUG: teamMembers.length = {teamMembers.length}</p>
              <p>DEBUG: real data = {teamMembers.length > 0 ? 'true' : 'false'}</p>
              <p>Keine Daten für heute/gestern verfügbar.</p>
              <p className="text-sm">Bitte tragen Sie Ihre täglichen Ziele und Ergebnisse auf der Berater-Seite ein.</p>
            </div>
          ) : (
            displayTeamMembers.map((member) => (
              <Card key={member.id} data-member-id={member.id} className="cursor-pointer hover:shadow-md transition-shadow duration-200" onClick={() => toggleMemberExpansion(member.id)}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <CardTitle className="text-lg">{member.name?.split(' ')[0] || member.name}</CardTitle>
                        {member.isTrainee && (
                          <Badge variant="secondary" className="text-xs">Trainee</Badge>
                        )}
                        
                        {/* 2-zeilige Ziel/Ergebnis Kacheln - Direkt neben dem Namen */}
                        <div className="grid grid-cols-8 gap-2 text-xs">
                          {/* Gestern Ergebnisse - 2-zeilig: FA / 1/1 mit Hintergrund-Farben */}
                          <div className={`text-center px-1 py-1 rounded-md shadow-sm border w-12 h-12 flex flex-col justify-center ${(member.yesterdayResults?.fa_achieved || 0) > 0 ? 'bg-green-100 border-green-200' : 'bg-gray-100 border-gray-200'}`}>
                            <div className="font-medium text-gray-600 mb-1">FA</div>
                            <div className="font-bold text-gray-900 text-xs">
                              {(member.yesterdayResults?.fa_achieved || 0)}/{(member.yesterdayGoals?.fa_target || 0)}
                            </div>
                          </div>
                          <div className={`text-center px-1 py-1 rounded-md shadow-sm border w-12 h-12 flex flex-col justify-center ${(member.yesterdayResults?.eh_achieved || 0) > 0 ? 'bg-green-100 border-green-200' : 'bg-gray-100 border-gray-200'}`}>
                            <div className="font-medium text-gray-600 mb-1">EH</div>
                            <div className="font-bold text-gray-900 text-xs">
                              {(member.yesterdayResults?.eh_achieved || 0)}/{(member.yesterdayGoals?.eh_target || 0)}
                            </div>
                          </div>
                          <div className={`text-center px-1 py-1 rounded-md shadow-sm border w-12 h-12 flex flex-col justify-center ${(member.yesterdayResults?.new_appointments_achieved || 0) > 0 ? 'bg-green-100 border-green-200' : 'bg-gray-100 border-gray-200'}`}>
                            <div className="font-medium text-gray-600 mb-1">Ter</div>
                            <div className="font-bold text-gray-900 text-xs">
                              {(member.yesterdayResults?.new_appointments_achieved || 0)}/{(member.yesterdayGoals?.new_appointments_target || 0)}
                            </div>
                          </div>
                          <div className={`text-center px-1 py-1 rounded-md shadow-sm border w-12 h-12 flex flex-col justify-center ${(member.yesterdayResults?.recommendations_achieved || 0) > 0 ? 'bg-green-100 border-green-200' : 'bg-gray-100 border-gray-200'}`}>
                            <div className="font-medium text-gray-600 mb-1">Empf</div>
                            <div className="font-bold text-gray-900 text-xs">
                              {(member.yesterdayResults?.recommendations_achieved || 0)}/{(member.yesterdayGoals?.recommendations_target || 0)}
                            </div>
                          </div>
                          <div className={`text-center px-1 py-1 rounded-md shadow-sm border w-12 h-12 flex flex-col justify-center ${(member.yesterdayResults?.tiv_invitations_achieved || 0) > 0 ? 'bg-green-100 border-green-200' : 'bg-gray-100 border-gray-200'}`}>
                            <div className="font-medium text-gray-600 mb-1">TIV</div>
                            <div className="font-bold text-gray-900 text-xs">
                              {(member.yesterdayResults?.tiv_invitations_achieved || 0)}/{(member.yesterdayGoals?.tiv_invitations_target || 0)}
                            </div>
                          </div>
                          <div className={`text-center px-1 py-1 rounded-md shadow-sm border w-12 h-12 flex flex-col justify-center ${(member.yesterdayResults?.taa_invitations_achieved || 0) > 0 ? 'bg-green-100 border-green-200' : 'bg-gray-100 border-gray-200'}`}>
                            <div className="font-medium text-gray-600 mb-1">TAA</div>
                            <div className="font-bold text-gray-900 text-xs">
                              {(member.yesterdayResults?.taa_invitations_achieved || 0)}/{(member.yesterdayGoals?.taa_invitations_target || 0)}
                            </div>
                          </div>
                          <div className={`text-center px-1 py-1 rounded-md shadow-sm border w-12 h-12 flex flex-col justify-center ${(member.yesterdayResults?.tgs_registrations_achieved || 0) > 0 ? 'bg-green-100 border-green-200' : 'bg-gray-100 border-gray-200'}`}>
                            <div className="font-medium text-gray-600 mb-1">TGS</div>
                            <div className="font-bold text-gray-900 text-xs">
                              {(member.yesterdayResults?.tgs_registrations_achieved || 0)}/{(member.yesterdayGoals?.tgs_registrations_target || 0)}
                            </div>
                          </div>
                          <div className={`text-center px-1 py-1 rounded-md shadow-sm border w-12 h-12 flex flex-col justify-center ${(member.yesterdayResults?.bav_checks_achieved || 0) > 0 ? 'bg-green-100 border-green-200' : 'bg-gray-100 border-gray-200'}`}>
                            <div className="font-medium text-gray-600 mb-1">bAV</div>
                            <div className="font-bold text-gray-900 text-xs">
                              {(member.yesterdayResults?.bav_checks_achieved || 0)}/{(member.yesterdayGoals?.bav_checks_target || 0)}
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                    
                    <div className="text-xs text-gray-400 ml-2">
                      {expandedMembers.has(member.id) ? '▼' : '▶'}
                    </div>
                  </div>
                </CardHeader>
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  expandedMembers.has(member.id) ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <CardContent className="space-y-6">
                    {/* Zielzahlen und Ergebnisse - Table like berater page */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Zielzahlen und Ergebnisse</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-300 p-2 text-left">Kennzahl</th>
                            <th className="border border-gray-300 p-2 text-center">Ziel</th>
                            <th className="border border-gray-300 p-2 text-center">Ergebnis</th>
                            <th className="border border-gray-300 p-2 text-center">%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { key: 'fa', label: 'Finanzanalysen', target: member.yesterdayGoals?.fa_target || 0, achieved: member.yesterdayResults?.fa_achieved || 0 },
                            { key: 'eh', label: 'EH', target: member.yesterdayGoals?.eh_target || 0, achieved: member.yesterdayResults?.eh_achieved || 0 },
                            { key: 'new_appointments', label: 'Neue Termine', target: member.yesterdayGoals?.new_appointments_target || 0, achieved: member.yesterdayResults?.new_appointments_achieved || 0 },
                            { key: 'recommendations', label: 'Empfehlungen', target: member.yesterdayGoals?.recommendations_target || 0, achieved: member.yesterdayResults?.recommendations_achieved || 0 },
                            { key: 'tiv_invitations', label: 'TIV', target: member.yesterdayGoals?.tiv_invitations_target || 0, achieved: member.yesterdayResults?.tiv_invitations_achieved || 0 },
                            { key: 'taa_invitations', label: 'TAA', target: member.yesterdayGoals?.taa_invitations_target || 0, achieved: member.yesterdayResults?.taa_invitations_achieved || 0 },
                            { key: 'tgs_registrations', label: 'TGS', target: member.yesterdayGoals?.tgs_registrations_target || 0, achieved: member.yesterdayResults?.tgs_registrations_achieved || 0 },
                            { key: 'bav_checks', label: 'bAV Checks', target: member.yesterdayGoals?.bav_checks_target || 0, achieved: member.yesterdayResults?.bav_checks_achieved || 0 }
                          ].map((metric) => {
                            const progress = calculateProgressWithColorLocal(metric.achieved, metric.target);
                            return (
                              <tr key={metric.key}>
                                <td className="border border-gray-300 p-2 font-medium">{metric.label}</td>
                                <td className="border border-gray-300 p-2 text-center">{metric.target}</td>
                                <td className="border border-gray-300 p-2 text-center">
                                  <span className={`font-semibold ${progress.color}`}>
                                    {metric.achieved}
                                  </span>
                                </td>
                                <td className="border border-gray-300 p-2 text-center">
                                  <span className={`font-semibold ${progress.color}`}>
                                    {progress.progress}%
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Yesterday's Todos */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">ToDos abhaken:</h4>
                    {console.log('DEBUG - member.yesterdayTodos:', member.yesterdayTodos)}
                    {console.log('DEBUG - member.yesterdayResults?.todos_completed:', member.yesterdayResults?.todos_completed)}
                    {console.log('DEBUG - member._debug_yesterdayEntry:', member._debug_yesterdayEntry)}
                    {console.log('DEBUG - member._debug_yesterdayTodos:', member._debug_yesterdayTodos)}
                    {console.log('DEBUG - member._debug_yesterdayEntryRaw:', member._debug_yesterdayEntryRaw)}
                    <div className="space-y-2">
                      {member.yesterdayTodos?.filter((todo: string) => todo && todo.trim() !== '').map((todo: string, index: number) => {
                        const originalIndex = member.yesterdayTodos?.indexOf(todo);
                        const completed = member.yesterdayResults?.todos_completed?.[originalIndex] || false;
                        return (
                          <label key={index} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={completed}
                              readOnly
                              className="rounded"
                            />
                            <span className={completed ? 'line-through text-gray-500' : 'text-gray-900'}>
                              {todo}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* How do you feel about it? */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Wie fühlst du dich damit?</h4>
                    <textarea
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="Wie fühlst du dich mit deinen gestrigen Ergebnissen?"
                      value={member.yesterdayResults?.mood_feedback || ""}
                      onChange={(e) => {
                        // Update the mood_feedback for this member
                        const updatedMembers = teamMembers.map(m => 
                          m.id === member.id 
                            ? { ...m, yesterdayResults: { ...m.yesterdayResults, mood_feedback: e.target.value }}
                            : m
                        );
                        setTeamMembers(updatedMembers);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onFocus={(e) => e.stopPropagation()}
                    />
                  </div>

                  {/* Yesterday's Questions - Questions advisor filled today for yesterday */}
                  <div>
                    <div className="space-y-3">
                      {getYesterdayQuestions(member).map((qa, index) => (
                        <div key={index} className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 mb-1">{qa.q}</p>
                          <p className="text-sm text-gray-900">{qa.a}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Individual Weekly & Monthly Progress */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">📊 {member.name} - Wochenergebnis & Monatsergebnis</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { key: 'fa', label: 'Finanzanalysen', weekly: { current: member.weeklyProgress?.fa_current || 0, target: member.weeklyProgress?.fa_target || 0 }, monthly: { current: member.monthlyProgress?.fa_current || 0, target: member.monthlyProgress?.fa_target || 0 } },
                        { key: 'eh', label: 'EH', weekly: { current: member.weeklyProgress?.eh_current || 0, target: member.weeklyProgress?.eh_target || 0 }, monthly: { current: member.monthlyProgress?.eh_current || 0, target: member.monthlyProgress?.eh_target || 0 } },
                        { key: 'new_appointments', label: 'Neue Termine', weekly: { current: member.weeklyProgress?.new_appointments_current || 0, target: member.weeklyProgress?.new_appointments_target || 0 }, monthly: { current: member.monthlyProgress?.new_appointments_current || 0, target: member.monthlyProgress?.new_appointments_target || 0 } },
                        { key: 'recommendations', label: 'Empfehlungen', weekly: { current: member.weeklyProgress?.recommendations_current || 0, target: member.weeklyProgress?.recommendations_target || 0 }, monthly: { current: member.monthlyProgress?.recommendations_current || 0, target: member.monthlyProgress?.recommendations_target || 0 } },
                        { key: 'tiv_invitations', label: 'TIV', weekly: { current: member.weeklyProgress?.tiv_invitations_current || 0, target: member.weeklyProgress?.tiv_invitations_target || 0 }, monthly: { current: member.monthlyProgress?.tiv_invitations_current || 0, target: member.monthlyProgress?.tiv_invitations_target || 0 } },
                        { key: 'taa_invitations', label: 'TAA', weekly: { current: member.weeklyProgress?.taa_invitations_current || 0, target: member.weeklyProgress?.taa_invitations_target || 0 }, monthly: { current: member.monthlyProgress?.taa_invitations_current || 0, target: member.monthlyProgress?.taa_invitations_target || 0 } },
                        { key: 'tgs_registrations', label: 'TGS', weekly: { current: member.weeklyProgress?.tgs_registrations_current || 0, target: member.weeklyProgress?.tgs_registrations_target || 0 }, monthly: { current: member.monthlyProgress?.tgs_registrations_current || 0, target: member.monthlyProgress?.tgs_registrations_target || 0 } },
                        { key: 'bav_checks', label: 'bAV Checks', weekly: { current: member.weeklyProgress?.bav_checks_current || 0, target: member.weeklyProgress?.bav_checks_target || 0 }, monthly: { current: member.monthlyProgress?.bav_checks_current || 0, target: member.monthlyProgress?.bav_checks_target || 0 } }
                      ].map((metric) => {
                        const weeklyProgress = calculateProgressWithColorLocal(metric.weekly.current, metric.weekly.target);
                        const monthlyProgress = calculateProgressWithColorLocal(metric.monthly.current, metric.monthly.target);
                        return (
                          <div key={metric.key} className="p-3 bg-gray-50 rounded-lg">
                            <div className="text-sm font-medium mb-3 text-center">{metric.label}</div>
                            
                            {/* Weekly Progress */}
                            <div className="mb-4">
                              <div className="text-xs text-gray-600 mb-1">
                                <span className="font-medium">Woche:</span> {metric.weekly.current} / {metric.weekly.target}
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${weeklyProgress.color.replace('text-', 'bg-')}`}
                                  style={{ width: `${weeklyProgress.progress}%` }}
                                ></div>
                              </div>
                            </div>
                            
                            {/* Monthly Progress */}
                            <div>
                              <div className="text-xs text-gray-600 mb-1">
                                <span className="font-medium">Monat:</span> {metric.monthly.current} / {metric.monthly.target}
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${monthlyProgress.color.replace('text-', 'bg-')}`}
                                  style={{ width: `${monthlyProgress.progress}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  </CardContent>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Combined Weekly & Monthly Progress - 2 bars stacked per metric */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">📊 Team Wochenergebnis & Monatsergebnis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { key: 'fa', label: 'Finanzanalysen', weekly: { current: weeklyProgress?.fa_current || 0, target: weeklyProgress?.fa_target || 0 }, monthly: { current: monthlyProgress?.fa_current || 0, target: monthlyProgress?.fa_target || 0 } },
                { key: 'eh', label: 'EH', weekly: { current: weeklyProgress?.eh_current || 0, target: weeklyProgress?.eh_target || 0 }, monthly: { current: monthlyProgress?.eh_current || 0, target: monthlyProgress?.eh_target || 0 } },
                { key: 'new_appointments', label: 'Neue Termine', weekly: { current: weeklyProgress?.new_appointments_current || 0, target: weeklyProgress?.new_appointments_target || 0 }, monthly: { current: monthlyProgress?.new_appointments_current || 0, target: monthlyProgress?.new_appointments_target || 0 } },
                { key: 'recommendations', label: 'Empfehlungen', weekly: { current: weeklyProgress?.recommendations_current || 0, target: weeklyProgress?.recommendations_target || 0 }, monthly: { current: monthlyProgress?.recommendations_current || 0, target: monthlyProgress?.recommendations_target || 0 } },
                { key: 'tiv_invitations', label: 'TIV', weekly: { current: weeklyProgress?.tiv_invitations_current || 0, target: weeklyProgress?.tiv_invitations_target || 0 }, monthly: { current: monthlyProgress?.tiv_invitations_current || 0, target: monthlyProgress?.tiv_invitations_target || 0 } },
                { key: 'taa_invitations', label: 'TAA', weekly: { current: weeklyProgress?.taa_invitations_current || 0, target: weeklyProgress?.taa_invitations_target || 0 }, monthly: { current: monthlyProgress?.taa_invitations_current || 0, target: monthlyProgress?.taa_invitations_target || 0 } },
                { key: 'tgs_registrations', label: 'TGS', weekly: { current: weeklyProgress?.tgs_registrations_current || 0, target: weeklyProgress?.tgs_registrations_target || 0 }, monthly: { current: monthlyProgress?.tgs_registrations_current || 0, target: monthlyProgress?.tgs_registrations_target || 0 } },
                { key: 'bav_checks', label: 'bAV Checks', weekly: { current: weeklyProgress?.bav_checks_current || 0, target: weeklyProgress?.bav_checks_target || 0 }, monthly: { current: monthlyProgress?.bav_checks_current || 0, target: monthlyProgress?.bav_checks_target || 0 } }
              ].map((metric) => {
                const weeklyProgress = calculateProgressWithColorLocal(metric.weekly.current, metric.weekly.target);
                const monthlyProgress = calculateProgressWithColorLocal(metric.monthly.current, metric.monthly.target);
                return (
                  <div key={metric.key} className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium mb-3 text-center">{metric.label}</div>
                    
                    {/* Weekly Progress Bar */}
                    <div className="mb-2">
                      <div className="flex justify-between items-center mb-1">
                        <div className="text-xs text-gray-600">Woche</div>
                        <div className="text-xs text-gray-600">{metric.weekly.current} / {metric.weekly.target}</div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${weeklyProgress.color.replace('text-', 'bg-')}`}
                          style={{ width: `${weeklyProgress.progress}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Monthly Progress Bar */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <div className="text-xs text-gray-600">Monat</div>
                        <div className="text-xs text-gray-600">{metric.monthly.current} / {metric.monthly.target}</div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${monthlyProgress.color.replace('text-', 'bg-')}`}
                          style={{ width: `${monthlyProgress.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Die heutige Chance Button - Between weekly/monthly and team goals */}
        <div className="text-center py-8">
          <Button
            onClick={toggleTodayOpportunity}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-12 py-4 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 text-lg font-semibold"
            size="lg"
          >
            {showTodayOpportunity ? (
              <span className="flex items-center gap-3">
                <span>🎯</span>
                <span>Die heutige Chance verbergen</span>
              </span>
            ) : (
              <span className="flex items-center gap-3">
                <span>🎯</span>
                <span>Die heutige Chance</span>
              </span>
            )}
          </Button>
        </div>

        {/* All content below button - Only visible when opportunity is active */}
        {showTodayOpportunity && (
          <>
            {/* Team Gesamt Ziel Heute - Fixed card, always visible */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">🎯 Team Gesamt Ziel Heute</CardTitle>
          </CardHeader>
          <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { key: 'fa', label: 'Finanzanalysen', target: teamTotals?.today?.fa_target || 0 },
                { key: 'eh', label: 'EH', target: teamTotals?.today?.eh_target || 0 },
                { key: 'new_appointments', label: 'Neue Termine', target: teamTotals?.today?.new_appointments_target || 0 },
                { key: 'recommendations', label: 'Empfehlungen', target: teamTotals?.today?.recommendations_target || 0 },
                { key: 'tiv_invitations', label: 'TIV', target: teamTotals?.today?.tiv_invitations_target || 0 },
                { key: 'taa_invitations', label: 'TAA', target: teamTotals?.today?.taa_invitations_target || 0 },
                { key: 'tgs_registrations', label: 'TGS', target: teamTotals?.today?.tgs_registrations_target || 0 },
                { key: 'bav_checks', label: 'bAV Checks', target: teamTotals?.today?.bav_checks_target || 0 }
              ].map((metric) => {
                return (
                  <div key={metric.key} className="p-3 bg-gray-50 rounded-lg text-center">
                    <div className="text-sm font-medium mb-2">{metric.label}</div>
                    <div className="text-2xl font-bold text-blue-600">{metric.target}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Individual Member Today's Goals - Only show when opportunity is active */}
        {showTodayOpportunity && (
          <div className="space-y-6">
            {displayTeamMembers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Keine Daten für heute verfügbar.</p>
              </div>
            ) : (
              displayTeamMembers.map((member) => (
                <Card key={`today-${member.id}`} data-member-id={`today-${member.id}`} className="cursor-pointer hover:shadow-md transition-shadow duration-200" onClick={() => toggleMemberExpansion(`today-${member.id}`)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <CardTitle className="text-lg">{member.name?.split(' ')[0] || member.name}</CardTitle>
                          {member.isTrainee && (
                            <Badge variant="secondary" className="text-xs">Trainee</Badge>
                          )}
                          
                          {/* 2-zeilige Ziel Kacheln - Nur Ziel, mit Blau/Grau Hintergrund */}
                          <div className="grid grid-cols-8 gap-2 text-xs">
                            <div className={`text-center px-2 py-1 rounded-md shadow-sm border w-full ${(member.todayGoals?.fa_target || 0) > 0 ? 'bg-blue-100 border-blue-200' : 'bg-gray-100 border-gray-200'}`}>
                              <div className="font-medium text-gray-600 mb-1">FA</div>
                              <div className="font-bold text-gray-900 text-xs">
                                {member.todayGoals?.fa_target || 0}
                              </div>
                            </div>
                            <div className={`text-center px-2 py-1 rounded-md shadow-sm border w-full ${(member.todayGoals?.eh_target || 0) > 0 ? 'bg-blue-100 border-blue-200' : 'bg-gray-100 border-gray-200'}`}>
                              <div className="font-medium text-gray-600 mb-1">EH</div>
                              <div className="font-bold text-gray-900 text-xs">
                                {member.todayGoals?.eh_target || 0}
                              </div>
                            </div>
                            <div className={`text-center px-2 py-1 rounded-md shadow-sm border w-full ${(member.todayGoals?.new_appointments_target || 0) > 0 ? 'bg-blue-100 border-blue-200' : 'bg-gray-100 border-gray-200'}`}>
                              <div className="font-medium text-gray-600 mb-1">Ter</div>
                              <div className="font-bold text-gray-900 text-xs">
                                {member.todayGoals?.new_appointments_target || 0}
                              </div>
                            </div>
                            <div className={`text-center px-2 py-1 rounded-md shadow-sm border w-full ${(member.todayGoals?.recommendations_target || 0) > 0 ? 'bg-blue-100 border-blue-200' : 'bg-gray-100 border-gray-200'}`}>
                              <div className="font-medium text-gray-600 mb-1">Empf</div>
                              <div className="font-bold text-gray-900 text-xs">
                                {member.todayGoals?.recommendations_target || 0}
                              </div>
                            </div>
                            <div className={`text-center px-2 py-1 rounded-md shadow-sm border w-full ${(member.todayGoals?.tiv_invitations_target || 0) > 0 ? 'bg-blue-100 border-blue-200' : 'bg-gray-100 border-gray-200'}`}>
                              <div className="font-medium text-gray-600 mb-1">TIV</div>
                              <div className="font-bold text-gray-900 text-xs">
                                {member.todayGoals?.tiv_invitations_target || 0}
                              </div>
                            </div>
                            <div className={`text-center px-2 py-1 rounded-md shadow-sm border w-full ${(member.todayGoals?.taa_invitations_target || 0) > 0 ? 'bg-blue-100 border-blue-200' : 'bg-gray-100 border-gray-200'}`}>
                              <div className="font-medium text-gray-600 mb-1">TAA</div>
                              <div className="font-bold text-gray-900 text-xs">
                                {member.todayGoals?.taa_invitations_target || 0}
                              </div>
                            </div>
                            <div className={`text-center px-2 py-1 rounded-md shadow-sm border w-full ${(member.todayGoals?.tgs_registrations_target || 0) > 0 ? 'bg-blue-100 border-blue-200' : 'bg-gray-100 border-gray-200'}`}>
                              <div className="font-medium text-gray-600 mb-1">TGS</div>
                              <div className="font-bold text-gray-900 text-xs">
                                {member.todayGoals?.tgs_registrations_target || 0}
                              </div>
                            </div>
                            <div className={`text-center px-2 py-1 rounded-md shadow-sm border w-full ${(member.todayGoals?.bav_checks_target || 0) > 0 ? 'bg-blue-100 border-blue-200' : 'bg-gray-100 border-gray-200'}`}>
                              <div className="font-medium text-gray-600 mb-1">bAV</div>
                              <div className="font-bold text-gray-900 text-xs">
                                {member.todayGoals?.bav_checks_target || 0}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-400 ml-2">
                        {expandedMembers.has(`today-${member.id}`) ? '▼' : '▶'}
                      </div>
                    </div>
                  </CardHeader>
                  
                  {/* Aufklappbarer Inhalt - Alle Beraterseite Inhalte */}
                  <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    expandedMembers.has(`today-${member.id}`) ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    <CardContent className="space-y-6">
                      {/* Große Kacheln - Nur beim Aufklappen sichtbar */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Zielzahlen für heute</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-sm">
                          <div className={`text-center px-2 py-3 rounded-lg shadow-sm border ${(member.todayGoals?.fa_target || 0) > 0 ? 'bg-blue-100 border-blue-200' : 'bg-gray-100 border-gray-200'}`}>
                            <div className="font-medium text-gray-600 mb-1 text-xs sm:text-sm">FA</div>
                            <div className="font-bold text-gray-900 text-sm sm:text-lg">
                              {member.todayGoals?.fa_target || 0}
                            </div>
                          </div>
                          <div className={`text-center px-2 py-3 rounded-lg shadow-sm border col-span-1 sm:col-span-1 ${(member.todayGoals?.eh_target || 0) > 0 ? 'bg-blue-100 border-blue-200' : 'bg-gray-100 border-gray-200'}`}>
                            <div className="font-medium text-gray-600 mb-1 text-xs sm:text-sm">EH</div>
                            <div className="font-bold text-gray-900 text-xs sm:text-lg break-all">
                              {member.todayGoals?.eh_target || 0}
                            </div>
                          </div>
                          <div className={`text-center px-2 py-3 rounded-lg shadow-sm border col-span-1 sm:col-span-1 ${(member.todayGoals?.new_appointments_target || 0) > 0 ? 'bg-blue-100 border-blue-200' : 'bg-gray-100 border-gray-200'}`}>
                            <div className="font-medium text-gray-600 mb-1 text-xs sm:text-sm leading-tight">Neue<br className="sm:hidden"/>Termine</div>
                            <div className="font-bold text-gray-900 text-sm sm:text-lg">
                              {member.todayGoals?.new_appointments_target || 0}
                            </div>
                          </div>
                          <div className={`text-center px-2 py-3 rounded-lg shadow-sm border col-span-1 sm:col-span-1 ${(member.todayGoals?.recommendations_target || 0) > 0 ? 'bg-blue-100 border-blue-200' : 'bg-gray-100 border-gray-200'}`}>
                            <div className="font-medium text-gray-600 mb-1 text-xs sm:text-sm">Empfehlungen</div>
                            <div className="font-bold text-gray-900 text-sm sm:text-lg">
                              {member.todayGoals?.recommendations_target || 0}
                            </div>
                          </div>
                          <div className={`text-center px-2 py-3 rounded-lg shadow-sm border col-span-1 sm:col-span-1 ${(member.todayGoals?.tiv_invitations_target || 0) > 0 ? 'bg-blue-100 border-blue-200' : 'bg-gray-100 border-gray-200'}`}>
                            <div className="font-medium text-gray-600 mb-1 text-xs sm:text-sm">TIV</div>
                            <div className="font-bold text-gray-900 text-sm sm:text-lg">
                              {member.todayGoals?.tiv_invitations_target || 0}
                            </div>
                          </div>
                          <div className={`text-center px-2 py-3 rounded-lg shadow-sm border col-span-1 sm:col-span-1 ${(member.todayGoals?.taa_invitations_target || 0) > 0 ? 'bg-blue-100 border-blue-200' : 'bg-gray-100 border-gray-200'}`}>
                            <div className="font-medium text-gray-600 mb-1 text-xs sm:text-sm">TAA</div>
                            <div className="font-bold text-gray-900 text-sm sm:text-lg">
                              {member.todayGoals?.taa_invitations_target || 0}
                            </div>
                          </div>
                          <div className={`text-center px-3 py-4 rounded-lg shadow-sm border ${(member.todayGoals?.tgs_registrations_target || 0) > 0 ? 'bg-blue-100 border-blue-200' : 'bg-gray-100 border-gray-200'}`}>
                            <div className="font-medium text-gray-600 mb-2">TGS</div>
                            <div className="font-bold text-gray-900 text-lg">
                              {member.todayGoals?.tgs_registrations_target || 0}
                            </div>
                          </div>
                          <div className={`text-center px-3 py-4 rounded-lg shadow-sm border ${(member.todayGoals?.bav_checks_target || 0) > 0 ? 'bg-blue-100 border-blue-200' : 'bg-gray-100 border-gray-200'}`}>
                            <div className="font-medium text-gray-600 mb-2">bAV</div>
                            <div className="font-bold text-gray-900 text-lg">
                              {member.todayGoals?.bav_checks_target || 0}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Today's Todos - Only show planned todos, no checkboxes */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">ToDos für heute:</h4>
                        <div className="space-y-2">
                          {member.todayTodos?.filter((todo: string) => todo && todo.trim() !== '').map((todo: string, index: number) => (
                            <div key={index} className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                              <p className="text-sm text-gray-900 break-words leading-relaxed">
                                {todo}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Today's Answers - Alle Fragen von der Beraterseite */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Heutiger Tag</h4>
                        {console.log('DEBUG - getTodayQuestions result:', getTodayQuestions(member))}
                        {console.log('DEBUG - member.todayWeekdayAnswers:', member.todayWeekdayAnswers)}
                        <div className="space-y-3">
                          {getTodayQuestions(member).map((qa, index) => (
                            <div key={index} className="bg-blue-50 p-3 rounded-lg">
                              <p className="text-sm font-medium text-gray-700 mb-1">{qa.q}</p>
                              <p className="text-sm text-gray-900">{qa.a}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                    </CardContent>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Team Focus Areas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">🎯 Team Fokus heute</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Was wird heute trainiert?
                </label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  value={todayFocus.training}
                  onChange={(e) => setTodayFocus(prev => ({ ...prev, training: e.target.value }))}
                  placeholder="Trainingsthema eingeben..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wann ist Telefonparty?
                </label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  value={todayFocus.phoneParty}
                  onChange={(e) => setTodayFocus(prev => ({ ...prev, phoneParty: e.target.value }))}
                  placeholder="Zeit eingeben..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verantwortlich für Training
                </label>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={todayFocus.trainingResponsible}
                  onChange={(e) => setTodayFocus(prev => ({ ...prev, trainingResponsible: e.target.value }))}
                >
                  <option value="">Bitte auswählen...</option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.name}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verantwortlich für Telefonparty
                </label>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={todayFocus.phonePartyResponsible}
                  onChange={(e) => setTodayFocus(prev => ({ ...prev, phonePartyResponsible: e.target.value }))}
                >
                  <option value="">Bitte auswählen...</option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.name}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Speichern Button */}
            <div className="text-center pt-4">
              <Button 
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-base"
              >
                Fertig
              </Button>
            </div>
          </CardContent>
        </Card>

          </>
        )}
      </div>
    </div>
  );
}