import { supabaseFetch, supabaseHeaders, SUPABASE_URL } from "./supabase";

export async function getAdminData() {
  try {
    const res = await supabaseFetch("/rest/v1/admin?select=resultados,campeo_real&id=eq.1");
    const data = await res.json();
    return {
      resultados: data?.[0]?.resultados || {},
      campeoReal: data?.[0]?.campeo_real || "",
    };
  } catch {
    return { resultados: {}, campeoReal: "" };
  }
}

export async function salvarAdminData(resultados, campeoReal) {
  const body = {
    resultados,
    campeo_real: campeoReal,
    updated_at: new Date().toISOString(),
  };
  const res = await supabaseFetch("/rest/v1/admin?id=eq.1", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const res2 = await supabaseFetch("/rest/v1/admin", {
      method: "POST",
      headers: { ...supabaseHeaders, "Prefer": "resolution=merge-duplicates" },
      body: JSON.stringify({ id: 1, ...body }),
    });
    if (!res2.ok && res2.status !== 201) throw new Error("Erro ao salvar dados de admin");
  }
}

export async function getConfig() {
  try {
    const res = await supabaseFetch("/rest/v1/config?select=valor_aposta,api_url,admin_password,bonus_geral&id=eq.1");
    const data = await res.json();
    return {
      valor_aposta: data?.[0]?.valor_aposta || 20,
      api_url: data?.[0]?.api_url || "https://raw.githubusercontent.com/openfootball/world-cup.json/master/2026/worldcup.json",
      admin_password: data?.[0]?.admin_password || "",
      bonus_geral: data?.[0]?.bonus_geral || 0,
    };
  } catch {
    return { valor_aposta: 20, api_url: "", bonus_geral: 0 };
  }
}

export async function salvarConfig({ valor_aposta, api_url, admin_password, bonus_geral }) {
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
  const res = await supabaseFetch("/rest/v1/config?id=eq.1", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const texto = await res.text().catch(() => "");
    const res2 = await supabaseFetch("/rest/v1/config", {
      method: "POST",
      headers: { ...supabaseHeaders, "Prefer": "resolution=merge-duplicates" },
      body: JSON.stringify({ id: 1, ...body }),
    });
    if (!res2.ok && res2.status !== 201) {
      const texto2 = await res2.text().catch(() => "");
      throw new Error("Erro ao salvar configuração\nPATCH: " + res.status + " " + texto.slice(0, 200) + "\nPOST: " + res2.status + " " + texto2.slice(0, 200));
    }
  }
}
