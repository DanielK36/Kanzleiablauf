import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">📄 Datenschutzerklärung</CardTitle>
            <p className="text-gray-600 text-center mt-2">Stand: Oktober 2025</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-2xl font-bold mb-3">1. Verantwortlicher</h2>
              <p className="text-gray-700">
                Daniel Kuhlen<br />
                Hennes-Weisweiler-Allee 8<br />
                41179 Mönchengladbach<br />
                Tel.: 0176 83088327<br />
                E-Mail: daniel.kuhlen@telis-finanz.de
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">2. Zweck der Verarbeitung</h2>
              <p className="text-gray-700 mb-3">
                Die Plattform dient der Erfassung, Auswertung und Darstellung von Leistungs- und Zielzahlen 
                im Rahmen der Zusammenarbeit von selbstständigen Finanzdienstleistern (Beratern) und deren Führungskräften.
              </p>
              <p className="text-gray-700 mb-2">Daten werden ausschließlich zur:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Eingabe persönlicher Ziele und Ist-Zahlen,</li>
                <li>Darstellung im eigenen Berater-Dashboard,</li>
                <li>Führungskräfte-Übersicht (Ziele und Ist-Zahlen des Teams),</li>
                <li>Admin-Auswertung (aggregierte Kennzahlen für Teamleitung),</li>
              </ul>
              <p className="text-gray-700 mt-2">verarbeitet.</p>
              <p className="text-gray-700 mt-2">
                Eine Verarbeitung zu anderen Zwecken (z. B. Werbung, Weitergabe an Dritte) erfolgt nicht.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">3. Rechtsgrundlage der Verarbeitung</h2>
              <p className="text-gray-700 mb-2">Die Verarbeitung erfolgt auf Grundlage von:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Art. 6 Abs. 1 lit. b DSGVO (Erfüllung eines Vertragsverhältnisses bzw. vorbereitender Maßnahmen).</li>
                <li>Art. 6 Abs. 1 lit. a DSGVO (Einwilligung) für die freiwillige Eingabe personenbezogener Daten.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">4. Verarbeitete Daten</h2>
              <p className="text-gray-700 mb-2">Folgende Kategorien personenbezogener Daten können verarbeitet werden:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li><strong>Identifikationsdaten:</strong> Name, E-Mail-Adresse (für Login).</li>
                <li><strong>Ziel- und Leistungsdaten:</strong> z. B. Anzahl Termine, Empfehlungen, Finanzanalysen, Teamziele.</li>
                <li><strong>Führungskraft-Zuweisungen:</strong> Zuordnung zum Teamleiter / Führungskraft.</li>
                <li><strong>Freitexteingaben:</strong> z. B. Begründungen, Schwerpunkte, Wocheneinträge.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">5. Empfänger der Daten</h2>
              <p className="text-gray-700 mb-2">Zugriff auf die Daten haben ausschließlich:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Der/die jeweilige Nutzer/in selbst.</li>
                <li>Die direkte Führungskraft / Teamleiter entsprechend der Organisationsstruktur.</li>
                <li>Der Admin (Daniel Kuhlen) für technische Verwaltung und Gesamtauswertung.</li>
              </ul>
              <p className="text-gray-700 mt-2">Eine Weitergabe an Dritte außerhalb des Systems erfolgt nicht.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">6. Speicherdauer</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li><strong>Reguläre Speicherdauer:</strong> 2 Jahre.</li>
                <li>Danach werden personenbezogene Daten anonymisiert (d. h. nur noch für statistische Zwecke ohne Personenbezug genutzt).</li>
                <li>Bei Austritt aus der Organisation wird der Zugang gesperrt und die Daten nach Ablauf der Speicherdauer gelöscht bzw. anonymisiert.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">7. Technische Umsetzung & Hosting</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Die Plattform nutzt Supabase (Cloud-Dienst mit Serverstandorten innerhalb der EU).</li>
                <li>Es gelten die Sicherheits- und Datenschutzmaßnahmen von Supabase (inkl. SSL-Verschlüsselung, Zugriffsprotokollierung).</li>
                <li>Die Übertragung der Daten erfolgt ausschließlich verschlüsselt (TLS/SSL).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">8. Rechte der betroffenen Personen</h2>
              <p className="text-gray-700 mb-2">Betroffene Personen haben jederzeit das Recht:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Auskunft über die gespeicherten Daten zu verlangen (Art. 15 DSGVO).</li>
                <li>Berichtigung unrichtiger Daten zu verlangen (Art. 16 DSGVO).</li>
                <li>Löschung der Daten zu verlangen (Art. 17 DSGVO).</li>
                <li>Einschränkung der Verarbeitung zu verlangen (Art. 18 DSGVO).</li>
                <li>Widerspruch gegen die Verarbeitung einzulegen (Art. 21 DSGVO).</li>
                <li>Datenübertragbarkeit zu verlangen (Art. 20 DSGVO).</li>
                <li>Eine erteilte Einwilligung jederzeit zu widerrufen (Art. 7 Abs. 3 DSGVO).</li>
              </ul>
              <p className="text-gray-700 mt-2">
                Zur Ausübung dieser Rechte genügt eine Nachricht an die oben genannte Kontaktadresse.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">9. Aufsichtsbehörde</h2>
              <p className="text-gray-700 mb-2">Beschwerden können an die zuständige Datenschutzaufsichtsbehörde gerichtet werden:</p>
              <p className="text-gray-700">
                Landesbeauftragte für Datenschutz und Informationsfreiheit Nordrhein-Westfalen (LDI NRW)<br/>
                Kavalleriestraße 2–4<br/>
                40213 Düsseldorf<br/>
                Tel.: 0211 38424-0<br/>
                E-Mail: poststelle@ldi.nrw.de
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">10. Änderungen</h2>
              <p className="text-gray-700">
                Diese Datenschutzerklärung kann bei Bedarf angepasst werden (z. B. bei Erweiterung der Funktionen 
                oder Änderung der Rechtslage).
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
