'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import TopBar from './SideBar';
import { ToastProvider } from '@/components/ui/toast';

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // 初始化和响应式检查
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);

    const handleSidebarToggle = (event: CustomEvent) => {
      setIsCollapsed(event.detail);
    };

    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      // 在移动端自动折叠侧边栏
      if (mobile && !isCollapsed) {
        setIsCollapsed(true);
      }
    };

    // 初始检查
    checkMobile();

    // 添加事件监听器
    window.addEventListener('resize', checkMobile);
    window.addEventListener('sidebarToggle', handleSidebarToggle as EventListener);

    // 初始加载完成
    const loadTimer = setTimeout(() => setIsInitialLoad(false), 500);

    return () => {
      clearTimeout(timer);
      clearTimeout(loadTimer);
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('sidebarToggle', handleSidebarToggle as EventListener);
    };
  }, [isCollapsed]);

  // 计算主内容区域的边距
  const getMainMarginLeft = () => {
    if (isMobile) return '0';
    return isCollapsed ? '5rem' : '13rem';
  };

  // 页面过渡动画配置
  const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.4
  };

  const pageVariants = {
    initial: {
      opacity: 0,
      y: 20,
      filter: "blur(4px)"
    },
    in: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)"
    },
    out: {
      opacity: 0,
      y: -20,
      filter: "blur(4px)"
    }
  };

  // 加载状态
  if (!mounted) {
    return (
      <div className="bg-canvas min-h-screen">
        <ToastProvider>
          {/* 加载时的侧边栏占位 */}
          <div className="fixed left-0 top-0 h-screen w-52 bg-surface-primary z-40 
                         border-r border-border-subtle">
            <div className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-surface-secondary rounded-xl animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 bg-surface-secondary rounded w-20 animate-pulse" />
                  <div className="h-3 bg-surface-tertiary rounded w-16 animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          {/* 加载时的主内容区域 */}
          <div className="ml-52 min-h-screen bg-canvas">
            <div className="p-8">
              <div className="space-y-4">
                <div className="h-8 bg-surface-secondary rounded w-1/3 animate-pulse" />
                <div className="h-4 bg-surface-tertiary rounded w-2/3 animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-48 bg-surface-secondary rounded-2xl animate-pulse" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </ToastProvider>
      </div>
    );
  }

  return (
    <div className="bg-canvas min-h-screen">
      <ToastProvider>
        {/* 背景装饰元素 */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {/* 网格背景 */}
          <div className="absolute inset-0 bg-grid opacity-20" />

          {/* 纹理层 */}
          <div className="absolute inset-0 bg-texture" />
        </div>

        {/* 侧边栏 */}
        <TopBar />

        {/* 主内容区域 */}
        <motion.main
          className="flex-1 min-h-screen relative z-10"
          animate={{
            marginLeft: getMainMarginLeft(),
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30
          }}
        >
          {/* 页面内容容器 */}
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
              className="min-h-screen relative"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </motion.main>
      </ToastProvider>
    </div>
  );
}
