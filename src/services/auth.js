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

export async function signIn({ nome, senha }) {
  try {
    const data = await rpcRetry("buscar_jogador", { p_nome: nome.trim(), p_senha: senha });
    if (!data || !data.nome) throw new Error("Nome ou senha incorretos");
    salvarSession({ nome: data.nome, isAdmin: false });
    return data;
  } catch (e) {
    if (!e.message || e.message.includes("fetch") || e.message.includes("network") || e.message.includes("Failed")) {
      throw new Error("Erro de conexão. Verifique sua internet e tente novamente.");
    }
    throw e;
  }
}

export async function signUp({ nome, senha }) {
  if (senha.length < 6) throw new Error("A senha deve ter pelo menos 6 caracteres");
  await rpc("criar_jogador", { p_nome: nome.trim(), p_senha: senha });
  salvarSession({ nome: nome.trim(), isAdmin: false });
  return { nome: nome.trim() };
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
  salvarSession({ isAdmin: true, nome: "Admin" });
  return { nome: "Admin" };
}

export async function signOut() {
  limparSession();
}
