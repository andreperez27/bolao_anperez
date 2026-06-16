import { supabaseFetch, supabaseHeaders } from "./supabase";

export async function atualizarAdminGrupo(grupoId, dados) {
  const res = await supabaseFetch("/rest/v1/rpc/atualizar_admin_grupo", {
    method: "POST",
    body: JSON.stringify({
      p_grupo_id: grupoId,
      p_nome: dados.nome || null,
      p_slug: dados.slug || null,
      p_nome_admin: dados.nome_admin || null,
      p_valor_aposta: dados.valor_aposta != null ? Number(dados.valor_aposta) : null,
      p_senha_admin: dados.senha_admin || null,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    let msg = text;
    try { const j = JSON.parse(text); msg = j.message || j.error || text; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export async function getAdminData(grupoId = "geral") {
  try {
    const res = await supabaseFetch("/rest/v1/admin?select=resultados,campeo_real&grupo_id=eq." + encodeURIComponent(grupoId));
    const data = await res.json();
    return {
      resultados: data?.[0]?.resultados || {},
      campeoReal: data?.[0]?.campeo_real || "",
    };
  } catch {
    return { resultados: {}, campeoReal: "" };
  }
}

export async function salvarAdminData(resultados, campeoReal, grupoId = "geral") {
  const body = {
    resultados,
    campeo_real: campeoReal,
    updated_at: new Date().toISOString(),
  };
  const res = await supabaseFetch("/rest/v1/admin?grupo_id=eq." + encodeURIComponent(grupoId), {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const res2 = await supabaseFetch("/rest/v1/admin", {
      method: "POST",
      headers: { ...supabaseHeaders, "Prefer": "resolution=merge-duplicates" },
      body: JSON.stringify({ id: genId(), ...body, grupo_id: grupoId }),
    });
    if (!res2.ok && res2.status !== 201) throw new Error("Erro ao salvar dados de admin");
  }
}

function genId() {
  return Date.now();
}

export async function getConfig(grupoId = "geral") {
  try {
    const res = await supabaseFetch("/rest/v1/config?select=valor_aposta,api_url,admin_password,bonus_geral&id=eq.1&grupo_id=eq." + encodeURIComponent(grupoId));
    const data = await res.json();
    return {
      valor_aposta: data?.[0]?.valor_aposta || 20,
      api_url: data?.[0]?.api_url || "",
      admin_password: data?.[0]?.admin_password || "",
      bonus_geral: data?.[0]?.bonus_geral || 0,
    };
  } catch {
    return { valor_aposta: 20, api_url: "", bonus_geral: 0 };
  }
}

export async function salvarConfig({ valor_aposta, api_url, admin_password, bonus_geral }, grupoId = "geral") {
  const body = {
    valor_aposta: Number(valor_aposta),
    api_url,
  };
  if (admin_password !== undefined && admin_password !== "") {
    body.admin_password = admin_password;
  }
  if (bonus_geral !== undefined) {
    body.bonus_geral = Number(bonus_geral) || 0;
  }
  const res = await supabaseFetch("/rest/v1/config?grupo_id=eq." + encodeURIComponent(grupoId), {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const res2 = await supabaseFetch("/rest/v1/config", {
      method: "POST",
      headers: { ...supabaseHeaders, "Prefer": "resolution=merge-duplicates" },
      body: JSON.stringify({ id: genId(), grupo_id: grupoId, ...body }),
    });
    if (!res2.ok && res2.status !== 201) throw new Error("Erro ao salvar configuração");
  }
}
