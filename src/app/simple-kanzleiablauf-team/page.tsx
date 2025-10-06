'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@clerk/nextjs';
import { 
  calculateProgressWithColor
} from '@/lib/weekday-logic';
import dynamic from 'next/dynamic';

// Lazy load AdminSection for better performance
const AdminSection = dynamic(() => import('@/components/AdminSection'), {
  loading: () => <div className="animate-pulse bg-gray-200 h-32 rounded"></div>,
  ssr: false
});

interface TeamMember {
  id: string;
  name: string;
  firstName?: string;
  role: string;
  teamName?: string;
  team_name?: string;
  isTrainee?: boolean;
  isTeamLeader?: boolean;
  yesterdayResults?: {
    fa_actual: number;
    eh_actual: number;
    new_appointments_actual: number;
    recommendations_actual: number;
    tiv_invitations_actual: number;
    taa_invitations_actual: number;
    tgs_registrations_actual: number;
    bav_checks_actual: number;
    todos?: string[];
    todos_completed?: boolean[];
    mood_feedback?: string;
    // Fragen-Antworten von gestern
    highlight_yesterday?: string;
    appointments_next_week?: number;
    improvement_today?: string;
    weekly_improvement?: string;
    charisma_training?: boolean;
  };
  yesterdayGoals?: {
    fa_daily_target: number;
    eh_daily_target: number;
    new_appointments_daily_target: number;
    recommendations_daily_target: number;
    tiv_invitations_daily_target: number;
    taa_invitations_daily_target: number;
    tgs_registrations_daily_target: number;
    bav_checks_daily_target: number;
  };
  todayGoals?: {
    fa_daily_target: number;
    eh_daily_target: number;
    new_appointments_daily_target: number;
    recommendations_daily_target: number;
    tiv_invitations_daily_target: number;
    taa_invitations_daily_target: number;
    tgs_registrations_daily_target: number;
    bav_checks_daily_target: number;
  };
  todayTodos?: string[];
  // Fragen für heute
  todayQuestions?: string[];
  todayAnswers?: {
    help_needed?: string;
    training_focus?: string;
    improvement_today?: string;
    weekday_answers?: any;
    question_0?: string;
    question_1?: string;
    question_2?: string;
    question_3?: string;
  };
  weeklyProgress?: {
    fa_weekly_target: number;
    fa_actual: number;
    eh_weekly_target: number;
    eh_actual: number;
    new_appointments_weekly_target: number;
    new_appointments_actual: number;
    recommendations_weekly_target: number;
    recommendations_actual: number;
    tiv_invitations_weekly_target: number;
    tiv_invitations_actual: number;
    bav_checks_weekly_target: number;
    bav_checks_actual: number;
    taa_invitations_weekly_target: number;
    taa_invitations_actual: number;
    tgs_registrations_weekly_target: number;
    tgs_registrations_actual: number;
  };
  monthlyProgress?: {
    fa_monthly_target: number;
    fa_actual: number;
    eh_monthly_target: number;
    eh_actual: number;
    new_appointments_monthly_target: number;
    new_appointments_actual: number;
    recommendations_monthly_target: number;
    recommendations_actual: number;
    tiv_invitations_monthly_target: number;
    tiv_invitations_actual: number;
    bav_checks_monthly_target: number;
    bav_checks_actual: number;
    taa_invitations_monthly_target: number;
    taa_invitations_actual: number;
    tgs_registrations_monthly_target: number;
    tgs_registrations_actual: number;
  };
}

interface SubteamData {
  teamLeader: {
    id: string;
    name: string;
    role: string;
    team_id: string;
    team_name: string;
  };
  members: any[];
  isSubteam: boolean;
}

interface TeamData {
  teamMembers: TeamMember[];
  currentUser?: any;
  subteams: SubteamData[];
  teamGoals: {
    fa: number;
    eh: number;
    newAppointments: number;
    recommendations: number;
    tivInvitations: number;
    bavChecks: number;
    taaInvitations: number;
    tgsRegistrations: number;
  };
  teamTotals: {
    fa_monthly_target: number;
    fa_actual: number;
    eh_monthly_target: number;
    eh_actual: number;
    new_appointments_monthly_target: number;
    new_appointments_actual: number;
    recommendations_monthly_target: number;
    recommendations_actual: number;
    tiv_invitations_monthly_target: number;
    tiv_invitations_actual: number;
    bav_checks_monthly_target: number;
    bav_checks_actual: number;
    taa_invitations_monthly_target: number;
    taa_invitations_actual: number;
    tgs_registrations_monthly_target: number;
    tgs_registrations_actual: number;
  };
  teamTodayGoals: {
    fa_daily_target: number;
    eh_daily_target: number;
    new_appointments_daily_target: number;
    recommendations_daily_target: number;
    tiv_invitations_daily_target: number;
    bav_checks_daily_target: number;
    taa_invitations_daily_target: number;
    tgs_registrations_daily_target: number;
  };
  teamWeeklyProgress: {
    fa_weekly_target: number;
    fa_actual: number;
    eh_weekly_target: number;
    eh_actual: number;
    new_appointments_weekly_target: number;
    new_appointments_actual: number;
    recommendations_weekly_target: number;
    recommendations_actual: number;
    tiv_invitations_weekly_target: number;
    tiv_invitations_actual: number;
    bav_checks_weekly_target: number;
    bav_checks_actual: number;
    taa_invitations_weekly_target: number;
    taa_invitations_actual: number;
    tgs_registrations_weekly_target: number;
    tgs_registrations_actual: number;
  };
  teamMonthlyProgress: {
    fa_monthly_target: number;
    fa_actual: number;
    eh_monthly_target: number;
    eh_actual: number;
    new_appointments_monthly_target: number;
    new_appointments_actual: number;
    recommendations_monthly_target: number;
    recommendations_actual: number;
    tiv_invitations_monthly_target: number;
    tiv_invitations_actual: number;
    bav_checks_monthly_target: number;
    bav_checks_actual: number;
    taa_invitations_monthly_target: number;
    taa_invitations_actual: number;
    tgs_registrations_monthly_target: number;
    tgs_registrations_actual: number;
  };
  teamYesterdayResults: {
    fa_actual: number;
    eh_actual: number;
    new_appointments_actual: number;
    recommendations_actual: number;
    tiv_invitations_actual: number;
    bav_checks_actual: number;
    taa_invitations_actual: number;
    tgs_registrations_actual: number;
  };
  teamQuestionsToday: any;
  teamAnswersToday: any;
  teamFocusToday: any;
  teamTodosToday: any;
  weeklyProgress?: {
    fa_weekly_target: number;
    fa_actual: number;
    eh_weekly_target: number;
    eh_actual: number;
    new_appointments_weekly_target: number;
    new_appointments_actual: number;
    recommendations_weekly_target: number;
    recommendations_actual: number;
    tiv_invitations_weekly_target: number;
    tiv_invitations_actual: number;
    bav_checks_weekly_target: number;
    bav_checks_actual: number;
    taa_invitations_weekly_target: number;
    taa_invitations_actual: number;
    tgs_registrations_weekly_target: number;
    tgs_registrations_actual: number;
  };
  monthlyProgress?: {
    fa_monthly_target: number;
    fa_actual: number;
    eh_monthly_target: number;
    eh_actual: number;
    new_appointments_monthly_target: number;
    new_appointments_actual: number;
    recommendations_monthly_target: number;
    recommendations_actual: number;
    tiv_invitations_monthly_target: number;
    tiv_invitations_actual: number;
    bav_checks_monthly_target: number;
    bav_checks_actual: number;
    taa_invitations_monthly_target: number;
    taa_invitations_actual: number;
    tgs_registrations_monthly_target: number;
    tgs_registrations_actual: number;
  };
}

export default function SimpleKanzleiablaufTeamPage() {
  const { user, isLoaded } = useUser();
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [activeView, setActiveView] = useState<string>('');
  const [showTodayOpportunity, setShowTodayOpportunity] = useState(false);
  const [todayFocus, setTodayFocus] = useState({
    training: "",
    phoneParty: "",
    trainingResponsible: "",
    phonePartyResponsible: ""
  });
  const [moodFeedback, setMoodFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [weekdayQuestions, setWeekdayQuestions] = useState<any>(null);
  const [availableTeamViews, setAvailableTeamViews] = useState<any[]>([]);
  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set());

  // Get current weekday (1=Monday, 7=Sunday)
  const currentWeekday = new Date().getDay() || 7;

  // Metriken-Definition (einmal definiert, überall verwendet)
  const metrics = [
    { key: 'fa', label: 'FA', fullLabel: 'Finanzanalysen' },
    { key: 'eh', label: 'EH', fullLabel: 'EH' },
    { key: 'new_appointments', label: 'Ter', fullLabel: 'Neue Termine' },
    { key: 'recommendations', label: 'Empf', fullLabel: 'Empfehlungen' },
    { key: 'tiv_invitations', label: 'TIV', fullLabel: 'TIV' },
    { key: 'taa_invitations', label: 'TAA', fullLabel: 'TAA' },
    { key: 'tgs_registrations', label: 'TGS', fullLabel: 'TGS' },
    { key: 'bav_checks', label: 'bAV', fullLabel: 'bAV Checks' }
  ];

  // Transform Dashboard Data to Team Data Format
  const transformDashboardDataToTeamData = (dashboardData: any): TeamData => {
    // Map teamMembers to include teamName from team_name
    const mappedTeamMembers = (dashboardData.teamMembers || []).map((member: any) => ({
      ...member,
      teamName: member.team_name || member.teamName
    }));
    
    
    return {
      teamMembers: mappedTeamMembers,
      currentUser: dashboardData.currentUser,
      subteams: dashboardData.subteams || [],
      teamGoals: dashboardData.teamGoals || {
        fa: 0,
        eh: 0,
        newAppointments: 0,
        recommendations: 0,
        tivInvitations: 0,
        bavChecks: 0,
        taaInvitations: 0,
        tgsRegistrations: 0,
      },
      teamTotals: dashboardData.teamTotals || {
        fa_daily_target: 0,
        fa_actual: 0,
        eh_daily_target: 0,
        eh_actual: 0,
        new_appointments_daily_target: 0,
        new_appointments_actual: 0,
        recommendations_daily_target: 0,
        recommendations_actual: 0,
        tiv_invitations_daily_target: 0,
        tiv_invitations_actual: 0,
        bav_checks_daily_target: 0,
        bav_checks_actual: 0,
        taa_invitations_daily_target: 0,
        taa_invitations_actual: 0,
        tgs_registrations_daily_target: 0,
        tgs_registrations_actual: 0,
      },
      teamTodayGoals: dashboardData.teamTodayGoals || {
        fa_daily_target: 0,
        eh_daily_target: 0,
        new_appointments_daily_target: 0,
        recommendations_daily_target: 0,
        tiv_invitations_daily_target: 0,
        bav_checks_daily_target: 0,
        taa_invitations_daily_target: 0,
        tgs_registrations_daily_target: 0,
      },
      teamWeeklyProgress: dashboardData.teamWeeklyProgress || {
        fa_weekly_target: 0,
        fa_actual: 0,
        eh_weekly_target: 0,
        eh_actual: 0,
        new_appointments_weekly_target: 0,
        new_appointments_actual: 0,
        recommendations_weekly_target: 0,
        recommendations_actual: 0,
        tiv_invitations_weekly_target: 0,
        tiv_invitations_actual: 0,
        bav_checks_weekly_target: 0,
        bav_checks_actual: 0,
        taa_invitations_weekly_target: 0,
        taa_invitations_actual: 0,
        tgs_registrations_weekly_target: 0,
        tgs_registrations_actual: 0,
      },
      teamMonthlyProgress: dashboardData.teamMonthlyProgress || {
        fa_monthly_target: 0,
        fa_actual: 0,
        eh_monthly_target: 0,
        eh_actual: 0,
        new_appointments_monthly_target: 0,
        new_appointments_actual: 0,
        recommendations_monthly_target: 0,
        recommendations_actual: 0,
        tiv_invitations_monthly_target: 0,
        tiv_invitations_actual: 0,
        bav_checks_monthly_target: 0,
        bav_checks_actual: 0,
        taa_invitations_monthly_target: 0,
        taa_invitations_actual: 0,
        tgs_registrations_monthly_target: 0,
        tgs_registrations_actual: 0,
      },
      teamYesterdayResults: {
        fa_actual: 0,
        eh_actual: 0,
        new_appointments_actual: 0,
        recommendations_actual: 0,
        tiv_invitations_actual: 0,
        bav_checks_actual: 0,
        taa_invitations_actual: 0,
        tgs_registrations_actual: 0,
      },
      teamQuestionsToday: {},
      teamAnswersToday: {},
      teamFocusToday: {},
      teamTodosToday: {},
      weeklyProgress: dashboardData.teamWeeklyProgress || {
        fa_weekly_target: 0,
        fa_actual: 0,
        eh_weekly_target: 0,
        eh_actual: 0,
        new_appointments_weekly_target: 0,
        new_appointments_actual: 0,
        recommendations_weekly_target: 0,
        recommendations_actual: 0,
        tiv_invitations_weekly_target: 0,
        tiv_invitations_actual: 0,
        bav_checks_weekly_target: 0,
        bav_checks_actual: 0,
        taa_invitations_weekly_target: 0,
        taa_invitations_actual: 0,
        tgs_registrations_weekly_target: 0,
        tgs_registrations_actual: 0,
      },
      monthlyProgress: dashboardData.teamMonthlyProgress || {
        fa_monthly_target: 0,
        fa_actual: 0,
        eh_monthly_target: 0,
        eh_actual: 0,
        new_appointments_monthly_target: 0,
        new_appointments_actual: 0,
        recommendations_monthly_target: 0,
        recommendations_actual: 0,
        tiv_invitations_monthly_target: 0,
        tiv_invitations_actual: 0,
        bav_checks_monthly_target: 0,
        bav_checks_actual: 0,
        taa_invitations_monthly_target: 0,
        taa_invitations_actual: 0,
        tgs_registrations_monthly_target: 0,
        tgs_registrations_actual: 0,
      },
    };
  };

  // Hilfsfunktion für Progress-Berechnung
  const getProgress = (achieved: number, target: number) => {
    if (!target || target === 0) return { progress: 0, color: 'text-gray-500' };
    const result = calculateProgressWithColor(achieved, target);
    return {
      progress: Math.round(result.progress),
      color: result.color.replace('bg-', 'text-')
    };
  };

  // Team View Navigation - äußerer Rahmen
  const teamViews = (() => {
    const isAdmin = teamData?.currentUser?.role === 'admin';
    const currentUserTeam = teamData?.currentUser?.team_name;
    
    if (isAdmin) {
      // Admins sehen alle Teams
      return [
        { id: 'current-user', label: '👤 Meine Ansicht', description: '' },
        ...availableTeamViews.map(teamView => ({
          id: teamView.id,
          label: `👥 ${teamView.name}`,
          description: ''
        }))
      ];
    } else {
      // Nicht-Admins sehen nur ihren eigenen Team-Tab
      const ownTeamView = availableTeamViews.find(teamView => 
        teamView.name === currentUserTeam || teamView.id === currentUserTeam
      );
      
      if (ownTeamView) {
        return [{
          id: ownTeamView.id,
          label: `👥 ${ownTeamView.name}`,
          description: ''
        }];
      } else {
        // Fallback: Zeige "Meine Ansicht" wenn kein Team gefunden
        return [{
          id: 'current-user',
          label: '👤 Meine Ansicht',
          description: 'Aktuelle Team-Ansicht'
        }];
      }
    }
  })();

  // Load Team Data (nur einmal beim ersten Laden)
  const loadTeamData = async () => {
    try {
      const response = await fetch('/api/dashboard-data');
      const data = await response.json();
      
      if (data.success) {
        // Transform dashboard data to team data format
        const transformedData = transformDashboardDataToTeamData(data.data);
        setTeamData(transformedData);
        
        // Set available team views
        if (data.data.availableTeamViews) {
          setAvailableTeamViews(data.data.availableTeamViews);
          // Set first team as active view (not current-user) - nur beim ersten Laden
          if (data.data.availableTeamViews.length > 0 && activeView === '') {
            setActiveView(data.data.availableTeamViews[0].id);
          }
        }
      }
    } catch (error) {
      console.error('Error loading team data:', error);
    } finally {
      setLoading(false);
    }
  };


  // Filter team data by selected team
  const getFilteredTeamData = (selectedTeam?: string) => {
    if (!teamData || !selectedTeam) {
      return teamData;
    }

    // NEU: "Meine Ansicht" - Alle Mitglieder ohne Filter
    if (selectedTeam === 'current-user') {
      return {
        ...teamData,
        teamMembers: teamData.teamMembers || [],
        subteams: teamData.subteams || []
      };
    }

    // Filter subteams basierend auf ausgewähltem Team
    let filteredSubteams = [];
    
    if (selectedTeam === 'Gamechanger') {
      // Gamechanger: Alle Subteams anzeigen
      filteredSubteams = teamData.subteams || [];
    } else {
      // Andere Teams: Filtere Subteams basierend auf team_name
      filteredSubteams = teamData.subteams?.filter(subteam => 
        subteam.teamLeader.team_name === selectedTeam
      ) || [];
      
    }
    
    // Intelligente Filterung basierend auf ausgewähltem Team
    let filteredDirectUsers = [];
    
    if (selectedTeam === 'Gamechanger') {
      // Gamechanger: Alle Teams anzeigen (Admin-View)
      filteredDirectUsers = teamData.teamMembers || [];
    } else {
      // Andere Teams: Filtere Team-Mitglieder basierend auf team_name + Subteams
      const selectedTeamMembers = teamData.teamMembers?.filter(member => {
        const memberTeamName = member.teamName;
        return memberTeamName === selectedTeam;
      }) || [];
      
      // Finde alle Subteams des ausgewählten Teams
      const selectedTeamSubteams = teamData.subteams?.filter(subteam => 
        subteam.teamLeader.team_name === selectedTeam
      ) || [];
      
      // Sammle alle Mitglieder der Subteams
      const subteamMembers = selectedTeamSubteams.flatMap(subteam => subteam.members || []);
      
      // Kombiniere Team-Mitglieder + Subteam-Mitglieder
      const allMembers = [...selectedTeamMembers, ...subteamMembers];
      const uniqueMembers = allMembers.filter((member, index, self) => 
        index === self.findIndex(m => m.id === member.id)
      );
      
      filteredDirectUsers = uniqueMembers;
    }
    
    // EINFACHE LOGIK: Wenn currentUser das ausgewählte Team hat, verwende ihn direkt
    let currentUserAsLeader: any = null;
    
    if (teamData.currentUser?.team_name === selectedTeam) {
      // Finde currentUser in teamMembers um die daily entry Daten zu bekommen
      const currentUserInTeamMembers = teamData.teamMembers?.find(member => member.id === teamData.currentUser?.id);
      
      currentUserAsLeader = {
        ...teamData.currentUser,
        ...currentUserInTeamMembers, // WICHTIG: daily entry Daten aus teamMembers übernehmen
        teamName: selectedTeam,
        isTeamLeader: true,
        isCurrentUser: true
      };
    } else {
      // Wenn currentUser nicht das ausgewählte Team hat, finde den Team-Leader für das ausgewählte Team
      const teamLeader = teamData.teamMembers?.find(member => 
        member.teamName === selectedTeam && (member as any).isTeamLeader
      );
      
      if (teamLeader) {
        currentUserAsLeader = {
          ...teamLeader,
          teamName: selectedTeam,
          isTeamLeader: true,
          isCurrentUser: false
        };
      }
    }
    

    // Strukturierte Anzeige: Team-Leader und deren Subteam-Mitglieder
    const teamLeaderAsMembers = filteredSubteams.flatMap(subteam => {
      const leader = {
        ...subteam.teamLeader,
        teamName: subteam.teamLeader.team_name,
        isTeamLeader: true,
        subteamMembers: subteam.members,
        isSubteamLeader: true
      };
      
      // Subteam-Mitglieder auch als separate teamMembers anzeigen (aber nicht den Team-Leader selbst)
      const members = subteam.members?.filter(member => member.id !== subteam.teamLeader.id).map(member => {
        // Finde die vollständigen Member-Daten aus teamData.teamMembers
        const fullMemberData = teamData.teamMembers?.find(tm => tm.id === member.id);
        return {
          ...member,
          ...fullMemberData, // Vollständige Daten inkl. weeklyProgress, monthlyProgress
          teamName: subteam.teamLeader.team_name,
          isTeamLeader: false,
          isSubteamMember: true,
          teamLeaderName: subteam.teamLeader.name
        };
      }) || [];
      
      return [leader, ...members];
    });
    
    
    // Haupt-Team-Leader hinzufügen (falls vorhanden und noch nicht in Subteams)
    const mainTeamLeader = filteredDirectUsers.find(member => 
      (member.teamName || member.team_name) === selectedTeam && 
      (member as any).isTeamLeader
    );
    
    if (mainTeamLeader && !teamLeaderAsMembers.find(member => member.id === mainTeamLeader.id)) {
      teamLeaderAsMembers.unshift({
        ...mainTeamLeader,
        teamName: selectedTeam,
        isTeamLeader: true,
        isMainTeamLeader: true
      });
    }

    // Direkte Mitarbeiter hinzufügen (Duplikate vermeiden)
    const allTeamMembers = [...teamLeaderAsMembers];
    const processedIds = new Set(teamLeaderAsMembers.map(member => member.id));
    
    // Alle gefilterten Mitglieder hinzufügen, die noch nicht in teamLeaderAsMembers sind
    for (const directUser of filteredDirectUsers) {
      if (!processedIds.has(directUser.id)) {
        allTeamMembers.push({
          ...directUser,
          teamName: directUser.teamName || directUser.team_name,
          isTeamLeader: false,
          isDirectMember: true
        });
        processedIds.add(directUser.id);
      }
    }
    
    
    // Current user als Team-Leader hinzufügen (falls zutreffend und noch nicht vorhanden)
    if (currentUserAsLeader) {
      const isAlreadyIncluded = allTeamMembers.some(member => member.id === currentUserAsLeader.id);
      
      if (!isAlreadyIncluded) {
        allTeamMembers.unshift(currentUserAsLeader);
      } else {
        // Update existing member to be team leader
        const existingIndex = allTeamMembers.findIndex(member => member.id === currentUserAsLeader.id);
        if (existingIndex !== -1) {
          allTeamMembers[existingIndex] = {
            ...allTeamMembers[existingIndex],
            ...currentUserAsLeader, // WICHTIG: Alle Daten von currentUserAsLeader übernehmen
            isTeamLeader: true,
            isCurrentUser: true
          };
        }
      }
    }

    
    // VEREINFACHTE LÖSUNG: Verwende direkt die gefilterten User
    const finalTeamMembers = filteredDirectUsers.map(member => {
      // Finde die vollständigen Member-Daten aus teamData.teamMembers
      const fullMemberData = teamData.teamMembers?.find(tm => tm.id === member.id);
      
      // Wenn keine vollständigen Daten gefunden werden, verwende die Basis-Daten
      if (!fullMemberData) {
        return {
          ...member,
          teamName: member.teamName || member.team_name,
          isTeamLeader: false,
          isDirectMember: true,
          // Füge leere Daten hinzu, damit die UI nicht crasht
          todayGoals: {},
          todayActuals: {},
          yesterdayResults: {},
          yesterdayGoals: {},
          todayAnswers: {},
          todayTodos: [],
          weeklyProgress: {},
          monthlyProgress: {}
        };
      }
      
      return {
        ...member,
        ...fullMemberData, // Vollständige Daten inkl. weeklyProgress, monthlyProgress
        teamName: member.teamName || member.team_name,
        isTeamLeader: false,
        isDirectMember: true
      };
    });
    
    
    // Calculate team-specific goals and progress
    const filteredTeamTodayGoals = calculateTeamTodayGoals(finalTeamMembers);
    const filteredTeamWeeklyProgress = calculateTeamWeeklyProgress(finalTeamMembers);
    const filteredTeamMonthlyProgress = calculateTeamMonthlyProgress(finalTeamMembers);
    
    // Calculate team-specific yesterday results
    const filteredTeamYesterdayResults = calculateTeamYesterdayResults(finalTeamMembers);
    
    // Calculate team-specific questions and answers
    const filteredTeamQuestionsToday = calculateTeamQuestionsToday(finalTeamMembers);
    const filteredTeamAnswersToday = calculateTeamAnswersToday(finalTeamMembers);
    
    // Calculate team-specific focus and todos
    const filteredTeamFocusToday = calculateTeamFocusToday(finalTeamMembers);
    const filteredTeamTodosToday = calculateTeamTodosToday(finalTeamMembers);

    return {
      ...teamData,
      teamMembers: finalTeamMembers,
      subteams: filteredSubteams,
      teamTodayGoals: filteredTeamTodayGoals,
      teamWeeklyProgress: filteredTeamWeeklyProgress,
      teamMonthlyProgress: filteredTeamMonthlyProgress,
      teamYesterdayResults: filteredTeamYesterdayResults,
      teamQuestionsToday: filteredTeamQuestionsToday,
      teamAnswersToday: filteredTeamAnswersToday,
      teamFocusToday: filteredTeamFocusToday,
      teamTodosToday: filteredTeamTodosToday
    };
  };

  // Helper functions to calculate team-specific data (moved before usage)
  const calculateTeamTodayGoals = (members: any[]) => {
    const goals = {
      fa_daily_target: 0,
      eh_daily_target: 0,
      new_appointments_daily_target: 0,
      recommendations_daily_target: 0,
      tiv_invitations_daily_target: 0,
      bav_checks_daily_target: 0,
      taa_invitations_daily_target: 0,
      tgs_registrations_daily_target: 0
    };

    members.forEach(member => {
      // Verwende yesterdayGoals für konsistente Anzeige mit der Tabelle
      if (member.yesterdayGoals) {
        goals.fa_daily_target += member.yesterdayGoals.fa_daily_target || 0;
        goals.eh_daily_target += member.yesterdayGoals.eh_daily_target || 0;
        goals.new_appointments_daily_target += member.yesterdayGoals.new_appointments_daily_target || 0;
        goals.recommendations_daily_target += member.yesterdayGoals.recommendations_daily_target || 0;
        goals.tiv_invitations_daily_target += member.yesterdayGoals.tiv_invitations_daily_target || 0;
        goals.bav_checks_daily_target += member.yesterdayGoals.bav_checks_daily_target || 0;
        goals.taa_invitations_daily_target += member.yesterdayGoals.taa_invitations_daily_target || 0;
        goals.tgs_registrations_daily_target += member.yesterdayGoals.tgs_registrations_daily_target || 0;
      }
    });

    return goals;
  };

  const calculateTeamWeeklyProgress = (members: any[]) => {
    const progress = {
      fa_weekly_target: 0,
      fa_actual: 0,
      eh_weekly_target: 0,
      eh_actual: 0,
      new_appointments_weekly_target: 0,
      new_appointments_actual: 0,
      recommendations_weekly_target: 0,
      recommendations_actual: 0,
      tiv_invitations_weekly_target: 0,
      tiv_invitations_actual: 0,
      bav_checks_weekly_target: 0,
      bav_checks_actual: 0,
      taa_invitations_weekly_target: 0,
      taa_invitations_actual: 0,
      tgs_registrations_weekly_target: 0,
      tgs_registrations_actual: 0
    };

    members.forEach(member => {
      if (member.weeklyProgress) {
        // Weekly Targets (kumuliert)
        progress.fa_weekly_target += member.weeklyProgress.fa_weekly_target || 0;
        progress.eh_weekly_target += member.weeklyProgress.eh_weekly_target || 0;
        progress.new_appointments_weekly_target += member.weeklyProgress.new_appointments_weekly_target || 0;
        progress.recommendations_weekly_target += member.weeklyProgress.recommendations_weekly_target || 0;
        progress.tiv_invitations_weekly_target += member.weeklyProgress.tiv_invitations_weekly_target || 0;
        progress.bav_checks_weekly_target += member.weeklyProgress.bav_checks_weekly_target || 0;
        progress.taa_invitations_weekly_target += member.weeklyProgress.taa_invitations_weekly_target || 0;
        progress.tgs_registrations_weekly_target += member.weeklyProgress.tgs_registrations_weekly_target || 0;
        
        // Weekly Actuals (nur heute's Ist-Werte, nicht kumuliert)
        progress.fa_actual += member.yesterdayResults?.fa_actual || 0;
        progress.eh_actual += member.yesterdayResults?.eh_actual || 0;
        progress.new_appointments_actual += member.yesterdayResults?.new_appointments_actual || 0;
        progress.recommendations_actual += member.yesterdayResults?.recommendations_actual || 0;
        progress.tiv_invitations_actual += member.yesterdayResults?.tiv_invitations_actual || 0;
        progress.bav_checks_actual += member.yesterdayResults?.bav_checks_actual || 0;
        progress.taa_invitations_actual += member.yesterdayResults?.taa_invitations_actual || 0;
        progress.tgs_registrations_actual += member.yesterdayResults?.tgs_registrations_actual || 0;
      }
    });

    return progress;
  };

  const calculateTeamMonthlyProgress = (members: any[]) => {
    const progress = {
      fa_monthly_target: 0,
      fa_actual: 0,
      eh_monthly_target: 0,
      eh_actual: 0,
      new_appointments_monthly_target: 0,
      new_appointments_actual: 0,
      recommendations_monthly_target: 0,
      recommendations_actual: 0,
      tiv_invitations_monthly_target: 0,
      tiv_invitations_actual: 0,
      bav_checks_monthly_target: 0,
      bav_checks_actual: 0,
      taa_invitations_monthly_target: 0,
      taa_invitations_actual: 0,
      tgs_registrations_monthly_target: 0,
      tgs_registrations_actual: 0
    };

    members.forEach(member => {
      if (member.monthlyProgress) {
        progress.fa_monthly_target += member.monthlyProgress.fa_monthly_target || 0;
        progress.fa_actual += member.monthlyProgress.fa_actual || 0;
        progress.eh_monthly_target += member.monthlyProgress.eh_monthly_target || 0;
        progress.eh_actual += member.monthlyProgress.eh_actual || 0;
        progress.new_appointments_monthly_target += member.monthlyProgress.new_appointments_monthly_target || 0;
        progress.new_appointments_actual += member.monthlyProgress.new_appointments_actual || 0;
        progress.recommendations_monthly_target += member.monthlyProgress.recommendations_monthly_target || 0;
        progress.recommendations_actual += member.monthlyProgress.recommendations_actual || 0;
        progress.tiv_invitations_monthly_target += member.monthlyProgress.tiv_invitations_monthly_target || 0;
        progress.tiv_invitations_actual += member.monthlyProgress.tiv_invitations_actual || 0;
        progress.bav_checks_monthly_target += member.monthlyProgress.bav_checks_monthly_target || 0;
        progress.bav_checks_actual += member.monthlyProgress.bav_checks_actual || 0;
        progress.taa_invitations_monthly_target += member.monthlyProgress.taa_invitations_monthly_target || 0;
        progress.taa_invitations_actual += member.monthlyProgress.taa_invitations_actual || 0;
        progress.tgs_registrations_monthly_target += member.monthlyProgress.tgs_registrations_monthly_target || 0;
        progress.tgs_registrations_actual += member.monthlyProgress.tgs_registrations_actual || 0;
      }
    });

    return progress;
  };

  const calculateTeamYesterdayResults = (members: any[]) => {
    const results = {
      fa_actual: 0,
      eh_actual: 0,
      new_appointments_actual: 0,
      recommendations_actual: 0,
      tiv_invitations_actual: 0,
      bav_checks_actual: 0,
      taa_invitations_actual: 0,
      tgs_registrations_actual: 0
    };

    members.forEach(member => {
      if (member.yesterdayResults) {
        results.fa_actual += member.yesterdayResults.fa_actual || 0;
        results.eh_actual += member.yesterdayResults.eh_actual || 0;
        results.new_appointments_actual += member.yesterdayResults.new_appointments_actual || 0;
        results.recommendations_actual += member.yesterdayResults.recommendations_actual || 0;
        results.tiv_invitations_actual += member.yesterdayResults.tiv_invitations_actual || 0;
        results.bav_checks_actual += member.yesterdayResults.bav_checks_actual || 0;
        results.taa_invitations_actual += member.yesterdayResults.taa_invitations_actual || 0;
        results.tgs_registrations_actual += member.yesterdayResults.tgs_registrations_actual || 0;
      }
    });

    return results;
  };

  const calculateTeamQuestionsToday = (members: any[]) => {
    const questions = {
      help_needed: '',
      training_focus: '',
      improvement_today: '',
      weekday_answers: {} as any,
      question_0: '',
      question_1: '',
      question_2: '',
      question_3: ''
    };

    // Sammle alle Fragen von allen Teammitgliedern
    members.forEach(member => {
      if (member.todayAnswers) {
        if (member.todayAnswers.help_needed) questions.help_needed += (questions.help_needed ? '; ' : '') + member.todayAnswers.help_needed;
        if (member.todayAnswers.training_focus) questions.training_focus += (questions.training_focus ? '; ' : '') + member.todayAnswers.training_focus;
        if (member.todayAnswers.improvement_today) questions.improvement_today += (questions.improvement_today ? '; ' : '') + member.todayAnswers.improvement_today;
        
        // Weekday answers zusammenführen
        if (member.todayAnswers.weekday_answers) {
          Object.keys(member.todayAnswers.weekday_answers).forEach(key => {
            if (member.todayAnswers.weekday_answers[key]) {
              questions.weekday_answers[key] = member.todayAnswers.weekday_answers[key];
            }
          });
        }
        
        // Einzelne Fragen
        if (member.todayAnswers.question_0) questions.question_0 += (questions.question_0 ? '; ' : '') + member.todayAnswers.question_0;
        if (member.todayAnswers.question_1) questions.question_1 += (questions.question_1 ? '; ' : '') + member.todayAnswers.question_1;
        if (member.todayAnswers.question_2) questions.question_2 += (questions.question_2 ? '; ' : '') + member.todayAnswers.question_2;
        if (member.todayAnswers.question_3) questions.question_3 += (questions.question_3 ? '; ' : '') + member.todayAnswers.question_3;
      }
    });

    return questions;
  };

  const calculateTeamAnswersToday = (members: any[]) => {
    const answers = {
      help_needed: '',
      training_focus: '',
      improvement_today: '',
      weekday_answers: {} as any,
      question_0: '',
      question_1: '',
      question_2: '',
      question_3: ''
    };

    // Sammle alle Antworten von allen Teammitgliedern
    members.forEach(member => {
      if (member.todayAnswers) {
        if (member.todayAnswers.help_needed) answers.help_needed += (answers.help_needed ? '; ' : '') + member.todayAnswers.help_needed;
        if (member.todayAnswers.training_focus) answers.training_focus += (answers.training_focus ? '; ' : '') + member.todayAnswers.training_focus;
        if (member.todayAnswers.improvement_today) answers.improvement_today += (answers.improvement_today ? '; ' : '') + member.todayAnswers.improvement_today;
        
        // Weekday answers zusammenführen
        if (member.todayAnswers.weekday_answers) {
          Object.keys(member.todayAnswers.weekday_answers).forEach(key => {
            if (member.todayAnswers.weekday_answers[key]) {
              answers.weekday_answers[key] = member.todayAnswers.weekday_answers[key];
            }
          });
        }
        
        // Einzelne Antworten
        if (member.todayAnswers.question_0) answers.question_0 += (answers.question_0 ? '; ' : '') + member.todayAnswers.question_0;
        if (member.todayAnswers.question_1) answers.question_1 += (answers.question_1 ? '; ' : '') + member.todayAnswers.question_1;
        if (member.todayAnswers.question_2) answers.question_2 += (answers.question_2 ? '; ' : '') + member.todayAnswers.question_2;
        if (member.todayAnswers.question_3) answers.question_3 += (answers.question_3 ? '; ' : '') + member.todayAnswers.question_3;
      }
    });

    return answers;
  };

  const calculateTeamFocusToday = (members: any[]) => {
    const focus = {
      training_focus: '',
      improvement_today: '',
      today_goals: '',
      today_todos: '',
      help_needed: '',
      weekly_improvement: '',
      improvement_focus: '',
      charisma_training: ''
    };

    // Sammle alle Fokus-Bereiche von allen Teammitgliedern
    members.forEach(member => {
      if (member.todayAnswers) {
        if (member.todayAnswers.training_focus) focus.training_focus += (focus.training_focus ? '; ' : '') + member.todayAnswers.training_focus;
        if (member.todayAnswers.improvement_today) focus.improvement_today += (focus.improvement_today ? '; ' : '') + member.todayAnswers.improvement_today;
        if (member.todayAnswers.today_goals) focus.today_goals += (focus.today_goals ? '; ' : '') + member.todayAnswers.today_goals;
        if (member.todayAnswers.today_todos) focus.today_todos += (focus.today_todos ? '; ' : '') + member.todayAnswers.today_todos;
        if (member.todayAnswers.help_needed) focus.help_needed += (focus.help_needed ? '; ' : '') + member.todayAnswers.help_needed;
        if (member.todayAnswers.weekly_improvement) focus.weekly_improvement += (focus.weekly_improvement ? '; ' : '') + member.todayAnswers.weekly_improvement;
        if (member.todayAnswers.improvement_focus) focus.improvement_focus += (focus.improvement_focus ? '; ' : '') + member.todayAnswers.improvement_focus;
        if (member.todayAnswers.charisma_training) focus.charisma_training += (focus.charisma_training ? '; ' : '') + member.todayAnswers.charisma_training;
      }
    });

    return focus;
  };

  const calculateTeamTodosToday = (members: any[]) => {
    const todos = {
      todos: [] as any[],
      auto_generated_todos: [] as any[],
      todos_completed: [] as any[]
    };

    // Sammle alle Todos von allen Teammitgliedern
    members.forEach(member => {
      if (member.todayTodos) {
        if (member.todayTodos.todos) todos.todos.push(...member.todayTodos.todos);
        if (member.todayTodos.auto_generated_todos) todos.auto_generated_todos.push(...member.todayTodos.auto_generated_todos);
        if (member.todayTodos.todos_completed) todos.todos_completed.push(...member.todayTodos.todos_completed);
      }
    });

    return todos;
  };

  const loadWeekdayQuestions = async () => {
    try {
      const response = await fetch(`/api/weekday-questions?weekday=${currentWeekday}`);
      if (response.ok) {
        const data = await response.json();
        setWeekdayQuestions(data);
      }
    } catch (error) {
      console.error('Error loading weekday questions:', error);
    }
  };

  // Load Today Focus
  const loadTodayFocus = async () => {
    try {
      const response = await fetch('/api/kanzleiablauf-team-focus');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setTodayFocus({
            training: data.data.training || '',
            phoneParty: data.data.phone_party || '',
            trainingResponsible: data.data.training_responsible || '',
            phonePartyResponsible: data.data.phone_party_responsible || ''
          });
        }
      }
    } catch (error) {
      console.error('Error loading today focus:', error);
    }
  };

  // Save Today Focus
  const handleSave = async () => {
    try {
      const response = await fetch('/api/kanzleiablauf-team-focus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ todayFocus })
      });
      
      if (response.ok) {
        alert('Team-Fokus erfolgreich gespeichert!');
      } else {
        alert('Fehler beim Speichern.');
      }
    } catch (error) {
      alert('Fehler beim Speichern.');
    }
  };

  useEffect(() => {
    if (isLoaded && user) {
      loadTeamData();
      loadWeekdayQuestions();
      loadTodayFocus();
    }
  }, [isLoaded, user]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Team-Daten...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Nicht angemeldet</h1>
          <p className="text-gray-600">Bitte melde dich an, um die Team-Daten zu sehen.</p>
        </div>
      </div>
    );
  }

  if (!teamData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Keine Team-Daten verfügbar.</p>
          <Button onClick={() => loadTeamData()} className="mt-4">
            Erneut laden
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 Kanzleiablauf</h1>
          <p className="text-gray-600">Teamübersicht und Tagesplanung</p>
        </div>

        {/* Team View Navigation - äußerer Rahmen */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">🎯 Team-Ansicht wechseln</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {teamViews.map((view) => (
                <button
                  key={view.id}
                  onClick={() => {
                    setActiveView(view.id);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeView === view.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <div className="text-left">
                    <div>{view.label}</div>
                    <div className="text-xs opacity-75">{view.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Team Content - zeigt die Ansicht des gewählten Users */}
        {activeView && (() => {
          
          const filteredData = getFilteredTeamData(activeView);
          if (!filteredData) return null;
          return (
            <div className="space-y-6">
            {/* Team Gesamt Ergebnis von Gestern */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">📊 Team Gesamt Ergebnis von Gestern</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
               {metrics.map((metric) => {
                 // Use today's actuals from all team members (not yesterday's results)
                 const achieved = filteredData.teamMembers?.reduce((sum: number, member: any) => {
                   return sum + (member.todayActuals?.[`${metric.key}_actual` as keyof typeof member.todayActuals] as number || 0);
                 }, 0) || 0;
                 // Calculate target from yesterday goals of all team members
                 const target = filteredData.teamMembers?.reduce((sum: number, member: any) => {
                   return sum + (member.yesterdayGoals?.[`${metric.key}_daily_target` as keyof typeof member.yesterdayGoals] as number || 0);
                 }, 0) || 0;
                const progress = getProgress(achieved, target);
                
                return (
                  <div key={metric.key} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm font-medium">{metric.fullLabel}</div>
                      <div className="text-sm text-gray-600">{achieved} / {target}</div>
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
        <div className="space-y-4">
          {filteredData.teamMembers.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">Keine Team-Mitglieder-Daten verfügbar.</p>
              </CardContent>
            </Card>
          ) : (
            filteredData.teamMembers.map((member: any) => {
              const isExpanded = expandedMembers.has(member.id);
              
              return (
                <Card 
                  key={member.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow duration-200"
                  onClick={() => {
                    const newExpanded = new Set(expandedMembers);
                    if (isExpanded) {
                      newExpanded.delete(member.id);
                    } else {
                      newExpanded.add(member.id);
                    }
                    setExpandedMembers(newExpanded);
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg">
                          {member.firstName || member.name?.split(' ')[0] || member.name}
                        </CardTitle>
                        {member.isTrainee && (
                          <Badge variant="secondary" className="text-xs">Trainee</Badge>
                        )}
                        
                         {/* Kleine Metriken-Kacheln */}
                         <div className="grid grid-cols-8 gap-1">
                           {metrics.map((metric) => {
                             const achieved = member.todayActuals?.[`${metric.key}_actual` as keyof typeof member.todayActuals] as number || 0;
                             const target = member.yesterdayGoals?.[`${metric.key}_daily_target` as keyof typeof member.yesterdayGoals] as number || 0;
                             const hasResults = achieved > 0;
                            
                            return (
                              <div 
                                key={metric.key} 
                                className={`text-center px-1 py-1 rounded text-xs w-10 h-10 flex flex-col justify-center ${
                                  hasResults ? 'bg-green-100 border border-green-200' : 'bg-gray-100 border border-gray-200'
                                }`}
                              >
                                <div className="font-medium text-gray-600 text-xs">{metric.label}</div>
                                <div className="font-bold text-gray-900 text-xs">{achieved}/{target}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-400">
                        {isExpanded ? '▼' : '▶'}
                      </div>
                    </div>
                  </CardHeader>
                
                {/* Aufklappbarer Inhalt */}
                {isExpanded && (
                  <div>
                    <CardContent className="space-y-4">
                    {/* Zielzahlen und Ergebnisse Tabelle */}
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
                             {metrics.map((metric) => {
                               const target = member.yesterdayGoals?.[`${metric.key}_daily_target` as keyof typeof member.yesterdayGoals] as number || 0;
                               const achieved = member.todayActuals?.[`${metric.key}_actual` as keyof typeof member.todayActuals] as number || 0;
                               const progress = getProgress(achieved, target);
                              
                              return (
                                <tr key={metric.key}>
                                  <td className="border border-gray-300 p-2 font-medium">{metric.fullLabel}</td>
                                  <td className="border border-gray-300 p-2 text-center">{target}</td>
                                  <td className="border border-gray-300 p-2 text-center">
                                    <span className={`font-semibold ${progress.color}`}>{achieved}</span>
                                  </td>
                                  <td className="border border-gray-300 p-2 text-center">
                                    <span className={`font-semibold ${progress.color}`}>{progress.progress}%</span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Mood Feedback */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Wie fühlst du dich damit?
                      </label>
                      <Textarea
                        rows={3}
                        value={moodFeedback}
                        onChange={(e) => setMoodFeedback(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        placeholder=""
                        className="w-full"
                      />
                    </div>

                    {/* ToDos abhaken und Fragen von gestern - nebeneinander */}
                    {(((member.yesterdayResults?.todos && member.yesterdayResults.todos.length > 0) || member.yesterdayResults?.charisma_training) || 
                      (member.yesterdayResults?.highlight_yesterday || member.yesterdayResults?.appointments_next_week || member.yesterdayResults?.weekly_improvement)) && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* ToDos abhaken */}
                        {((member.yesterdayResults?.todos && member.yesterdayResults.todos.length > 0) || member.yesterdayResults?.charisma_training) && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-3">ToDos von gestern:</h4>
                            <div className="space-y-2">
                              {/* Alle Todos anzeigen (abgehakt und nicht abgehakt) */}
                              {member.yesterdayResults.todos && member.yesterdayResults.todos.map((todo: string, index: number) => {
                                const isCompleted = member.yesterdayResults?.todos_completed?.[index];
                                return (
                                  <div key={index} className="flex items-center space-x-2">
                                    <span className={isCompleted ? "text-green-600" : "text-gray-400"}>
                                      {isCompleted ? "✓" : "○"}
                                    </span>
                                    <span className={isCompleted ? "line-through text-gray-500" : "text-gray-900"}>
                                      {todo}
                                    </span>
                                  </div>
                                );
                              })}
                              {/* Charisma-Training als abgehaktes Todo */}
                              {member.yesterdayResults?.charisma_training && (
                                <div className="flex items-center space-x-2">
                                  <span className="text-green-600">✓</span>
                                  <span className="line-through text-gray-500">Charisma-Training</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Fragen-Antworten von gestern */}
                        {(member.yesterdayResults?.highlight_yesterday || 
                          member.yesterdayResults?.appointments_next_week || 
                          member.yesterdayResults?.weekly_improvement) && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-3">Fragen von gestern:</h4>
                            <div className="space-y-3">
                              {member.yesterdayResults.highlight_yesterday && (
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Diamanten:</p>
                                  <p className="text-sm text-gray-600">{member.yesterdayResults.highlight_yesterday}</p>
                                </div>
                              )}
                              {member.yesterdayResults.appointments_next_week && member.yesterdayResults.appointments_next_week > 0 && (
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Termine nächste Woche:</p>
                                  <p className="text-sm text-gray-600">{member.yesterdayResults.appointments_next_week}</p>
                                </div>
                              )}
                              {member.yesterdayResults.weekly_improvement && (
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Wöchentliche Verbesserung:</p>
                                  <p className="text-sm text-gray-600">{member.yesterdayResults.weekly_improvement}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Weekly & Monthly Progress */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Wochen- & Monatsergebnis</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {metrics.map((metric) => {
                          const weeklyCurrent = member.weeklyProgress?.[`${metric.key}_actual` as keyof typeof member.weeklyProgress] as number || 0;
                          const weeklyTarget = member.weeklyProgress?.[`${metric.key}_weekly_target` as keyof typeof member.weeklyProgress] as number || 0;
                          const monthlyCurrent = member.monthlyProgress?.[`${metric.key}_actual` as keyof typeof member.monthlyProgress] as number || 0;
                          const monthlyTarget = member.monthlyProgress?.[`${metric.key}_monthly_target` as keyof typeof member.monthlyProgress] as number || 0;
                          
                          const weeklyProgress = getProgress(weeklyCurrent, weeklyTarget);
                          const monthlyProgress = getProgress(monthlyCurrent, monthlyTarget);
                          
                          return (
                            <div key={metric.key} className="p-3 bg-gray-50 rounded-lg">
                              <div className="text-sm font-medium mb-3 text-center">{metric.fullLabel}</div>
                              
                              {/* Weekly Progress */}
                              <div className="mb-3">
                                <div className="text-xs text-gray-600 mb-1">
                                  Woche: {weeklyCurrent} / {weeklyTarget}
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
                                  Monat: {monthlyCurrent} / {monthlyTarget}
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
                )}
              </Card>
              );
            })
          )}
        </div>




            {/* Team Wochen- und Monatsergebnis */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">📊 Team Wochen- & Monatsergebnis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {metrics.map((metric) => {
                    // Wochenziel = Summe der Wochenziele aller Teammitglieder
                    const weeklyTarget = filteredData.teamMembers?.reduce((sum: number, member: any) => {
                      return sum + (member.weeklyProgress?.[`${metric.key}_weekly_target` as keyof typeof member.weeklyProgress] as number || 0);
                    }, 0) || 0;
                    
                    // Wochenist = Summe der Wochenist-Zahlen aller Teammitglieder
                    const weeklyCurrent = filteredData.teamMembers?.reduce((sum: number, member: any) => {
                      return sum + (member.weeklyProgress?.[`${metric.key}_actual` as keyof typeof member.weeklyProgress] as number || 0);
                    }, 0) || 0;
                    
                    
                    // EINFACHE LÖSUNG: Statische Team-Leader-Zuordnung für Admins
                    const teamLeaderMap: { [key: string]: string } = {
                      'GameChanger': 'Daniel Kuhlen',
                      'Goalgetter': 'Robin',
                      'Proud': 'Robin', 
                      'Eagles': 'Robin',
                      'Visionäre': 'Robin',
                      'Hurricane': 'Domenic',
                      'Alpha': 'Robin',
                      'Straw Hats': 'Andreas La Farina',
                      'Eys Breaker': 'Patrick van Eys'
                    };
                    
                    const teamLeaderName = teamLeaderMap[activeView];
                    // Fallback: personalTargets aus teamLeader oder currentUser
                    // Fix: TypeScript error - TeamMember has no personalTargets property
                    // We assume personalTargets is on currentUser only
                    const monthlyTarget = teamData.currentUser?.personalTargets?.[`${metric.key}_team_target`] as number || 0;
                    const monthlyCurrent = filteredData.teamMembers?.reduce((sum: number, member: any) => {
                      return sum + (member.monthlyProgress?.[`${metric.key}_actual` as keyof typeof member.monthlyProgress] as number || 0);
                    }, 0) || 0;
                    
                    const weeklyProgress = getProgress(weeklyCurrent, weeklyTarget);
                    const monthlyProgress = getProgress(monthlyCurrent, monthlyTarget);
                    
                    return (
                      <div key={metric.key} className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm font-medium mb-3 text-center">{metric.fullLabel}</div>
                        
                        {/* Weekly Progress */}
                        <div className="mb-2">
                          <div className="flex justify-between items-center mb-1">
                            <div className="text-xs text-gray-600">Woche</div>
                            <div className="text-xs text-gray-600">{weeklyCurrent} / {weeklyTarget}</div>
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
                          <div className="flex justify-between items-center mb-1">
                            <div className="text-xs text-gray-600">Monat</div>
                            <div className="text-xs text-gray-600">{monthlyCurrent} / {monthlyTarget}</div>
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

            {/* Die heutige Chance Button */}
            <div className="text-center py-8">
              <Button
                onClick={() => setShowTodayOpportunity(!showTodayOpportunity)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-12 py-4 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 text-lg font-semibold"
                size="lg"
              >
                <span className="flex items-center gap-3">
                  <span>🎯</span>
                  <span>Die heutige Chance</span>
                </span>
              </Button>
            </div>

            {/* Die heutige Chance Content */}
            {showTodayOpportunity && (
          <>
            {/* Team Gesamt Ziel Heute */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">🎯 Team Gesamt Ziel Heute</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {metrics.map((metric) => {
                    // Add up todayGoals from all displayed team members
                    const target = filteredData.teamMembers?.reduce((sum: number, member: any) => {
                      return sum + (member.todayGoals?.[`${metric.key}_daily_target` as keyof typeof member.todayGoals] as number || 0);
                    }, 0) || 0;
                    
                    return (
                      <div key={metric.key} className="p-3 bg-gray-50 rounded-lg text-center">
                        <div className="text-sm font-medium mb-2">{metric.fullLabel}</div>
                        <div className="text-2xl font-bold text-blue-600">{target}</div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Individual Member Today's Goals */}
            <div className="space-y-4">
              {filteredData.teamMembers.map((member: any) => {
                const isExpanded = expandedMembers.has(member.id);
                
                return (
                <Card 
                  key={`today-${member.id}`} 
                  className="cursor-pointer hover:shadow-md transition-shadow duration-200"
                >
                  <CardHeader 
                    className="pb-3"
                    onClick={() => {
                      setExpandedMembers(prev => {
                        const newSet = new Set(prev);
                        if (newSet.has(member.id)) {
                          newSet.delete(member.id);
                        } else {
                          newSet.add(member.id);
                        }
                        return newSet;
                      });
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg">
                          {member.firstName || member.name?.split(' ')[0] || member.name}
                        </CardTitle>
                        
                        {/* Heute Ziele - Kleine Kacheln */}
                        <div className="grid grid-cols-8 gap-1">
                          {metrics.map((metric) => {
                            const target = member.todayGoals?.[`${metric.key}_daily_target` as keyof typeof member.todayGoals] as number || 0;
                            const hasGoal = target > 0;
                            
                            return (
                              <div 
                                key={metric.key} 
                                className={`text-center px-1 py-1 rounded text-xs w-10 h-10 flex flex-col justify-center ${
                                  hasGoal ? 'bg-blue-100 border border-blue-200' : 'bg-gray-100 border border-gray-200'
                                }`}
                              >
                                <div className="font-medium text-gray-600 text-xs">{metric.label}</div>
                                <div className="font-bold text-gray-900 text-xs">{target}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-400">
                        {isExpanded ? '▼' : '▶'}
                      </div>
                    </div>
                  </CardHeader>
                  
                  {/* Aufklappbarer Inhalt für Heute */}
                  {isExpanded && (
                    <div>
                    <CardContent className="space-y-4">
                      {/* Heute Ziele - Große Kacheln */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Zielzahlen für heute</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                          {metrics.map((metric) => {
                            const target = member.todayGoals?.[`${metric.key}_daily_target` as keyof typeof member.todayGoals] as number || 0;
                            const hasGoal = target > 0;
                            
                            // Alle 8 Ziele anzeigen, auch wenn 0
                            return (
                              <div 
                                key={metric.key} 
                                className={`text-center px-2 py-3 rounded-lg shadow-sm border ${
                                  hasGoal ? 'bg-blue-100 border-blue-200' : 'bg-gray-100 border-gray-200'
                                }`}
                              >
                                <div className="font-medium text-gray-600 mb-1 text-xs">{metric.fullLabel}</div>
                                <div className="font-bold text-gray-900 text-lg">{target}</div>
                              </div>
                            );
                          })}
                        </div>
                        {/* Zeige Nachricht wenn keine Ziele gesetzt wurden */}
                      </div>

                      {/* Heute ToDos und Fragen - nebeneinander */}
                      {((member.todayTodos && member.todayTodos.length > 0) || (weekdayQuestions && weekdayQuestions.today_questions)) && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Heute ToDos */}
                          {member.todayTodos && member.todayTodos.length > 0 && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-3">ToDos für heute:</h4>
                              <div className="space-y-1">
                                {member.todayTodos.filter((todo: string) => todo && todo.trim() !== '').map((todo: string, index: number) => (
                                  <div key={index}>
                                    <span className="text-sm text-gray-700">{todo}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Heutige Fragen */}
                          {weekdayQuestions && weekdayQuestions.today_questions && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-3">Fragen für heute:</h4>
                          <div className="space-y-2">
                            {weekdayQuestions.today_questions.map((question: string, index: number) => {
                              // Antwort basierend auf dem Index der Frage
                              let answer = '';
                              switch(index) {
                                case 0:
                                  answer = member.todayAnswers?.help_needed || '';
                                  break;
                                case 1:
                                  answer = member.todayAnswers?.training_focus || '';
                                  break;
                                case 2:
                                  answer = member.todayAnswers?.improvement_today || '';
                                  break;
                                case 3:
                                  // Die 4. Frage ist in weekday_answers gespeichert
                                  // Wenn question_3 leer oder 0 ist, suche in weekday_answers nach der nächsten Antwort
                                  answer = member.todayAnswers?.question_3 || '';
                                  if (!answer || answer === '0') {
                                    // Suche in weekday_answers nach der ersten nicht-leeren Antwort
                                    const weekdayAnswers = member.todayAnswers?.weekday_answers || {};
                                    const answerKeys = Object.keys(weekdayAnswers).sort();
                                    for (const key of answerKeys) {
                                      if (weekdayAnswers[key] && weekdayAnswers[key] !== '0' && weekdayAnswers[key] !== '') {
                                        answer = weekdayAnswers[key];
                                        break;
                                      }
                                    }
                                  }
                                  break;
                                default:
                                  answer = '';
                              }
                              
                              return (
                                <div key={index}>
                                  <p className="text-sm font-medium text-gray-700">{question}</p>
                                  {answer ? (
                                    <p className="text-sm text-gray-600 mt-1">{answer}</p>
                                  ) : (
                                    <p className="text-sm text-gray-400 mt-1">Noch keine Antwort</p>
                                  )}
                                </div>
                              );
                            })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    </CardContent>
                    </div>
                  )}
                </Card>
                );
              })}
            </div>


            {/* Team Fokus heute */}
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
                    <Textarea
                      rows={3}
                      value={todayFocus.training}
                      onChange={(e) => setTodayFocus(prev => ({ ...prev, training: e.target.value }))}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Trainingsthema eingeben..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Wann ist Telefonparty?
                    </label>
                    <Textarea
                      rows={3}
                      value={todayFocus.phoneParty}
                      onChange={(e) => setTodayFocus(prev => ({ ...prev, phoneParty: e.target.value }))}
                      onClick={(e) => e.stopPropagation()}
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
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="">Bitte auswählen...</option>
                      {filteredData.teamMembers.map((member: any) => (
                        <option key={member.id} value={member.name}>
                          {member.firstName || member.name?.split(' ')[0] || member.name}
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
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="">Bitte auswählen...</option>
                      {filteredData.teamMembers.map((member: any) => (
                        <option key={member.id} value={member.name}>
                          {member.firstName || member.name?.split(' ')[0] || member.name}
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
          );
        })()}
      </div>
    </div>
  );
}
