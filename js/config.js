// Datos de conexión a Supabase.
//
// OJO: esto NO es un secreto. La "anon key" de Supabase está pensada para
// vivir en el navegador (por eso se la llama "public" en el dashboard) — la
// seguridad real la dan las políticas de Row Level Security de la tabla
// `tasks` (ver supabase/schema.sql), no el hecho de que esta clave sea
// difícil de conseguir. Lo que nunca va acá es la "service_role key" ni
// ningún token personal de tu cuenta de Supabase.
//
// Se completan los dos valores desde el dashboard de Supabase:
// Project Settings → API → "Project URL" y "anon public" key.

export const SUPABASE_URL = "";
export const SUPABASE_ANON_KEY = "";
