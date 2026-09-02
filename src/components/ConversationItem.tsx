'use client';

// Élément individuel dans la liste des conversations
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConversationWithDetails, Profile } from '@/types/database';
import UserAvatar from './UserAvatar';

interface ConversationItemProps {
  conversation: ConversationWithDetails;
  currentUserId: string;
}

export default function ConversationItem({ conversation, currentUserId }: ConversationItemProps) {
  const pathname = usePathname();
  const isActive = pathname === `/chat/${conversation.id}`;
  
  // Trouver l'autre participant
  const otherParticipant = conversation.participants.find(p => p.id !== currentUserId) as Profile;
  
  if (!otherParticipant) return null;

  const lastMessage = conversation.last_message;
  const timeString = lastMessage 
    ? formatTime(lastMessage.created_at)
    : '';

  const hasUnread = conversation.unread_count > 0;

  return (
    <Link 
      href={`/chat/${conversation.id}`} 
      className={`block border-b border-gray-100 transition-colors ${
        isActive ? 'bg-indigo-50' : 'hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center p-4">
        <UserAvatar 
          username={otherParticipant.username} 
          avatarUrl={otherParticipant.avatar_url} 
        />
        <div className="ml-3 flex-1 overflow-hidden">
          <div className="flex justify-between items-baseline">
            <h3 className={`truncate ${hasUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-900'}`}>
              {otherParticipant.username}
            </h3>
            <span className={`text-xs flex-shrink-0 ml-2 ${hasUnread ? 'text-indigo-500 font-semibold' : 'text-gray-400'}`}>
              {timeString}
            </span>
          </div>
          <div className="flex justify-between items-center mt-0.5">
            <p className={`text-sm truncate ${hasUnread ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
              {lastMessage 
                ? (lastMessage.sender_id === currentUserId ? '✓ ' : '') + lastMessage.content 
                : 'Nouvelle conversation'
              }
            </p>
            {hasUnread && (
              <span className="ml-2 bg-indigo-500 text-white text-xs font-bold min-w-[20px] h-5 flex items-center justify-center rounded-full flex-shrink-0 px-1.5">
                {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Hier';
  } else if (diffDays < 7) {
    return date.toLocaleDateString('fr-FR', { weekday: 'short' });
  } else {
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  }
}
