'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import ConversationList from '@/components/ConversationList';
import NotificationPrompt from '@/components/NotificationPrompt';

import { useConversations } from '@/hooks/useConversations';
import OrderCounters from '@/components/OrderCounters';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const { conversations } = useConversations();
  const router = useRouter();
  const pathname = usePathname();

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = totalUnread > 0 ? `(${totalUnread}) Discussions — GD Shop Chat` : 'Discussions — GD Shop Chat';
    }
  }, [totalUnread]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Sur mobile, si on est sur une page de conversation spécifique, on cache la liste
  const isConversationView = pathname !== '/chat';

  return (
    <div className="h-full flex flex-col bg-gray-50/50">
      <NotificationPrompt />
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar : Liste des conversations */}
        <div className={`${isConversationView ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 lg:w-96 border-r border-gray-200/80 bg-white z-20`}>
          <div className="px-4 py-3.5 border-b border-gray-100 bg-white">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                <h1 className="text-lg font-bold text-gray-900 tracking-tight">Discussions</h1>
                {totalUnread > 0 && (
                  <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-2xs animate-[popIn_0.15s_ease-out]">
                    {totalUnread}
                  </span>
                )}
              </div>
              <button 
                onClick={() => signOut()}
                className="text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50/80 px-2.5 py-1.5 rounded-lg transition-all flex items-center space-x-1"
                title="Se déconnecter"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Déconnexion</span>
              </button>
            </div>

            {/* Compteurs commandes en pilules modernes */}
            <OrderCounters />
          </div>
          <div className="flex-1 overflow-hidden bg-white">
            <ConversationList />
          </div>
        </div>

        {/* Vue principale : Chat ou Placeholder */}
        <div className={`${!isConversationView ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-[#f8fafc]`}>
          {children}
        </div>
      </div>
    </div>
  );
}
