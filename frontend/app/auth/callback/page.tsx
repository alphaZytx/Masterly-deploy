import { Suspense } from 'react';
import AuthCallbackPage from './_AuthCallbackPage';

export default function Page() {
  return (
    <Suspense fallback={<div className="flex flex-col items-center justify-center min-h-screen"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" /><p className="text-lg font-medium">Signing you in with Google...</p></div>}>
      <AuthCallbackPage />
    </Suspense>
  );
}