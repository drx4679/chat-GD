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
    ? new Date(lastMessage.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) 
    : '';

  return (
    <Link href={`/chat/${conversation.id}`} className={`block border-b border-gray-100 transition-colors ${isActive ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}>
      <div className="flex items-center p-4">
        <UserAvatar 
          username={otherParticipant.username} 
          avatarUrl={otherParticipant.avatar_url} 
        />
        <div className="ml-3 flex-1 overflow-hidden">
          <div className="flex justify-between items-baseline">
            <h3 className="font-medium text-gray-900 truncate">{otherParticipant.username}</h3>
            {timeString && <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{timeString}</span>}
          </div>
          <div className="flex justify-between items-center mt-1">
            <p className="text-sm text-gray-500 truncate">
              {lastMessage ? lastMessage.content : 'Nouvelle conversation'}
            </p>
            {conversation.unread_count > 0 && (
              <span className="ml-2 bg-indigo-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                {conversation.unread_count}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
