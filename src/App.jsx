import React, { useState, useEffect, useCallback } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { useCartelas } from "./hooks/useCartelas";
import { useRanking } from "./hooks/useRanking";
import { salvarAdminData } from "./services/admin";
import { getFaseAtual } from "./utils/pontuacao";
import { deletarCartela } from "./services/cartelas";
import { deletarJogador } from "./services/jogadores";
import Login from "./pages/Login";
import MinhasCartelas from "./pages/MinhasCartelas";
import PreencherCartela from "./pages/PreencherCartela";
import RankingPage from "./pages/Ranking";
import Tabela from "./pages/Tabela";
import { ModalInstrucoes } from "./components/ModalInstrucoes";
import { PrintArea } from "./components/PrintArea";
import { OfflineBanner } from "./components/OfflineBanner";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, jogador, isAdmin, signOut, refreshJogador, refreshUser } = useAuth();
  const { cartelas, refresh: refreshCartelas, salvar: salvarCartelaHook, deletar, validar } = useCartelas();
  const { resultados, campeoReal, config, updateResultados, loadData, ultimaAtualizacao } = useRanking();

  const [cartelaEditando, setCartelaEditando] = useState(null);
  const [cartelaPrint, setCartelaPrint] = useState(null);
  const [showInstrucoes, setShowInstrucoes] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("bolao_instrucoes_visto");
    if (!seen && !user) {
      setShowInstrucoes(true);
      localStorage.setItem("bolao_instrucoes_visto", "true");
    }
  }, [user]);

  useEffect(() => {
    if (location.pathname === "/") {
      if (user) {
        navigate("/minhas-cartelas", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    }
  }, [user, location.pathname, navigate]);

  const handleLogin = useCallback(
    async ({ isAdmin: adminFlag }) => {
      refreshUser();
      if (adminFlag) {
        navigate("/ranking", { replace: true });
      } else {
        navigate("/minhas-cartelas", { replace: true });
      }
    },
    [navigate, refreshUser]
  );

  const handleSair = useCallback(async () => {
    await signOut();
    navigate("/login", { replace: true });
  }, [signOut, navigate]);

  const handleExcluirConta = useCallback(async () => {
    const confirm = window.confirm("Tem certeza que deseja excluir sua conta? Todos os seus dados serão perdidos.");
    if (!confirm) return;
    const minhasCartelas = cartelas.filter((c) => c.participante === jogador?.nome);
    for (const c of minhasCartelas) {
      try { await deletarCartela(c.id); } catch {}
    }
    try {
      await deletarJogador(user?.nome);
    } catch {}
    await signOut();
    navigate("/login", { replace: true });
  }, [user, jogador, cartelas, signOut, navigate]);

  const handleSalvarCartela = useCallback(
    async (cartela) => {
      const nova = { ...cartela };
      if (!nova.campeao_fase && nova.campeao) {
        nova.campeao_fase = getFaseAtual(resultados);
      }
      await salvarCartelaHook(nova);
      navigate("/minhas-cartelas", { replace: true });
    },
    [resultados, salvarCartelaHook, navigate]
  );

  const handleValidarCartela = useCallback(
    async (cartelaId, status) => {
      await validar(cartelaId, status);
    },
    [validar]
  );

  const handleResultadosChange = useCallback(
    (novosResultados, novoCampeo) => {
      updateResultados(novosResultados, novoCampeo);
      salvarAdminData(novosResultados, novoCampeo).catch(() => {});
    },
    [updateResultados]
  );

  const handlePrintCartela = useCallback((cartela) => {
    setCartelaPrint(cartela);
  }, []);

  const handleImportarCartela = useCallback(
    async (file) => {
      try {
        const text = await file.text();
        const { parseCartelaHTML } = await import("./services/importarCartela");
        const nomePart = jogador?.nome || user?.nome || "";
        const dados = parseCartelaHTML(text, nomePart);
        const msgErros = dados.erros?.length ? dados.erros.join("\n") : "";

        if (Object.keys(dados.palpites).length === 0) {
          alert("Nenhum palpite válido encontrado no arquivo." + (msgErros ? "\n\n" + msgErros : ""));
          return;
        }

        const existingCartela = cartelas.find((c) => c.participante === nomePart);
        const palpitesMergeados = { ...dados.palpites };
        if (existingCartela?.palpites) {
          Object.keys(existingCartela.palpites).forEach((key) => {
            if (existingCartela.palpites[key]?.gols_a !== undefined) {
              delete palpitesMergeados[key];
            }
          });
        }
        const palpitesFinais = { ...(existingCartela?.palpites || {}), ...palpitesMergeados };

        await salvarCartelaHook({
          id: existingCartela?.id || "cart_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
          nome: existingCartela?.nome || "Importada",
          palpites: palpitesFinais,
          campeao: dados.campeao || existingCartela?.campeao || "",
          campeao_fase: dados.campeao_fase || existingCartela?.campeao_fase || "grupos",
          participante: nomePart,
          status: "aguardando",
        });

        let msg = `Cartela importada com ${Object.keys(dados.palpites).length} palpite(s)!`;
        if (existingCartela) msg += ` Mesclado com cartela existente (${Object.keys(palpitesMergeados).length} novo(s)).`;
        if (dados.dataEmitido) msg += ` Data de exportação: ${dados.dataEmitido.toLocaleDateString("pt-BR")}.`;
        if (msgErros) msg += `\n\nAvisos:\n${msgErros}`;
        alert(msg);
      } catch (e) {
        alert("Erro ao importar: " + e.message);
      }
    },
    [salvarCartelaHook, jogador, user, cartelas]
  );

  const handlePrintDone = useCallback(() => {
    setCartelaPrint(null);
  }, []);

  const atualCartelas = cartelas;

  return (
    <>
      <OfflineBanner />
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route
          path="/minhas-cartelas"
          element={
            user ? (
              <MinhasCartelas
                cartelas={atualCartelas}
                config={config}
                resultados={resultados}
                onRefreshCartelas={refreshCartelas}
                onNovaCartela={() => {
                  setCartelaEditando(null);
                  navigate("/preencher-cartela");
                }}
                onVerCartela={(c) => {
                  setCartelaEditando(c);
                  navigate("/preencher-cartela");
                }}
                onVerRanking={() => navigate("/ranking")}
                onExcluirCartela={deletar}
                onPrintCartela={handlePrintCartela}
                onSair={handleSair}
                onExcluirConta={handleExcluirConta}
                onShowInstrucoes={() => setShowInstrucoes(true)}
                onImportarCartela={handleImportarCartela}
                onVerTabela={() => navigate("/tabela")}
              />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/preencher-cartela"
          element={
            user ? (
              <PreencherCartela
                cartela={cartelaEditando}
                resultados={resultados}
                config={config}
                onSalvar={handleSalvarCartela}
                onVoltar={() => navigate("/minhas-cartelas")}
                onPrintCartela={handlePrintCartela}
              />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/ranking"
          element={
            <RankingPage
              cartelas={atualCartelas}
              resultados={resultados}
              campeoReal={campeoReal}
              isAdmin={isAdmin}
              config={config}
              ultimaAtualizacao={ultimaAtualizacao}
              onVoltar={() => navigate(user ? "/minhas-cartelas" : "/login")}
              onValidarCartela={handleValidarCartela}
              onResultadosChange={handleResultadosChange}
              onShowInstrucoes={() => setShowInstrucoes(true)}
              onVerTabela={() => navigate("/tabela")}
              onVerCartela={(c) => { setCartelaEditando(c); navigate("/preencher-cartela"); }}
            />
          }
        />
        <Route
          path="/tabela"
          element={
            <Tabela
              resultados={resultados}
              campeoReal={campeoReal}
              onVoltar={() => navigate(-1)}
            />
          }
        />
        <Route
          path="/grupo/:slug/tabela"
          element={
            <Tabela
              resultados={resultados}
              campeoReal={campeoReal}
              onVoltar={() => navigate(-1)}
            />
          }
        />
        <Route path="*" element={<Login onLogin={handleLogin} />} />
      </Routes>
      {showInstrucoes && (
        <ModalInstrucoes onFechar={() => setShowInstrucoes(false)} />
      )}
      <PrintArea cartela={cartelaPrint} participante={jogador?.nome || ""} onDone={handlePrintDone} />
    </>
  );
}
