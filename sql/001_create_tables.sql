-- =============================================================
-- BOLÃO COPA 2026 — Criação de Tabelas e Migração
-- Execute no SQL Editor do Supabase
-- =============================================================

-- 1. Extensão necessária para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de perfil dos jogadores (vinculada ao auth.users)
CREATE TABLE IF NOT EXISTS jogadores (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de administradores
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de cartelas (ajustada para user_id)
CREATE TABLE IF NOT EXISTS cartelas (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES jogadores(id) ON DELETE CASCADE,
  participante TEXT NOT NULL,
  nome TEXT DEFAULT 'Cartela',
  palpites JSONB DEFAULT '{}',
  campeao TEXT DEFAULT '',
  campeao_fase TEXT DEFAULT 'grupos',
  status TEXT DEFAULT 'aguardando',
  valor_pago NUMERIC DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabela de resultados / admin
CREATE TABLE IF NOT EXISTS admin (
  id INTEGER PRIMARY KEY DEFAULT 1,
  resultados JSONB DEFAULT '{}',
  campeo_real TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabela de configuração
CREATE TABLE IF NOT EXISTS config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  valor_aposta NUMERIC DEFAULT 20,
  api_url TEXT DEFAULT 'https://worldcupjson.net/matches',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
