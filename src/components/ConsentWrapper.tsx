'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import ConsentScreen from './ConsentScreen';

interface ConsentWrapperProps {
  children: React.ReactNode;
}

export default function ConsentWrapper({ children }: ConsentWrapperProps) {
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  // Pages that should bypass consent check
  const bypassConsentPages = ['/privacy', '/terms', '/impressum'];

  useEffect(() => {
    // Skip consent check for legal pages
    if (bypassConsentPages.includes(pathname)) {
      setHasConsent(true);
      setLoading(false);
      return;
    }
    
    checkConsent();
  }, [pathname]);

  const checkConsent = async () => {
    try {
      const response = await fetch('/api/consent');
      
      if (response.ok) {
        const data = await response.json();
        setHasConsent(data.hasConsent);
      } else {
        const errorData = await response.json();
        setHasConsent(false);
      }
    } catch (error) {
      console.error('Error checking consent:', error);
      setHasConsent(false);
    } finally {
      setLoading(false);
    }
  };

  const handleConsent = (consentGiven: boolean) => {
    setHasConsent(consentGiven);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade...</p>
        </div>
      </div>
    );
  }

  if (hasConsent === false) {
    return <ConsentScreen onConsent={handleConsent} />;
  }

  return <>{children}</>;
}

