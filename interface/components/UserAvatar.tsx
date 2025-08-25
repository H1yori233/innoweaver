'use client';

import React, { useMemo } from 'react';
import useAuthStore from '@/lib/hooks/auth-store';
import Link from 'next/link';
import { User, ChevronRight } from 'lucide-react';

interface UserAvatarProps {
  isCollapsed: boolean;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ isCollapsed }) => {
  const { name, email, id } = useAuthStore();

  const initials = useMemo(() => {
    if (name) {
      const words = name.trim().split(' ');
      if (words.length === 1) {
        return words[0].substring(0, 2).toUpperCase();
      }
      return words.slice(0, 2).map(word => word.charAt(0).toUpperCase()).join('');
    }
    return '';
  }, [name]);

  const displayName = name || 'Guest User';
  const targetHref = email ? `/user/${id}` : '/user/login';
  
  // Generate consistent background gradient based on username
  const avatarGradient = useMemo(() => {
    if (!name && !email) return 'from-organic-sage to-organic-clay';
    
    const str = name || email || 'default';
    const hash = str.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const gradients = [
      'from-organic-sage to-organic-moss',
      'from-organic-clay to-organic-sand', 
      'from-organic-rust to-organic-clay',
      'from-accent-primary to-organic-storm',
      'from-organic-moss to-accent-primary',
      'from-organic-sand to-organic-sage',
    ];
    
    return gradients[Math.abs(hash) % gradients.length];
  }, [name, email]);

  // User status indicator
  const userStatus = email ? 'online' : 'offline';
  
  if (isCollapsed) {
    return (
      <Link 
        href={targetHref}
        className="group block w-full"
      >
        <div className="relative flex items-center justify-center">
          {/* Avatar container */}
          <div className={`
            relative w-9 h-9 rounded-lg overflow-hidden
            bg-gradient-to-br ${avatarGradient} 
            border-2 border-surface-elevated
            shadow-sm group-hover:shadow-md
            transition-all duration-200 
            group-hover:scale-105 group-active:scale-95
          `}>
            {/* Background texture */}
            <div className="absolute inset-0 bg-texture opacity-30" />
            
            {/* Content */}
            <div className="relative flex items-center justify-center h-full text-surface-elevated font-semibold text-sm">
              {email ? (
                initials || <User className="w-4 h-4" />
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>
            
            {/* Hover effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/0 to-white/10 
                           opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </div>

          {/* Status indicator */}
          <div className={`
            absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-surface-primary
            ${userStatus === 'online' ? 'bg-success' : 'bg-text-placeholder'}
            transition-colors duration-200
          `}>
            <div className={`
              w-full h-full rounded-full animate-pulse
              ${userStatus === 'online' ? 'bg-success' : 'bg-text-placeholder'}
            `} />
          </div>
          
          {/* Tooltip */}
          <div className="
            absolute left-12 top-1/2 -translate-y-1/2 px-3 py-2 
            bg-surface-elevated border border-border-subtle rounded-lg shadow-lg
            text-sm font-medium text-text-primary whitespace-nowrap
            opacity-0 group-hover:opacity-100 transition-all duration-200
            pointer-events-none scale-95 group-hover:scale-100 z-50
          ">
            <div className="flex items-center space-x-2">
              <span>{displayName}</span>
              {email && <span className="text-text-tertiary text-xs">({email})</span>}
            </div>
            
            {/* Arrow */}
            <div className="absolute right-full top-1/2 -translate-y-1/2 
                           border-4 border-transparent border-r-surface-elevated" />
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link 
      href={targetHref}
      className="group block w-full"
    >
      <div className="
        flex items-center space-x-3 p-2 rounded-lg
        hover:bg-surface-secondary border border-transparent hover:border-border-subtle
        transition-all duration-200 group-hover:shadow-sm
      ">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className={`
            relative w-9 h-9 rounded-lg overflow-hidden
            bg-gradient-to-br ${avatarGradient}
            border-2 border-surface-elevated
            shadow-sm group-hover:shadow-md
            transition-all duration-200 
            group-hover:scale-105 group-active:scale-95
          `}>
            {/* Background texture */}
            <div className="absolute inset-0 bg-texture opacity-30" />
            
            {/* Content */}
            <div className="relative flex items-center justify-center h-full text-surface-elevated font-semibold text-sm">
              {email ? (
                initials || <User className="w-4 h-4" />
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>
            
            {/* Hover effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/0 to-white/10 
                           opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </div>

          {/* Status indicator */}
          <div className={`
            absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full 
            border-2 border-surface-primary
            ${userStatus === 'online' ? 'bg-success' : 'bg-text-placeholder'}
            transition-colors duration-200
          `}>
            <div className={`
              w-full h-full rounded-full animate-pulse
              ${userStatus === 'online' ? 'bg-success' : 'bg-text-placeholder'}
            `} />
          </div>
        </div>

        {/* User information */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text-primary truncate group-hover:text-accent-primary 
                           transition-colors duration-200" 
                 title={displayName}>
                {displayName}
              </p>
              
              {email ? (
                <p className="text-xs text-text-tertiary truncate" 
                   title={email}>
                  {email.length > 20 
                    ? `${email.substring(0, 18)}...` 
                    : email}
                </p>
              ) : (
                <p className="text-xs text-accent-secondary font-medium">
                  Sign In
                </p>
              )}
            </div>
            
            {/* Arrow indicator */}
            <ChevronRight className="w-4 h-4 text-text-placeholder 
                                   group-hover:text-text-secondary
                                   transform group-hover:translate-x-0.5 
                                   transition-all duration-200 flex-shrink-0" />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default React.memo(UserAvatar);
