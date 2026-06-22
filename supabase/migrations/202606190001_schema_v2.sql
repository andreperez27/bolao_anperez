-- =============================================================
-- BOLÃO MULTITENANCY — FASE 1
-- Schema V2: motor genérico multi-campeonato
-- Coexiste com tabelas antigas (grupos, jogadores, cartelas...)
-- Execute no SQL Editor do Supabase Dashboard
-- =============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================
-- IDENTIDADE E ACESSO
-- =============================================================

CREATE TABLE profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome          TEXT NOT NULL,
  senha_hash    TEXT,
  sessao_token  UUID,
  role_global   TEXT NOT NULL DEFAULT 'user'
                CHECK (role_global IN ('superadmin', 'user')),
  criado_em     TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_profiles_nome ON profiles (nome);
CREATE INDEX idx_profiles_sessao ON profiles (sessao_token) WHERE sessao_token IS NOT NULL;

-- =============================================================
-- DADOS DO CAMPEONATO
-- =============================================================

CREATE TABLE competitions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT UNIQUE NOT NULL,
  nome        TEXT NOT NULL,
  tipo        TEXT NOT NULL DEFAULT 'torneio'
              CHECK (tipo IN ('torneio', 'liga')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE competition_editions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id  UUID NOT NULL REFERENCES competitions(id),
  slug            TEXT UNIQUE NOT NULL,
  nome            TEXT NOT NULL,
  temporada       TEXT NOT NULL,
  timezone        TEXT DEFAULT 'America/Sao_Paulo',
  ativo           BOOLEAN DEFAULT TRUE,
  data_inicio     DATE,
  data_fim        DATE,
  config          JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_editions_competition ON competition_editions (competition_id);

CREATE TABLE teams (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome            TEXT NOT NULL,
  nome_curto      TEXT,
  slug            TEXT,
  iso_code        TEXT,
  is_placeholder  BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_teams_slug ON teams (slug);

CREATE TABLE edition_teams (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_id      UUID NOT NULL REFERENCES competition_editions(id) ON DELETE CASCADE,
  team_id         UUID NOT NULL REFERENCES teams(id),
  grupo_letra     TEXT,
  seed            INT,
  UNIQUE(edition_id, team_id)
);

CREATE INDEX idx_edition_teams_edition ON edition_teams (edition_id);

CREATE TABLE stages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_id      UUID NOT NULL REFERENCES competition_editions(id) ON DELETE CASCADE,
  slug            TEXT NOT NULL,
  nome            TEXT NOT NULL,
  ordem           INT NOT NULL,
  tipo            TEXT NOT NULL DEFAULT 'groups'
                  CHECK (tipo IN ('groups', 'knockout', 'league')),
  config          JSONB DEFAULT '{}',
  UNIQUE(edition_id, slug)
);

CREATE INDEX idx_stages_edition ON stages (edition_id);

CREATE TABLE rounds (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id        UUID NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
  slug            TEXT NOT NULL,
  nome            TEXT NOT NULL,
  ordem           INT NOT NULL,
  data_prevista   DATE,
  UNIQUE(stage_id, slug)
);

CREATE INDEX idx_rounds_stage ON rounds (stage_id);

CREATE TABLE matches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_id      UUID NOT NULL REFERENCES competition_editions(id) ON DELETE CASCADE,
  round_id        UUID NOT NULL REFERENCES rounds(id),
  time_a_id       UUID REFERENCES teams(id),
  time_b_id       UUID REFERENCES teams(id),
  time_a_nome     TEXT,
  time_b_nome     TEXT,
  grupo_letra     TEXT,
  data_iso        DATE,
  horario         TIME,
  estadio         TEXT,
  slug            TEXT,
  ordem           INT,
  status          TEXT DEFAULT 'agendado'
                  CHECK (status IN ('agendado', 'ao_vivo', 'encerrado', 'cancelado')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_matches_edition ON matches (edition_id);
CREATE INDEX idx_matches_round ON matches (round_id);
CREATE INDEX idx_matches_data ON matches (edition_id, data_iso);

CREATE TABLE match_results (
  match_id    UUID PRIMARY KEY REFERENCES matches(id) ON DELETE CASCADE,
  placar_a    INT,
  placar_b    INT,
  encerrado   BOOLEAN DEFAULT FALSE,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- MOTOR DO BOLÃO
-- =============================================================

CREATE TABLE groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_id  UUID NOT NULL REFERENCES competition_editions(id),
  nome        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  criado_por  UUID REFERENCES profiles(id),
  criado_em   TIMESTAMPTZ DEFAULT NOW(),
  ativo       BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_groups_edition ON groups (edition_id);
CREATE UNIQUE INDEX idx_groups_slug ON groups (slug);

CREATE TABLE group_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id    UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'participante'
              CHECK (role IN ('admin', 'participante')),
  pago        BOOLEAN DEFAULT FALSE,
  criado_em   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(grupo_id, profile_id)
);

CREATE INDEX idx_group_members_profile ON group_members (profile_id);
CREATE INDEX idx_group_members_grupo ON group_members (grupo_id);

CREATE TABLE group_config (
  grupo_id      UUID PRIMARY KEY REFERENCES groups(id) ON DELETE CASCADE,
  valor_aposta  NUMERIC DEFAULT 20,
  api_url       TEXT DEFAULT '',
  bonus_geral   NUMERIC DEFAULT 0,
  regras        JSONB DEFAULT '{"pontos_placar_exato":5,"pontos_diferenca_certa":4,"pontos_vencedor_certo":3}',
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE group_invites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id    UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  token       TEXT UNIQUE NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', ''),
  criado_por  UUID REFERENCES profiles(id),
  expira_em   TIMESTAMPTZ,
  max_usos    INT DEFAULT 1,
  usos        INT DEFAULT 0,
  ativo       BOOLEAN DEFAULT TRUE,
  criado_em   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_group_invites_token ON group_invites (token);

CREATE TABLE admin_invites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id    UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  secret_hash TEXT NOT NULL,
  usado       BOOLEAN DEFAULT FALSE,
  criado_em   TIMESTAMPTZ DEFAULT NOW(),
  expira_em   TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  UNIQUE(grupo_id, profile_id)
);

CREATE TABLE predictions (
  id            TEXT PRIMARY KEY,
  grupo_id      UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  profile_id    UUID NOT NULL REFERENCES profiles(id),
  participante  TEXT NOT NULL,
  nome          TEXT DEFAULT 'Cartela',
  palpites      JSONB DEFAULT '{}',
  campeao_id    UUID REFERENCES teams(id),
  campeao_fase  TEXT,
  status        TEXT DEFAULT 'aguardando'
                CHECK (status IN ('aguardando', 'validada', 'rejeitada')),
  valor_pago    NUMERIC DEFAULT 20,
  deleted_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_predictions_grupo ON predictions (grupo_id);
CREATE INDEX idx_predictions_profile ON predictions (profile_id);
CREATE INDEX idx_predictions_grupo_status ON predictions (grupo_id, status)
  WHERE deleted_at IS NULL;

CREATE TABLE ai_predictions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_id  UUID NOT NULL REFERENCES competition_editions(id) ON DELETE CASCADE,
  ia_nome     TEXT NOT NULL,
  match_id    UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  gols_a      INT NOT NULL,
  gols_b      INT NOT NULL,
  UNIQUE(edition_id, ia_nome, match_id)
);

CREATE INDEX idx_ai_predictions_edition ON ai_predictions (edition_id, ia_nome);

-- =============================================================
-- SUPERADMIN PADRÃO
-- =============================================================
INSERT INTO profiles (id, nome, senha_hash, role_global)
SELECT gen_random_uuid(), 'superadmin', extensions.crypt('admin123', extensions.gen_salt('bf')), 'superadmin'
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE nome = 'superadmin');
