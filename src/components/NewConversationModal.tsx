'use client';

// Modale pour chercher un utilisateur et créer une conversation
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-browser';
import { useConversations } from '@/hooks/useConversations';
import { useAuth } from '@/hooks/useAuth';
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
  const [creating, setCreating] = useState(false);
  const { createConversation } = useConversations();
  const { user } = useAuth();
  const router = useRouter();

  // Charger tous les utilisateurs au montage, puis filtrer par recherche
  useEffect(() => {
    if (!isOpen) return;

    const fetchUsers = async () => {
      setSearching(true);
      
      let query = supabase
        .from('profiles')
        .select('*')
        .limit(20);

      // Exclure l'utilisateur courant
      if (user?.id) {
        query = query.neq('id', user.id);
      }

      // Filtrer par nom si recherche
      if (search.trim()) {
        query = query.ilike('username', `%${search}%`);
      }

      // Trier par nom
      query = query.order('username', { ascending: true });

      const { data, error } = await query;
      
      if (!error && data) {
        setResults(data as Profile[]);
      }
      setSearching(false);
    };

    const timer = setTimeout(fetchUsers, 200);
    return () => clearTimeout(timer);
  }, [search, isOpen, user?.id]);

  if (!isOpen) return null;

  const handleCreate = async (userId: string) => {
    if (creating) return;
    setCreating(true);
    try {
      const convId = await createConversation(userId);
      onClose();
      router.push(`/chat/${convId}`);
    } catch (err) {
      console.error('Erreur création conversation :', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-[fadeIn_0.15s_ease-out]">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md max-h-[80vh] flex flex-col animate-[popIn_0.15s_ease-out]">
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-base font-semibold text-gray-900 tracking-tight">Nouvelle discussion</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4 pb-2">
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-gray-50/80 border border-gray-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-sm transition-all placeholder:text-gray-400"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin">
          {searching && (
            <div className="flex items-center justify-center py-6 space-x-2">
              <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <span className="text-xs text-gray-400 font-medium">Recherche...</span>
            </div>
          )}
          
          {!searching && results.length === 0 && (
            <p className="text-center text-xs text-gray-400 py-6">
              {search ? 'Aucun utilisateur trouvé.' : 'Aucun autre utilisateur inscrit.'}
            </p>
          )}
          
          {!searching && results.map(u => (
            <div 
              key={u.id} 
              onClick={() => handleCreate(u.id)}
              className={`flex items-center p-2.5 hover:bg-indigo-50/60 rounded-xl cursor-pointer transition-colors ${creating ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <UserAvatar username={u.username} avatarUrl={u.avatar_url} />
              <div className="ml-3">
                <span className="text-sm font-semibold text-gray-800">{u.username}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
