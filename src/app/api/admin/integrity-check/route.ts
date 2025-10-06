import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const supabase = createSupabaseServerClient();
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('clerk_id', userId)
      .single();

    if (userError || user?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const issues = [];

    // Check for users without personal targets
    const { data: usersWithoutTargets, error: targetsError } = await supabase
      .from('users')
      .select('id, name, team_name')
      .or('personal_targets.is.null,personal_targets.eq.{}');

    if (!targetsError && usersWithoutTargets && usersWithoutTargets.length > 0) {
      issues.push({
        type: 'missing_goals',
        severity: 'high',
        description: `${usersWithoutTargets.length} Benutzer haben keine persönlichen Ziele definiert`,
        affected_users: usersWithoutTargets.map(u => u.name),
        suggested_action: 'Persönliche Ziele für alle Benutzer definieren'
      });
    }

    // Check for users without recent daily entries
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: usersWithoutEntries, error: entriesError } = await supabase
      .from('users')
      .select('id, name, team_name')
      .not('id', 'in', `(
        SELECT DISTINCT user_id 
        FROM daily_entries 
        WHERE entry_date >= '${thirtyDaysAgo.toISOString().split('T')[0]}'
      )`);

    if (!entriesError && usersWithoutEntries && usersWithoutEntries.length > 0) {
      issues.push({
        type: 'missing_entries',
        severity: 'medium',
        description: `${usersWithoutEntries.length} Benutzer haben keine Tageseinträge in den letzten 30 Tagen`,
        affected_users: usersWithoutEntries.map(u => u.name),
        suggested_action: 'Benutzer zur Eingabe von Tageseinträgen motivieren'
      });
    }

    // Check for broken quotas (division by zero)
    const { data: brokenQuotas, error: quotasError } = await supabase
      .from('daily_entries')
      .select('user_id, fa, new_appointments, recommendations, tiv_invitations, tgs_registrations, bav_checks')
      .gte('entry_date', thirtyDaysAgo.toISOString().split('T')[0]);

    if (!quotasError && brokenQuotas) {
      const usersWithBrokenQuotas = new Set();
      
      brokenQuotas.forEach(entry => {
        // Check for impossible quotas
        if (entry.fa === 0 && (entry.new_appointments > 0 || entry.recommendations > 0 || entry.tiv_invitations > 0 || entry.bav_checks > 0)) {
          usersWithBrokenQuotas.add(entry.user_id);
        }
        if (entry.tiv_invitations === 0 && entry.tgs_registrations > 0) {
          usersWithBrokenQuotas.add(entry.user_id);
        }
      });

      if (usersWithBrokenQuotas.size > 0) {
        // Get user names
        const { data: users, error: userNamesError } = await supabase
          .from('users')
          .select('id, name')
          .in('id', Array.from(usersWithBrokenQuotas));

        if (!userNamesError && users) {
          issues.push({
            type: 'broken_quotas',
            severity: 'medium',
            description: `${users.length} Benutzer haben inkonsistente Quoten-Daten`,
            affected_users: users.map(u => u.name),
            suggested_action: 'Tageseinträge auf Konsistenz prüfen und korrigieren'
          });
        }
      }
    }

    // Check for inconsistent annual goals
    const { data: annualGoals, error: goalsError } = await supabase
      .from('annual_goals')
      .select('user_id, fa_yearly_target, eh_yearly_target, is_self_goal');

    if (!goalsError && annualGoals) {
      const inconsistentGoals = [];
      
      annualGoals.forEach(goal => {
        // Check for unrealistic ratios (1 FA ≈ 100 EH)
        if (goal.fa_yearly_target > 0 && goal.eh_yearly_target > 0) {
          const ratio = goal.eh_yearly_target / goal.fa_yearly_target;
          if (ratio < 50 || ratio > 200) { // Outside reasonable range
            inconsistentGoals.push(goal.user_id);
          }
        }
      });

      if (inconsistentGoals.length > 0) {
        const { data: users, error: userNamesError } = await supabase
          .from('users')
          .select('id, name')
          .in('id', inconsistentGoals);

        if (!userNamesError && users) {
          issues.push({
            type: 'inconsistent_data',
            severity: 'low',
            description: `${users.length} Benutzer haben unrealistische FA/EH-Verhältnisse`,
            affected_users: users.map(u => u.name),
            suggested_action: 'Jahresziele auf Plausibilität prüfen (1 FA ≈ 100 EH)'
          });
        }
      }
    }

    // Check for missing team leaders
    const { data: teamsWithoutLeaders, error: leadersError } = await supabase
      .from('users')
      .select('team_name')
      .not('team_name', 'is', null)
      .neq('team_name', '')
      .eq('is_team_leader', false);

    if (!leadersError && teamsWithoutLeaders) {
      const teams = [...new Set(teamsWithoutLeaders.map(u => u.team_name))];
      const teamsWithLeaders = new Set();

      // Check which teams have leaders
      const { data: teamLeaders, error: teamLeadersError } = await supabase
        .from('users')
        .select('team_name')
        .eq('is_team_leader', true);

      if (!teamLeadersError && teamLeaders) {
        teamLeaders.forEach(leader => teamsWithLeaders.add(leader.team_name));
      }

      const teamsWithoutLeadersList = teams.filter(team => !teamsWithLeaders.has(team));

      if (teamsWithoutLeadersList.length > 0) {
        issues.push({
          type: 'missing_goals',
          severity: 'medium',
          description: `${teamsWithoutLeadersList.length} Teams haben keinen Team-Leader`,
          affected_users: teamsWithoutLeadersList,
          suggested_action: 'Team-Leader für alle Teams definieren'
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: issues
    });

  } catch (error) {
    console.error('Error in GET /api/admin/integrity-check:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
