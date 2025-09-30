import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Nutzungsbedingungen (AGB)</CardTitle>
            <p className="text-gray-600">Stand: September 2025</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Geltungsbereich</h2>
              <p className="text-gray-700">
                Diese Bedingungen gelten für die kostenfreie Nutzung des Portals „Führungsradar / Team-Radar" durch selbstständige Partner.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Leistungen des Betreibers</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Das Portal ist ein Werkzeug zur Eingabe, Speicherung und Auswertung von Zielen und Leistungsdaten.</li>
                <li>Es besteht kein Anspruch auf ständige Verfügbarkeit oder fehlerfreie Nutzung.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Pflichten der Nutzer</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Eingaben erfolgen freiwillig und wahrheitsgemäß.</li>
                <li>Keine Eingabe sensibler oder sachfremder Daten (z. B. Gesundheitsdaten).</li>
                <li>Exportierte Daten (PDF/CSV) sind ausschließlich für die interne Nutzung bestimmt.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Zugriff durch Führungskräfte</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Führungskräfte haben Zugriff auf die Daten ihrer zugeordneten Partner (gemäß Organisationsstruktur).</li>
                <li>Mit Austritt endet der Zugriff automatisch.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Datenschutz</h2>
              <p className="text-gray-700">
                Es gilt die separate <Link href="/privacy" className="text-blue-600 hover:underline">Datenschutzerklärung</Link>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Haftung</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Der Betreiber übernimmt keine Haftung für Verluste, die durch falsche Eingaben oder fehlerhafte Auswertungen entstehen.</li>
                <li>Nutzung erfolgt auf eigene Verantwortung.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Änderungen</h2>
              <p className="text-gray-700">
                Der Betreiber behält sich vor, diese Bedingungen anzupassen. Über wesentliche Änderungen werden die Nutzer informiert.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

