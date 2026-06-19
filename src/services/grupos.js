import { supabaseFetch } from "./supabase";

async function rpc(name, params) {
  const res = await supabaseFetch("POST", "/rest/v1/rpc/" + name, params);
  if (!res.ok) {
    const text = await res.text();
    let msg = text;
    try { const j = JSON.parse(text); msg = j.message || j.error || text; } catch {}
    throw new Error(msg);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export async function buscarGrupoPorSlug(slug) {
  return rpc("buscar_grupo_por_slug", { p_slug: slug });
}

export async function listarTodosGrupos() {
  return rpc("listar_todos_grupos", {});
}

export async function criarGrupo({ nome, slug, admin_nome, admin_senha }) {
  return rpc("criar_grupo", {
    p_nome: nome,
    p_slug: slug,
    p_admin_nome: admin_nome,
    p_admin_senha: admin_senha,
  });
}

export async function listarMembrosGrupo(grupoId) {
  return rpc("listar_membros_grupo", { p_grupo_id: grupoId });
}

export async function gerarConvite(grupoId, criadoPor, maxUsos = 0, expiraDias = 30) {
  return rpc("gerar_convite", {
    p_grupo_id: grupoId,
    p_criado_por: criadoPor,
    p_max_usos: maxUsos,
    p_expira_dias: expiraDias,
  });
}

export async function listarConvites(grupoId) {
  return rpc("listar_convites", { p_grupo_id: grupoId });
}

export async function atualizarConfigGrupo(grupoId, adminNome, config) {
  return rpc("atualizar_config_grupo", {
    p_grupo_id: grupoId,
    p_admin_nome: adminNome,
    p_valor: config.valor_aposta,
    p_pontos_cheio: config.pontos_acerto_cheio,
    p_pontos_vencedor: config.pontos_acerto_vencedor,
    p_pontos_gols: config.pontos_acerto_gols,
  });
}

export async function validarConvite(codigo) {
  return rpc("validar_convite", { p_codigo: codigo });
}

export async function atualizarGrupoAdmin(grupoId, dados) {
  return rpc("atualizar_grupo_admin", {
    p_grupo_id: grupoId,
    p_nome: dados.nome || undefined,
    p_novo_admin: dados.novo_admin || undefined,
    p_nova_senha_admin: dados.nova_senha_admin || undefined,
  });
}

export async function deletarGrupo(grupoId) {
  return rpc("deletar_grupo", { p_grupo_id: grupoId });
}
