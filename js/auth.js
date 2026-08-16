import { supabase, isSupabaseConfigured } from "./supabaseClient.js";

export async function getSession() {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export function onAuthStateChange(callback) {
  if (!isSupabaseConfigured) return { unsubscribe() {} };
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return data.subscription;
}

export function translateAuthError(error) {
  const msg = error?.message || "";
  if (msg.includes("Invalid login credentials")) return "Correo o contraseña incorrectos.";
  if (msg.includes("User already registered")) return "Ya existe una cuenta con ese correo.";
  if (msg.includes("Password should be at least")) return "La contraseña debe tener al menos 6 caracteres.";
  if (msg.includes("is invalid")) return "El correo ingresado no es válido.";
  if (msg.includes("rate limit")) return "Demasiados intentos. Espera un momento y vuelve a intentar.";
  if (msg.includes("Email not confirmed")) return "Falta confirmar el correo. Revisa tu bandeja de entrada.";
  return msg || "Ocurrió un error. Intenta de nuevo.";
}
