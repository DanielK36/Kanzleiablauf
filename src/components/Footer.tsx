import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-600 border-t border-gray-500 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-300">
            © {new Date().getFullYear()} Leadership Enablement System. Alle Rechte vorbehalten.
          </p>
          <div className="flex space-x-6 mt-2 md:mt-0">
            <Link href="/privacy" className="text-sm text-gray-300 hover:text-white">
              Datenschutz
            </Link>
            <Link href="/impressum" className="text-sm text-gray-300 hover:text-white">
              Impressum
            </Link>
            <Link href="/terms" className="text-sm text-gray-300 hover:text-white">
              AGB
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
