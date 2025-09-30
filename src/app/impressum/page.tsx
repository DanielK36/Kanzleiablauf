import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Impressum</CardTitle>
            <p className="text-gray-600">Angaben gemäß § 5 TMG</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">Anbieter</h2>
              <p className="text-gray-700">
                Daniel Kuhlen<br />
                Hennes-Weisweiler-Allee 8<br />
                41179 Mönchengladbach<br />
                <br />
                Telefon: 0176 830 88 327<br />
                E-Mail: Daniel.Kuhlen@Telis-finanz.de<br />
                <br />
                Umsatzsteuer-ID: Nicht vorhanden (umsatzsteuerbefreit)
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
              <p className="text-gray-700">
                Daniel Kuhlen<br />
                (Hennes-Weisweiler-Allee 8, 41179 Mönchengladbach)
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Haftung für Inhalte</h2>
              <p className="text-gray-700">
                Die Inhalte dieser Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte kann jedoch keine Gewähr übernommen werden.<br /><br />
                Als Diensteanbieter bin ich gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Haftung für Links</h2>
              <p className="text-gray-700">
                Dieses Portal enthält ggf. Links zu externen Webseiten Dritter, auf deren Inhalte ich keinen Einfluss habe. Für diese fremden Inhalte übernehme ich keine Gewähr.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Urheberrecht</h2>
              <p className="text-gray-700">
                Die durch den Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Beiträge Dritter sind als solche gekennzeichnet.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}