export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://fnqnlajohfvcvatvznkd.supabase.co";
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZucW5sYWpvaGZ2Y3ZhdHZ6bmtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MDUwMzQsImV4cCI6MjA5NzM4MTAzNH0.sJ8_slfNnanheMvsBtIDzV38FLrYJ9wT440-mMkYycc";

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

export async function rpc(name, params) {
  const body = params ? JSON.stringify(params) : undefined;
  const res = await supabaseFetch("/rest/v1/rpc/" + name, {
    method: "POST",
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    let msg = text;
    try { const j = JSON.parse(text); msg = j.message || j.error || text; } catch {}
    throw new Error(msg);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}
