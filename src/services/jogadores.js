const SUPABASE_URL = "https://sjleucelnptbgyjofhnz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_fFDUULEIatz3fzxENC6BRQ_T8rZZEmr";

async function rpc(name, params) {
  const res = await fetch(SUPABASE_URL + "/rest/v1/rpc/" + name, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": "Bearer " + SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(await res.text());
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export async function getJogador(nome) {
  if (!nome) return null;
  try {
    return await rpc("buscar_jogador_nome", { p_nome: nome });
  } catch {
    return null;
  }
}

export async function listJogadores() {
  try {
    const res = await fetch(SUPABASE_URL + "/rest/v1/jogadores?select=nome", {
      method: "GET",
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": "Bearer " + SUPABASE_ANON_KEY,
      },
    });
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function deletarJogador(nome) {
  const h = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": "Bearer " + SUPABASE_ANON_KEY,
  };
  const enc = encodeURIComponent(nome);
  await fetch(SUPABASE_URL + "/rest/v1/cartelas?participante=eq." + enc, { method: "DELETE", headers: h });
  const res = await fetch(SUPABASE_URL + "/rest/v1/jogadores?nome=eq." + enc, { method: "DELETE", headers: h });
  if (!res.ok) throw new Error("Erro ao excluir jogador");
}
