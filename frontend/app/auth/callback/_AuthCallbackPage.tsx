"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { checkAuth, setUser, setIsAuthenticated } = useAuthStore();

  useEffect(() => {
    async function handleAuth() {
      // After Google OAuth, backend should set cookie. Just check auth.
      await checkAuth();
      // Optionally, you can fetch user info and set it here if needed
      setIsAuthenticated(true);
      router.replace('/');
    }
    handleAuth();
  }, [router, checkAuth, setUser, setIsAuthenticated]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-lg font-medium">Signing you in with Google...</p>
    </div>
  );
} 