-- =============================================================
-- BOLÃO COPA 2026 — Políticas RLS (Row Level Security)
-- Execute após 001_create_tables.sql
-- =============================================================

-- HABILITAR RLS EM TODAS AS TABELAS
ALTER TABLE jogadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE cartelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- POLÍTICAS: jogadores
-- =============================================================
-- Cada jogador vê apenas seu próprio perfil
CREATE POLICY "jogadores_select_own" ON jogadores
  FOR SELECT USING (auth.uid() = id);

-- Jogador pode inserir seu próprio perfil no cadastro
CREATE POLICY "jogadores_insert_own" ON jogadores
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Jogador pode atualizar seu próprio perfil
CREATE POLICY "jogadores_update_own" ON jogadores
  FOR UPDATE USING (auth.uid() = id);

-- Administradores podem ver todos os jogadores
CREATE POLICY "jogadores_select_admin" ON jogadores
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

-- =============================================================
-- POLÍTICAS: admins
-- =============================================================
-- Admin vê apenas seu próprio registro
CREATE POLICY "admins_select_own" ON admins
  FOR SELECT USING (auth.uid() = id);

-- =============================================================
-- POLÍTICAS: cartelas
-- =============================================================
-- Jogador vê apenas suas próprias cartelas
CREATE POLICY "cartelas_select_own" ON cartelas
  FOR SELECT USING (auth.uid() = user_id);

-- Jogador pode criar sua própria cartela
CREATE POLICY "cartelas_insert_own" ON cartelas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Jogador pode atualizar suas próprias cartelas
CREATE POLICY "cartelas_update_own" ON cartelas
  FOR UPDATE USING (auth.uid() = user_id);

-- Jogador pode excluir suas próprias cartelas
CREATE POLICY "cartelas_delete_own" ON cartelas
  FOR DELETE USING (auth.uid() = user_id);

-- Administradores podem ver e validar todas as cartelas
CREATE POLICY "cartelas_select_admin" ON cartelas
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

CREATE POLICY "cartelas_update_admin" ON cartelas
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

-- =============================================================
-- POLÍTICAS: admin (tabela de resultados)
-- =============================================================
-- Qualquer um pode ler resultados (público)
CREATE POLICY "admin_select_public" ON admin
  FOR SELECT USING (true);

-- Apenas administradores podem modificar
CREATE POLICY "admin_insert_admin" ON admin
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

CREATE POLICY "admin_update_admin" ON admin
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

-- =============================================================
-- POLÍTICAS: config
-- =============================================================
-- Qualquer um pode ler configuração (público)
CREATE POLICY "config_select_public" ON config
  FOR SELECT USING (true);

-- Apenas administradores podem modificar
CREATE POLICY "config_insert_admin" ON config
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

CREATE POLICY "config_update_admin" ON config
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );
