import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Leadership Enablement System
            </h3>
            <p className="text-sm text-gray-600">
              Team Performance Dashboard für Führungskräfte
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Navigation
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/simple-kanzleiablauf-team" className="text-sm text-gray-600 hover:text-gray-900">
                  Team-Dashboard
                </Link>
              </li>
              <li>
                <Link href="/simple-dashboard" className="text-sm text-gray-600 hover:text-gray-900">
                  Persönliches Dashboard
                </Link>
              </li>
              <li>
                <Link href="/simple-goals" className="text-sm text-gray-600 hover:text-gray-900">
                  Ziele verwalten
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Rechtliches
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-sm text-gray-600 hover:text-gray-900">
                  Datenschutz
                </Link>
              </li>
              <li>
                <Link href="/impressum" className="text-sm text-gray-600 hover:text-gray-900">
                  Impressum
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-gray-600 hover:text-gray-900">
                  AGB
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} Leadership Enablement System. Alle Rechte vorbehalten.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-900">
                Datenschutz
              </Link>
              <Link href="/impressum" className="text-sm text-gray-500 hover:text-gray-900">
                Impressum
              </Link>
              <Link href="/terms" className="text-sm text-gray-500 hover:text-gray-900">
                AGB
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
