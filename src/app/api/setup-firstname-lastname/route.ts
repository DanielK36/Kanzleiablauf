import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function POST() {
  try {
    const supabase = createSupabaseServerClient();

    // Try to add firstName column
    let firstNameError = null;
    try {
      const { error } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS firstName VARCHAR(100);'
      });
      firstNameError = error;
    } catch (err) {
      firstNameError = err;
    }

    if (firstNameError) {
      console.error('Error adding firstName column:', firstNameError);
      return NextResponse.json({ 
        error: 'Failed to add firstName column', 
        details: firstNameError.message || 'exec_sql function not available',
        hint: 'Bitte führe das SQL-Script manuell in Supabase aus: ALTER TABLE users ADD COLUMN IF NOT EXISTS firstName VARCHAR(100);'
      }, { status: 500 });
    }

    // Try to add lastName column
    let lastNameError = null;
    try {
      const { error } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS lastName VARCHAR(100);'
      });
      lastNameError = error;
    } catch (err) {
      lastNameError = err;
    }

    if (lastNameError) {
      console.error('Error adding lastName column:', lastNameError);
      return NextResponse.json({ 
        error: 'Failed to add lastName column', 
        details: lastNameError.message || 'exec_sql function not available',
        hint: 'Bitte führe das SQL-Script manuell in Supabase aus: ALTER TABLE users ADD COLUMN IF NOT EXISTS lastName VARCHAR(100);'
      }, { status: 500 });
    }

    // Try to update existing records
    let updateError = null;
    try {
      const { error } = await supabase.rpc('exec_sql', {
        sql: `UPDATE users 
          SET 
            firstName = CASE 
              WHEN name IS NOT NULL AND name != '' THEN 
                CASE 
                  WHEN position(' ' in name) > 0 THEN 
                    substring(name from 1 for position(' ' in name) - 1)
                  ELSE name
                END
              ELSE NULL
            END,
            lastName = CASE 
              WHEN name IS NOT NULL AND name != '' THEN 
                CASE 
                  WHEN position(' ' in name) > 0 THEN 
                    substring(name from position(' ' in name) + 1)
                  ELSE NULL
                END
              ELSE NULL
            END
          WHERE firstName IS NULL OR lastName IS NULL;`
      });
      updateError = error;
    } catch (err) {
      updateError = err;
    }

    if (updateError) {
      console.error('Error updating existing records:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update existing records', 
        details: updateError.message || 'exec_sql function not available',
        hint: 'Bitte führe das SQL-Script manuell in Supabase aus. Siehe ADD_FIRSTNAME_LASTNAME_COLUMNS.sql'
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'firstName und lastName Spalten erfolgreich hinzugefügt und bestehende Daten konvertiert' 
    });

  } catch (error) {
    console.error('Error in setup-firstname-lastname:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error',
      hint: 'Bitte führe das SQL-Script manuell in Supabase aus. Siehe ADD_FIRSTNAME_LASTNAME_COLUMNS.sql'
    }, { status: 500 });
  }
}
