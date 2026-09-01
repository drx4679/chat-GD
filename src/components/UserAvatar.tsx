'use client';

// Composant pour afficher l'avatar d'un utilisateur
import React from 'react';

interface UserAvatarProps {
  username: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  online?: boolean;
}

export default function UserAvatar({ username, avatarUrl, size = 'md', online }: UserAvatarProps) {
  // Calculer une couleur basée sur le nom d'utilisateur
  const hashCode = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
  };
  const colors = ['bg-red-500', 'bg-yellow-500', 'bg-green-500', 'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500'];
  const colorClass = colors[Math.abs(hashCode(username)) % colors.length];

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  };

  return (
    <div className="relative inline-block flex-shrink-0">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={username}
          className={`${sizeClasses[size]} rounded-full object-cover`}
        />
      ) : (
        <div className={`${sizeClasses[size]} ${colorClass} rounded-full flex items-center justify-center text-white font-bold uppercase`}>
          {username.charAt(0)}
        </div>
      )}
      
      {online && (
        <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white" />
      )}
    </div>
  );
}
