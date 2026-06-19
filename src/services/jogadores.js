import { supabaseFetch, supabaseHeaders, SUPABASE_URL } from "./supabase";

export async function getJogador(nome) {
  if (!nome) return null;
  try {
    const res = await supabaseFetch("/rest/v1/rpc/buscar_jogador_nome", {
      method: "POST",
      body: JSON.stringify({ p_nome: nome }),
    });
    if (!res.ok) return null;
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

export async function listJogadores(grupoId) {
  try {
    let url = "/rest/v1/jogadores?select=nome";
    if (grupoId) url += "&grupo_id=eq." + encodeURIComponent(grupoId);
    const res = await supabaseFetch(url);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function deletarJogador(nome) {
  const enc = encodeURIComponent(nome);
  await supabaseFetch("/rest/v1/cartelas?participante=eq." + enc, { method: "DELETE" });
  const res = await supabaseFetch("/rest/v1/jogadores?nome=eq." + enc, { method: "DELETE" });
  if (!res.ok) throw new Error("Erro ao excluir jogador");
}
