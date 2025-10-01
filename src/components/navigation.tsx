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
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Leadership System
            </Link>
            
            <div className="hidden md:flex space-x-6">
              <Link 
                href="/simple-dashboard" 
                className={`text-sm font-medium transition-colors ${
                  isActive('/simple-dashboard') 
                    ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Dashboard
              </Link>
              
              <Link 
                href="/simple-kanzleiablauf-v3" 
                className={`text-sm font-medium transition-colors ${
                  isActive('/simple-kanzleiablauf-v3') 
                    ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Kanzleiablauf
              </Link>
              
              <Link 
                href="/simple-kanzleiablauf-team" 
                className={`text-sm font-medium transition-colors ${
                  isActive('/simple-kanzleiablauf-team') 
                    ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                    : 'text-gray-700 hover:text-gray-900'
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
                        ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
                        : 'text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    Admin
                  </Link>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {userData?.name?.split(' ')[0] || user?.firstName || 'Benutzer'}
            </span>
            <SignOutButton redirectUrl="/">
              <Button variant="outline" size="sm">Abmelden</Button>
            </SignOutButton>
          </div>
        </div>
      </div>
    </nav>
  );
}
