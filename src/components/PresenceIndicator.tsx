'use client';

// Indicateur de présence (en ligne / hors ligne)
import React from 'react';

interface Props {
  userId: string;
  onlineUsers: Record<string, { online: boolean; last_seen: string }>;
}

export default function PresenceIndicator({ userId, onlineUsers }: Props) {
  const presence = onlineUsers[userId];
  const isOnline = presence?.online;

  let text = 'Hors ligne';
  if (isOnline) {
    text = 'En ligne';
  } else if (presence?.last_seen) {
    const date = new Date(presence.last_seen);
    const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    text = `Vu à ${time}`;
  }

  return (
    <div className="flex items-center text-xs mt-0.5">
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
      <span className={isOnline ? 'text-green-600' : 'text-gray-500'}>{text}</span>
    </div>
  );
}
