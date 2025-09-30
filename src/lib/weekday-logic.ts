// Weekday-specific logic and recommendation engine

export interface WeekdayQuestions {
  yesterday: string;
  today: string[];
  trainee: string;
}

export interface DatabaseWeekdayQuestion {
  id: string;
  weekday: number;
  yesterday_question: string;
  today_questions: string[];
  trainee_question: string;
  created_at: string;
  updated_at: string;
}

export interface WeeklyGoals {
  fa_weekly_target: number;
  eh_weekly_target: number;
  new_appointments_weekly_target: number;
  recommendations_weekly_target: number;
  tiv_invitations_weekly_target: number;
  taa_invitations_weekly_target: number;
  tgs_registrations_weekly_target: number;
  bav_checks_weekly_target: number;
  additional_goal: string;
}

export interface DailyMetrics {
  fa_count: number;
  eh_count: number;
  new_appointments: number;
  recommendations: number;
  tiv_invitations: number;
  taa_invitations: number;
  tgs_registrations: number;
  bav_checks: number;
}

export interface MonthlyAverages {
  appointments_per_week: number;
  recommendations_per_month: number;
  tiv_per_month: number;
  tgs_per_month: number;
  eh_per_month: number;
}

// Weekday-specific questions - now loads from database via API
export const getWeekdayQuestions = async (weekday: number, isTrainee: boolean = false): Promise<WeekdayQuestions> => {
  try {
    // Only try to load from API if we're on the client side
    if (typeof window !== 'undefined') {
      const response = await fetch(`/api/weekday-questions?weekday=${weekday}`);
      if (response.ok) {
        const dbQuestion: DatabaseWeekdayQuestion = await response.json();
        const baseQuestions: WeekdayQuestions = {
          yesterday: dbQuestion.yesterday_question,
          today: dbQuestion.today_questions,
          trainee: dbQuestion.trainee_question
        };
        
        if (isTrainee) {
          return {
            ...baseQuestions,
            yesterday: baseQuestions.trainee
          };
        }
        
        return baseQuestions;
      }
    }
  } catch (error) {
    console.error('Error loading weekday questions from API:', error);
  }

  // Fallback to hardcoded questions if API fails
  const questions: Record<number, WeekdayQuestions> = {
    1: { // Montag
      yesterday: "Was sind deine drei Diamanten von den Samstagsschulungen?",
      today: ["Welche Beratungen sollen diese Woche durchgesprochen werden?"],
      trainee: "Ein großer Test"
    },
    2: { // Dienstag
      yesterday: "Was sind deine drei Diamanten von den Samstagsschulungen?",
      today: [
        "Welche Nacharbeiten stehen an?",
        "Bei welchen Nacharbeiten brauchst du Hilfe?",
        "Welchen Wettbewerb willst du gewinnen?"
      ],
      trainee: "Ein großer Test"
    },
    3: { // Mittwoch
      yesterday: "Was sind deine drei Diamanten von den Samstagsschulungen?",
      today: [
        "Wen meldest du für die TIV an?",
        "Wen meldest du für die TAA an?",
        "Wer fehlt noch aus deinem Umfeld?",
        "Wen darf deine FK heute für dich einladen?"
      ],
      trainee: "Ein großer Test"
    },
    4: { // Donnerstag
      yesterday: "Was sind deine drei Diamanten von den Samstagsschulungen?",
      today: [
        "Stehen bereits alle Termine für nächste Woche?"
      ],
      trainee: "Ein großer Test"
    },
    5: { // Freitag
      yesterday: "Was sind deine drei Diamanten von den Samstagsschulungen?",
      today: [
        "Welche Firma möchte ich bezüglich bAV kontaktieren?"
      ],
      trainee: "Ein großer Test"
    }
  };

  const baseQuestions = questions[weekday] || questions[1];
  
  if (isTrainee) {
    return {
      ...baseQuestions,
      yesterday: baseQuestions.trainee
    };
  }
  
  return baseQuestions;
};

// Calculate monthly averages for recommendation logic
export const calculateMonthlyAverages = (dailyEntries: any[]): MonthlyAverages => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthEntries = dailyEntries.filter(entry => {
    const entryDate = new Date(entry.entry_date);
    return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
  });

  const totalDays = monthEntries.length;
  if (totalDays === 0) {
    return {
      appointments_per_week: 0,
      recommendations_per_month: 0,
      tiv_per_month: 0,
      tgs_per_month: 0,
      eh_per_month: 0
    };
  }

  const totals = monthEntries.reduce((acc, entry) => ({
    appointments: acc.appointments + (entry.new_appointments || 0),
    recommendations: acc.recommendations + (entry.recommendations || 0),
    tiv: acc.tiv + (entry.tiv_invitations || 0),
    tgs: acc.tgs + (entry.tgs_registrations || 0),
    eh: acc.eh + (entry.eh_count || 0)
  }), {
    appointments: 0,
    recommendations: 0,
    tiv: 0,
    tgs: 0,
    eh: 0
  });

  const weeksInMonth = Math.ceil(new Date(currentYear, currentMonth + 1, 0).getDate() / 7);

  return {
    appointments_per_week: totals.appointments / weeksInMonth,
    recommendations_per_month: totals.recommendations,
    tiv_per_month: totals.tiv,
    tgs_per_month: totals.tgs,
    eh_per_month: totals.eh
  };
};

// Recommendation engine based on monthly averages
export const generateRecommendations = (averages: MonthlyAverages) => {
  const recommendations: any[] = [];

  // <12 Termine pro Woche im Schnitt
  if (averages.appointments_per_week < 12) {
    recommendations.push({
      type: "new_customers",
      title: "Neue Kunden gewinnen",
      suggestions: [
        "MindMap / Netzwerken - wen kenne ich?",
        "Kontaktieren - Anrufen/Anschreiben",
        "Terminieren",
        "Gewinnspiel",
        "FA Aufstellung terminieren - Tankgutschein/Empfehlungsgespräch",
        "Bestehende Assistenten kontaktieren",
        "Kaltakquise (Strom/Gas/KFZ)"
      ]
    });
  }

  // <30 Empfehlungen p.M.
  if (averages.recommendations_per_month < 30) {
    recommendations.push({
      type: "more_recommendations",
      title: "Empfehlungen trainieren",
      suggestions: [
        "Wie werde ich empfehlenswerter? - z.B. Kundenpräsente",
        "Empfehlung in FPG - Namen",
        "Empfehlungen in der Datenaufnahme"
      ]
    });
  }

  // <3 TIV / <1 TGS p.M.
  if (averages.tiv_per_month < 3 || averages.tgs_per_month < 1) {
    recommendations.push({
      type: "new_partners",
      title: "Neue Geschäftspartner gewinnen",
      suggestions: [
        "Karriereoffensive (1000€ Gespräch)",
        "Zusatzeinkommen - letzte Seite FA",
        "FA Aufstellung anrufen und einladen"
      ]
    });
  }

  // <500 EH p.M.
  if (averages.eh_per_month < 500) {
    recommendations.push({
      type: "more_eh",
      title: "Mehr EH",
      suggestions: [
        "bAV Check",
        "Beratungsvorbereitung",
        "Gesprächsabschluss/Beratung trainieren",
        "Selektionen zu bestimmten Themen - z.B. Krankenkasse, Geldanlage"
      ]
    });
  }

  return recommendations;
};

// Calculate progress with color coding
export const calculateProgressWithColor = (current: number, target: number) => {
  if (target === 0) return { progress: 0, color: 'bg-gray-400' };
  
  const progress = Math.min((current / target) * 100, 100);
  
  let color = 'bg-red-500'; // <30%
  if (progress >= 80) {
    color = 'bg-green-500'; // >80%
  } else if (progress >= 30) {
    color = 'bg-yellow-500'; // 30-80%
  }
  
  return { progress, color };
};

// Calculate projection for end of month/week
export const calculateProjection = (current: number, target: number, period: 'week' | 'month' = 'month') => {
  const today = new Date();
  const currentDay = today.getDate();
  
  let totalDays: number;
  if (period === 'week') {
    const dayOfWeek = today.getDay();
    const daysInWeek = 7;
    const remainingDays = daysInWeek - dayOfWeek;
    totalDays = remainingDays;
  } else {
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const remainingDays = daysInMonth - currentDay;
    totalDays = remainingDays;
  }
  
  if (currentDay === 0 || totalDays <= 0) return target;
  
  const dailyAverage = current / currentDay;
  const projectedTotal = current + (dailyAverage * totalDays);
  
  return Math.round(projectedTotal);
};

// Check if previous day is missing
export const checkMissingPreviousDay = (userId: string, currentDate: Date) => {
  const yesterday = new Date(currentDate);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Skip weekends
  const dayOfWeek = yesterday.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) return false;
  
  // In real implementation, check database for yesterday's entry
  // For now, return false (no missing entry)
  return false;
};

// Auto-generate ToDos based on recommendations
export const generateAutoToDos = (recommendations: any[]) => {
  const todos: string[] = [];
  
  recommendations.forEach(rec => {
    if (rec.suggestions && rec.suggestions.length > 0) {
      // Take first suggestion as auto ToDo
      todos.push(rec.suggestions[0]);
    }
  });
  
  // Always add Charismatraining
  todos.push("Charismatraining");
  
  return todos.map(text => ({
    text,
    completed: false,
    carried_over: false,
    auto_generated: true
  }));
};

// Get week start date (Monday)
export const getWeekStartDate = (date: Date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
};

// Check if it's weekend (Friday after 18:00, Saturday, Sunday)
export const isWeekend = () => {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  
  return day === 0 || day === 6 || (day === 5 && hour >= 18);
};
