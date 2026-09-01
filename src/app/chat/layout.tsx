'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import ConversationList from '@/components/ConversationList';
import NotificationPrompt from '@/components/NotificationPrompt';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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
    <div className="h-full flex flex-col bg-white">
      <NotificationPrompt />
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar : Liste des conversations */}
        <div className={`${isConversationView ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 lg:w-96 border-r border-gray-200 bg-white`}>
          <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white shadow-sm z-10">
            <h1 className="text-xl font-bold text-gray-900">Discussions</h1>
            <button 
              onClick={() => signOut()}
              className="text-sm text-gray-500 hover:text-gray-900"
            >
              Déconnexion
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <ConversationList />
          </div>
        </div>

        {/* Vue principale : Chat ou Placeholder */}
        <div className={`${!isConversationView ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-gray-50`}>
          {children}
        </div>
      </div>
    </div>
  );
}
