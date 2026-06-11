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
  const SUPABASE_URL = "https://sjleucelnptbgyjofhnz.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_fFDUULEIatz3fzxENC6BRQ_T8rZZEmr";
  return fetch(SUPABASE_URL + path, {
    method,
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": "Bearer " + SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
    },
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
  for (let i = 0; i < tentativas; i++) {
    try {
      const data = await rpc(name, params);
      if (data && data.nome) return data;
    } catch {}
    if (i < tentativas - 1) await new Promise((r) => setTimeout(r, 1000));
  }
  return null;
}

export async function signIn({ nome, senha }) {
  const data = await rpcRetry("buscar_jogador", { p_nome: nome.trim(), p_senha: senha });
  if (!data || !data.nome) throw new Error("Nome ou senha incorretos");
  salvarSession({ nome: data.nome, isAdmin: false });
  return data;
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
