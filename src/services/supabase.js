export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://fnqnlajohfvcvatvznkd.supabase.co";
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_3C2tm8hRqrIA6zdUrBvUUg_470i3Ax1";

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
