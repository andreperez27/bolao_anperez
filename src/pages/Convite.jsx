import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSession } from "../services/auth";
import { validarConvite, solicitarEntradaComConvite } from "../services/groups";

const ESTADOS = {
  VALIDANDO: "validando",
  INVALIDO: "invalido",
  EXPIRADO: "expirado",
  MEMBRO: "membro",
  PENDENTE: "pendente",
  PRONTO_AUTO: "pronto_auto",
  PRONTO_APROVACAO: "pronto_aprovacao",
  SOLICITADO: "solicitado",
  ERRO: "erro",
};

export default function Convite() {
  const { token } = useParams();
  const navigate = useNavigate();
  const session = getSession();

  const [estado, setEstado] = useState(ESTADOS.VALIDANDO);
  const [grupoNome, setGrupoNome] = useState("");
  const [grupoSlug, setGrupoSlug] = useState("");
  const [inviteType, setInviteType] = useState("");
  const [msg, setMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const validar = useCallback(async (tok) => {
    if (!tok) { setEstado(ESTADOS.INVALIDO); setMsg("Link inválido"); return; }
    if (!session?.sessao_token) {
      navigate("/superadmin?convite=" + tok, { replace: true });
      return;
    }
    setEstado(ESTADOS.VALIDANDO);
    try {
      const data = await validarConvite(tok);
      if (!data?.valido) {
        if ((data?.motivo || "").includes("expirado")) {
          setEstado(ESTADOS.EXPIRADO);
        } else {
          setEstado(ESTADOS.INVALIDO);
        }
        setMsg(data?.motivo || "Convite inválido");
        return;
      }
      setGrupoNome(data.grupo_nome);
      setGrupoSlug(data.grupo_slug);
      setInviteType(data.invite_type);
      if (data.invite_type === "convite_auto") {
        setEstado(ESTADOS.PRONTO_AUTO);
      } else {
        setEstado(ESTADOS.PRONTO_APROVACAO);
      }
    } catch (e) {
      setEstado(ESTADOS.ERRO);
      setMsg(e.message || "Erro ao validar convite");
    }
  }, [session, navigate]);

  useEffect(() => { validar(token); }, [token, validar]);

  const handleSolicitar = async () => {
    if (!token || !session?.sessao_token) return;
    setSubmitting(true);
    try {
      const data = await solicitarEntradaComConvite(token, session.sessao_token);
      if (data?.entrada_direta) {
        alert("Bem-vindo ao grupo!");
        navigate(`/g/${data.grupo_slug}/minhas-cartelas`, { replace: true });
        return;
      }
      setEstado(ESTADOS.SOLICITADO);
      setMsg("Solicitação enviada com sucesso!");
    } catch (e) {
      const errMsg = e.message || "";
      if (errMsg.includes("já faz parte")) {
        setEstado(ESTADOS.MEMBRO);
        setMsg(errMsg);
      } else if (errMsg.includes("solicitação pendente")) {
        setEstado(ESTADOS.PENDENTE);
        setMsg(errMsg);
      } else {
        setEstado(ESTADOS.ERRO);
        setMsg(errMsg);
      }
    }
    setSubmitting(false);
  };

  const handleVoltar = () => navigate("/superadmin");

  return (
    <div style={{ minHeight: "100vh", background: "#0A0E1A", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#111827", border: "1px solid #1E2A45", borderRadius: 16, padding: 32, maxWidth: 420, width: "100%", textAlign: "center" }}>
        {estado === ESTADOS.VALIDANDO && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>{"\u23F3"}</div>
            <div style={{ color: "#FFD700", fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Validando convite...</div>
            <div style={{ color: "#8B9CC8", fontSize: 14 }}>Aguarde um instante</div>
          </>
        )}

        {estado === ESTADOS.INVALIDO && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>{"\u274C"}</div>
            <div style={{ color: "#C8102E", fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Ops!</div>
            <div style={{ color: "#8B9CC8", fontSize: 14, lineHeight: 1.5, marginBottom: 16 }}>{msg || "Este convite não é mais válido"}</div>
            <button onClick={handleVoltar} style={{ background: "#0033A0", border: "none", borderRadius: 8, color: "#fff", padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              Ir para o Bolão
            </button>
          </>
        )}

        {estado === ESTADOS.EXPIRADO && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>{"\u23F3"}</div>
            <div style={{ color: "#C8102E", fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Convite expirado</div>
            <div style={{ color: "#8B9CC8", fontSize: 14, lineHeight: 1.5, marginBottom: 16 }}>Este convite expirou. Peça um novo link ao administrador do grupo.</div>
            <button onClick={handleVoltar} style={{ background: "#0033A0", border: "none", borderRadius: 8, color: "#fff", padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              Ir para o Bolão
            </button>
          </>
        )}

        {estado === ESTADOS.MEMBRO && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>{"\u2705"}</div>
            <div style={{ color: "#16a34a", fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Você já faz parte deste grupo</div>
            <div style={{ color: "#8B9CC8", fontSize: 14, lineHeight: 1.5, marginBottom: 16 }}>{msg}</div>
            <button onClick={() => grupoSlug ? navigate(`/g/${grupoSlug}/minhas-cartelas`) : handleVoltar()}
              style={{ background: "#0033A0", border: "none", borderRadius: 8, color: "#fff", padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              Ir para o grupo
            </button>
          </>
        )}

        {estado === ESTADOS.PENDENTE && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>{"\uD83D\uDD14"}</div>
            <div style={{ color: "#FFD700", fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Solicitação pendente</div>
            <div style={{ color: "#8B9CC8", fontSize: 14, lineHeight: 1.5, marginBottom: 16 }}>
              Você já possui uma solicitação pendente para este grupo. Aguarde a aprovação do administrador.
            </div>
            <button onClick={handleVoltar} style={{ background: "#0033A0", border: "none", borderRadius: 8, color: "#fff", padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              Voltar
            </button>
          </>
        )}

        {estado === ESTADOS.PRONTO_AUTO && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>{"\uD83C\uDFC6"}</div>
            <div style={{ color: "#FFD700", fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Você foi convidado!</div>
            <div style={{ color: "#F0F4FF", fontSize: 16, fontWeight: 600, marginBottom: 12 }}>{grupoNome}</div>
            <div style={{ color: "#8B9CC8", fontSize: 13, lineHeight: 1.5, marginBottom: 20 }}>
              Este link permite entrar diretamente no grupo.
            </div>
            <button onClick={handleSolicitar} disabled={submitting}
              style={{ width: "100%", background: "#16a34a", border: "none", borderRadius: 8, color: "#fff", padding: "12px", fontWeight: 700, fontSize: 15, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.6 : 1 }}>
              {submitting ? "Entrando..." : "Entrar no grupo"}
            </button>
          </>
        )}

        {estado === ESTADOS.PRONTO_APROVACAO && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>{"\uD83C\uDFC6"}</div>
            <div style={{ color: "#FFD700", fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Você foi convidado!</div>
            <div style={{ color: "#F0F4FF", fontSize: 16, fontWeight: 600, marginBottom: 12 }}>{grupoNome}</div>
            <div style={{ color: "#8B9CC8", fontSize: 13, lineHeight: 1.5, marginBottom: 20 }}>
              Esse link permite solicitar acesso ao grupo. Seu pedido de entrada será enviado para aprovação do administrador.
            </div>
            <button onClick={handleSolicitar} disabled={submitting}
              style={{ width: "100%", background: "#0033A0", border: "none", borderRadius: 8, color: "#fff", padding: "12px", fontWeight: 700, fontSize: 15, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.6 : 1 }}>
              {submitting ? "Enviando..." : "Solicitar entrada"}
            </button>
          </>
        )}

        {estado === ESTADOS.SOLICITADO && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>{"\u2705"}</div>
            <div style={{ color: "#16a34a", fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{msg}</div>
            <div style={{ color: "#8B9CC8", fontSize: 14, lineHeight: 1.5, marginBottom: 16 }}>
              Aguarde a aprovação do administrador do grupo.
            </div>
            <button onClick={handleVoltar}
              style={{ background: "#0033A0", border: "none", borderRadius: 8, color: "#fff", padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              Voltar
            </button>
          </>
        )}

        {estado === ESTADOS.ERRO && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>{"\u274C"}</div>
            <div style={{ color: "#C8102E", fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Erro</div>
            <div style={{ color: "#8B9CC8", fontSize: 14, lineHeight: 1.5, marginBottom: 16 }}>{msg || "Ocorreu um erro inesperado"}</div>
            <button onClick={handleVoltar} style={{ background: "#0033A0", border: "none", borderRadius: 8, color: "#fff", padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              Voltar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
