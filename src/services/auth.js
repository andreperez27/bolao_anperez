import { supabaseFetch, supabaseHeaders, SUPABASE_URL } from "./supabase";

const SESSION_KEY = "bolao_session";

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function salvarSession(data) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

export function limparSession() {
  localStorage.removeItem(SESSION_KEY);
}

function apiCall(method, path, body) {
  return supabaseFetch(path, {
    method,
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function rpc(name, params) {
  const res = await apiCall("POST", "/rest/v1/rpc/" + name, params);
  if (!res.ok) {
    const text = await res.text();
    let msg = text;
    try { const j = JSON.parse(text); msg = j.message || j.error || text; } catch {}
    throw new Error(msg);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function rpcRetry(name, params, tentativas = 3) {
  let lastError = null;
  for (let i = 0; i < tentativas; i++) {
    try {
      const data = await rpc(name, params);
      if (data && data.nome) return data;
    } catch (e) {
      lastError = e;
    }
    if (i < tentativas - 1) await new Promise((r) => setTimeout(r, 1000));
  }
  if (lastError) throw lastError;
  return null;
}

function montarSession(dados) {
  return {
    nome: dados.nome,
    role: dados.role || "participant",
    grupo_id: dados.grupo_id || null,
    grupo_slug: dados.grupo_slug || null,
    grupo_nome: dados.grupo_nome || null,
  };
}

export async function signIn({ nome, senha }) {
  try {
    const data = await rpcRetry("buscar_jogador", { p_nome: nome.trim(), p_senha: senha });
    if (!data || !data.nome) throw new Error("Nome ou senha incorretos");
    const session = montarSession(data);
    salvarSession(session);
    return session;
  } catch (e) {
    if (!e.message || e.message.includes("fetch") || e.message.includes("network") || e.message.includes("Failed")) {
      throw new Error("Erro de conexão. Verifique sua internet e tente novamente.");
    }
    throw e;
  }
}

export async function signUp({ nome, senha, grupo_id }) {
  if (senha.length < 6) throw new Error("A senha deve ter pelo menos 6 caracteres");
  const data = await rpc("criar_jogador", {
    p_nome: nome.trim(),
    p_senha: senha,
    p_grupo_id: grupo_id || undefined,
  });
  const session = montarSession(data);
  salvarSession(session);
  return session;
}

export async function signInAdmin({ senha }) {
  const res = await apiCall("GET", "/rest/v1/config?select=admin_password&id=eq.1");
  const rows = await res.json();
  if (!rows || !rows[0] || !rows[0].admin_password) {
    throw new Error("Admin não configurado. Contate o desenvolvedor.");
  }
  if (senha !== rows[0].admin_password) {
    throw new Error("Senha de administrador incorreta");
  }
  salvarSession({ nome: "Admin", role: "super_admin", grupo_id: null, grupo_slug: null });
  return { nome: "Admin", role: "super_admin" };
}

export async function signOut() {
  limparSession();
}

export async function entrarComConvite({ codigo, nome, senha }) {
  const data = await rpc("entrar_grupo_por_convite", {
    p_codigo: codigo.trim().toUpperCase(),
    p_nome: nome.trim(),
    p_senha: senha,
  });
  const session = montarSession(data);
  salvarSession(session);
  return session;
}
