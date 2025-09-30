# 🏢 Kanzleiablauf System - Vollständige Übersicht

## 📋 **Aktueller Stand (Dezember 2024)**

### **🎯 System-Zweck:**
Führungskräfte-Tool für Team-Management, Event-Verwaltung und Performance-Tracking in einer Kanzlei.

---

## 🗄️ **DATENBANK-SCHEMA (Supabase)**

### **📊 Haupt-Tabellen:**

#### **1. `users` Tabelle:**
```sql
- id: INTEGER (Primary Key)
- clerk_id: TEXT (Unique, Clerk Authentication)
- email: TEXT
- firstname: TEXT
- lastname: TEXT  
- name: TEXT (firstname + lastname)
- role: TEXT (CHECK: 'admin', 'führungskraft', 'berater', 'trainee')
- team_id: INTEGER (Foreign Key → teams.id)
- team_name: TEXT
- is_team_leader: BOOLEAN
- team_leader_for: INTEGER (Foreign Key → teams.id)
- personal_targets: JSONB
- monthly_targets: JSONB
- consent_given: BOOLEAN
- consent_date: TIMESTAMP
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### **2. `teams` Tabelle:**
```sql
- id: INTEGER (Primary Key)
- name: TEXT
- description: TEXT
- team_level: INTEGER (1=Admin, 2=Führungsteams, 3=Unterteams)
- parent_team_id: INTEGER (Foreign Key → teams.id)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### **3. `daily_entries` Tabelle:**
```sql
- id: INTEGER (Primary Key)
- user_id: INTEGER (Foreign Key → users.id)
- entry_date: DATE
- fa_count: INTEGER
- eh_count: INTEGER
- new_appointments: INTEGER
- recommendations: INTEGER
- tiv_invitations: INTEGER
- taa_invitations: INTEGER
- tgs_registrations: INTEGER
- bav_checks: INTEGER
- mood: TEXT
- notes: TEXT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### **4. `events` Tabelle:**
```sql
- id: UUID (Primary Key)
- title: TEXT
- description: TEXT
- event_date: DATE
- start_time: TIME
- end_time: TIME
- location: TEXT
- event_type: TEXT
- status: TEXT
- is_recurring: BOOLEAN
- recurrence_type: TEXT
- recurrence_days: INTEGER[]
- recurrence_interval: INTEGER
- recurrence_end_date: DATE
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### **5. `weekday_questions` Tabelle:**
```sql
- id: INTEGER (Primary Key)
- weekday: INTEGER (1=Monday, 7=Sunday)
- yesterday_question: TEXT or TEXT[]
- today_questions: TEXT[]
- trainee_question: TEXT or TEXT[]
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

---

## 🎭 **ROLLEN-SYSTEM**

### **Rollen-Hierarchie:**
1. **`admin`** - Vollzugriff auf alles
2. **`führungskraft`** - Team-Management + Events verwalten
3. **`berater`** - Tägliche Einträge + Events anzeigen
4. **`trainee`** - Tägliche Einträge + Events anzeigen

### **Team-Leader System:**
- `is_team_leader: true` + `team_leader_for: team_id`
- Team-Leader haben eigenes Dashboard (`/team-leader`)
- Zugriff auf Team-Analytics und Performance

---

## 📱 **SEITEN-ÜBERSICHT**

### **🔐 Authentifizierung:**
- **`/sign-in`** - Clerk Login
- **`/sign-up`** - Clerk Registrierung
- **`/onboarding`** - Erste Anmeldung (Rolle, Ziele, Team)

### **🏠 Haupt-Dashboards:**
- **`/dashboard`** - Haupt-Dashboard (Events, Übersicht)
- **`/kanzleiablauf`** - Team-Performance Übersicht
- **`/berater`** - Tägliche Einträge für Berater

### **👑 Admin-Bereich:**
- **`/admin/dashboard`** - Admin Übersicht
- **`/admin`** - Organigramm (Teams verwalten, Leader setzen)
- **`/admin/analytics`** - Team-Performance Analytics
- **`/admin/events`** - Event-Verwaltung
- **`/admin/weekday-questions`** - Wochentags-Fragen verwalten

### **👥 Team-Management:**
- **`/team-leader`** - Team-Leader Dashboard
- **`/team-performance`** - Team-Performance Übersicht

### **📅 Event-System:**
- **`/events`** - Event-Übersicht
- **`/speaker-registration`** - Referenten-Anmeldung

---

## 🔌 **API-ROUTEN**

### **👤 Benutzer-Management:**
- **`/api/users`** - Benutzer erstellen/abrufen (Onboarding)
- **`/api/admin/users`** - Alle Benutzer für Admin

### **🏢 Team-Management:**
- **`/api/admin/teams`** - Teams verwalten (CRUD)
- **`/api/admin/set-team-leader`** - Team-Leader setzen

### **📊 Analytics:**
- **`/api/admin/analytics`** - Team-Performance für Admin
- **`/api/admin/user-activity`** - Benutzer-Aktivität
- **`/api/team-leader/analytics`** - Team-Analytics für Leader
- **`/api/team-leader/performance`** - Team-Performance für Leader

### **📈 Daten-Abruf:**
- **`/api/kanzleiablauf-data`** - Team-Daten für Kanzleiablauf-Seite
- **`/api/daily-entries`** - Tägliche Einträge
- **`/api/weekday-questions`** - Wochentags-Fragen

### **📅 Events:**
- **`/api/events`** - Event-Verwaltung (CRUD)
- **`/api/admin/events`** - Event-Verwaltung für Admin
- **`/api/admin/speakers`** - Referenten-Verwaltung

---

## 🔄 **DATENFLUSS**

### **1. Benutzer-Registrierung:**
```
Clerk Sign-Up → /onboarding → /api/users → users Tabelle
```

### **2. Admin-Team-Management:**
```
/admin → /api/admin/teams → teams Tabelle
/admin → /api/admin/set-team-leader → users.is_team_leader
```

### **3. Tägliche Einträge:**
```
/berater → /api/daily-entries → daily_entries Tabelle
```

### **4. Team-Performance:**
```
/kanzleiablauf → /api/kanzleiablauf-data → daily_entries + users
```

### **5. Event-Management:**
```
/dashboard → /api/events → events Tabelle
```

---

## ⚠️ **BEKANNTE PROBLEME**

### **1. Weekday-Questions API:**
- Fehler: "Failed to parse URL from /api/weekday-questions"
- **Status:** Zu beheben

### **2. Veraltete Rollen-Namen:**
- Einige Stellen verwenden noch `advisor` statt `berater`
- **Status:** Teilweise behoben

### **3. Team-Leader Funktionalität:**
- Team-Leader Dashboard funktioniert nur wenn `is_team_leader = true`
- **Status:** Funktioniert

---

## 🧹 **AUFRÄUMUNG (Dezember 2024)**

### **✅ Entfernte veraltete APIs:**
- `/api/complete-onboarding` - **GELÖSCHT**
- `/api/check-onboarding` - **GELÖSCHT**
- `/api/team` - **GELÖSCHT**
- `/api/team-data` - **GELÖSCHT**
- `/api/admin/authorize-leader` - **GELÖSCHT**

### **✅ Korrigierte Rollen:**
- Onboarding: `sub_leader` → `berater`
- Admin-Dashboard: `advisor` → `berater`
- Dashboard: `leader` → `führungskraft`

### **✅ Entfernte Features:**
- Manuelle Benutzer-Erstellung in Admin-Panel
- Veraltete Leader-Autorisierung

---

## 🚀 **NÄCHSTE SCHRITTE**

### **1. Sofort zu beheben:**
- [ ] Weekday-Questions API Fehler
- [ ] Alle verbleibenden `advisor` → `berater` Änderungen

### **2. System-Tests:**
- [ ] Onboarding funktioniert
- [ ] Admin kann Teams verwalten
- [ ] Team-Leader Dashboard funktioniert
- [ ] Kanzleiablauf zeigt alle Benutzer
- [ ] Events können erstellt/bearbeitet werden

### **3. Dokumentation:**
- [ ] API-Dokumentation erstellen
- [ ] Rollen-Berechtigungen dokumentieren
- [ ] Deployment-Anleitung

---

## 📝 **WARTUNG**

### **Bei jeder Änderung:**
1. **Datenbank-Schema aktualisieren**
2. **API-Routen dokumentieren**
3. **Veralteten Code sofort entfernen**
4. **Rollen-Konsistenz prüfen**
5. **Build-Test durchführen**

### **Regelmäßige Checks:**
- [ ] Alle API-Routen funktionieren
- [ ] Rollen-System ist konsistent
- [ ] Keine veralteten Imports/APIs
- [ ] Datenbank-Constraints sind korrekt

---

**Letzte Aktualisierung:** Dezember 2024  
**Version:** 1.0 (Aufgeräumt)
