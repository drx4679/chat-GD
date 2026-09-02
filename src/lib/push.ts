import { supabase } from './supabase-browser';

/**
 * Convertit une clé publique VAPID en Base64 vers un Uint8Array pour le PushManager
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Enregistre le Service Worker, souscrit aux notifications Push et enregistre les identifiants dans Supabase
 */
export async function subscribeToPush(userId: string): Promise<PushSubscription | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Notifications Push non supportées par ce navigateur.');
    return null;
  }

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) {
    console.error('Variable NEXT_PUBLIC_VAPID_PUBLIC_KEY non définie.');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey as BufferSource,
    });

    const subscriptionJson = subscription.toJSON();
    if (!subscriptionJson.endpoint || !subscriptionJson.keys?.p256dh || !subscriptionJson.keys?.auth) {
      throw new Error('Données de souscription invalides.');
    }

    // Sauvegarde de la souscription dans Supabase
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          user_id: userId,
          endpoint: subscriptionJson.endpoint,
          keys: {
            p256dh: subscriptionJson.keys.p256dh,
            auth: subscriptionJson.keys.auth,
          },
        },
        { onConflict: 'user_id,endpoint' }
      );

    if (error) {
      console.error("Erreur lors de l'enregistrement de la souscription dans Supabase :", error);
      throw error;
    }

    return subscription;
  } catch (error) {
    console.error('Erreur lors de la souscription Push :', error);
    throw error;
  }
}

/**
 * Désabonne le client des notifications Push et supprime l'enregistrement Supabase
 */
export async function unsubscribeFromPush(userId: string): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();

      // Suppression de l'entrée correspondante dans Supabase
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', userId)
        .eq('endpoint', endpoint);

      if (error) {
        console.error('Erreur lors de la suppression de la souscription Supabase :', error);
      }
    }

    return true;
  } catch (error) {
    console.error('Erreur lors du désabonnement Push :', error);
    return false;
  }
}
