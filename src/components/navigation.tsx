"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

interface UserData {
  role: string;
  firstName: string;
}

export default function Navigation() {
  const { user, isLoaded } = useUser();
  const pathname = usePathname();
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    if (isLoaded && user) {
      loadUserData();
    }
  }, [isLoaded, user]);

  const loadUserData = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
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
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Leadership System
            </Link>
            
            <div className="hidden md:flex space-x-6">
              <Link 
                href="/dashboard" 
                className={`text-sm font-medium transition-colors ${
                  isActive('/dashboard') 
                    ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Dashboard
              </Link>
              
              <Link 
                href="/berater" 
                className={`text-sm font-medium transition-colors ${
                  isActive('/berater') 
                    ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Berater
              </Link>
              
              <Link 
                href="/kanzleiablauf" 
                className={`text-sm font-medium transition-colors ${
                  isActive('/kanzleiablauf') 
                    ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Kanzleiablauf
              </Link>
              
              {userData?.role === 'admin' && (
                <>
                  <Link 
                    href="/admin" 
                    className={`text-sm font-medium transition-colors ${
                      isActive('/admin') 
                        ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                        : 'text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    Admin
                  </Link>
                  <Link 
                    href="/admin/weekday-questions" 
                    className={`text-sm font-medium transition-colors ${
                      isActive('/admin/weekday-questions') 
                        ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                        : 'text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    Fragen
                  </Link>
                  <Link 
                    href="/admin/teams" 
                    className={`text-sm font-medium transition-colors ${
                      isActive('/admin/teams') 
                        ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                        : 'text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    Teams
                  </Link>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {userData?.name?.split(' ')[0] || user?.firstName || 'Benutzer'}
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}
