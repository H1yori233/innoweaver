"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (token) {
      router.push('/chat');
    } else {
      router.push('/user/register');
    }
  }, [router]);

  return (
    <div className="mobile-padding pt-16 md:pt-0">
      {/* Loading state for mobile */}
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-text-link border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-text-secondary mobile-text">Loading...</p>
        </div>
      </div>
    </div>
  );
}
