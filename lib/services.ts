import { supabase } from "@/lib/supabase"

// Define the Estampa type
export interface Estampa {
  id?: string
  posicao?: string
  tipo?: string
  largura?: number
}

// Corrigir a função obterProximoCodigoCliente que está incompleta
// Substituir a função atual por esta versão completa:

export const obterProximoCodigoCliente = async (): Promise<string> => {
  try {
    // Buscar o último cliente para obter o código mais recente
    const { data, error } = await supabase
      .from("clientes")
      .select("codigo")
      .order("codigo", { ascending: false })
      .limit(1)

    if (error) {
      console.error("Erro ao buscar último código de cliente:", error)
      // Se houver erro, começar do C0001
      return "C0001"
    }

    if (data && data.length > 0 && data[0].codigo) {
      // Extrair apenas os dígitos do código
      const ultimoCodigo = data[0].codigo.trim()
      const numerosApenas = ultimoCodigo.replace(/\D/g, "")

      // Se não conseguirmos extrair números, começar do C0001
      if (!numerosApenas) {
        console.warn("Formato de código inválido encontrado:", ultimoCodigo)
        return "C0001"
      }

      // Converter para número e incrementar
      const proximoCodigoNumerico = Number.parseInt(numerosApenas, 10) + 1

      // Formatar com zeros à esquerda e adicionar prefixo C
      return "C" + String(proximoCodigoNumerico).padStart(4, "0")
    }

    // Se não houver clientes, começar do C0001
    return "C0001"
  } catch (error) {
    console.error("Erro ao gerar próximo código de cliente:", error)
    return "C0001"
  }
}

// Corrigir a expressão regular na função atualizarCodigosProdutos
// Substituir a linha problemática por esta versão corrigida:

export const atualizarCodigosProdutos = async () => {
  try {
    // Buscar todos os produtos sem código
    const { data: produtos, error } = await supabase
      .from("produtos")
      .select("id, codigo")
      .is("codigo", null)
      .order("created_at", { ascending: true })

    if (error) throw error

    if (produtos && produtos.length > 0) {
      // Para cada produto sem código, gerar um código sequencial e atualizar
      let contador = 1

      // Buscar o último código existente
      const { data: ultimoProduto, error: ultimoError } = await supabase
        .from("produtos")
        .select("codigo")
        .not("codigo", "is", null)
        .order("codigo", { ascending: false })
        .limit(1)

      if (!ultimoError && ultimoProduto && ultimoProduto.length > 0 && ultimoProduto[0].codigo) {
        // Corrigindo a expressão regular para evitar problemas com escape
        const match = ultimoProduto[0].codigo.match(/^P(\d+)$/)
        if (match && match[1]) {
          contador = Number.parseInt(match[1], 10) + 1
        }
      }

      // Atualizar cada produto
      for (const produto of produtos) {
        const novoCodigo = "P" + String(contador).padStart(4, "0")
        contador++

        await supabase.from("produtos").update({ codigo: novoCodigo }).eq("id", produto.id)
      }

      return { success: true, message: `${produtos.length} produtos atualizados com códigos sequenciais.` }
    }

    return { success: true, message: "Nenhum produto sem código encontrado." }
  } catch (error) {
    console.error("Erro ao atualizar códigos de produtos:", error)
    return {
      success: false,
      message: `Erro ao atualizar códigos: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
    }
  }
}
