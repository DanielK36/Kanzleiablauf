'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function AfterSignIn() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && user) {
      // Check if this is a sign-in (not sign-up)
      const isSignIn = sessionStorage.getItem('clerk_sign_in') === 'true';
      if (isSignIn) {
        sessionStorage.removeItem('clerk_sign_in');
        router.push('/simple-dashboard');
        return;
      }
      
      // Always redirect to simple-dashboard after sign-in
      // Check if we're not already on a protected page
      const currentPath = window.location.pathname;
      const protectedPages = ['/simple-dashboard', '/simple-kanzleiablauf-team', '/simple-kanzleiablauf-v3', '/speaker-registration'];
      
      if (!protectedPages.includes(currentPath) && currentPath !== '/onboarding') {
        router.push('/simple-dashboard');
      }
    }
  }, [isLoaded, user, router]);

  return null;
}

export function AfterSignUp() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && user) {
      // Check if this is a sign-up (not sign-in)
      const isSignUp = sessionStorage.getItem('clerk_sign_up') === 'true';
      if (isSignUp) {
        sessionStorage.removeItem('clerk_sign_up');
        router.push('/onboarding');
      }
    }
  }, [isLoaded, user, router]);

  return null;
}
