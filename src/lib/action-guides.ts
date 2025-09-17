export const mondayGuides = {
  leader: {
    focus: "Follow-up & Wochenziele",
    steps: [
      "Öffne das Wochenend-Seminar-Protokoll",
      "Identifiziere die 3 wichtigsten Follow-ups",
      "Weise jedem Berater 1-2 konkrete Nacharbeiten zu",
      "Definiere klare Wochenziele: FA/EH/TIV pro Person",
      "Script: 'Max, deine Nacharbeit heute: Anruf bei Familie Schmidt wegen...'"
    ],
    scripts: [
      "Schauen wir uns das Wochenend-Seminar-Protokoll an...",
      "Die wichtigsten Follow-ups sind: 1. Familie Schmidt, 2. Herr Müller, 3. Frau Weber",
      "Max, du rufst Familie Schmidt an. Sarah, du kümmerst dich um Herrn Müller.",
      "Unsere Wochenziele: Max 5 FA, Sarah 3 EH, Team 8 TIV",
      "Max, deine Nacharbeit heute: Anruf bei Familie Schmidt wegen der Versicherungsanfrage. Script: 'Hallo Familie Schmidt, wie versprochen rufe ich an...'"
    ]
  },
  advisor: {
    focus: "Follow-up & Wochenziele",
    steps: [
      "Liste alle Kontakte vom Wochenend-Seminar auf",
      "Priorisiere: Wer war am interessiertesten?",
      "Rufe die Top 3 bis 14:00 Uhr an",
      "Script: 'Hallo Familie Schmidt, wie versprochen rufe ich an...'",
      "Dokumentiere Ergebnisse für Morgenbesprechung morgen"
    ],
    scripts: [
      "Meine Kontakte vom Wochenend-Seminar: Familie Schmidt, Herr Müller, Frau Weber, Herr Klein",
      "Priorisierung: 1. Familie Schmidt (sehr interessiert), 2. Herr Müller (Termin gewünscht), 3. Frau Weber (Rückruf)",
      "Ich rufe jetzt Familie Schmidt an...",
      "Hallo Familie Schmidt, wie versprochen rufe ich an. Haben Sie noch Fragen zu unserem Gespräch vom Wochenende?",
      "Ergebnisse: Familie Schmidt - Termin nächste Woche, Herr Müller - Rückruf morgen, Frau Weber - Info per E-Mail"
    ]
  }
};

export const tuesdayGuides = {
  leader: {
    focus: "Potentials & Neukundenakquise",
    steps: [
      "Überprüfe Potentials-Liste der letzten 30 Tage",
      "Identifiziere 3 Top-Potentials pro Berater",
      "Plane konkrete Akquisitions-Aktivitäten",
      "Script: 'Sarah, dein Top-Potential ist Familie Schmidt. Plan: Anruf heute 15:00 Uhr'",
      "Definiere Tagesziele: 2 neue Termine pro Person"
    ],
    scripts: [
      "Schauen wir uns die Potentials der letzten 30 Tage an...",
      "Top-Potentials: Max - Familie Schmidt, Sarah - Herr Müller, Tom - Frau Weber",
      "Aktionsplan: Max ruft Familie Schmidt an, Sarah besucht Herrn Müller, Tom schreibt Frau Weber",
      "Sarah, dein Top-Potential ist Familie Schmidt. Plan: Anruf heute 15:00 Uhr mit dem neuen Tarif-Angebot",
      "Tagesziele: Jeder von euch soll heute 2 neue Termine vereinbaren"
    ]
  },
  advisor: {
    focus: "Potentials & Neukundenakquise",
    steps: [
      "Überprüfe deine Potentials-Liste",
      "Wähle 3 Top-Potentials aus",
      "Plane konkrete Akquisitions-Aktivitäten",
      "Script: 'Hallo Familie Schmidt, ich habe ein interessantes Angebot für Sie...'",
      "Ziel: 2 neue Termine heute vereinbaren"
    ],
    scripts: [
      "Meine Potentials: Familie Schmidt, Herr Müller, Frau Weber, Herr Klein",
      "Top 3: 1. Familie Schmidt (sehr interessiert), 2. Herr Müller (Termin gewünscht), 3. Frau Weber (Rückruf)",
      "Plan: Familie Schmidt anrufen, Herrn Müller besuchen, Frau Weber E-Mail schreiben",
      "Hallo Familie Schmidt, ich habe ein interessantes Angebot für Sie. Haben Sie 10 Minuten Zeit?",
      "Ziel erreicht: 2 Termine vereinbart - Familie Schmidt (Donnerstag) und Herr Müller (Freitag)"
    ]
  }
};

export const wednesdayGuides = {
  leader: {
    focus: "Recruiting & Business Partners",
    steps: [
      "Überprüfe Recruiting-Pipeline",
      "Identifiziere 2-3 Kandidaten für Gespräche",
      "Plane Business Partner Meetings",
      "Script: 'Max, dein Kandidat Herr Schmidt ist interessiert. Gespräch morgen 14:00 Uhr'",
      "Definiere Recruiting-Ziele: 1 neuer Kandidat pro Woche"
    ],
    scripts: [
      "Schauen wir uns die Recruiting-Pipeline an...",
      "Interessante Kandidaten: Herr Schmidt (Max), Frau Müller (Sarah), Herr Weber (Tom)",
      "Business Partner Meetings: Versicherung ABC (heute 16:00), Bank XYZ (morgen 10:00)",
      "Max, dein Kandidat Herr Schmidt ist sehr interessiert. Gespräch morgen 14:00 Uhr in unserem Büro",
      "Recruiting-Ziel: Jeder von euch soll diese Woche 1 neuen Kandidaten für ein Gespräch gewinnen"
    ]
  },
  advisor: {
    focus: "Recruiting & Business Partners",
    steps: [
      "Überprüfe deine Recruiting-Liste",
      "Identifiziere 2-3 Kandidaten",
      "Plane Gespräche und Meetings",
      "Script: 'Hallo Herr Schmidt, ich habe von Ihrem Interesse gehört...'",
      "Ziel: 1 neuer Kandidat für Gespräch gewinnen"
    ],
    scripts: [
      "Meine Recruiting-Kandidaten: Herr Schmidt, Frau Müller, Herr Weber",
      "Top 3: 1. Herr Schmidt (sehr interessiert), 2. Frau Müller (Termin gewünscht), 3. Herr Weber (Rückruf)",
      "Plan: Herrn Schmidt anrufen, Frau Müller treffen, Herrn Weber E-Mail schreiben",
      "Hallo Herr Schmidt, ich habe von Ihrem Interesse an einer Tätigkeit bei uns gehört. Haben Sie Zeit für ein Gespräch?",
      "Ziel erreicht: Herr Schmidt hat morgen 14:00 Uhr Zeit für ein Gespräch"
    ]
  }
};

export const getActionGuides = (weekday: string, role: 'leader' | 'advisor') => {
  const day = weekday.toLowerCase();
  
  if (day === 'monday' || day === 'montag') {
    return mondayGuides[role];
  } else if (day === 'tuesday' || day === 'dienstag') {
    return tuesdayGuides[role];
  } else if (day === 'wednesday' || day === 'mittwoch') {
    return wednesdayGuides[role];
  }
  
  // Default fallback
  return {
    focus: "Tägliche Führungsaufgaben",
    steps: [
      "Überprüfe deine Tagesziele",
      "Führe Team-Check-in durch",
      "Bearbeite wichtige Aufgaben",
      "Dokumentiere Ergebnisse",
      "Plane den nächsten Tag"
    ],
    scripts: [
      "Was sind deine wichtigsten Ziele für heute?",
      "Wie geht es dir heute? Was brauchst du für Unterstützung?",
      "Lass uns die wichtigsten Aufgaben angehen...",
      "Was haben wir heute erreicht?",
      "Was steht morgen an? Was brauchst du dafür?"
    ]
  };
};
