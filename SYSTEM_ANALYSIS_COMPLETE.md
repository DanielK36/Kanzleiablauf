# 🔍 VOLLSTÄNDIGE SYSTEM-ANALYSE

## 📋 ÜBERSICHT ALLER SEITEN UND API-ROUTEN

### 🏠 HAUPTSEITEN

#### 1. **ONBOARDING** (`/onboarding`)
- **Zweck:** Benutzerregistrierung und erste Einrichtung
- **API-Aufrufe:**
  - `GET /api/users` - Lädt bestehende Benutzerdaten
  - `POST /api/users` - Speichert neue Benutzerdaten
  - `POST /api/monthly-goals` - Speichert Monatsziele
- **Datenbank-Zugriffe:**
  - **Tabelle:** `users`
  - **Operationen:** READ, CREATE, UPDATE
  - **Felder:** `firstName`, `lastName`, `name`, `team_name`, `role`, `personal_targets`
- **Besonderheiten:**
  - Überspringt Team-Setup wenn Team bereits existiert
  - Admin wird direkt zum Dashboard weitergeleitet
  - Speichert Monatsziele direkt in `personal_targets` (keine Rundungsfehler)

#### 2. **DASHBOARD** (`/dashboard`)
- **Zweck:** Hauptübersicht für alle Benutzerrollen
- **API-Aufrufe:**
  - `GET /api/users` - Lädt Benutzerdaten
  - `GET /api/weekly-progress` - Lädt Wochenfortschritt
  - `GET /api/daily-entries/monthly-progress` - Lädt Monatsfortschritt
  - `GET /api/team-goals` - Lädt Team-Ziele
  - `GET /api/events` - Lädt kommende Events
- **Datenbank-Zugriffe:**
  - **Tabelle:** `users`, `weekly_goals`, `daily_entries`, `events`
  - **Operationen:** READ
  - **Felder:** `personal_targets`, `weekly_goals.*`, `daily_entries.*`
- **Besonderheiten:**
  - Zeigt 2 Balken für Monatsfortschritt (persönlich + Team)
  - Leadership-Tiles für Führungskräfte
  - Auto-Refresh alle 30 Sekunden

#### 3. **BERATER-SEITE** (`/berater`)
- **Zweck:** Tägliche Einträge und Wochenziele
- **API-Aufrufe:**
  - `GET /api/users` - Lädt Benutzerdaten
  - `GET /api/weekly-progress` - Lädt Wochenziele
  - `POST /api/daily-entries/berater` - Speichert Tageseinträge
  - `POST /api/weekly-progress` - Speichert Wochenziele
- **Datenbank-Zugriffe:**
  - **Tabelle:** `users`, `daily_entries`, `weekly_goals`
  - **Operationen:** READ, CREATE, UPDATE
  - **Felder:** `daily_entries.*`, `weekly_goals.*`
- **Besonderheiten:**
  - Speichert "gestern" Ergebnisse in heutigem Eintrag
  - Konvertiert `todos_completed` Array zu String
  - Speichert `charisma_training` als Boolean

#### 4. **TEAM-GOALS** (`/team-goals`)
- **Zweck:** Persönliche und Team-Ziele verwalten
- **API-Aufrufe:**
  - `GET /api/monthly-goals` - Lädt persönliche Monatsziele
  - `GET /api/weekly-progress` - Lädt persönliche Wochenziele
  - `GET /api/team-goals` - Lädt Team-Ziele
  - `POST /api/monthly-goals` - Speichert persönliche Monatsziele
  - `POST /api/weekly-progress` - Speichert persönliche Wochenziele
  - `POST /api/team-goals` - Speichert Team-Ziele
- **Datenbank-Zugriffe:**
  - **Tabelle:** `users`, `weekly_goals`
  - **Operationen:** READ, CREATE, UPDATE
  - **Felder:** `personal_targets`, `weekly_goals.*`
- **Besonderheiten:**
  - Team-Ziele werden in `personal_targets` mit `_monthly_target` Feldern gespeichert
  - Wochenziele werden als `weeklyGoals` Objekt gespeichert

#### 5. **KANZLEIABLAUF** (`/kanzleiablauf`)
- **Zweck:** Team-Übersicht und Performance-Analyse
- **API-Aufrufe:**
  - `GET /api/kanzleiablauf-data` - Lädt alle Team-Daten
- **Datenbank-Zugriffe:**
  - **Tabelle:** `users`, `daily_entries`, `weekly_goals`
  - **Operationen:** READ
  - **Felder:** Alle relevanten Felder für Team-Aggregation
- **Besonderheiten:**
  - Aggregiert Daten aller Teammitglieder
  - Berechnet Wochen- und Monatsfortschritt
  - Zeigt "gestern" Ergebnisse aus heutigen Einträgen

### 🔧 ADMIN-SEITEN

#### 6. **ADMIN DASHBOARD** (`/admin/dashboard`)
- **Zweck:** Admin-Übersicht und Navigation
- **API-Aufrufe:**
  - `GET /api/admin/analytics` - Lädt Admin-Statistiken
- **Datenbank-Zugriffe:**
  - **Tabelle:** `users`, `daily_entries`, `teams`
  - **Operationen:** READ
- **Besonderheiten:**
  - Zeigt Gesamtstatistiken aller Teams
  - Navigation zu allen Admin-Funktionen

#### 7. **ADMIN ORGANIGRAMM** (`/admin`)
- **Zweck:** Team-Hierarchie verwalten
- **API-Aufrufe:**
  - `GET /api/admin/users` - Lädt alle Benutzer
  - `GET /api/admin/teams` - Lädt alle Teams
  - `POST /api/admin/set-team-leader` - Setzt Team-Leader
  - `POST /api/admin/assign-user-to-team` - Weist Benutzer Teams zu
- **Datenbank-Zugriffe:**
  - **Tabelle:** `users`, `teams`
  - **Operationen:** READ, UPDATE
  - **Felder:** `team_id`, `team_leader_for`, `is_team_leader`

#### 8. **ADMIN ANALYTICS** (`/admin/analytics`)
- **Zweck:** Detaillierte Performance-Analyse
- **API-Aufrufe:**
  - `GET /api/admin/analytics` - Lädt detaillierte Analytics
- **Datenbank-Zugriffe:**
  - **Tabelle:** `users`, `daily_entries`, `weekly_goals`
  - **Operationen:** READ
- **Besonderheiten:**
  - Aggregiert Daten über alle Teams
  - Zeigt Trends und Performance-Metriken

#### 9. **ADMIN EVENTS** (`/admin/events`)
- **Zweck:** Veranstaltungen und Referenten verwalten
- **API-Aufrufe:**
  - `GET /api/events` - Lädt alle Events
  - `POST /api/events` - Erstellt neue Events
  - `PUT /api/events` - Aktualisiert Events
  - `DELETE /api/events` - Löscht Events
- **Datenbank-Zugriffe:**
  - **Tabelle:** `events`, `speakers`, `event_speakers`, `event_registrations`
  - **Operationen:** READ, CREATE, UPDATE, DELETE
- **Besonderheiten:**
  - UUID-basierte IDs
  - Recurrence-Logik für wiederkehrende Events

#### 10. **ADMIN WEEKTAG-FRAGEN** (`/admin/weekday-questions`)
- **Zweck:** Fragen für verschiedene Wochentage konfigurieren
- **API-Aufrufe:**
  - `GET /api/admin/weekday-questions` - Lädt Wochentag-Fragen
  - `POST /api/admin/weekday-questions` - Speichert Wochentag-Fragen
- **Datenbank-Zugriffe:**
  - **Tabelle:** `weekday_questions`
  - **Operationen:** READ, CREATE, UPDATE
- **Besonderheiten:**
  - Konvertiert einzelne Fragen von Array zu String

## 🗄️ DATENBANK-TABELLEN ANALYSE

### **USERS** Tabelle
- **Zweck:** Zentrale Benutzerdaten
- **Wichtige Felder:**
  - `clerk_id` - Clerk Authentication ID
  - `firstname`, `lastname`, `name` - Benutzername
  - `role` - Benutzerrolle (admin, führungskraft, berater, trainee)
  - `team_id` - Team-Zugehörigkeit
  - `personal_targets` - JSONB mit Monatszielen
  - `team_leader_for` - Team-ID wenn Team-Leader
  - `is_team_leader` - Boolean für Team-Leader-Status
- **Zugriffe von:**
  - Alle Seiten lesen Benutzerdaten
  - Onboarding, Team-Goals, Admin-Seiten schreiben

### **DAILY_ENTRIES** Tabelle
- **Zweck:** Tägliche Einträge der Berater
- **Wichtige Felder:**
  - `user_id` - Verknüpfung zu Users
  - `entry_date` - Datum des Eintrags
  - `fa_count`, `eh_count`, etc. - Tagesergebnisse
  - `todos_completed` - String mit abgehakten ToDos
  - `charisma_training` - Boolean
  - `yesterday_results` - JSONB mit "gestern" Ergebnissen
- **Zugriffe von:**
  - Berater-Seite (schreibt)
  - Dashboard, Kanzleiablauf (liest)
  - Admin Analytics (liest)

### **WEEKLY_GOALS** Tabelle
- **Zweck:** Wochenziele der Berater
- **Wichtige Felder:**
  - `user_id` - Verknüpfung zu Users
  - `week_start_date` - Woche Start-Datum
  - `fa_weekly_target`, `eh_weekly_target`, etc. - Wochenziele
  - `additional_goal` - Zusätzliches Ziel
- **Zugriffe von:**
  - Berater-Seite, Team-Goals (schreibt)
  - Dashboard, Kanzleiablauf (liest)

### **TEAMS** Tabelle
- **Zweck:** Team-Definitionen
- **Wichtige Felder:**
  - `id` - Team-ID (INTEGER)
  - `name` - Team-Name
  - `description` - Team-Beschreibung
- **Zugriffe von:**
  - Admin-Seiten (verwaltet)
  - Users-Tabelle (Referenz)

### **EVENTS** Tabelle
- **Zweck:** Veranstaltungen
- **Wichtige Felder:**
  - `id` - Event-ID (UUID)
  - `title` - Event-Titel
  - `description` - Event-Beschreibung
  - `start_date`, `end_date` - Zeiträume
  - `recurrence_type` - Wiederholungstyp
- **Zugriffe von:**
  - Admin Events (verwaltet)
  - Dashboard (liest kommende Events)

### **WEEKDAY_QUESTIONS** Tabelle
- **Zweck:** Fragen für verschiedene Wochentage
- **Wichtige Felder:**
  - `weekday` - Wochentag
  - `yesterday_question` - Gestern-Frage
  - `trainee_question` - Trainee-Frage
- **Zugriffe von:**
  - Admin Weekday-Questions (verwaltet)
  - Berater-Seite (liest)

## ⚠️ IDENTIFIZIERTE PROBLEME UND INKONSISTENZEN

### 🔴 **KRITISCHE PROBLEME**

#### 1. **AUTHENTICATION CHAOS**
- **Problem:** Verschiedene APIs verwenden verschiedene Auth-Methoden
- **Betroffen:**
  - `/api/users` - Fallback `userId`
  - `/api/monthly-goals` - Fallback `userId`
  - `/api/weekly-progress` - Fallback `userId`
  - `/api/team-goals` - Fallback `userId`
  - `/api/daily-entries` - Clerk `auth()`
  - `/api/kanzleiablauf-data` - Keine Auth
- **Auswirkung:** Inkonsistente Benutzeridentifikation

#### 2. **DATENTYP-INKONSISTENZEN**
- **Problem:** Verschiedene APIs erwarten verschiedene Datentypen
- **Beispiele:**
  - `todos_completed`: Array vs String
  - `charisma_training`: Boolean vs String
  - `personal_targets`: Verschiedene Feldnamen
- **Auswirkung:** Daten werden nicht korrekt gespeichert/geladen

#### 3. **FELDNAME-INKONSISTENZEN**
- **Problem:** Verschiedene APIs verwenden verschiedene Feldnamen
- **Beispiele:**
  - Monatsziele: `fa_monthly` vs `fa_monthly_target`
  - Wochenziele: `fa_target` vs `fa_weekly_target`
  - Team-Ziele: `fa_monthly_target` vs `faTarget`
- **Auswirkung:** Daten werden nicht korrekt zugeordnet

#### 4. **DATENFLUSS-PROBLEME**
- **Problem:** "Gestern" Ergebnisse werden inkonsistent gespeichert
- **Beispiel:**
  - Berater-Seite speichert "gestern" in heutigem Eintrag
  - Kanzleiablauf liest "gestern" aus gestern Eintrag
- **Auswirkung:** Falsche Anzeige von Ergebnissen

### 🟡 **MITTLERE PROBLEME**

#### 5. **API-RESPONSE-INKONSISTENZEN**
- **Problem:** Verschiedene APIs geben verschiedene Response-Formate zurück
- **Beispiele:**
  - `/api/weekly-progress` gibt `weeklyProgress` zurück
  - Team-Goals erwartet `weeklyGoals`
- **Auswirkung:** Frontend kann Daten nicht korrekt verarbeiten

#### 6. **DATENBANK-SCHEMA-INKONSISTENZEN**
- **Problem:** Verschiedene Tabellen verwenden verschiedene ID-Typen
- **Beispiele:**
  - `teams.id` ist INTEGER
  - `events.id` ist UUID
  - `users.team_leader_for` ist UUID aber sollte INTEGER sein
- **Auswirkung:** Foreign Key Constraints schlagen fehl

### 🟢 **KLEINERE PROBLEME**

#### 7. **FEHLENDE VALIDIERUNG**
- **Problem:** APIs validieren Eingabedaten nicht ausreichend
- **Auswirkung:** Inkonsistente Daten in der Datenbank

#### 8. **FEHLENDE FEHLERBEHANDLUNG**
- **Problem:** APIs behandeln Fehler nicht einheitlich
- **Auswirkung:** Schwer zu debuggen

## 🎯 **LÖSUNGSVORSCHLÄGE**

### **PRIORITÄT 1: AUTHENTICATION STANDARDISIEREN**
1. Alle APIs auf einheitliche Auth-Methode umstellen
2. Fallback-Mechanismen entfernen
3. Konsistente Benutzeridentifikation

### **PRIORITÄT 2: DATENTYPEN STANDARDISIEREN**
1. Einheitliche Feldnamen definieren
2. Datentyp-Konvertierungen zentralisieren
3. API-Response-Formate vereinheitlichen

### **PRIORITÄT 3: DATENFLUSS REPARIEREN**
1. "Gestern" Logik vereinheitlichen
2. Datenfluss zwischen Seiten dokumentieren
3. Inkonsistenzen beheben

### **PRIORITÄT 4: DATENBANK-SCHEMA BEREINIGEN**
1. ID-Typen vereinheitlichen
2. Foreign Key Constraints reparieren
3. Fehlende Indizes hinzufügen

## 📊 **ZUSAMMENFASSUNG**

Das System hat **37 API-Routen** und **10 Hauptseiten**. Die Hauptprobleme sind:

1. **Authentication-Chaos** - Verschiedene Auth-Methoden
2. **Datentyp-Inkonsistenzen** - Verschiedene Feldnamen und -typen
3. **Datenfluss-Probleme** - Inkonsistente Logik zwischen Seiten
4. **API-Response-Inkonsistenzen** - Verschiedene Response-Formate

**Empfehlung:** Systematische Bereinigung der Authentication und Datentypen als erste Priorität.
