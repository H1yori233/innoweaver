'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import useAuthStore from '@/lib/hooks/auth-store';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, Image, History, Star, Code } from 'lucide-react';
import { FeedbackFish } from '@feedback-fish/react';
import UserHistory from './UserHistory';
import UserAvatar from './UserAvatar';

export default function TopBar() {
    const pathname = usePathname();
    const router = useRouter();
    const [key, setKey] = useState(0);
    const authStore = useAuthStore();
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        setKey(prevKey => prevKey + 1);
        setTheme(document.body.className || 'light');
    }, [pathname]);

    const [theme, setTheme] = useState(() => {
        if (typeof document !== 'undefined') {
            return document.body.className || 'light';
        }
        return 'light';
    });

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
    };
    const isActive = (path: string) => pathname === path;
    const toggleSidebar = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        const event = new CustomEvent('sidebarToggle', { detail: newState });
        window.dispatchEvent(event);
    };


    return (
        <motion.div
            className={`fixed left-0 top-0 h-screen ${isCollapsed ? 'w-16' : 'w-[200px]'} 
                bg-primary z-40 flex flex-col justify-between items-start overflow-x-hidden
                text-text-primary transition-all duration-200 shadow-md overflow-y-auto
                backdrop-blur-md bg-opacity-95`}
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
                        // { href: '/chat', icon: FaCommentAlt, label: 'Chat' },
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
                {/* {!isCollapsed && (
                    <FeedbackFish projectId="99f3739e6a24ef" userId={authStore.email}>
                        <button
                            className="py-2.5 px-5 text-cyan-400 rounded-xl text-base font-semibold 
                            hover:bg-secondary/30 hover:text-cyan-300 transition-all duration-200
                            shadow-sm backdrop-blur-sm"
                            style={{ width: '8rem' }}
                        >
                            Feedback
                        </button>
                    </FeedbackFish>
                )} */}
                {/* <button
                    onClick={toggleSidebar}
                    className="absolute bottom-0 left-0 right-0 h-10 flex items-center justify-end pr-4 
                    hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                    <div className="p-2 rounded-full">
                        {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
                    </div>
                </button> */}
            </div>
        </motion.div>
    );
}