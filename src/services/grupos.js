import { supabaseFetch, SUPABASE_URL } from "./supabase";

export async function listarGrupos(nomeUsuario) {
  const res = await supabaseFetch("/rest/v1/rpc/listar_grupos_usuario", {
    method: "POST",
    body: JSON.stringify({ p_usuario: nomeUsuario }),
  });
  if (!res.ok) throw new Error("Erro ao listar grupos");
  return await res.json();
}

export async function listarTodosGrupos() {
  const res = await supabaseFetch("/rest/v1/rpc/listar_todos_grupos", {
    method: "POST",
  });
  if (!res.ok) throw new Error("Erro ao listar grupos");
  return await res.json();
}

export async function criarGrupo(nome, slug, admin, valor = 20) {
  const res = await supabaseFetch("/rest/v1/rpc/criar_grupo", {
    method: "POST",
    body: JSON.stringify({ p_nome: nome, p_slug: slug, p_admin: admin, p_valor: valor }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt.slice(0, 200));
  }
  return await res.json();
}

export async function entrarGrupo(slug, usuario) {
  const res = await supabaseFetch("/rest/v1/rpc/entrar_grupo", {
    method: "POST",
    body: JSON.stringify({ p_slug: slug, p_usuario: usuario }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt.slice(0, 200));
  }
  return await res.json();
}

export async function listarMembros(grupoId) {
  const res = await supabaseFetch("/rest/v1/rpc/listar_membros_grupo", {
    method: "POST",
    body: JSON.stringify({ p_grupo_id: grupoId }),
  });
  if (!res.ok) throw new Error("Erro ao listar membros");
  return await res.json();
}

export async function atualizarGrupo(grupoId, admin, dados) {
  const res = await supabaseFetch("/rest/v1/rpc/atualizar_grupo", {
    method: "POST",
    body: JSON.stringify({
      p_grupo_id: grupoId,
      p_admin: admin,
      p_valor: dados.valor_aposta,
      p_pontos_cheio: dados.pontos_cheio || 5,
      p_pontos_vencedor: dados.pontos_vencedor || 3,
    }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt.slice(0, 200));
  }
  return await res.json();
}

export async function removerMembro(grupoId, admin, usuario) {
  const res = await supabaseFetch("/rest/v1/rpc/remover_membro_grupo", {
    method: "POST",
    body: JSON.stringify({ p_grupo_id: grupoId, p_admin: admin, p_usuario: usuario }),
  });
  if (!res.ok) throw new Error("Erro ao remover membro");
  return await res.json();
}
