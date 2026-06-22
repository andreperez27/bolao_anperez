import { rpc } from "./supabase";

export async function listarGruposPublicos() {
  return await rpc("listar_grupos_publicos");
}

export async function buscarGrupoPorSlug(slug) {
  return await rpc("buscar_grupo_por_slug_v2", { p_slug: slug });
}

export async function slugDisponivel(slug) {
  return await rpc("slug_disponivel", { p_slug: slug });
}

export async function criarGrupoAdmin({ nome, slug, editionId, adminNome, adminSenha, sessaoToken }) {
  return await rpc("criar_grupo_admin", {
    p_nome: nome, p_slug: slug, p_edition_id: editionId,
    p_admin_nome: adminNome, p_admin_senha: adminSenha,
    p_criador_sessao: sessaoToken,
  });
}

export async function criarGrupoBolao({ nome, slug, editionId, sessaoToken, valorAposta }) {
  return await rpc("criar_grupo_bolao", {
    p_nome: nome, p_slug: slug, p_edition_id: editionId,
    p_criador_sessao: sessaoToken, p_valor_aposta: valorAposta || 20,
  });
}

export async function listarMembros(grupoId, sessaoToken) {
  return await rpc("listar_membros_grupo_v2", { p_grupo_id: grupoId, p_sessao_token: sessaoToken });
}

export async function entrarEmGrupo(grupoId, sessaoToken) {
  return await rpc("entrar_em_grupo", { p_grupo_id: grupoId, p_sessao_token: sessaoToken });
}

export async function buscarConfigGrupo(grupoId) {
  return await rpc("buscar_config_grupo_v2", { p_grupo_id: grupoId });
}

export async function listarGruposDashboard() {
  return await rpc("listar_grupos_dashboard");
}

export async function gerarAdminInvite(grupoId, sessaoToken) {
  return await rpc("gerar_admin_invite", { p_grupo_id: grupoId, p_sessao_token: sessaoToken });
}

export async function usarAdminInvite(grupoId, secret, sessaoToken) {
  return await rpc("usar_admin_invite", { p_grupo_id: grupoId, p_secret: secret, p_sessao_token: sessaoToken });
}

export async function excluirGrupo(grupoId, sessaoToken) {
  return await rpc("excluir_grupo_v2", { p_grupo_id: grupoId, p_sessao_token: sessaoToken });
}

export async function atualizarGrupo({ grupoId, sessaoToken, nome, slug }) {
  return await rpc("atualizar_grupo_v2", {
    p_grupo_id: grupoId, p_sessao_token: sessaoToken,
    p_nome: nome || null, p_slug: slug || null,
  });
}

export async function gerarConviteParticipante(grupoId, sessaoToken, validadeDias = 7, maxUsos = 0) {
  return await rpc("gerar_convite_participante", { p_grupo_id: grupoId, p_sessao_token: sessaoToken, p_validade_dias: validadeDias, p_max_usos: maxUsos });
}

export async function usarConviteParticipante(token, sessaoToken) {
  return await rpc("usar_convite_participante", { p_token: token, p_sessao_token: sessaoToken });
}

export async function atualizarConfigGrupo({ grupoId, sessaoToken, valorAposta, apiUrl, bonusGeral, regras }) {
  return await rpc("atualizar_config_grupo_v2", {
    p_grupo_id: grupoId, p_sessao_token: sessaoToken,
    p_valor_aposta: valorAposta, p_api_url: apiUrl,
    p_bonus_geral: bonusGeral, p_regras: regras,
  });
}
