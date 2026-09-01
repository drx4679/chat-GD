'use client';

import { useParams, useRouter } from 'next/navigation';
import { useConversations } from '@/hooks/useConversations';
import { useAuth } from '@/hooks/useAuth';
import { usePresence } from '@/hooks/usePresence';
import { useMessages } from '@/hooks/useMessages';
import MessageList from '@/components/MessageList';
import MessageInput from '@/components/MessageInput';
import UserAvatar from '@/components/UserAvatar';
import PresenceIndicator from '@/components/PresenceIndicator';
import { Profile } from '@/types/database';

export default function ConversationPage() {
  const params = useParams();
  const conversationId = params.conversationId as string;
  const router = useRouter();
  const { conversations, loading: convsLoading } = useConversations();
  const { profile } = useAuth();
  const { onlineUsers } = usePresence(conversationId);
  const { sendMessage } = useMessages(conversationId);

  const conversation = conversations.find(c => c.id === conversationId);
  const otherParticipant = conversation?.participants.find(p => p.id !== profile?.id) as Profile;

  if (convsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!conversation || !otherParticipant) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Conversation introuvable</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative">
      {/* Header */}
      <div className="flex items-center p-3 border-b border-gray-200 bg-white shadow-sm z-10">
        <button 
          onClick={() => router.push('/chat')}
          className="md:hidden mr-3 p-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <UserAvatar 
          username={otherParticipant.username} 
          avatarUrl={otherParticipant.avatar_url}
          size="md"
          online={onlineUsers[otherParticipant.id]?.online}
        />
        
        <div className="ml-3">
          <h2 className="font-semibold text-gray-900 leading-tight">
            {otherParticipant.username}
          </h2>
          <PresenceIndicator 
            userId={otherParticipant.id} 
            onlineUsers={onlineUsers} 
          />
        </div>
      </div>

      {/* Messages */}
      <MessageList conversationId={conversationId} />

      {/* Input */}
      <div className="mt-auto z-10 bg-white">
        <MessageInput onSend={sendMessage} />
      </div>
    </div>
  );
}
