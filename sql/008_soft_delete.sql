-- Soft delete para cartelas
ALTER TABLE cartelas ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- RPC for admin to permanently delete a cartela (called from admin lixeira)
CREATE OR REPLACE FUNCTION excluir_cartela_definitivo(cartela_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM cartelas WHERE id = cartela_id;
END;
$$;
