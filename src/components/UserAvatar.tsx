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
  const gradients = [
    'bg-gradient-to-tr from-indigo-500 to-indigo-600',
    'bg-gradient-to-tr from-sky-500 to-blue-600',
    'bg-gradient-to-tr from-emerald-500 to-teal-600',
    'bg-gradient-to-tr from-violet-500 to-purple-600',
    'bg-gradient-to-tr from-rose-500 to-pink-600',
    'bg-gradient-to-tr from-amber-500 to-orange-600',
  ];
  const gradientClass = gradients[Math.abs(hashCode(username)) % gradients.length];

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
          className={`${sizeClasses[size]} rounded-full object-cover ring-2 ring-white shadow-xs`}
        />
      ) : (
        <div className={`${sizeClasses[size]} ${gradientClass} rounded-full flex items-center justify-center text-white font-semibold uppercase ring-2 ring-white shadow-xs`}>
          {username.charAt(0)}
        </div>
      )}
      
      {online && (
        <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
      )}
    </div>
  );
}
