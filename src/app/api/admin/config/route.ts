import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerClient } from '@/lib/supabase';

// Default-Konfigurationen aus dem Briefing
const DEFAULT_CONFIG = {
  // Ampel-Grenzen für KPIs
  fa_monthly_thresholds: { red: 5, yellow: 10, green: 20, diamond: 20 },
  appointments_per_fa_thresholds: { red: 5, yellow: 3, green: 3 },
  recommendations_per_fa_thresholds: { red: 1, yellow: 2, green: 3 },
  tiv_per_fa_thresholds: { red: 0.4, yellow: 0.6, green: 0.8 },
  tgs_per_tiv_thresholds: { red: 0.2, yellow: 0.25, green: 0.33 },
  bav_per_fa_thresholds: { red: 0.5, yellow: 0.6, green: 0.8 },
  
  // Toleranzen und Schwellen
  plan_consistency_tolerance: 2, // ±2%
  fk_self_delta_threshold_yellow: 25, // Gelb ab 25%
  fk_self_delta_threshold_red: 50, // Rot ab 50%
  target_increase_threshold: 25, // Warnung ab 25% Steigerung
  
  // Beförderungsstufen (EH/Jahr)
  promotion_levels: [10000, 22500, 50000, 100000, 200000, 400000],
  
  // Planungszyklen
  cycles: [
    { start: '2025-01-01', end: '2025-12-31', label: 'bis 30.12.2025' },
    { start: '2025-07-01', end: '2026-06-30', label: 'bis 30.06.2026' }
  ],
  
  // IST-Basis Konfiguration
  ist_basis_cutoff_month: 10, // Oktober
  ist_basis_cutoff_day: 1,
  
  // Team-Durchschnitt Fenster
  team_average_windows: { short: 30, long: 90 }, // Tage
  
  // Features ein/aus
  features: {
    hard_block_inconsistent_goals: false,
    show_team_averages: true,
    show_quota_analysis: true,
    enable_pdf_export: true
  }
};

export async function GET() {
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

    // Load all configurations
    const { data: configs, error } = await supabase
      .from('admin_config')
      .select('*')
      .eq('is_active', true)
      .order('config_key');

    if (error) {
      console.error('Error loading admin config:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Convert to key-value object
    const configMap: Record<string, any> = {};
    configs?.forEach(config => {
      configMap[config.config_key] = config.config_value;
    });

    // Merge with defaults for missing keys
    const mergedConfig = { ...DEFAULT_CONFIG, ...configMap };

    return NextResponse.json({
      success: true,
      data: mergedConfig,
      defaults: DEFAULT_CONFIG
    });

  } catch (error) {
    console.error('Error in GET /api/admin/config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { configKey, configValue, description } = body;

    if (!configKey || configValue === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Upsert configuration
    const { data, error } = await supabase
      .from('admin_config')
      .upsert({
        config_key: configKey,
        config_value: configValue,
        description: description || null,
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving admin config:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error in POST /api/admin/config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { configs } = body; // Array of {key, value, description}

    if (!Array.isArray(configs)) {
      return NextResponse.json({ error: 'Configs must be an array' }, { status: 400 });
    }

    // Update multiple configurations
    const updates = configs.map(config => ({
      config_key: config.key,
      config_value: config.value,
      description: config.description || null,
      is_active: true,
      updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('admin_config')
      .upsert(updates)
      .select();

    if (error) {
      console.error('Error updating admin configs:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error in PUT /api/admin/config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const configKey = searchParams.get('key');

    if (!configKey) {
      return NextResponse.json({ error: 'Missing config key' }, { status: 400 });
    }

    // Soft delete (set is_active to false)
    const { error } = await supabase
      .from('admin_config')
      .update({ is_active: false })
      .eq('config_key', configKey);

    if (error) {
      console.error('Error deleting admin config:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Configuration deleted successfully'
    });

  } catch (error) {
    console.error('Error in DELETE /api/admin/config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
