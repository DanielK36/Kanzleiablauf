import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">📄 Allgemeine Geschäftsbedingungen (AGB)</CardTitle>
            <p className="text-gray-600 text-center mt-2">Stand: Oktober 2025</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-2xl font-bold mb-3">1. Geltungsbereich</h2>
              <p className="text-gray-700">
                Diese Allgemeinen Geschäftsbedingungen (AGB) regeln die Nutzung der von Daniel Kuhlen betriebenen 
                Online-Plattform (im Folgenden: „Plattform").
              </p>
              <p className="text-gray-700 mt-2">
                Die Plattform dient der Erfassung, Auswertung und Darstellung von Ziel- und Leistungsdaten 
                im Rahmen der Zusammenarbeit von selbstständigen Finanzdienstleistern („Nutzer") und deren Führungskräften.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">2. Vertragsverhältnis</h2>
              <p className="text-gray-700">
                Die Nutzung der Plattform erfolgt ausschließlich durch selbstständige Partner im Rahmen ihrer 
                Zusammenarbeit mit Telis Finanz AG (nachfolgend „Organisation").
              </p>
              <p className="text-gray-700 mt-2">
                Ein gesondertes Vertragsverhältnis zwischen den Nutzern und Daniel Kuhlen entsteht durch die Nutzung nicht.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">3. Leistungen</h2>
              <p className="text-gray-700 mb-2">(1) Die Plattform ermöglicht es den Nutzern:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Persönliche Ziele und Ist-Zahlen zu erfassen,</li>
                <li>die eigene Zielerreichung zu verfolgen,</li>
                <li>Führungskräften die Team- und Partnerentwicklung zu visualisieren.</li>
              </ul>
              <p className="text-gray-700 mt-2">
                (2) Der Leistungsumfang kann laufend angepasst und erweitert werden.
              </p>
              <p className="text-gray-700 mt-2">
                (3) Ein Anspruch auf ständige Verfügbarkeit besteht nicht. Kurzfristige Ausfälle oder Wartungen sind möglich.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">4. Pflichten der Nutzer</h2>
              <p className="text-gray-700">
                (1) Die Eingabe von Daten erfolgt freiwillig und eigenverantwortlich durch die Nutzer.
              </p>
              <p className="text-gray-700 mt-2">
                (2) Es dürfen ausschließlich sachlich richtige und eigene Daten eingegeben werden.
              </p>
              <p className="text-gray-700 mt-2">
                (3) Die Nutzer sind verpflichtet, ihre Zugangsdaten geheim zu halten und Dritten nicht zugänglich zu machen.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">5. Datenzugriff</h2>
              <p className="text-gray-700">
                (1) Jeder Nutzer hat Zugriff auf seine eigenen Daten.
              </p>
              <p className="text-gray-700 mt-2">
                (2) Die jeweilige Führungskraft erhält Zugriff auf die Daten der ihr zugeordneten Partner (gemäß Organisationsstruktur).
              </p>
              <p className="text-gray-700 mt-2">
                (3) Der Plattform-Administrator (Daniel Kuhlen) hat Zugriff auf alle Daten, ausschließlich zur Verwaltung und Auswertung.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">6. Datenschutz</h2>
              <p className="text-gray-700">
                Die Verarbeitung personenbezogener Daten richtet sich nach der Datenschutzerklärung (separates Dokument).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">7. Nutzung unentgeltlich</h2>
              <p className="text-gray-700">
                Die Nutzung der Plattform ist für die Nutzer unentgeltlich.
              </p>
              <p className="text-gray-700 mt-2">
                Ein Anspruch auf bestimmte Funktionen oder dauerhafte Verfügbarkeit besteht nicht.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">8. Haftung</h2>
              <p className="text-gray-700">
                (1) Die Nutzung erfolgt auf eigene Verantwortung der Nutzer.
              </p>
              <p className="text-gray-700 mt-2">
                (2) Daniel Kuhlen übernimmt keine Gewähr für die Richtigkeit, Vollständigkeit oder Aktualität 
                der eingegebenen oder dargestellten Daten.
              </p>
              <p className="text-gray-700 mt-2">
                (3) Eine Haftung für Schäden, die durch fehlerhafte Eingaben, Missbrauch oder technische Störungen 
                entstehen, ist ausgeschlossen – außer bei Vorsatz oder grober Fahrlässigkeit.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">9. Beendigung der Nutzung</h2>
              <p className="text-gray-700">
                (1) Nutzer können die Nutzung jederzeit einstellen.
              </p>
              <p className="text-gray-700 mt-2">
                (2) Mit Beendigung des zugrundeliegenden Organisationsvertrags (z. B. Telis-Partnervertrag) 
                erlischt der Zugriff automatisch.
              </p>
              <p className="text-gray-700 mt-2">
                (3) Die Daten werden gemäß der Datenschutzerklärung gespeichert, anonymisiert oder gelöscht.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">10. Änderungen der AGB</h2>
              <p className="text-gray-700">
                Daniel Kuhlen behält sich das Recht vor, diese AGB jederzeit zu ändern. 
                Nutzer werden über wesentliche Änderungen rechtzeitig informiert.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">11. Schlussbestimmungen</h2>
              <p className="text-gray-700">
                (1) Es gilt deutsches Recht.
              </p>
              <p className="text-gray-700 mt-2">
                (2) Gerichtsstand ist – soweit zulässig – Mönchengladbach.
              </p>
              <p className="text-gray-700 mt-2">
                (3) Sollten einzelne Bestimmungen dieser AGB unwirksam sein, bleibt die Gültigkeit der übrigen Bestimmungen unberührt.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
