'use client';

// Modale pour chercher un utilisateur et créer une conversation
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-browser';
import { useConversations } from '@/hooks/useConversations';
import UserAvatar from './UserAvatar';
import { Profile } from '@/types/database';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewConversationModal({ isOpen, onClose }: Props) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const { createConversation } = useConversations();
  const router = useRouter();

  useEffect(() => {
    if (!search.trim()) {
      setResults([]);
      return;
    }

    const fetchUsers = async () => {
      setSearching(true);
      // Recherche d'utilisateurs
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', `%${search}%`)
        .limit(10);
      
      if (!error && data) {
        setResults(data);
      }
      setSearching(false);
    };

    const timer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timer);
  }, [search]);

  if (!isOpen) return null;

  const handleCreate = async (userId: string) => {
    try {
      const convId = await createConversation(userId);
      onClose();
      router.push(`/chat/${convId}`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Nouvelle conversation</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4">
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {searching && <p className="text-center text-sm text-gray-500 py-4">Recherche...</p>}
          {!searching && search && results.length === 0 && (
            <p className="text-center text-sm text-gray-500 py-4">Aucun utilisateur trouvé.</p>
          )}
          {!searching && results.map(user => (
            <div 
              key={user.id} 
              onClick={() => handleCreate(user.id)}
              className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
            >
              <UserAvatar username={user.username} avatarUrl={user.avatar_url} />
              <span className="ml-3 font-medium text-gray-900">{user.username}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
