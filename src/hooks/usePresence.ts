'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-browser';
import { useAuth } from './useAuth';

interface PresenceState {
  online: boolean;
  last_seen: string;
}

interface UsePresenceReturn {
  onlineUsers: Record<string, PresenceState>;
}

export function usePresence(conversationId: string): UsePresenceReturn {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Record<string, PresenceState>>({});

  useEffect(() => {
    if (!conversationId || !user) return;

    const channel = supabase.channel(`presence:${conversationId}`);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users: Record<string, PresenceState> = {};
        
        for (const [key, presences] of Object.entries(state)) {
          if (presences.length > 0) {
            const p: any = presences[0];
            users[p.user_id] = { online: true, last_seen: new Date().toISOString() };
          }
        }
        
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [conversationId, user]);

  return { onlineUsers };
}
