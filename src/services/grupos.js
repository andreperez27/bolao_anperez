import { supabaseFetch } from "./supabase";

async function rpc(name, params) {
  const res = await supabaseFetch("/rest/v1/rpc/" + name, {
    method: "POST",
    body: JSON.stringify(params),
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

export async function listarGrupos() {
  return rpc("listar_grupos");
}

export async function listarTodosGrupos() {
  return rpc("listar_todos_grupos");
}

export async function criarGrupo(nome, slug, senhaAdmin, valorAposta = 20) {
  return rpc("criar_grupo", {
    p_nome: nome,
    p_slug: slug,
    p_senha_admin: senhaAdmin,
    p_valor_aposta: Number(valorAposta),
  });
}

export async function atualizarGrupo(grupoId, dados) {
  return rpc("atualizar_admin_grupo", {
    p_grupo_id: grupoId,
    ...dados,
  });
}

export async function excluirGrupo(grupoId, senhaAdmin) {
  return rpc("excluir_grupo", {
    p_grupo_id: grupoId,
    p_senha_admin: senhaAdmin,
  });
}
