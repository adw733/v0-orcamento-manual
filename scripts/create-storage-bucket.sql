-- Criar uma política de armazenamento para o bucket de imagens
INSERT INTO storage.buckets (id, name, public)
VALUES ('orcamentos-imagens', 'Imagens de Orçamentos', true)
ON CONFLICT (id) DO NOTHING;

-- Criar políticas de acesso para o bucket
-- Política para permitir leitura pública
CREATE POLICY "Política de Leitura Pública para Imagens de Orçamentos"
ON storage.objects FOR SELECT
USING (bucket_id = 'orcamentos-imagens');

-- Política para permitir inserção de imagens por usuários autenticados
CREATE POLICY "Política de Inserção para Imagens de Orçamentos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'orcamentos-imagens');

-- Política para permitir atualização de imagens por usuários autenticados
CREATE POLICY "Política de Atualização para Imagens de Orçamentos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'orcamentos-imagens');

-- Política para permitir exclusão de imagens por usuários autenticados
CREATE POLICY "Política de Exclusão para Imagens de Orçamentos"
ON storage.objects FOR DELETE
USING (bucket_id = 'orcamentos-imagens');
