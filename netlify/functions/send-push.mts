import { Config, Context } from '@netlify/functions';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

// Types pour la charge utile (payload) du Webhook Supabase
interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  record: {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    created_at: string;
    read_at?: string | null;
  };
  old_record?: Record<string, unknown> | null;
}

// Interface pour la table push_subscriptions
interface PushSubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Interface pour la table profiles
interface ProfileRow {
  username: string;
  avatar_url?: string | null;
}

// Configuration des clés VAPID depuis les variables d'environnement
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:contact@gdshopchat.com';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

/**
 * Fonction Netlify déclenchée sur webhook Supabase lors de l'insertion d'un nouveau message.
 * Envoie une notification Web Push à tous les autres participants de la conversation.
 */
export default async (req: Request, context: Context): Promise<Response> => {
  // 1. Vérification de la méthode HTTP
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Méthode non autorisée' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // 2. Vérification des variables d'environnement obligatoires
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('Variables SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquantes.');
      return new Response(JSON.stringify({ error: 'Configuration serveur Supabase incomplète' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('Variables VAPID_PUBLIC_KEY ou VAPID_PRIVATE_KEY manquantes.');
      return new Response(JSON.stringify({ error: 'Configuration VAPID incomplète' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. Validation de la charge utile (Webhook Supabase)
    const payload = (await req.json()) as WebhookPayload;

    if (
      payload.type !== 'INSERT' ||
      payload.table !== 'messages' ||
      !payload.record?.conversation_id ||
      !payload.record?.sender_id ||
      !payload.record?.content
    ) {
      return new Response(
        JSON.stringify({ message: 'Événement ignoré (charge utile non ciblée ou incomplète)' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { id: messageId, conversation_id: conversationId, sender_id: senderId, content } = payload.record;

    // 4. Initialisation du client Supabase Admin avec la clé Service Role
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false },
    });

    // 5. Récupération du profil de l'expéditeur pour le titre de la notification
    const { data: senderProfile, error: senderError } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', senderId)
      .single<ProfileRow>();

    if (senderError) {
      console.warn(`Impossible de récupérer le profil de l'expéditeur (${senderId}) :`, senderError.message);
    }

    const senderUsername = senderProfile?.username || 'Nouveau message';

    // 6. Récupération de la liste des destinataires (tous les participants sauf l'expéditeur)
    const { data: participants, error: participantsError } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .neq('user_id', senderId);

    if (participantsError) {
      console.error('Erreur lors de la récupération des participants :', participantsError.message);
      return new Response(JSON.stringify({ error: 'Erreur lors de la recherche des participants' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!participants || participants.length === 0) {
      return new Response(JSON.stringify({ message: 'Aucun destinataire à notifier pour cette conversation' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const recipientIds = participants.map((p) => p.user_id);

    // 7. Recherche des abonnements push actifs pour les destinataires
    const { data: subscriptions, error: subsError } = await supabase
      .from('push_subscriptions')
      .select('id, user_id, endpoint, keys')
      .in('user_id', recipientIds);

    if (subsError) {
      console.error('Erreur lors de la récupération des abonnements push :', subsError.message);
      return new Response(JSON.stringify({ error: 'Erreur lors de la recherche des abonnements' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ message: 'Aucun abonnement push trouvé pour les destinataires' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 8. Construction du contenu de la notification push
    const notificationPayload = JSON.stringify({
      title: senderUsername,
      body: content.length > 120 ? `${content.slice(0, 117)}...` : content,
      data: {
        conversationId,
        messageId,
        url: `/chat/${conversationId}`,
      },
      icon: senderProfile?.avatar_url || '/icon-192x192.png',
      badge: '/badge-72x72.png',
    });

    // 9. Envoi asynchrone des notifications et nettoyage des abonnements révoqués/expirés
    const sendPromises = (subscriptions as PushSubscriptionRow[]).map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys,
          },
          notificationPayload
        );
      } catch (err: any) {
        // En cas d'erreur 404 (Not Found) ou 410 (Gone), l'abonnement n'est plus valide
        if (err.statusCode === 404 || err.statusCode === 410) {
          console.info(`Suppression de l'abonnement push expiré : ${sub.id}`);
          await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        } else {
          console.error(`Échec de l'envoi de notification push (${sub.id}) :`, err);
        }
      }
    });

    await Promise.all(sendPromises);

    // 10. Succès
    return new Response(
      JSON.stringify({
        success: true,
        sentCount: subscriptions.length,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Erreur inattendue dans la fonction send-push :', error);
    return new Response(JSON.stringify({ error: error.message || 'Erreur interne' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const config: Config = {
  path: '/api/send-push',
  method: 'POST',
};
