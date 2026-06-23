import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { buscarGrupoPublico, solicitarEntradaGrupo, verificarStatusParticipante } from "../services/groups";
import { getSession, limparSession } from "../services/auth";

const ESTADOS = {
  LOADING: "loading",
  NOT_FOUND: "not_found",
  FORM: "form",
  SUBMITTING: "submitting",
  WRONG_PASSWORD: "wrong_password",
  PENDING: "pending",
  MEMBER: "member",
  REJECTED: "rejected",
  ERROR: "error",
};

function salvarSession(data) {
  localStorage.setItem("bolaov2_session", JSON.stringify({
    profile_id: data.profile_id,
    nome: data.nome,
    sessao_token: data.sessao_token,
    role_global: "user",
  }));
}

export default function EntrarGrupo() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [estado, setEstado] = useState(ESTADOS.LOADING);
  const [grupo, setGrupo] = useState(null);
  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!slug) { setEstado(ESTADOS.NOT_FOUND); return; }

    buscarGrupoPublico(slug)
      .then((data) => {
        if (!data?.encontrado) {
          setEstado(ESTADOS.NOT_FOUND);
          return;
        }
        setGrupo(data);

        // Se já tem sessão, verificar status
        const session = getSession();
        if (session?.sessao_token) {
          return verificarStatusParticipante(slug, session.sessao_token)
            .then((statusData) => {
              if (statusData?.status === "member") {
                setEstado(ESTADOS.MEMBER);
                setMensagem("Você já é participante deste grupo!");
              } else if (statusData?.status === "pending") {
                setEstado(ESTADOS.PENDING);
                setMensagem(statusData.mensagem || "Aguardando aprovação do administrador.");
              } else if (statusData?.status === "rejected") {
                setEstado(ESTADOS.REJECTED);
                setMensagem(statusData.mensagem || "Solicitação recusada.");
              } else {
                setEstado(ESTADOS.FORM);
              }
            })
            .catch(() => {
              setEstado(ESTADOS.FORM);
            });
        }
        setEstado(ESTADOS.FORM);
      })
      .catch(() => {
        setEstado(ESTADOS.NOT_FOUND);
      });
  }, [slug]);

  const handleSubmit = async () => {
    if (!nome.trim() || !senha) return;
    setErro("");
    setEstado(ESTADOS.SUBMITTING);
    try {
      const data = await solicitarEntradaGrupo(slug, nome.trim(), senha);
      if (data?.status === "not_found") {
        setEstado(ESTADOS.NOT_FOUND);
      } else if (data?.status === "wrong_password") {
        setEstado(ESTADOS.FORM);
        setErro("Este nome já está em uso. Se é você, faça login com sua senha.");
      } else if (data?.status === "member") {
        salvarSession(data);
        setEstado(ESTADOS.MEMBER);
        setMensagem("Você já é participante deste grupo!");
      } else if (data?.status === "pending") {
        salvarSession(data);
        setEstado(ESTADOS.PENDING);
        setMensagem(data.mensagem || "Solicitação enviada! Aguarde a aprovação do administrador.");
      } else if (data?.status === "rejected") {
        salvarSession(data);
        setEstado(ESTADOS.REJECTED);
        setMensagem(data.mensagem || "Sua solicitação foi recusada pelo administrador.");
      } else {
        setEstado(ESTADOS.ERROR);
        setErro("Resposta inesperada do servidor.");
      }
    } catch (e) {
      setEstado(ESTADOS.FORM);
      setErro(e.message || "Erro ao processar solicitação.");
    }
  };

  const handleIrParaGrupo = () => {
    navigate("/g/" + slug + "/minhas-cartelas");
  };

  const handleLogout = () => {
    limparSession();
    navigate("/g/" + slug + "/entrar");
  };

  if (estado === ESTADOS.LOADING) {
    return (
      <div style={containerStyle}>
        <div style={{ color: "#8B9CC8", fontSize: 14 }}>Carregando...</div>
      </div>
    );
  }

  if (estado === ESTADOS.NOT_FOUND) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ fontSize: 48, marginBottom: 16, textAlign: "center" }}>{"\u2753"}</div>
          <div style={{ color: "#C8102E", fontWeight: 700, fontSize: 18, marginBottom: 8, textAlign: "center" }}>Grupo não encontrado</div>
          <div style={{ color: "#8B9CC8", fontSize: 14, textAlign: "center", lineHeight: 1.5 }}>
            O link que você acessou não corresponde a nenhum grupo ativo.<br />
            Verifique o link e tente novamente.
          </div>
        </div>
      </div>
    );
  }

  if (estado === ESTADOS.MEMBER) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ fontSize: 48, marginBottom: 16, textAlign: "center" }}>{"\u2705"}</div>
          <div style={{ color: "#16a34a", fontWeight: 700, fontSize: 18, marginBottom: 8, textAlign: "center" }}>
            {mensagem}
          </div>
          <div style={{ color: "#8B9CC8", fontSize: 13, textAlign: "center", marginBottom: 20 }}>
            {grupo?.nome}
          </div>
          <button onClick={handleIrParaGrupo} style={btnPrimaryStyle}>
            Entrar no grupo
          </button>
        </div>
      </div>
    );
  }

  if (estado === ESTADOS.PENDING) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ fontSize: 48, marginBottom: 16, textAlign: "center" }}>{"\u23F3"}</div>
          <div style={{ color: "#FFD700", fontWeight: 700, fontSize: 16, marginBottom: 8, textAlign: "center" }}>
            Solicitação enviada!
          </div>
          <div style={{ color: "#8B9CC8", fontSize: 14, textAlign: "center", lineHeight: 1.5, marginBottom: 16 }}>
            {mensagem}
          </div>
          <div style={{ color: "#6B7BA8", fontSize: 12, textAlign: "center", marginBottom: 16 }}>
            Grupo: {grupo?.nome}
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button onClick={handleLogout} style={btnSecondaryStyle}>
              Sair
            </button>
            <button onClick={handleIrParaGrupo} disabled style={{ ...btnPrimaryStyle, opacity: 0.5, cursor: "not-allowed" }}>
              Acesso bloqueado
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (estado === ESTADOS.REJECTED) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ fontSize: 48, marginBottom: 16, textAlign: "center" }}>{"\u274C"}</div>
          <div style={{ color: "#C8102E", fontWeight: 700, fontSize: 16, marginBottom: 8, textAlign: "center" }}>
            Solicitação recusada
          </div>
          <div style={{ color: "#8B9CC8", fontSize: 14, textAlign: "center", lineHeight: 1.5, marginBottom: 16 }}>
            {mensagem}
          </div>
          <div style={{ color: "#6B7BA8", fontSize: 13, textAlign: "center", marginBottom: 16 }}>
            {grupo?.nome}
          </div>
          <button onClick={handleLogout} style={btnSecondaryStyle}>
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (estado === ESTADOS.ERROR) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ fontSize: 48, marginBottom: 16, textAlign: "center" }}>{"\u26A0\uFE0F"}</div>
          <div style={{ color: "#C8102E", fontWeight: 700, fontSize: 16, marginBottom: 8, textAlign: "center" }}>Erro</div>
          <div style={{ color: "#8B9CC8", fontSize: 14, textAlign: "center", lineHeight: 1.5, marginBottom: 16 }}>
            {erro}
          </div>
          <button onClick={() => setEstado(ESTADOS.FORM)} style={btnPrimaryStyle}>
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  // FORM state
  return (
    <div style={containerStyle}>
      <div style={{ maxWidth: 420, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>{"\uD83C\uDFC6"}</div>
          <div style={{ color: "#FFD700", fontWeight: 900, fontSize: 22, marginBottom: 4 }}>
            {grupo?.nome || "Carregando..."}
          </div>
          {grupo?.edicao_nome && (
            <div style={{ color: "#8B9CC8", fontSize: 13 }}>{grupo.edicao_nome}</div>
          )}
          <div style={{ color: "#6B7BA8", fontSize: 13, marginTop: 8 }}>
            Faça seu cadastro para solicitar entrada no grupo
          </div>
        </div>

        <div style={cardStyle}>
          {erro && (
            <div style={{ color: "#C8102E", fontSize: 13, marginBottom: 12, textAlign: "center" }}>{erro}</div>
          )}
          {erro.includes("já está em uso") ? (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div style={{ color: "#8B9CC8", fontSize: 13, marginBottom: 12 }}>
                Se você já possui cadastro, faça login com sua senha.
              </div>
              <button onClick={() => navigate("/g/" + slug + "/login")} style={btnPrimaryStyle}>
                Ir para login
              </button>
            </div>
          ) : (
            <>
              <input
                placeholder="Seu nome"
                value={nome}
                onChange={(e) => { setNome(e.target.value); setErro(""); }}
                style={inputStyle}
                disabled={estado === ESTADOS.SUBMITTING}
                autoFocus
              />
              <input
                type="password"
                placeholder="Crie uma senha (mín. 6 caracteres)"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                style={{ ...inputStyle, marginTop: 10 }}
                disabled={estado === ESTADOS.SUBMITTING}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />

              <button
                onClick={handleSubmit}
                disabled={!nome.trim() || senha.length < 6 || estado === ESTADOS.SUBMITTING}
                style={{
                  ...btnPrimaryStyle,
                  width: "100%",
                  marginTop: 16,
                  opacity: !nome.trim() || senha.length < 6 || estado === ESTADOS.SUBMITTING ? 0.6 : 1,
                  cursor: !nome.trim() || senha.length < 6 || estado === ESTADOS.SUBMITTING ? "not-allowed" : "pointer",
                }}
              >
                {estado === ESTADOS.SUBMITTING ? "Enviando..." : "Solicitar entrada"}
              </button>
            </>
          )}
        </div>

        <div style={{ color: "#6B7BA8", fontSize: 12, textAlign: "center", marginTop: 16 }}>
          Sua solicitação será analisada pelo administrador do grupo.
        </div>
      </div>
    </div>
  );
}

const containerStyle = {
  minHeight: "100vh",
  background: "#0A0E1A",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
};

const cardStyle = {
  background: "#111827",
  border: "1px solid #1E2A45",
  borderRadius: 16,
  padding: 24,
};

const inputStyle = {
  width: "100%",
  background: "#1a2234",
  border: "2px solid #1E2A45",
  borderRadius: 8,
  color: "#F0F4FF",
  padding: "10px 14px",
  fontSize: 16,
  boxSizing: "border-box",
};

const btnPrimaryStyle = {
  background: "#0033A0",
  border: "none",
  borderRadius: 8,
  color: "#fff",
  padding: "12px 24px",
  fontWeight: 700,
  fontSize: 15,
  cursor: "pointer",
};

const btnSecondaryStyle = {
  background: "transparent",
  border: "1px solid #1E2A45",
  borderRadius: 8,
  color: "#8B9CC8",
  padding: "12px 24px",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
};
