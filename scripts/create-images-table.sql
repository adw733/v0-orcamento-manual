-- Criar tabela para armazenar imagens
CREATE TABLE IF NOT EXISTS public.imagens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para busca rápida por item_id
CREATE INDEX IF NOT EXISTS idx_imagens_item_id ON public.imagens(item_id);

-- Criar política para permitir acesso anônimo às imagens
ALTER TABLE public.imagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acesso anônimo às imagens" 
ON public.imagens FOR ALL 
TO anon
USING (true);
