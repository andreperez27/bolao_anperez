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

export async function gerarConviteParticipante(grupoId, sessaoToken, validadeDias = 30, maxUsos = 0, inviteType = "convite_aprovacao") {
  const params = { p_grupo_id: grupoId, p_sessao_token: sessaoToken, p_validade_dias: validadeDias, p_max_usos: maxUsos, p_invite_type: inviteType };
  console.log("gerarConviteParticipante params:", params);
  const result = await rpc("gerar_convite_v2", params);
  console.log("gerarConviteParticipante result:", result);
  return result;
}

export async function validarConvite(token) {
  return await rpc("validar_convite", { p_token: token });
}

export async function solicitarEntradaComConvite(token, sessaoToken) {
  return await rpc("solicitar_entrada_com_convite", { p_token: token, p_sessao_token: sessaoToken });
}

export async function aprovarSolicitacao(requestId, sessaoToken) {
  return await rpc("aprovar_solicitacao_entrada", { p_request_id: requestId, p_sessao_token: sessaoToken });
}

export async function recusarSolicitacao(requestId, sessaoToken, notes) {
  return await rpc("recusar_solicitacao_entrada", { p_request_id: requestId, p_sessao_token: sessaoToken, p_notes: notes || null });
}

export async function listarSolicitacoes(grupoId, sessaoToken) {
  return await rpc("listar_solicitacoes_pendentes", { p_grupo_id: grupoId, p_sessao_token: sessaoToken });
}

// mantido para compatibilidade
export async function usarConviteParticipante(token, sessaoToken) {
  return await rpc("solicitar_entrada_com_convite", { p_token: token, p_sessao_token: sessaoToken });
}

export async function atualizarConfigGrupo({ grupoId, sessaoToken, valorAposta, apiUrl, bonusGeral, regras, campeaoRealId, viceCampeaoRealId, artilheiroRealNome, artilheiroRealSelecao, adminSenha }) {
  return await rpc("atualizar_config_grupo_v2", {
    p_grupo_id: grupoId, p_sessao_token: sessaoToken,
    p_valor_aposta: valorAposta, p_api_url: apiUrl,
    p_bonus_geral: bonusGeral, p_regras: regras,
    p_campeao_real_id: campeaoRealId || null,
    p_vice_campeao_real_id: viceCampeaoRealId || null,
    p_artilheiro_real_nome: artilheiroRealNome || null,
    p_artilheiro_real_selecao: artilheiroRealSelecao || null,
    p_admin_senha: adminSenha || null,
  });
}

export async function removerMembro(grupoId, membroProfileId, sessaoToken) {
  return await rpc("remover_membro_grupo_v2", { p_grupo_id: grupoId, p_membro_profile_id: membroProfileId, p_sessao_token: sessaoToken });
}
