"use client";

import { User } from 'lucide-react';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  showOnline?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
  xxl: 'h-30 w-30 text-xl'
};

export default function Avatar({ 
  src, 
  alt, 
  name, 
  size = 'md', 
  showOnline = false,
  className = '' 
}: AvatarProps) {
  // Generate initials from name
  const getInitials = (name?: string) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const initials = getInitials(name || alt);

  return (
    <div className={`relative ${className}`}>
      <div className={`
        ${sizeClasses[size]} 
        rounded-full 
        overflow-hidden 
        bg-gradient-to-br from-accent/20 to-accent/40
        flex items-center justify-center
        font-bold text-black dark:text-white
        border-2 border-white dark:border-black
        shadow-sm
      `}>
        {src ? (
          <img 
            src={src} 
            alt={alt || name || 'Avatar'} 
            className="h-full w-full object-cover"
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      
      {showOnline && (
        <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white dark:border-black"></div>
      )}
    </div>
  );
}
