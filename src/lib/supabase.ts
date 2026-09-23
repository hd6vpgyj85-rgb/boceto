import { createClient } from "@supabase/supabase-js";

// [MODIFICAR MANUAL] Credenciales de Supabase: se leen de variables de entorno
// (ver .env.example). Crea tu propio proyecto en supabase.com, corre
// supabase/schema.sql en el SQL Editor, y pega aquí tu URL y anon key a través
// de un archivo ".env" local y de las variables de Cloudflare Workers en producción.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Faltan las variables VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copia .env.example a .env y complétalas.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
