'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import useAuthStore from '@/lib/hooks/auth-store';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, Image, History, Star, Code, Menu, X } from 'lucide-react';
import { FeedbackFish } from '@feedback-fish/react';
import UserHistory from './UserHistory';
import UserAvatar from './UserAvatar';

export default function TopBar() {
    const pathname = usePathname();
    const router = useRouter();
    const [key, setKey] = useState(0);
    const authStore = useAuthStore();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        setKey(prevKey => prevKey + 1);
        
        // Check if mobile on mount and resize
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

    const [theme, setTheme] = useState('light');

    useEffect(() => {
        if (mounted) {
            const savedTheme = document.body.className || 'light';
            setTheme(savedTheme);
        }
    }, [mounted]);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        document.body.className = newTheme;
        const event = new CustomEvent('themeChange', { detail: newTheme });
        window.dispatchEvent(event);
    };

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

    if (!mounted) {
        return (
            <div className="fixed left-0 top-0 h-screen w-[200px] bg-primary z-40 flex flex-col justify-between items-start overflow-x-hidden text-text-primary transition-all duration-200 shadow-md overflow-y-auto backdrop-blur-md bg-opacity-95">
                <div className="w-full flex-shrink-0">
                    <h1 className="text-2xl font-semibold mt-6 ml-1 tracking-tight h-8 flex items-center">
                        <svg width="32" height="32" viewBox="0 0 120 130" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                            <g transform="translate(10, 5)">
                                <circle cx="20" cy="20" r="9" fill="#2563eb" />
                                <circle cx="100" cy="20" r="9" fill="#2563eb" />
                                <circle cx="20" cy="90" r="9" fill="#2563eb" />
                                <circle cx="100" cy="90" r="9" fill="#2563eb" />
                                <path
                                    d="M20 20 L100 90 M100 20 L20 90 M20 20 L20 90 M100 20 L100 90 M100 90 L70 120"
                                    stroke="#2563eb"
                                    strokeWidth="7"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    fill="none"
                                />
                            </g>
                        </svg>
                        <div className="flex">
                            <span className="text-text-primary font-bold">Inno</span>
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500 font-bold">
                                Weaver
                            </span>
                        </div>
                    </h1>
                </div>
            </div>
        );
    }

    // Mobile menu button for small screens
    if (isMobile) {
        return (
            <>
                {/* Mobile menu button */}
                <button
                    onClick={toggleMobileMenu}
                    className="fixed top-4 left-4 z-50 p-2 bg-primary/90 backdrop-blur-sm rounded-lg shadow-lg border border-border-primary md:hidden"
                >
                    {isMobileMenuOpen ? (
                        <X className="w-6 h-6 text-text-primary" />
                    ) : (
                        <Menu className="w-6 h-6 text-text-primary" />
                    )}
                </button>

                {/* Mobile menu overlay */}
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-40 md:hidden"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                )}

                {/* Mobile sidebar */}
                <motion.div
                    className={`fixed left-0 top-0 h-screen w-80 bg-primary z-50 flex flex-col justify-between items-start overflow-x-hidden
                        text-text-primary shadow-xl border-r border-border-primary md:hidden`}
                    initial={{ x: '-100%' }}
                    animate={{ x: isMobileMenuOpen ? 0 : '-100%' }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                    <div className="w-full flex-shrink-0 pt-16">
                        <h1 className="text-2xl font-semibold mt-6 ml-6 tracking-tight h-8 flex items-center">
                            <svg width="32" height="32" viewBox="0 0 120 130" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                                <g transform="translate(10, 5)">
                                    <circle cx="20" cy="20" r="9" fill="#2563eb" />
                                    <circle cx="100" cy="20" r="9" fill="#2563eb" />
                                    <circle cx="20" cy="90" r="9" fill="#2563eb" />
                                    <circle cx="100" cy="90" r="9" fill="#2563eb" />
                                    <path
                                        d="M20 20 L100 90 M100 20 L20 90 M20 20 L20 90 M100 20 L100 90 M100 90 L70 120"
                                        stroke="#2563eb"
                                        strokeWidth="7"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        fill="none"
                                    />
                                </g>
                            </svg>
                            <div className="flex">
                                <span className="text-text-primary font-bold">Inno</span>
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500 font-bold">
                                    Weaver
                                </span>
                            </div>
                        </h1>
                        <div className="w-full h-px bg-gradient-to-r from-transparent via-border-secondary to-transparent my-5 opacity-70" />

                        <div className="px-6 mb-3 mt-8">
                            <h2 className="text-xs font-bold text-text-secondary uppercase tracking-wider opacity-70">Main</h2>
                        </div>
                        <nav className="flex flex-col items-center w-full font-medium text-base space-y-3 px-4 mb-4 flex-shrink-0">
                            {[
                                { href: '/', icon: Home, label: 'Home' },
                                { href: '/gallery', icon: Image, label: 'Gallery' },
                            ].map(({ href, icon: Icon, label }) => (
                                <Link
                                    key={href}
                                    href={href}
                                    className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${isActive(href)
                                        ? 'text-text-primary font-semibold bg-secondary/50'
                                        : 'text-text-secondary hover:bg-border-primary/50 hover:text-text-primary'
                                        }`}
                                    onClick={(e) => handleNavigation(e, href)}
                                >
                                    <Icon className="text-lg mr-3" />
                                    <span>{label}</span>
                                </Link>
                            ))}
                        </nav>

                        <div className="px-6 mb-3 mt-8">
                            <h2 className="text-xs font-bold text-text-secondary uppercase tracking-wider opacity-70">User</h2>
                        </div>
                        <nav className="flex flex-col items-center w-full font-medium text-base space-y-3 px-4 flex-shrink-0">
                            {[
                                ...(authStore.userType === 'developer' ? [{ href: '/user/developer', icon: Code, label: 'Developer' }] : []),
                                { href: '/user/favlist', icon: Star, label: 'Favorite' },
                                { href: '/user/history', icon: History, label: 'History' },
                            ].map(({ href, icon: Icon, label }) => (
                                <Link
                                    key={href}
                                    href={href}
                                    className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${isActive(href)
                                        ? 'text-text-primary font-semibold bg-secondary/50'
                                        : 'text-text-secondary hover:bg-border-primary/50 hover:text-text-primary'
                                        }`}
                                    onClick={(e) => handleNavigation(e, href)}
                                >
                                    <Icon className="text-lg mr-3" />
                                    <span>{label}</span>
                                </Link>
                            ))}
                        </nav>

                        <div className="w-full px-6 mt-6">
                            <UserHistory />
                        </div>
                    </div>

                    <div className="flex flex-col justify-end items-center w-full mb-5 font-medium text-sm space-y-3 px-4 flex-shrink-0">
                        <div className='w-full rounded-lg overflow-hidden'>
                            <UserAvatar isCollapsed={false} />
                        </div>
                        <button
                            onClick={toggleTheme}
                            className="relative flex items-center p-2 text-xl rounded-full 
                                bg-border-secondary/30 hover:bg-border-primary/40 backdrop-blur-sm
                                shadow-sm transition-all duration-200 w-32"
                            style={{ borderRadius: '9999px' }}
                        >
                            <div
                                className="absolute bg-primary shadow-md"
                                style={{
                                    width: '2.5rem',
                                    height: '2.5rem',
                                    transform: theme === 'dark' ? 'translateX(0)' : 'translateX(4.5rem)',
                                    transition: 'transform 0.3s ease, background-color 0.3s ease',
                                    borderRadius: '9999px',
                                }}
                            ></div>
                            <div className="flex justify-between w-full px-2">
                                <span>☀️</span>
                                <span>🌙</span>
                            </div>
                        </button>
                    </div>
                </motion.div>
            </>
        );
    }

    // Desktop sidebar
    return (
        <motion.div
            className={`fixed left-0 top-0 h-screen ${isCollapsed ? 'w-16' : 'w-[200px]'} 
                bg-primary z-40 flex flex-col justify-between items-start overflow-x-hidden
                text-text-primary transition-all duration-200 shadow-md overflow-y-auto
                backdrop-blur-md bg-opacity-95 md:flex`}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
        >
            <div className="w-full flex-shrink-0">
                <h1 className={`text-2xl font-semibold ${isCollapsed ? 'mt-6 text-center' : 'mt-6 ml-1'} tracking-tight h-8 flex items-center`}>
                    {isCollapsed ? (
                        <span className="text-text-primary font-bold">IW</span>
                    ) : (
                        <>
                            <svg width="32" height="32" viewBox="0 0 120 130" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                                <g transform="translate(10, 5)">
                                    <circle cx="20" cy="20" r="9" fill="#2563eb" />
                                    <circle cx="100" cy="20" r="9" fill="#2563eb" />
                                    <circle cx="20" cy="90" r="9" fill="#2563eb" />
                                    <circle cx="100" cy="90" r="9" fill="#2563eb" />
                                    <path
                                        d="M20 20 L100 90 M100 20 L20 90 M20 20 L20 90 M100 20 L100 90 M100 90 L70 120"
                                        stroke="#2563eb"
                                        strokeWidth="7"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        fill="none"
                                    />
                                </g>
                            </svg>
                            <div className="flex">
                                <span className="text-text-primary font-bold">Inno</span>
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500 font-bold">
                                    Weaver
                                </span>
                            </div>
                        </>
                    )}
                </h1>
                <div className="w-full h-px bg-gradient-to-r from-transparent via-border-secondary to-transparent my-5 opacity-70" />

                <div className={`${isCollapsed ? 'px-1' : 'px-5'} mb-3 mt-8`}>
                    <h2 className={`text-xs font-bold text-text-secondary uppercase tracking-wider ${isCollapsed ? 'text-center' : ''} opacity-70`}>Main</h2>
                </div>
                <nav className={`flex flex-col items-center w-full font-medium text-base space-y-3 ${isCollapsed ? 'px-1.5' : 'px-3'} mb-4 flex-shrink-0`}>
                    {[
                        { href: '/', icon: Home, label: 'Home' },
                        { href: '/gallery', icon: Image, label: 'Gallery' },
                    ].map(({ href, icon: Icon, label }) => (
                        <Link
                            key={href}
                            href={href}
                            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : ''} px-2 py-1 rounded-xl transition-all duration-200 ${isActive(href)
                                ? 'text-text-primary font-semibold'
                                : 'text-text-secondary hover:bg-border-primary/50 hover:text-text-primary'
                                }`}
                            onClick={(e) => handleNavigation(e, href)}
                        >
                            <Icon className={`${isCollapsed ? 'text-xl' : 'text-lg'} ${isActive(href) ? 'text-text-primary font-semibold' : 'text-text-secondary'}`} />
                            <span className={`ml-2 ${isCollapsed ? 'hidden' : 'block'}`}>{label}</span>
                            {!isCollapsed && isActive(href)}
                        </Link>
                    ))}
                </nav>

                <div className={`${isCollapsed ? 'px-1' : 'px-5'} mb-3 mt-8`}>
                    <h2 className={`text-xs font-bold text-text-secondary uppercase tracking-wider ${isCollapsed ? 'text-center' : ''} opacity-70`}>User</h2>
                </div>
                <nav className={`flex flex-col items-center w-full font-medium text-base space-y-3 ${isCollapsed ? 'px-1.5' : 'px-3'} flex-shrink-0`}>
                    {[
                        ...(authStore.userType === 'developer' ? [{ href: '/user/developer', icon: Code, label: 'Developer' }] : []),
                        { href: '/user/favlist', icon: Star, label: 'Favorite' },
                        { href: '/user/history', icon: History, label: 'History' },
                    ].map(({ href, icon: Icon, label }) => (
                        <Link
                            key={href}
                            href={href}
                            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : ''} px-2 py-1 rounded-xl transition-all duration-200 ${isActive(href)
                                ? 'text-text-primary font-semibold'
                                : 'text-text-secondary hover:bg-border-primary/50 hover:text-text-primary'
                                }`}
                            onClick={(e) => handleNavigation(e, href)}
                        >
                            <Icon className={`${isCollapsed ? 'text-xl' : 'text-lg'} ${isActive(href) ? 'text-text-primary font-semibold' : 'text-text-secondary'}`} />
                            <span className={`ml-2 ${isCollapsed ? 'hidden' : 'block'}`}>{label}</span>
                            {!isCollapsed && isActive(href)}
                        </Link>
                    ))}
                </nav>

                {!isCollapsed && (
                    <div className="w-full px-4 ml-3 mt-1">
                        <UserHistory />
                    </div>
                )}
            </div>

            <div className={`flex flex-col justify-end items-center w-full mb-5 font-medium text-sm space-y-3 ${isCollapsed ? 'px-1.5' : 'px-3'} flex-shrink-0`}>
                <div className='w-full rounded-lg overflow-hidden'>
                    <UserAvatar isCollapsed={isCollapsed} />
                </div>
                {isCollapsed ? (
                    <button
                        onClick={toggleTheme}
                        className="relative flex items-center justify-center p-2 text-xl rounded-full 
                            bg-border-secondary/30 hover:bg-border-primary/40 mb-2 backdrop-blur-sm
                            shadow-sm transition-all duration-200"
                        style={{ width: '2.5rem', height: '2.5rem' }}
                    >
                        {theme === 'dark' ? '🌙' : '☀️'}
                    </button>
                ) : (
                    <button
                        onClick={toggleTheme}
                        className="relative flex items-center p-2 text-xl rounded-full 
                            bg-border-secondary/30 hover:bg-border-primary/40 backdrop-blur-sm
                            shadow-sm transition-all duration-200"
                        style={{ width: '8rem', borderRadius: '9999px', marginLeft: '-2rem' }}
                    >
                        <div
                            className="absolute bg-primary shadow-md"
                            style={{
                                width: '2.5rem',
                                height: '2.5rem',
                                transform: theme === 'dark' ? 'translateX(0)' : 'translateX(4.5rem)',
                                transition: 'transform 0.3s ease, background-color 0.3s ease',
                                borderRadius: '9999px',
                            }}
                        ></div>
                        <div className="flex justify-between w-full px-2">
                            <span>☀️</span>
                            <span>🌙</span>
                        </div>
                    </button>
                )}
            </div>
        </motion.div>
    );
}