export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://sjleucelnptbgyjofhnz.supabase.co";
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_fFDUULEIatz3fzxENC6BRQ_T8rZZEmr";

export const supabaseHeaders = {
  "apikey": SUPABASE_ANON_KEY,
  "Authorization": "Bearer " + SUPABASE_ANON_KEY,
  "Content-Type": "application/json",
};

export function supabaseFetch(path, options = {}) {
  return fetch(SUPABASE_URL + path, {
    ...options,
    headers: { ...supabaseHeaders, ...(options.headers || {}) },
  });
}
