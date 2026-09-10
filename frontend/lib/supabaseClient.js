// supabaseClient.js
// The frontend's connection to Supabase - uses the PUBLIC (anon/publishable)
// key, never the secret key. This is safe to expose in browser code; RLS
// policies (see supabase/migration_002) are what actually keep data safe,
// not keeping this key hidden.

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);