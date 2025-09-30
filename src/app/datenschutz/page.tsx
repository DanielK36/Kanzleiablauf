import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Datenschutzerklärung</CardTitle>
            <p className="text-gray-600">Stand: {new Date().toLocaleDateString('de-DE')}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Verantwortlicher</h2>
              <p className="text-gray-700">
                Verantwortlicher für die Datenverarbeitung auf dieser Website ist:
                <br />
                [Ihr Name/Unternehmen]
                <br />
                [Ihre Adresse]
                <br />
                E-Mail: [Ihre E-Mail]
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Datenerfassung und -verwendung</h2>
              <p className="text-gray-700">
                Diese Anwendung erfasst und verarbeitet folgende personenbezogene Daten:
              </p>
              <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
                <li>Name und Kontaktdaten (für Benutzerkonten)</li>
                <li>Team- und Hierarchieinformationen</li>
                <li>Tägliche Arbeitsdaten und Ziele</li>
                <li>Performance-Metriken und Fortschrittsdaten</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Zweck der Datenverarbeitung</h2>
              <p className="text-gray-700">
                Die Daten werden ausschließlich für folgende Zwecke verwendet:
              </p>
              <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
                <li>Bereitstellung der Führungssystem-Funktionalität</li>
                <li>Team-Management und Hierarchieverwaltung</li>
                <li>Performance-Tracking und Zielverfolgung</li>
                <li>Kommunikation zwischen Führungskräften und Teams</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Rechtsgrundlage</h2>
              <p className="text-gray-700">
                Die Verarbeitung erfolgt auf Grundlage von:
              </p>
              <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
                <li>Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)</li>
                <li>Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse)</li>
                <li>Einwilligung der betroffenen Person (Art. 6 Abs. 1 lit. a DSGVO)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Datenspeicherung</h2>
              <p className="text-gray-700">
                Ihre Daten werden sicher in der Supabase-Cloud gespeichert und sind nur für autorisierte Benutzer zugänglich. 
                Die Daten werden gelöscht, sobald sie für die Zweckerfüllung nicht mehr erforderlich sind.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Ihre Rechte</h2>
              <p className="text-gray-700">
                Sie haben folgende Rechte bezüglich Ihrer personenbezogenen Daten:
              </p>
              <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
                <li>Recht auf Auskunft (Art. 15 DSGVO)</li>
                <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
                <li>Recht auf Löschung (Art. 17 DSGVO)</li>
                <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
                <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
                <li>Widerspruchsrecht (Art. 21 DSGVO)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Kontakt</h2>
              <p className="text-gray-700">
                Bei Fragen zum Datenschutz wenden Sie sich an:
                <br />
                E-Mail: [Ihre E-Mail]
                <br />
                Telefon: [Ihre Telefonnummer]
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Beschwerderecht</h2>
              <p className="text-gray-700">
                Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde über die Verarbeitung 
                Ihrer personenbezogenen Daten durch uns zu beschweren.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
