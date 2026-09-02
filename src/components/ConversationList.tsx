'use client';

// Liste des conversations de l'utilisateur
import { useState } from 'react';
import { useConversations } from '@/hooks/useConversations';
import { useAuth } from '@/hooks/useAuth';
import ConversationItem from './ConversationItem';
import NewConversationModal from './NewConversationModal';

export default function ConversationList() {
  const { conversations, loading } = useConversations();
  const { profile } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="p-3.5 space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center space-x-3 p-2 rounded-xl animate-pulse">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex-shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="h-3.5 bg-gray-100 rounded-md w-1/2"></div>
              <div className="h-2.5 bg-gray-100 rounded-md w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="relative h-full flex flex-col bg-white">
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {conversations.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center h-full">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 mb-3 border border-gray-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700">Aucune discussion</p>
            <p className="text-xs text-gray-400 mt-1 max-w-[200px]">Lancez une discussion ou attendez une nouvelle commande</p>
          </div>
        ) : (
          conversations.map(conv => (
            <ConversationItem 
              key={conv.id} 
              conversation={conv} 
              currentUserId={profile?.id || ''} 
            />
          ))
        )}
      </div>

      <button
        onClick={() => setIsModalOpen(true)}
        className="absolute bottom-5 right-5 w-11 h-11 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-full flex items-center justify-center shadow-md shadow-indigo-500/25 transition-all duration-150 group"
        title="Nouvelle conversation"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:rotate-90 duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {isModalOpen && (
        <NewConversationModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  );
}
