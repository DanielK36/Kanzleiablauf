// Data Models and Interfaces for the Kanzleiablauf System

export type KanzleiablaufMetric = 
  | 'fa'
  | 'eh'
  | 'new_appointments'
  | 'recommendations'
  | 'tiv_invitations'
  | 'bav_checks'
  | 'taa_invitations'
  | 'tgs_registrations';

export interface KanzleiablaufMetrics {
  fa_target: number;
  fa_actual: number;
  eh_target: number;
  eh_actual: number;
  new_appointments_target: number;
  new_appointments_actual: number;
  recommendations_target: number;
  recommendations_actual: number;
  tiv_invitations_target: number;
  tiv_invitations_actual: number;
  bav_checks_target: number;
  bav_checks_actual: number;
  taa_invitations_target: number;
  taa_invitations_actual: number;
  tgs_registrations_target: number;
  tgs_registrations_actual: number;
}

export interface KanzleiablaufTodayGoals {
  fa_target: number;
  eh_target: number;
  new_appointments_target: number;
  recommendations_target: number;
  tiv_invitations_target: number;
  bav_checks_target: number;
  taa_invitations_target: number;
  tgs_registrations_target: number;
}

export interface KanzleiablaufYesterdayResults {
  fa_actual: number;
  eh_actual: number;
  new_appointments_actual: number;
  recommendations_actual: number;
  tiv_invitations_actual: number;
  bav_checks_actual: number;
  taa_invitations_actual: number;
  tgs_registrations_actual: number;
}

export interface KanzleiablaufYesterdayGoals {
  fa_target: number;
  eh_target: number;
  new_appointments_target: number;
  recommendations_target: number;
  tiv_invitations_target: number;
  bav_checks_target: number;
  taa_invitations_target: number;
  tgs_registrations_target: number;
}

export interface KanzleiablaufYesterdayAnswers {
  todos_completed: string[];
  charisma_training: boolean;
  yesterday_question_1: string;
  yesterday_question_2: string;
  yesterday_question_3: string;
  trainee_question: string;
}

export interface UserWithKanzleiablaufData {
  id: number;
  name: string;
  role: string;
  team_id: number;
  team_name: string;
  weeklyProgress: KanzleiablaufMetrics;
  monthlyProgress: KanzleiablaufMetrics;
  todayGoals: KanzleiablaufTodayGoals;
  yesterdayResults: KanzleiablaufYesterdayResults;
  yesterdayGoals: KanzleiablaufYesterdayGoals;
  yesterdayAnswers: KanzleiablaufYesterdayAnswers;
}

export interface KanzleiablaufTeamTotals extends KanzleiablaufMetrics, KanzleiablaufTodayGoals, KanzleiablaufYesterdayResults, KanzleiablaufYesterdayGoals {}

export interface KanzleiablaufData {
  teamTotals: KanzleiablaufTeamTotals;
  teamMembers: UserWithKanzleiablaufData[];
}

export interface WeeklyGoals {
  fa_target: number;
  eh_target: number;
  new_appointments_target: number;
  recommendations_target: number;
  tiv_invitations_target: number;
  bav_checks_target: number;
  taa_invitations_target: number;
  tgs_registrations_target: number;
}

export interface MonthlyGoals {
  fa_target: number;
  eh_target: number;
  new_appointments_target: number;
  recommendations_target: number;
  tiv_invitations_target: number;
  bav_checks_target: number;
  taa_invitations_target: number;
  tgs_registrations_target: number;
}

export interface TeamGoals {
  fa_monthly_target: number;
  eh_monthly_target: number;
  new_appointments_monthly_target: number;
  recommendations_monthly_target: number;
  tiv_invitations_monthly_target: number;
  bav_checks_monthly_target: number;
  taa_invitations_monthly_target: number;
  tgs_registrations_monthly_target: number;
}

export interface PersonalTargets {
  fa_weekly?: number;
  fa_monthly?: number;
  fa_daily?: number;
  eh_weekly?: number;
  eh_monthly?: number;
  eh_daily?: number;
  new_appointments_weekly?: number;
  new_appointments_monthly?: number;
  new_appointments_daily?: number;
  recommendations_weekly?: number;
  recommendations_monthly?: number;
  recommendations_daily?: number;
  tiv_invitations_weekly?: number;
  tiv_invitations_monthly?: number;
  tiv_invitations_daily?: number;
  bav_checks_weekly?: number;
  bav_checks_monthly?: number;
  bav_checks_daily?: number;
  taa_invitations_weekly?: number;
  taa_invitations_monthly?: number;
  taa_invitations_daily?: number;
  tgs_registrations_weekly?: number;
  tgs_registrations_monthly?: number;
  tgs_registrations_daily?: number;
}

export interface DailyEntry {
  id: number;
  user_id: number;
  created_at: string;
  fa_today_goal: number;
  fa_yesterday_actual: number;
  eh_today_goal: number;
  eh_yesterday_actual: number;
  new_appointments_today_goal: number;
  new_appointments_yesterday_actual: number;
  recommendations_today_goal: number;
  recommendations_yesterday_actual: number;
  tiv_invitations_today_goal: number;
  tiv_invitations_yesterday_actual: number;
  bav_checks_today_goal: number;
  bav_checks_yesterday_actual: number;
  taa_invitations_today_goal: number;
  taa_invitations_yesterday_actual: number;
  tgs_registrations_today_goal: number;
  tgs_registrations_yesterday_actual: number;
  todos_completed: string;
  charisma_training: boolean;
  yesterday_question_1: string;
  yesterday_question_2: string;
  yesterday_question_3: string;
  trainee_question: string;
}

export interface User {
  id: string;
  clerk_id: string;
  name: string;
  firstname?: string;
  lastname?: string;
  email: string;
  role: string;
  team_id?: number;
  team_name?: string;
  personal_targets?: PersonalTargets;
  is_team_leader?: boolean;
  // Removed: team_leader_for (obsolete)
  created_at: string;
  updated_at: string;
}

export class DataTransformer {
  static transformUser(user: any): User {
    return {
      id: user.id,
      clerk_id: user.clerk_id,
      name: user.name,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role: user.role,
      team_id: user.team_id,
      team_name: user.team_name,
      personal_targets: user.personal_targets,
      is_team_leader: user.is_team_leader,
      // Removed: team_leader_for (obsolete)
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }

  static transformPersonalTargets(targets: any): PersonalTargets {
    return {
      fa_weekly: targets?.fa_weekly || 0,
      fa_monthly: targets?.fa_monthly || 0,
      fa_daily: targets?.fa_daily || 0,
      eh_weekly: targets?.eh_weekly || 0,
      eh_monthly: targets?.eh_monthly || 0,
      eh_daily: targets?.eh_daily || 0,
      new_appointments_weekly: targets?.new_appointments_weekly || 0,
      new_appointments_monthly: targets?.new_appointments_monthly || 0,
      new_appointments_daily: targets?.new_appointments_daily || 0,
      recommendations_weekly: targets?.recommendations_weekly || 0,
      recommendations_monthly: targets?.recommendations_monthly || 0,
      recommendations_daily: targets?.recommendations_daily || 0,
      tiv_invitations_weekly: targets?.tiv_invitations_weekly || 0,
      tiv_invitations_monthly: targets?.tiv_invitations_monthly || 0,
      tiv_invitations_daily: targets?.tiv_invitations_daily || 0,
      bav_checks_weekly: targets?.bav_checks_weekly || 0,
      bav_checks_monthly: targets?.bav_checks_monthly || 0,
      bav_checks_daily: targets?.bav_checks_daily || 0,
      taa_invitations_weekly: targets?.taa_invitations_weekly || 0,
      taa_invitations_monthly: targets?.taa_invitations_monthly || 0,
      taa_invitations_daily: targets?.taa_invitations_daily || 0,
      tgs_registrations_weekly: targets?.tgs_registrations_weekly || 0,
      tgs_registrations_monthly: targets?.tgs_registrations_monthly || 0,
      tgs_registrations_daily: targets?.tgs_registrations_daily || 0,
    };
  }
}
