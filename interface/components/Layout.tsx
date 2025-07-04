'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import TopBar from './SideBar';
import Footer from './Footer';
import { ToastProvider, useToast } from '@/components/ui/toast';

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isChatPage = pathname === '/chat';

  const [isCollapsed, setIsCollapsed] = useState(false);
  useEffect(() => {
    const handleSidebarToggle = (event: CustomEvent) => {
      setIsCollapsed(event.detail);
    };
    window.addEventListener('sidebarToggle', handleSidebarToggle as EventListener);
    return () => {
      window.removeEventListener('sidebarToggle', handleSidebarToggle as EventListener);
    };
  }, []);

  return (
    <div className="bg-primary min-h-screen">
      <ToastProvider>
        <TopBar />
        <motion.div
          className="flex-grow flex flex-col overflow-y-auto"
          animate={{ marginLeft: isCollapsed ? '4rem' : '12rem' }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          <div className="flex-grow"> {children} </div>
        </motion.div>
      </ToastProvider>
    </div >
  );
}

