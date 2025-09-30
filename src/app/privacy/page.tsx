import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Datenschutzerklärung</CardTitle>
            <p className="text-gray-600">Stand: September 2025</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Verantwortlicher</h2>
              <p className="text-gray-700">
                Daniel Kuhlen<br />
                Hennes-Weisweiler-Allee 8<br />
                41179 Mönchengladbach<br />
                Telefon: 0176 830 88 327<br />
                E-Mail: Daniel.Kuhlen@Telis-finanz.de
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Zweck der Datenverarbeitung</h2>
              <p className="text-gray-700">
                Dieses Portal dient der freiwilligen Eingabe und Auswertung von Ziel- und Leistungsdaten durch selbstständige Partner. Die Daten werden genutzt für:
              </p>
              <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
                <li>Anzeige für die jeweilige Führungskraft im Organisationsbaum (gemäß Telis-Struktur)</li>
                <li>Erstellung von Team- und Partner-Auswertungen</li>
                <li>Generierung von Reports und Exporten (PDF/CSV)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Rechtsgrundlage</h2>
              <p className="text-gray-700">
                Die Verarbeitung erfolgt auf Grundlage von:
              </p>
              <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
                <li><strong>Art. 6 Abs. 1 lit. a DSGVO (Einwilligung)</strong></li>
                <li>ergänzend <strong>Art. 6 Abs. 1 lit. b DSGVO (vertragliche Erforderlichkeit)</strong></li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Datenarten</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Zielwerte (monatlich, wöchentlich, teambezogen)</li>
                <li>Ist-Werte (z. B. Anzahl Termine, Empfehlungen, Beratungen)</li>
                <li>interne Kennzahlen für Führungs- und Team-Auswertungen</li>
              </ul>
              <p className="text-gray-700 mt-2">
                Es werden keine besonderen Kategorien personenbezogener Daten (z. B. Gesundheitsdaten) erhoben.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Speicherdauer</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Daten werden <strong>maximal 24 Monate</strong> gespeichert.</li>
                <li>Danach erfolgt eine <strong>Anonymisierung</strong> für statistische Zwecke.</li>
                <li>Mit Austritt aus der Organisation wird der Zugang gesperrt und die personenbezogenen Daten inaktiv gesetzt.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Datenweitergabe & Hosting</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Zugriff haben ausschließlich Führungskräfte innerhalb der Organisationsstruktur.</li>
                <li>Eine Weitergabe an Dritte erfolgt nicht.</li>
                <li>Hosting: Supabase (Postgres-DB) mit europäischen Serverstandorten (z. B. AWS/Google Cloud in Frankfurt oder Irland).</li>
                <li>Es besteht ein Auftragsverarbeitungsvertrag (AVV) mit Supabase.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Rechte der Betroffenen</h2>
              <p className="text-gray-700">
                Jeder Nutzer hat das Recht auf:
              </p>
              <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
                <li>Auskunft über gespeicherte Daten</li>
                <li>Berichtigung unrichtiger Daten</li>
                <li>Löschung oder Einschränkung der Verarbeitung</li>
                <li>Widerruf einer erteilten Einwilligung (Art. 7 DSGVO)</li>
                <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
              </ul>
              <p className="text-gray-700 mt-2">
                Anfragen an: <strong>Daniel.Kuhlen@Telis-finanz.de</strong>
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Sicherheit</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Zugriffskontrolle nach Rollen: Nutzer sehen nur eigene Daten, Führungskräfte nur die ihrer Organisation.</li>
                <li>Übertragung verschlüsselt per SSL/TLS.</li>
              </ul>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

