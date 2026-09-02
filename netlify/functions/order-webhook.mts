import { Config, Context } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

interface OrderWebhookPayload {
  type: 'INSERT' | 'UPDATE';
  table: string;
  record: {
    id: number;
    order_number: string;
    customer_name: string | null;
    customer_phone: string;
    customer_email: string | null;
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
    const customerName = order.customer_name || order.customer_phone;
    const customerPhone = order.customer_phone;
    const customerEmail = order.customer_email;

    // Client admin pour la base du chat
    const chatSupabase = createClient(chatUrl, chatServiceKey, {
      auth: { persistSession: false },
    });

    // Chercher si une conversation existe déjà pour ce client (par téléphone)
    let conversationId: string | null = null;

    const { data: existingConv } = await chatSupabase
      .from('conversations')
      .select('id')
      .eq('contact_phone', customerPhone)
      .limit(1)
      .maybeSingle();

    if (existingConv) {
      conversationId = existingConv.id;
      // Mettre à jour le timestamp
      await chatSupabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
    } else {
      // Créer une nouvelle conversation pour ce client
      const { data: newConv, error: convError } = await chatSupabase
        .from('conversations')
        .insert({
          contact_name: customerName,
          contact_phone: customerPhone,
          contact_email: customerEmail,
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (convError || !newConv) {
        console.error('Erreur création conversation :', convError);
        return new Response(JSON.stringify({ error: 'Erreur création conversation' }), { status: 500 });
      }

      conversationId = newConv.id;

      // Ajouter tous les utilisateurs du chat comme participants
      const { data: allUsers } = await chatSupabase
        .from('profiles')
        .select('id');

      if (allUsers && allUsers.length > 0) {
        await chatSupabase
          .from('conversation_participants')
          .insert(allUsers.map(u => ({
            conversation_id: conversationId!,
            user_id: u.id,
          })));
      }
    }

    // Trouver un expéditeur (premier participant)
    const { data: sender } = await chatSupabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId)
      .limit(1)
      .single();

    if (!sender) {
      return new Response(JSON.stringify({ error: 'Aucun participant' }), { status: 500 });
    }

    // Poster la commande comme message
    const { error: msgError } = await chatSupabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: sender.user_id,
        content: `[ORDER:${order.order_number}]`,
      });

    if (msgError) {
      console.error('Erreur insertion message :', msgError);
      return new Response(JSON.stringify({ error: msgError.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      order_number: order.order_number,
      conversation_id: conversationId,
      customer: customerName,
    }), {
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
