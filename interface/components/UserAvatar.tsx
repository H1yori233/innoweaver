'use client';

import React, { useMemo } from 'react';
import useAuthStore from '@/lib/hooks/auth-store';
import Link from 'next/link';
import { FaUser } from 'react-icons/fa';

// Define component props
interface UserAvatarProps {
  isCollapsed: boolean;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ isCollapsed }) => {
  const { name, email, id } = useAuthStore();

  const initials = useMemo(() => {
    if (name) {
      return name.substring(0, 2).toUpperCase();
    }
    return '';
  }, [name]);

  const displayName = name || 'Guest';
  const targetHref = email ? `/user/${id}` : '/user/login';

  return (
    <Link 
      href={targetHref} 
      className={`w-full block transition-all duration-200 ${
        isCollapsed ? 'py-2' : 'p-3 hover:bg-secondary/50 rounded-lg'
      }`}
    >
      <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start space-x-3'}`}>
        <div 
          className={`rounded-full bg-blue-500/20 text-blue-600 font-bold 
            flex items-center justify-center shadow-sm
            ${isCollapsed ? 'w-10 h-10' : 'w-10 h-10'}`}
        >
          {email ? (initials || <FaUser className="text-sm" />) : <FaUser className="text-sm" />}
        </div>
        
        {!isCollapsed && (
          <div className="flex flex-col overflow-hidden">
            <span 
              className="text-sm font-semibold text-text-primary truncate" 
              title={displayName}
            >
              {displayName}
            </span>
            
            {email ? (
              <span className="text-xs text-text-secondary truncate" title={email}>
                {email.length > 18 
                  ? `${email.substring(0, 16)}...` 
                  : email}
              </span>
            ) : (
              <span className="text-xs text-blue-400 font-medium">
                Sign In
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default React.memo(UserAvatar);