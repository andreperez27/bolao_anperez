-- =============================================================
-- BOLÃO COPA 2026 — Adiciona colunas admin_password e bonus_geral
-- Execute no SQL Editor do Supabase
-- =============================================================

ALTER TABLE config
  ADD COLUMN IF NOT EXISTS admin_password TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS bonus_geral NUMERIC DEFAULT 0;
