// Types TypeScript décrivant le schéma de base de données Supabase de GD Shop Chat
// Format compatible avec @supabase/supabase-js v2

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          avatar_url: string | null;
          last_seen: string;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          avatar_url?: string | null;
          last_seen?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          avatar_url?: string | null;
          last_seen?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      conversation_participants: {
        Row: {
          conversation_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          conversation_id: string;
          user_id: string;
          joined_at?: string;
        };
        Update: {
          conversation_id?: string;
          user_id?: string;
          joined_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          created_at: string;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          created_at?: string;
          read_at?: string | null;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          content?: string;
          created_at?: string;
          read_at?: string | null;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          keys: {
            p256dh: string;
            auth: string;
          };
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          keys: {
            p256dh: string;
            auth: string;
          };
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          endpoint?: string;
          keys?: {
            p256dh: string;
            auth: string;
          };
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {};
    Functions: {
      get_user_conversations: {
        Args: { p_user_id: string };
        Returns: {
          conversation_id: string;
          created_at: string;
          updated_at: string;
        }[];
      };
      get_conversation_participants: {
        Args: { p_conversation_id: string };
        Returns: {
          user_id: string;
          username: string;
          avatar_url: string | null;
          last_seen: string;
        }[];
      };
      create_conversation: {
        Args: { p_other_user_id: string };
        Returns: string;
      };
    };
    Enums: {};
    CompositeTypes: {};
  };
};

// Types utilitaires pour un usage simplifié dans les composants
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type ConversationParticipant = Database['public']['Tables']['conversation_participants']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type PushSubscriptionRecord = Database['public']['Tables']['push_subscriptions']['Row'];

// Type enrichi pour la liste de conversations avec détails
export interface ConversationWithDetails extends Conversation {
  participants: Profile[];
  last_message: Message | null;
  unread_count: number;
}

// Types pour la 2e base Supabase (Orders)
export type OrderStatus = 'pending' | 'confirmed' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled' | 'cashpay';

export interface Order {
  id: number;
  order_number: string;
  customer_name: string | null;
  customer_phone: string;
  customer_email: string | null;
  delivery_address: string;
  delivery_city: string;
  delivery_country: string | null;
  delivery_instructions: string | null;
  total_amount: number;
  delivery_fee: number | null;
  discount_amount: number | null;
  final_amount: number;
  currency: string | null;
  status: OrderStatus;
  payment_method: string | null;
  payment_status: PaymentStatus;
  notes: string | null;
  admin_notes: string | null;
  items: any[] | null;
  created_at: string | null;
  updated_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  shipping_company: string | null;
}
