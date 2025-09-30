import { createSupabaseServerClient } from '@/lib/supabase';

export async function updateWeekdayQuestions() {
  const supabase = createSupabaseServerClient();
  
  try {
    // Lösche alle bestehenden Fragen
    const { error: deleteError } = await supabase
      .from('weekday_questions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (deleteError) {
      console.error('Error deleting weekday questions:', deleteError);
      return { success: false, error: deleteError };
    }

    // Füge neue Fragen hinzu
    const questions = [
      {
        weekday: 1,
        yesterday_question: 'Was sind deine drei Diamanten von den Samstagsschulungen?',
        today_questions: [
          'Wobei brauchst du heute Hilfe?',
          'Was willst du heute trainieren?',
          'Was willst du heute noch besser machen?',
          'Welche Beratungen sollen diese Woche durchgesprochen werden?'
        ],
        trainee_question: 'Ein großer Test'
      },
      {
        weekday: 2,
        yesterday_question: 'Was sind deine drei Diamanten von den Samstagsschulungen?',
        today_questions: [
          'Wobei brauchst du heute Hilfe?',
          'Was willst du heute trainieren?',
          'Was willst du heute noch besser machen?',
          'Welche Beratungen sollen diese Woche durchgesprochen werden?'
        ],
        trainee_question: 'Ein großer Test'
      },
      {
        weekday: 3,
        yesterday_question: 'Was sind deine drei Diamanten von den Samstagsschulungen?',
        today_questions: [
          'Wobei brauchst du heute Hilfe?',
          'Was willst du heute trainieren?',
          'Was willst du heute noch besser machen?',
          'Welche Beratungen sollen diese Woche durchgesprochen werden?'
        ],
        trainee_question: 'Ein großer Test'
      },
      {
        weekday: 4,
        yesterday_question: 'Was sind deine drei Diamanten von den Samstagsschulungen?',
        today_questions: [
          'Wobei brauchst du heute Hilfe?',
          'Was willst du heute trainieren?',
          'Was willst du heute noch besser machen?',
          'Welche Beratungen sollen diese Woche durchgesprochen werden?'
        ],
        trainee_question: 'Ein großer Test'
      },
      {
        weekday: 5,
        yesterday_question: 'Was sind deine drei Diamanten von den Samstagsschulungen?',
        today_questions: [
          'Wobei brauchst du heute Hilfe?',
          'Was willst du heute trainieren?',
          'Was willst du heute noch besser machen?',
          'Welche Beratungen sollen diese Woche durchgesprochen werden?'
        ],
        trainee_question: 'Ein großer Test'
      }
    ];

    const { data, error } = await supabase
      .from('weekday_questions')
      .insert(questions);

    if (error) {
      console.error('Error inserting weekday questions:', error);
      return { success: false, error };
    }

    console.log('Successfully updated weekday questions:', data);
    return { success: true, data };

  } catch (error) {
    console.error('Error updating weekday questions:', error);
    return { success: false, error };
  }
}

