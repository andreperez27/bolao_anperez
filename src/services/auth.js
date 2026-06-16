import { supabaseFetch } from "./supabase";

const SESSION_KEY = "bolao_session";

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

async function rpc(name, params) {
  const res = await supabaseFetch("/rest/v1/rpc/" + name, {
    method: "POST",
    body: params ? JSON.stringify(params) : undefined,
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

export async function signIn({ nome, senha, grupoId = "geral" }) {
  const data = await rpc("buscar_jogador", { p_nome: nome.trim(), p_senha: senha, p_grupo_id: grupoId });
  if (!data || !data.nome) throw new Error("Nome ou senha incorretos");
  salvarSession({ nome: data.nome, isAdmin: false });
  return data;
}

export async function signUp({ nome, senha, grupoId = "geral" }) {
  if (senha.length < 6) throw new Error("A senha deve ter pelo menos 6 caracteres");
  await rpc("criar_jogador", { p_nome: nome.trim(), p_senha: senha, p_grupo_id: grupoId });
  salvarSession({ nome: nome.trim(), isAdmin: false });
  return { nome: nome.trim() };
}

export async function signInAdmin({ senha, grupoId = "geral" }) {
  const res = await supabaseFetch("/rest/v1/config?select=admin_password&grupo_id=eq." + grupoId);
  const rows = await res.json();
  if (!rows || !rows[0] || !rows[0].admin_password) throw new Error("Admin não configurado para este grupo");
  if (senha !== rows[0].admin_password) throw new Error("Senha de administrador incorreta");
  salvarSession({ isAdmin: true, nome: "Admin" });
  return { nome: "Admin" };
}
