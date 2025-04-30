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

  return null; // 不需要渲染任何内容,因为会立即重定向
}
