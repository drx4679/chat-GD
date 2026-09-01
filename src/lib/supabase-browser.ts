import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Instance unique du client Supabase pour l'environnement navigateur
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
