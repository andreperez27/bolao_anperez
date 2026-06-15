import { supabaseFetch, supabaseHeaders } from "./supabase";
import { getSession } from "./auth";

function caller() {
  return getSession()?.nome || "";
}

function adminPass() {
  return null; // será preenchido pelo caller
}

export async function listarGrupos(nomeUsuario) {
  const res = await supabaseFetch("/rest/v1/rpc/listar_grupos_usuario", {
    method: "POST",
    body: JSON.stringify({ p_usuario: nomeUsuario || caller() }),
  });
  if (!res.ok) throw new Error("Erro ao listar grupos");
  return await res.json();
}

export async function listarTodosGrupos(adminPassword) {
  const res = await supabaseFetch("/rest/v1/rpc/listar_todos_grupos", {
    method: "POST",
    body: JSON.stringify({ p_admin_password: adminPassword }),
  });
  if (!res.ok) throw new Error("Erro ao listar grupos");
  return await res.json();
}

export async function criarGrupo(nome, slug, admin, valor = 20, adminPassword) {
  const res = await supabaseFetch("/rest/v1/rpc/criar_grupo", {
    method: "POST",
    body: JSON.stringify({ p_nome: nome, p_slug: slug, p_admin: admin, p_valor: valor, p_admin_password: adminPassword }),
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
    body: JSON.stringify({ p_slug: slug, p_usuario: usuario || caller() }),
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
    body: JSON.stringify({ p_grupo_id: grupoId, p_usuario: caller() }),
  });
  if (!res.ok) throw new Error("Erro ao listar membros");
  return await res.json();
}

export async function listarMembrosDoGrupo(grupoId, usuario) {
  const res = await supabaseFetch("/rest/v1/rpc/listar_membros_do_grupo", {
    method: "POST",
    body: JSON.stringify({ p_usuario: usuario || caller(), p_grupo_id: grupoId }),
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

export async function gerarConvite(grupoId, validadeDias = 7, maxUsos = 0) {
  const res = await supabaseFetch("/rest/v1/rpc/gerar_convite_grupo", {
    method: "POST",
    body: JSON.stringify({ p_usuario: caller(), p_grupo_id: grupoId, p_validade_dias: validadeDias, p_max_usos: maxUsos }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt.slice(0, 200));
  }
  return await res.json();
}

export async function listarConvites(grupoId) {
  const res = await supabaseFetch("/rest/v1/rpc/listar_convites_grupo", {
    method: "POST",
    body: JSON.stringify({ p_usuario: caller(), p_grupo_id: grupoId }),
  });
  if (!res.ok) throw new Error("Erro ao listar convites");
  return await res.json();
}

export async function revogarConvite(conviteId) {
  const res = await supabaseFetch("/rest/v1/rpc/revogar_convite_grupo", {
    method: "POST",
    body: JSON.stringify({ p_usuario: caller(), p_convite_id: conviteId }),
  });
  if (!res.ok) throw new Error("Erro ao revogar convite");
  return await res.json();
}

export async function usarConvite(token, usuario) {
  const res = await supabaseFetch("/rest/v1/rpc/usar_convite_grupo", {
    method: "POST",
    body: JSON.stringify({ p_token: token, p_usuario: usuario || caller() }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    const msg = txt.includes("Usuario nao encontrado") ? "Você precisa fazer login primeiro" : txt.slice(0, 200);
    throw new Error(msg);
  }
  return await res.json();
}

export async function excluirGrupo(grupoId, adminPassword) {
  const res = await supabaseFetch("/rest/v1/rpc/excluir_grupo", {
    method: "POST",
    body: JSON.stringify({ p_grupo_id: grupoId, p_admin_password: adminPassword }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt.slice(0, 200));
  }
  return await res.json();
}
