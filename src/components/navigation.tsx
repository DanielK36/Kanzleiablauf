"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser, SignOutButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';

interface UserData {
  role: string;
  firstName: string;
}

export default function Navigation() {
  const { user, isLoaded } = useUser();
  const pathname = usePathname();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isLoaded && user) {
      loadUserData();
    }
  }, [isLoaded, user]);

  const loadUserData = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setUserData(result.data);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const isActive = (path: string) => pathname === path;

  if (!isLoaded || !user) {
    return null;
  }

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
              Leadership System
            </Link>
            
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
            
            <div className="hidden md:flex space-x-6">
              <Link 
                href="/simple-dashboard" 
                className={`text-sm font-medium transition-colors ${
                  isActive('/simple-dashboard') 
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 pb-1' 
                    : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Dashboard
              </Link>
              
              <Link 
                href="/simple-kanzleiablauf-v3" 
                className={`text-sm font-medium transition-colors ${
                  isActive('/simple-kanzleiablauf-v3') 
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 pb-1' 
                    : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Kanzleiablauf
              </Link>
              
              <Link 
                href="/simple-kanzleiablauf-team" 
                className={`text-sm font-medium transition-colors ${
                  isActive('/simple-kanzleiablauf-team') 
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 pb-1' 
                    : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Team-Übersicht
              </Link>
              
              {userData?.role === 'admin' && (
                <>
                  <Link 
                    href="/admin/dashboard" 
                    className={`text-sm font-medium transition-colors ${
                      isActive('/admin/dashboard') || pathname.startsWith('/admin/')
                        ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 pb-1' 
                        : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Admin
                  </Link>
                </>
              )}
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {userData?.name?.split(' ')[0] || user?.firstName || 'Benutzer'}
            </span>
            <SignOutButton redirectUrl="/">
              <Button variant="outline" size="sm">Abmelden</Button>
            </SignOutButton>
          </div>
          
          {/* Mobile menu button moved to left side */}
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link 
              href="/simple-dashboard" 
              className={`block px-4 py-2 text-sm font-medium rounded transition-colors ${
                isActive('/simple-dashboard') 
                  ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            
            <Link 
              href="/simple-kanzleiablauf-v3" 
              className={`block px-4 py-2 text-sm font-medium rounded transition-colors ${
                isActive('/simple-kanzleiablauf-v3') 
                  ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Kanzleiablauf
            </Link>
            
            <Link 
              href="/simple-kanzleiablauf-team" 
              className={`block px-4 py-2 text-sm font-medium rounded transition-colors ${
                isActive('/simple-kanzleiablauf-team') 
                  ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Team-Übersicht
            </Link>
            
            {userData?.role === 'admin' && (
              <Link 
                href="/admin/dashboard" 
                className={`block px-4 py-2 text-sm font-medium rounded transition-colors ${
                  isActive('/admin/dashboard') || pathname.startsWith('/admin/')
                    ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Admin
              </Link>
            )}
            
            <div className="px-4 py-2 border-t dark:border-gray-700 mt-2 pt-2">
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                {userData?.name?.split(' ')[0] || user?.firstName || 'Benutzer'}
              </div>
              <SignOutButton redirectUrl="/">
                <Button variant="outline" size="sm" className="w-full">Abmelden</Button>
              </SignOutButton>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
