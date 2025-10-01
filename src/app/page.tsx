'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          Leadership Enablement System
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Team Performance Dashboard für Führungskräfte
        </p>
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-3">Features:</h2>
            <ul className="text-left space-y-2 text-gray-600">
              <li>✅ Weekday-spezifische Action Guides</li>
              <li>✅ Hierarchische Teamstruktur</li>
              <li>✅ Tägliche Check-ins & Reflexionen</li>
              <li>✅ Executive-Level Design</li>
              <li>✅ GDPR-konforme Datenverwaltung</li>
            </ul>
          </div>
          <div className="space-y-4">
            <button 
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors"
              onClick={() => {
                sessionStorage.setItem('clerk_sign_in', 'true');
                // Use Clerk's sign in URL
                window.location.href = '/sign-in';
              }}
            >
              🚀 Jetzt starten
            </button>
             <div className="flex justify-center space-x-6 text-sm text-gray-500">
               <Link href="/privacy" className="hover:text-gray-700">Datenschutz</Link>
               <Link href="/impressum" className="hover:text-gray-700">Impressum</Link>
               <Link href="/terms" className="hover:text-gray-700">AGB</Link>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
