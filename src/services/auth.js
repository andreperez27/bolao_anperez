import { rpc, supabaseFetch } from "./supabase";

const SESSION_KEY = "bolaov2_session";

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function salvarSession(data) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

export function limparSession() {
  localStorage.removeItem(SESSION_KEY);
}

export async function signIn({ nome, senha }) {
  const data = await rpc("buscar_profile", { p_nome: nome.trim(), p_senha: senha });
  if (!data || !data.sessao_token) throw new Error("Nome ou senha incorretos");
  const session = { profile_id: data.id, nome: data.nome, sessao_token: data.sessao_token, role_global: data.role_global || "user" };
  salvarSession(session);
  return session;
}

export async function signUp({ nome, senha }) {
  const data = await rpc("criar_profile", { p_nome: nome.trim(), p_senha: senha });
  const session = { profile_id: data.id, nome: data.nome, sessao_token: data.sessao_token, role_global: "user" };
  salvarSession(session);
  return session;
}

export async function verificarSessao(sessaoToken) {
  const data = await rpc("verificar_sessao", { p_sessao_token: sessaoToken });
  return data;
}

export async function signOut(sessaoToken) {
  try { await rpc("logout_profile", { p_sessao_token: sessaoToken }); } catch {}
  limparSession();
}

export async function trocarSenha(sessaoToken, senhaAntiga, senhaNova) {
  return await rpc("trocar_senha_profile", { p_sessao_token: sessaoToken, p_senha_antiga: senhaAntiga, p_senha_nova: senhaNova });
}
