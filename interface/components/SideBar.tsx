'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import useAuthStore from '@/lib/hooks/auth-store';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Image, History, Star, Code, Menu, X, Sun, Moon } from 'lucide-react';
import UserHistory from './UserHistory';
import UserAvatar from './UserAvatar';

// Brand logo component
const BrandLogo = ({ isCollapsed }: { isCollapsed: boolean }) => (
    <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} w-full`}>
        {/* Redesigned logo - more organic, geometric abstract design */}
        <div className="relative">
            <svg
                width={isCollapsed ? "32" : "40"}
                height={isCollapsed ? "32" : "40"}
                viewBox="0 0 100 100"
                fill="none"
                className="transition-all duration-300"
            >
                {/* Organic background shape */}
                <path
                    d="M20,15 C35,8 65,8 80,15 C92,25 92,35 85,50 C88,65 75,85 50,85 C25,85 12,65 15,50 C8,35 8,25 20,15 Z"
                    fill="currentColor"
                    className="text-organic-sage/20"
                />

                {/* Geometric structure lines */}
                <g stroke="currentColor" strokeWidth="2.5" fill="none" className="text-accent-primary">
                    {/* Main connecting lines */}
                    <path d="M25,25 L75,75" strokeLinecap="round" />
                    <path d="M75,25 L25,75" strokeLinecap="round" />

                    {/* Node circles */}
                    <circle cx="25" cy="25" r="4" fill="currentColor" className="text-organic-clay" />
                    <circle cx="75" cy="25" r="4" fill="currentColor" className="text-organic-sage" />
                    <circle cx="25" cy="75" r="4" fill="currentColor" className="text-organic-rust" />
                    <circle cx="75" cy="75" r="4" fill="currentColor" className="text-accent-primary" />

                    {/* Center connection point */}
                    <circle cx="50" cy="50" r="3" fill="currentColor" className="text-text-primary animate-pulse" />

                    {/* Organic connecting lines */}
                    <path
                        d="M50,50 Q30,35 25,25 M50,50 Q70,35 75,25 M50,50 Q30,65 25,75 M50,50 Q70,65 75,75"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className="text-text-tertiary opacity-60"
                        strokeLinecap="round"
                    />
                </g>
            </svg>
        </div>

        {!isCollapsed && (
            <div className="flex items-baseline">
                <span className="font-display text-xl font-semibold text-text-primary">
                    Inno
                </span>
                <span className="font-display text-xl font-semibold bg-gradient-to-r from-organic-sage to-organic-clay bg-clip-text text-transparent">
                    Weaver
                </span>
            </div>
        )}
    </div>
);

// Theme toggle component
const ThemeToggle = ({ isCollapsed }: { isCollapsed: boolean }) => {
    const [theme, setTheme] = useState('light');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const savedTheme = document.body.className || 'light';
        setTheme(savedTheme);
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        document.body.className = newTheme;
        const event = new CustomEvent('themeChange', { detail: newTheme });
        window.dispatchEvent(event);
    };

    if (!mounted) return null;

    if (isCollapsed) {
        return (
            <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl bg-surface-secondary hover:bg-surface-tertiary 
                   border border-border-subtle hover:border-border-default
                   transition-all duration-200 group touch-target"
                aria-label="Toggle theme"
            >
                {theme === 'light' ? (
                    <Sun className="w-5 h-5 text-organic-clay" />
                ) : (
                    <Moon className="w-5 h-5 text-accent-primary" />
                )}
            </button>
        );
    }

    return (
        <button
            onClick={toggleTheme}
            className="relative flex items-center p-1.5 rounded-full bg-surface-secondary 
                 hover:bg-surface-tertiary border border-border-subtle hover:border-border-default
                 transition-all duration-200 w-20 h-10"
            aria-label="Toggle theme"
        >
            <motion.div
                className="absolute bg-surface-elevated shadow-sm rounded-full w-7 h-7 
                   border border-border-subtle flex items-center justify-center"
                animate={{ x: theme === 'dark' ? 0 : 44 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
                {theme === 'light' ? (
                    <Sun className="w-4 h-4 text-organic-clay" />
                ) : (
                    <Moon className="w-4 h-4 text-accent-primary" />
                )}
            </motion.div>

            {/* Background icons - don't follow animation */}
            <div className="flex justify-between items-center w-full px-2 text-xs">
                <Moon className="w-4 h-4 text-accent-primary/30" />
                <Sun className="w-4 h-4 text-organic-clay/30" />
            </div>
        </button>
    );
};

export default function TopBar() {
    const pathname = usePathname();
    const router = useRouter();
    const authStore = useAuthStore();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);

        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
            if (window.innerWidth >= 768) {
                setIsMobileMenuOpen(false);
            }
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, [pathname]);

    const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        e.preventDefault();
        router.push(href);
        if (isMobile) {
            setIsMobileMenuOpen(false);
        }
    };

    const isActive = (path: string) => pathname === path;

    const toggleSidebar = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        const event = new CustomEvent('sidebarToggle', { detail: newState });
        window.dispatchEvent(event);
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    // Navigation menu items
    const mainNavItems = [
        { href: '/', icon: Home, label: 'Home' },
        { href: '/gallery', icon: Image, label: 'Gallery' },
    ];

    const userNavItems = [
        ...(authStore.userType === 'developer' ? [{ href: '/user/developer', icon: Code, label: 'Developer' }] : []),
        { href: '/user/favlist', icon: Star, label: 'Favorites' },
        { href: '/user/history', icon: History, label: 'History' },
    ];

    // Loading state
    if (!mounted) {
        return (
            <div className="fixed left-0 top-0 h-screen w-52 bg-surface-primary z-40 
                      border-r border-border-subtle">
                <div className="p-6">
                    <div className="w-8 h-8 bg-surface-secondary rounded-lg animate-pulse"></div>
                </div>
            </div>
        );
    }

    // Mobile menu
    if (isMobile) {
        return (
            <>
                {/* Mobile menu button */}
                <button
                    onClick={toggleMobileMenu}
                    className="fixed top-4 left-4 z-50 p-2.5 rounded-xl 
                     bg-surface-elevated/95 backdrop-blur-md 
                     border border-border-subtle shadow-lg 
                     hover:bg-surface-secondary hover:border-border-default
                     transition-all duration-200 md:hidden touch-target"
                >
                    <AnimatePresence mode="wait">
                        {isMobileMenuOpen ? (
                            <motion.div
                                key="close"
                                initial={{ opacity: 0, rotate: -90 }}
                                animate={{ opacity: 1, rotate: 0 }}
                                exit={{ opacity: 0, rotate: 90 }}
                                transition={{ duration: 0.2 }}
                            >
                                <X className="w-5 h-5 text-text-primary" />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="menu"
                                initial={{ opacity: 0, rotate: 90 }}
                                animate={{ opacity: 1, rotate: 0 }}
                                exit={{ opacity: 0, rotate: -90 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Menu className="w-5 h-5 text-text-primary" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </button>

                {/* Mobile menu overlay */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-ink/20 backdrop-blur-sm z-40 md:hidden"
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                    )}
                </AnimatePresence>

                {/* Mobile sidebar */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            className="fixed left-0 top-0 h-screen w-80 bg-surface-primary z-50 
                         border-r border-border-subtle shadow-2xl md:hidden
                         flex flex-col"
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        >
                            {/* Mobile header */}
                            <div className="p-6 pt-20 border-b border-border-subtle">
                                <BrandLogo isCollapsed={false} />
                            </div>

                            {/* Mobile navigation */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                                {/* Main navigation */}
                                <div>
                                    <h2 className="caption text-text-tertiary mb-4">Navigation</h2>
                                    <nav className="space-y-2">
                                        {mainNavItems.map(({ href, icon: Icon, label }) => (
                                            <Link
                                                key={href}
                                                href={href}
                                                className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${isActive(href)
                                                        ? 'bg-accent-primary/10 text-accent-primary border border-accent-primary/20'
                                                        : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary'
                                                    }`}
                                                onClick={(e) => handleNavigation(e, href)}
                                            >
                                                <Icon className={`w-5 h-5 mr-3 transition-transform duration-200 ${isActive(href) ? 'scale-110' : 'group-hover:scale-105'
                                                    }`} />
                                                <span className="font-medium">{label}</span>
                                            </Link>
                                        ))}
                                    </nav>
                                </div>

                                {/* User navigation */}
                                <div>
                                    <h2 className="caption text-text-tertiary mb-4">User</h2>
                                    <nav className="space-y-2">
                                        {userNavItems.map(({ href, icon: Icon, label }) => (
                                            <Link
                                                key={href}
                                                href={href}
                                                className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${isActive(href)
                                                        ? 'bg-accent-primary/10 text-accent-primary border border-accent-primary/20'
                                                        : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary'
                                                    }`}
                                                onClick={(e) => handleNavigation(e, href)}
                                            >
                                                <Icon className={`w-5 h-5 mr-3 transition-transform duration-200 ${isActive(href) ? 'scale-110' : 'group-hover:scale-105'
                                                    }`} />
                                                <span className="font-medium">{label}</span>
                                            </Link>
                                        ))}
                                    </nav>
                                </div>

                                {/* User history */}
                                <div>
                                    <h2 className="caption text-text-tertiary mb-4">Recent</h2>
                                    <UserHistory />
                                </div>
                            </div>

                            {/* Mobile bottom */}
                            <div className="p-6 border-t border-border-subtle space-y-4">
                                <UserAvatar isCollapsed={false} />
                                <div className="flex justify-center">
                                    <ThemeToggle isCollapsed={false} />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </>
        );
    }

    // Desktop sidebar
    return (
        <motion.div
            className={`fixed left-0 top-0 h-screen ${isCollapsed ? 'w-20' : 'w-52'} 
                  bg-surface-primary/95 backdrop-blur-md z-40 
                  border-r border-border-subtle shadow-sm
                  flex flex-col transition-all duration-300 ease-out`}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
        >
            {/* Header logo area */}
            <div className={`${isCollapsed ? 'p-4' : 'p-6'}`}>
                <BrandLogo isCollapsed={isCollapsed} />
            </div>

            <div className="w-full h-px bg-border-subtle mb-6" />

            {/* Main content area */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
                <div className={`${isCollapsed ? 'p-2' : 'p-4'} space-y-6`}>

                    {/* Main navigation */}
                    <div>
                        {!isCollapsed && (
                            <h2 className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-3 px-2">Navigation</h2>
                        )}
                        <nav className="space-y-1">
                            {mainNavItems.map(({ href, icon: Icon, label }) => (
                                <Link
                                    key={href}
                                    href={href}
                                    className={`flex items-center ${isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'} 
                             rounded-lg transition-all duration-200 group relative ${isActive(href)
                                            ? 'bg-accent-primary/10 text-accent-primary'
                                            : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary'
                                        }`}
                                    onClick={(e) => handleNavigation(e, href)}
                                    title={isCollapsed ? label : undefined}
                                >
                                    <Icon className={`${isCollapsed ? 'w-5 h-5' : 'w-5 h-5 mr-3'} 
                                   transition-transform duration-200 ${isActive(href) ? 'scale-110' : 'group-hover:scale-105'
                                        }`} />
                                    {!isCollapsed && (
                                        <span className="font-medium text-[15px] transition-colors duration-200">
                                            {label}
                                        </span>
                                    )}

                                    {/* Active indicator */}
                                    {isActive(href) && (
                                        <motion.div
                                            className={`absolute ${isCollapsed ? 'right-0 top-1/2 -translate-y-1/2 w-1 h-5' : 'left-0 top-1/2 -translate-y-1/2 w-1 h-5'} 
                                 bg-accent-primary rounded-r-full`}
                                            layoutId="activeIndicator"
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        />
                                    )}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    {/* User navigation */}
                    <div>
                        {!isCollapsed && (
                            <h2 className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-3 px-2">User</h2>
                        )}
                        <nav className="space-y-1">
                            {userNavItems.map(({ href, icon: Icon, label }) => (
                                <Link
                                    key={href}
                                    href={href}
                                    className={`flex items-center ${isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'} 
                             rounded-lg transition-all duration-200 group relative ${isActive(href)
                                            ? 'bg-accent-primary/10 text-accent-primary'
                                            : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary'
                                        }`}
                                    onClick={(e) => handleNavigation(e, href)}
                                    title={isCollapsed ? label : undefined}
                                >
                                    <Icon className={`${isCollapsed ? 'w-5 h-5' : 'w-5 h-5 mr-3'} 
                                   transition-transform duration-200 ${isActive(href) ? 'scale-110' : 'group-hover:scale-105'
                                        }`} />
                                    {!isCollapsed && (
                                        <span className="font-medium text-[15px] transition-colors duration-200">
                                            {label}
                                        </span>
                                    )}

                                    {/* Active indicator */}
                                    {isActive(href) && (
                                        <motion.div
                                            className={`absolute ${isCollapsed ? 'right-0 top-1/2 -translate-y-1/2 w-1 h-5' : 'left-0 top-1/2 -translate-y-1/2 w-1 h-5'} 
                                 bg-accent-primary rounded-r-full`}
                                            layoutId="activeIndicator"
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        />
                                    )}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    {/* User history */}
                    {!isCollapsed && (
                        <div>
                            <h2 className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-3 px-2">Recent</h2>
                            <UserHistory />
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom user area */}
            <div className={`${isCollapsed ? 'p-2' : 'p-4'} border-t border-border-subtle space-y-3`}>
                <UserAvatar isCollapsed={isCollapsed} />
                <div className={`flex ${isCollapsed ? 'justify-center' : 'justify-center'}`}>
                    <ThemeToggle isCollapsed={isCollapsed} />
                </div>

                {/* Collapse button */}
                {isCollapsed && (
                    <div className="flex justify-center">
                        <button
                            onClick={toggleSidebar}
                            className="p-1.5 rounded-lg hover:bg-surface-secondary 
                         transition-colors duration-200 text-text-tertiary hover:text-text-primary"
                            aria-label="Expand sidebar"
                        >
                            <Menu className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
