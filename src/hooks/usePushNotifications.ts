'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { subscribeToPush, unsubscribeFromPush } from '@/lib/push';

interface UsePushNotificationsReturn {
  isSubscribed: boolean;
  isSupported: boolean;
  permission: NotificationPermission;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  // Vérifier le support des notifications push sur cet appareil
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
      setIsSupported(supported);
      if (supported) {
        setPermission(Notification.permission);
      }
    }
  }, []);

  // Vérifier l'abonnement réel de CE navigateur / appareil
  const checkDeviceSubscription = useCallback(async () => {
    if (!user || typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setIsSubscribed(false);
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        setIsSubscribed(true);
        // S'assurer que les identifiants de ce navigateur sont bien enregistrés dans Supabase
        await subscribeToPush(user.id);
      } else {
        setIsSubscribed(false);

        // Si la permission est déjà accordée sur ce navigateur, souscrire automatiquement
        if (Notification.permission === 'granted') {
          const newSub = await subscribeToPush(user.id);
          setIsSubscribed(!!newSub);
        }
      }
    } catch (e) {
      console.warn('Erreur vérification souscription push appareil:', e);
      setIsSubscribed(false);
    }
  }, [user]);

  useEffect(() => {
    checkDeviceSubscription();
  }, [checkDeviceSubscription]);

  const subscribe = async () => {
    if (!user || !isSupported) return;

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm === 'granted') {
        const sub = await subscribeToPush(user.id);
        setIsSubscribed(!!sub);
      } else {
        setIsSubscribed(false);
      }
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

  return { isSubscribed, isSupported, permission, subscribe, unsubscribe };
}
