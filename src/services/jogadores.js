import { supabaseFetch } from "./supabase";

export async function getJogador(nome, grupoId = "geral") {
  if (!nome) return null;
  try {
    const res = await supabaseFetch("/rest/v1/rpc/buscar_jogador_nome", {
      method: "POST",
      body: JSON.stringify({ p_nome: nome, p_grupo_id: grupoId }),
    });
    if (!res.ok) return null;
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

export async function listJogadores(grupoId = "geral") {
  try {
    const res = await supabaseFetch("/rest/v1/rpc/listar_jogadores", {
      method: "POST",
      body: JSON.stringify({ p_grupo_id: grupoId }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function deletarJogador(nome, grupoId = "geral") {
  const res = await supabaseFetch("/rest/v1/rpc/deletar_jogador", {
    method: "POST",
    body: JSON.stringify({ p_nome: nome, p_grupo_id: grupoId }),
  });
  if (!res.ok) throw new Error("Erro ao excluir jogador");
}
