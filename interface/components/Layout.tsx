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
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const handleSidebarToggle = (event: CustomEvent) => {
      setIsCollapsed(event.detail);
    };
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('sidebarToggle', handleSidebarToggle as EventListener);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('sidebarToggle', handleSidebarToggle as EventListener);
    };
  }, []);

  if (!mounted) {
    return (
      <div className="bg-primary min-h-screen">
        <ToastProvider>
          <div className="fixed left-0 top-0 h-screen w-[200px] bg-primary z-40"></div>
          <div className="flex-grow flex flex-col overflow-y-auto ml-[200px]">
            <div className="flex-grow">{children}</div>
          </div>
        </ToastProvider>
      </div>
    );
  }

  return (
    <div className="bg-primary min-h-screen">
      <ToastProvider>
        <TopBar />
        <motion.div
          className="flex-grow flex flex-col overflow-y-auto"
          animate={{ 
            marginLeft: isMobile ? '0' : (isCollapsed ? '4rem' : '12rem'),
            paddingTop: isMobile ? '0' : '0'
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          <div className="flex-grow"> {children} </div>
        </motion.div>
      </ToastProvider>
    </div >
  );
}

