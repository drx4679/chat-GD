import { Config, Context } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const ORDERS_CONVERSATION_ID = '00000000-0000-0000-0000-000000000002';

interface OrderWebhookPayload {
  type: 'INSERT' | 'UPDATE';
  table: string;
  record: {
    id: number;
    order_number: string;
    customer_name: string | null;
    customer_phone: string;
    final_amount: number;
    currency: string | null;
    status: string;
  };
}

export default async (req: Request, context: Context): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const chatUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const chatServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!chatUrl || !chatServiceKey) {
      console.error('Variables Supabase chat manquantes');
      return new Response(JSON.stringify({ error: 'Config manquante' }), { status: 500 });
    }

    const payload = (await req.json()) as OrderWebhookPayload;

    if (!payload.record?.order_number) {
      return new Response(JSON.stringify({ message: 'Événement ignoré' }), { status: 200 });
    }

    const order = payload.record;

    // Client admin pour la base du chat
    const chatSupabase = createClient(chatUrl, chatServiceKey, {
      auth: { persistSession: false },
    });

    // Trouver le premier participant de la conversation comme expéditeur
    const { data: firstParticipant } = await chatSupabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', ORDERS_CONVERSATION_ID)
      .limit(1)
      .single();

    if (!firstParticipant) {
      return new Response(JSON.stringify({ error: 'Aucun participant trouvé' }), { status: 500 });
    }

    // Créer le message commande dans la conversation dédiée
    const messageContent = `[ORDER:${order.order_number}]`;

    const { error } = await chatSupabase
      .from('messages')
      .insert({
        conversation_id: ORDERS_CONVERSATION_ID,
        sender_id: firstParticipant.user_id,
        content: messageContent,
      });

    if (error) {
      console.error('Erreur insertion message commande :', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    // Mettre à jour le timestamp de la conversation
    await chatSupabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', ORDERS_CONVERSATION_ID);

    return new Response(JSON.stringify({ success: true, order_number: order.order_number }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Erreur order-webhook :', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

export const config: Config = {
  path: '/api/order-webhook',
  method: 'POST',
};
