import React, { useState, useEffect, useCallback } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { useGrupo } from "./contexts/GrupoContext";
import { useCartelas } from "./hooks/useCartelas";
import { useRanking } from "./hooks/useRanking";
import Login from "./pages/Login";
import MinhasCartelas from "./pages/MinhasCartelas";
import PreencherCartela from "./pages/PreencherCartela";
import RankingPage from "./pages/Ranking";
import SuperAdminPainel from "./pages/SuperAdminPainel";
import Tabela from "./pages/Tabela";
import TrocarSenha from "./pages/TrocarSenha";
import { ModalInstrucoes } from "./components/ModalInstrucoes";
import { PrintArea } from "./components/PrintArea";
import { OfflineBanner } from "./components/OfflineBanner";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { grupoId, grupo, edition, config, membership, grupoSlug, navigateTo, loading: grupoLoading, error: grupoError } = useGrupo();
  const { cartelas, refresh: refreshCartelas, salvar: salvarCartelaHook, deletar, validar } = useCartelas(grupoId);
  const { resultados, campeoReal, updateResultados, loadData, ultimaAtualizacao } = useRanking(grupoId);

  const [cartelaEditando, setCartelaEditando] = useState(null);
  const [cartelaPrint, setCartelaPrint] = useState(null);
  const [showInstrucoes, setShowInstrucoes] = useState(false);

  useEffect(() => {
    if (grupoError) navigateTo("login");
  }, [grupoError, navigateTo]);

  useEffect(() => {
    const seen = localStorage.getItem("bolaov2_instrucoes_visto");
    if (!seen && !user) {
      setShowInstrucoes(true);
      localStorage.setItem("bolaov2_instrucoes_visto", "true");
    }
  }, [user]);

  const handleLogin = useCallback(async (result) => {
    if (result?.senhaPadrao) {
      navigateTo("trocar-senha");
    } else {
      navigateTo("minhas-cartelas");
    }
  }, [navigateTo]);

  const handleSair = useCallback(async () => {
    await signOut();
    navigateTo("login");
  }, [signOut, navigateTo]);

  const handleSalvarCartela = useCallback(async (cartela) => {
    const nova = { ...cartela };
    if (!nova.campeao_fase && nova.campeaoId) {
      nova.campeao_fase = "grupos";
    }
    await salvarCartelaHook(nova);
    navigateTo("minhas-cartelas");
  }, [salvarCartelaHook, navigateTo]);

  const handleValidarCartela = useCallback(async (cartelaId, status) => {
    await validar(cartelaId, status);
  }, [validar]);

  const handleResultadosChange = useCallback((novosResultados, novoCampeo) => {
    updateResultados(novosResultados, novoCampeo);
  }, [updateResultados]);

  const handlePrintCartela = useCallback((cartela) => setCartelaPrint(cartela), []);

  const handleImportarCartela = useCallback(async (file) => {
    try {
      const text = await file.text();
      const { parseCartelaHTML } = await import("./services/importarCartela");
      const nomePart = user?.nome || "";
      const dados = parseCartelaHTML(text, nomePart);
      const msgErros = dados.erros?.length ? dados.erros.join("\n") : "";
      if (Object.keys(dados.palpites).length === 0) {
        alert("Nenhum palpite válido encontrado." + (msgErros ? "\n\n" + msgErros : ""));
        return;
      }
      await salvarCartelaHook({
        id: "pred_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
        nome: dados.nome || "Importada",
        palpites: dados.palpites,
        campeaoId: null,
        campeaoFase: dados.campeao_fase || "grupos",
        participante: nomePart,
        status: "aguardando",
      });
      let msg = `Nova cartela importada com ${Object.keys(dados.palpites).length} palpite(s)!`;
      if (dados.dataEmitido) msg += ` Data: ${dados.dataEmitido.toLocaleDateString("pt-BR")}.`;
      if (msgErros) msg += `\n\nAvisos:\n${msgErros}`;
      alert(msg);
    } catch (e) {
      alert("Erro ao importar: " + e.message);
    }
  }, [salvarCartelaHook, user]);

  const handleVerCartela = useCallback((cartela) => {
    setCartelaEditando(cartela);
    navigateTo("preencher-cartela");
  }, [navigateTo]);

  const handlePrintDone = useCallback(() => setCartelaPrint(null), []);

  if (grupoLoading) return <div style={{ minHeight: "100vh", background: "#0A0E1A", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFD700" }}>Carregando...</div>;

  return (
    <>
      <OfflineBanner />
      <Routes>
        <Route index element={user ? <div style={{ minHeight: "100vh", background: "#0A0E1A", display: "flex", alignItems: "center", justifyContent: "center" }}><a href="/superadmin" style={{ color: "#FFD700", fontSize: 18 }}>Ir para Painel Administrativo</a></div> : <Login onLogin={handleLogin} />} />
        <Route path="login" element={<Login onLogin={handleLogin} />} />
        <Route path="minhas-cartelas" element={
          user ? (
            <MinhasCartelas
              cartelas={cartelas} config={config} resultados={resultados}
              onRefreshCartelas={refreshCartelas}
              onNovaCartela={() => { setCartelaEditando(null); navigateTo("preencher-cartela"); }}
              onVerCartela={handleVerCartela}
              onVerRanking={() => navigateTo("ranking")}
              onExcluirCartela={deletar}
              onPrintCartela={handlePrintCartela}
              onSair={handleSair}
              onShowInstrucoes={() => setShowInstrucoes(true)}
              onImportarCartela={handleImportarCartela}
              onVerTabela={() => navigateTo("tabela")}
              onVerAdmin={() => navigateTo("admin")}
            />
          ) : <Login onLogin={handleLogin} />
        } />
        <Route path="preencher-cartela" element={
          user ? (
            <PreencherCartela
              cartela={cartelaEditando} resultados={resultados} config={config}
              onSalvar={handleSalvarCartela}
              onVoltar={() => navigateTo("minhas-cartelas")}
              onPrintCartela={handlePrintCartela}
            />
          ) : <Login onLogin={handleLogin} />
        } />
        <Route path="ranking" element={
          <RankingPage
            resultados={resultados} campeoReal={campeoReal}
            config={config}
            onVoltar={() => navigateTo("minhas-cartelas")}
            onShowInstrucoes={() => setShowInstrucoes(true)}
            onVerTabela={() => navigateTo("tabela")}
            onVerCartela={handleVerCartela}
          />
        } />
        <Route path="admin" element={
          membership?.role === "admin" ? (
            <SuperAdminPainel
              resultados={resultados}
              onResultadosChange={handleResultadosChange}
              ultimaAtualizacao={ultimaAtualizacao}
              onVoltar={() => navigateTo("minhas-cartelas")}
            />
          ) : <Login onLogin={handleLogin} />
        } />
        <Route path="tabela" element={
          <Tabela resultados={resultados} campeoReal={campeoReal} onVoltar={() => navigateTo("minhas-cartelas")} />
        } />
        <Route path="trocar-senha" element={user ? <TrocarSenha /> : <Login onLogin={handleLogin} />} />
        <Route path="*" element={<Login onLogin={handleLogin} />} />
      </Routes>
      {showInstrucoes && <ModalInstrucoes onFechar={() => setShowInstrucoes(false)} />}
      <PrintArea cartela={cartelaPrint} participante={user?.nome || ""} onDone={handlePrintDone} />
    </>
  );
}
