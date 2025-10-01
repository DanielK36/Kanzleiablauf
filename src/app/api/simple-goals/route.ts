import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerClient } from '@/lib/supabase';

// EINFACHE API - nur das was WIRKLICH funktioniert
export async function GET() {
  try {
    console.log('🚀 EINFACHE API - GET Goals');
    
    // Aktuelle User ID aus Clerk Auth holen
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401 });
    }
    
    const supabase = createSupabaseServerClient();
    
    const { data: user, error } = await supabase
      .from('users')
      .select('personal_targets')
      .eq('clerk_id', userId)
      .single();

    if (error) {
      console.error('❌ Error:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    const targets = user.personal_targets || {};
    
    console.log('✅ Goals loaded:', {
      fa: targets.fa_monthly_target || 0,
      eh: targets.eh_monthly_target || 0
    });

    return NextResponse.json({
      success: true,
      data: {
        // Monatsziele (persönlich)
        monthly: {
          fa: targets.fa_monthly_target || 0,
          eh: targets.eh_monthly_target || 0,
          newAppointments: targets.new_appointments_monthly_target || 0,
          recommendations: targets.recommendations_monthly_target || 0,
          tivInvitations: targets.tiv_invitations_monthly_target || 0,
          bavChecks: targets.bav_checks_monthly_target || 0,
          taaInvitations: targets.taa_invitations_monthly_target || 0,
          tgsRegistrations: targets.tgs_registrations_monthly_target || 0,
        },
        // Wochenziele (persönlich)
        weekly: {
          fa: targets.fa_weekly || 0,
          eh: targets.eh_weekly || 0,
          newAppointments: targets.new_appointments_weekly || 0,
          recommendations: targets.recommendations_weekly || 0,
          tivInvitations: targets.tiv_invitations_weekly || 0,
          bavChecks: targets.bav_checks_weekly || 0,
          taaInvitations: targets.taa_invitations_weekly || 0,
          tgsRegistrations: targets.tgs_registrations_weekly || 0,
        },
        // Team-Ziele (für Organisation) - separate Felder
        team: {
          fa: targets.fa_team_target || 0,
          eh: targets.eh_team_target || 0,
          newAppointments: targets.new_appointments_team_target || 0,
          recommendations: targets.recommendations_team_target || 0,
          tivInvitations: targets.tiv_invitations_team_target || 0,
          bavChecks: targets.bav_checks_team_target || 0,
          taaInvitations: targets.taa_invitations_team_target || 0,
          tgsRegistrations: targets.tgs_registrations_team_target || 0,
        }
      }
    });

  } catch (error: any) {
    console.error('❌ API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 EINFACHE API - POST Goals');
    
    // Aktuelle User ID aus Clerk Auth holen
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401 });
    }
    
    const body = await request.json();
    
    console.log('📝 Saving goals for user:', userId, body);

    const supabase = createSupabaseServerClient();
    console.log('🔍 Supabase client created successfully');
    
    // Bestehende personal_targets laden
    const { data: existingUser } = await supabase
      .from('users')
      .select('personal_targets')
      .eq('clerk_id', userId)
      .single();

    const existingTargets = existingUser?.personal_targets || {};

    // Je nach Typ die richtigen Felder aktualisieren
    let updateData = { ...existingTargets };
    
    if (body.type === 'monthly') {
      // Bestimme für welchen Monat die Ziele gespeichert werden
      const now = new Date();
      const currentDay = now.getDate();
      
      let targetMonth;
      if (currentDay >= 20) {
        // Ab dem 20. werden Ziele für den Folgemonat gespeichert
        targetMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      } else {
        // Vor dem 20. für den aktuellen Monat
        targetMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      
      // Format: "YYYY-MM"
      const targetMonthKey = `${targetMonth.getFullYear()}-${String(targetMonth.getMonth() + 1).padStart(2, '0')}`;
      
      // Hole existierende monthly_targets
      const { data: userData } = await supabase
        .from('users')
        .select('monthly_targets')
        .eq('clerk_id', userId)
        .single();
      
      if (!userData) {
        return NextResponse.json({ 
          success: false, 
          error: 'User not found' 
        }, { status: 404 });
      }
      
      // Erweitere monthly_targets JSONB mit neuem Monat
      const monthlyTargets = userData.monthly_targets || {};
      monthlyTargets[targetMonthKey] = {
        fa_monthly_target: body.fa || 0,
        eh_monthly_target: body.eh || 0,
        new_appointments_monthly_target: body.newAppointments || 0,
        recommendations_monthly_target: body.recommendations || 0,
        tiv_invitations_monthly_target: body.tivInvitations || 0,
        bav_checks_monthly_target: body.bavChecks || 0,
        taa_invitations_monthly_target: body.taaInvitations || 0,
        tgs_registrations_monthly_target: body.tgsRegistrations || 0,
      };
      
      // Speichere in monthly_targets JSONB Spalte
      const { error: monthlyError } = await supabase
        .from('users')
        .update({ monthly_targets: monthlyTargets })
        .eq('clerk_id', userId);
      
      if (monthlyError) {
        console.error('❌ Error saving monthly targets:', monthlyError);
        return NextResponse.json({ 
          success: false, 
          error: monthlyError.message 
        }, { status: 500 });
      }
      
      // Auch in personal_targets für Backward-Kompatibilität (aktueller Monat)
      updateData = {
        ...updateData,
        fa_monthly_target: body.fa || 0,
        eh_monthly_target: body.eh || 0,
        new_appointments_monthly_target: body.newAppointments || 0,
        recommendations_monthly_target: body.recommendations || 0,
        tiv_invitations_monthly_target: body.tivInvitations || 0,
        bav_checks_monthly_target: body.bavChecks || 0,
        taa_invitations_monthly_target: body.taaInvitations || 0,
        tgs_registrations_monthly_target: body.tgsRegistrations || 0,
      };
    } else if (body.type === 'weekly') {
      updateData = {
        ...updateData,
        fa_weekly: body.fa || 0,
        eh_weekly: body.eh || 0,
        new_appointments_weekly: body.newAppointments || 0,
        recommendations_weekly: body.recommendations || 0,
        tiv_invitations_weekly: body.tivInvitations || 0,
        bav_checks_weekly: body.bavChecks || 0,
        taa_invitations_weekly: body.taaInvitations || 0,
        tgs_registrations_weekly: body.tgsRegistrations || 0,
      };
    } else if (body.type === 'team') {
      updateData = {
        ...updateData,
        fa_team_target: body.fa || 0,
        eh_team_target: body.eh || 0,
        new_appointments_team_target: body.newAppointments || 0,
        recommendations_team_target: body.recommendations || 0,
        tiv_invitations_team_target: body.tivInvitations || 0,
        bav_checks_team_target: body.bavChecks || 0,
        taa_invitations_team_target: body.taaInvitations || 0,
        tgs_registrations_team_target: body.tgsRegistrations || 0,
      };
    }

    const { data, error } = await supabase
      .from('users')
      .update({
        personal_targets: updateData
      })
      .eq('clerk_id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ Save Error:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }

    console.log('✅ Goals saved successfully');

    return NextResponse.json({
      success: true,
      message: 'Goals saved successfully!'
    });

  } catch (error: any) {
    console.error('❌ API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
