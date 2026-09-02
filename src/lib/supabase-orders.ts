import { createClient } from '@supabase/supabase-js';

const supabaseUrl2 = process.env.NEXT_PUBLIC_SUPABASE_URL2!;
const supabaseAnonKey2 = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY2!;

export const supabaseOrders = createClient(supabaseUrl2, supabaseAnonKey2);
