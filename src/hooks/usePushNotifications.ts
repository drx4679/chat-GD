'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-browser';
import { useAuth } from './useAuth';
import { subscribeToPush, unsubscribeFromPush } from '@/lib/push';

interface UsePushNotificationsReturn {
  isSubscribed: boolean;
  isSupported: boolean;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  // Vérifier le support des notifications push
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      setIsSupported('serviceWorker' in navigator && 'PushManager' in window);
    }
  }, []);

  // Vérifier si l'utilisateur est déjà abonné
  useEffect(() => {
    if (!user) {
      setIsSubscribed(false);
      return;
    }

    const checkSubscription = async () => {
      const { data } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      setIsSubscribed(!!data);
    };

    checkSubscription();
  }, [user]);

  const subscribe = async () => {
    if (!user || !isSupported) return;

    try {
      await subscribeToPush(user.id);
      setIsSubscribed(true);
    } catch (e) {
      console.error('Erreur lors de l\'abonnement push :', e);
    }
  };

  const unsubscribe = async () => {
    if (!user || !isSupported) return;

    try {
      await unsubscribeFromPush(user.id);
      setIsSubscribed(false);
    } catch (e) {
      console.error('Erreur lors du désabonnement push :', e);
    }
  };

  return { isSubscribed, isSupported, subscribe, unsubscribe };
}
