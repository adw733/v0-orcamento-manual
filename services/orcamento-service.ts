import { getClientSupabaseInstance } from "@/lib/supabase"
import type { Orcamento, Cliente, ItemOrcamento } from "@/types/types"

// Função para processar os itens do orçamento
const processarItens = (itens: any[]): ItemOrcamento[] => {
  if (!itens || !Array.isArray(itens)) {
    console.warn("Itens inválidos recebidos:", itens)
    return []
  }

  return itens.map((item) => {
    // Garantir que todos os campos necessários estejam presentes
    const itemProcessado: ItemOrcamento = {
      id: item.id || Date.now().toString(),
      produtoId: item.produtoId || "",
      produto: item.produto || undefined,
      quantidade: item.quantidade || 0,
      valorUnitario: item.valorUnitario || 0,
      tecidoSelecionado: item.tecidoSelecionado || undefined,
      corSelecionada: item.corSelecionada || undefined,
      descricaoEstampa: item.descricaoEstampa || undefined,
      tamanhos: item.tamanhos || {},
      // Garantir que a imagem seja preservada exatamente como está
      imagem: item.imagem || undefined,
    }

    return itemProcessado
  })
}

// Função para comprimir imagem base64
const comprimirImagem = (base64Image: string, qualidade = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.src = base64Image
    img.onload = () => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      // Calcular novas dimensões (reduzir para 50% se for muito grande)
      let width = img.width
      let height = img.height

      if (width > 800 || height > 800) {
        const ratio = Math.min(800 / width, 800 / height)
        width = width * ratio
        height = height * ratio
      }

      canvas.width = width
      canvas.height = height

      if (!ctx) {
        reject(new Error("Não foi possível obter o contexto do canvas"))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      // Converter para JPEG com qualidade reduzida
      const compressedImage = canvas.toDataURL("image/jpeg", qualidade)
      resolve(compressedImage)
    }

    img.onerror = () => {
      reject(new Error("Erro ao carregar a imagem"))
    }
  })
}

export const orcamentoService = {
  async getAll(): Promise<Orcamento[]> {
    try {
      const supabase = getClientSupabaseInstance()
      const { data, error } = await supabase
        .from("orcamentos")
        .select(`
          *,
          clientes:cliente_id (*)
        `)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Erro ao buscar orçamentos:", error)
        throw new Error("Erro ao buscar orçamentos")
      }

      return data.map((orcamento) => ({
        id: orcamento.id,
        numero: orcamento.numero,
        data: orcamento.data,
        cliente: orcamento.clientes
          ? ({
              id: orcamento.clientes.id,
              nome: orcamento.clientes.nome,
              cnpj: orcamento.clientes.cnpj || "",
              endereco: orcamento.clientes.endereco || "",
              telefone: orcamento.clientes.telefone || "",
              email: orcamento.clientes.email || "",
              contato: orcamento.clientes.contato || "",
            } as Cliente)
          : null,
        itens: processarItens((orcamento.itens as any[]) || []),
        observacoes: orcamento.observacoes || "",
        condicoesPagamento: orcamento.condicoes_pagamento || "",
        prazoEntrega: orcamento.prazo_entrega || "",
        validadeOrcamento: orcamento.validade_orcamento || "",
      }))
    } catch (error) {
      console.error("Erro ao buscar orçamentos:", error)
      // Retornar array vazio em caso de erro para evitar quebrar a aplicação
      return []
    }
  },

  async getById(id: string): Promise<Orcamento> {
    try {
      const supabase = getClientSupabaseInstance()
      const { data, error } = await supabase
        .from("orcamentos")
        .select(`
        *,
        clientes:cliente_id (*)
      `)
        .eq("id", id)
        .single()

      if (error) {
        console.error("Erro ao buscar orçamento:", error)
        throw new Error("Erro ao buscar orçamento")
      }

      // Garantir que os itens incluam as imagens
      const itensProcessados = processarItens((data.itens as any[]) || [])

      return {
        id: data.id,
        numero: data.numero,
        data: data.data,
        cliente: data.clientes
          ? ({
              id: data.clientes.id,
              nome: data.clientes.nome,
              cnpj: data.clientes.cnpj || "",
              endereco: data.clientes.endereco || "",
              telefone: data.clientes.telefone || "",
              email: data.clientes.email || "",
              contato: data.clientes.contato || "",
            } as Cliente)
          : null,
        itens: itensProcessados,
        observacoes: data.observacoes || "",
        condicoesPagamento: data.condicoes_pagamento || "",
        prazoEntrega: data.prazo_entrega || "",
        validadeOrcamento: data.validade_orcamento || "",
      }
    } catch (error) {
      console.error("Erro ao buscar orçamento:", error)
      // Retornar um orçamento vazio em caso de erro
      return {
        id: "",
        numero: "",
        data: new Date().toISOString().split("T")[0],
        cliente: null,
        itens: [],
        observacoes: "",
        condicoesPagamento: "",
        prazoEntrega: "",
        validadeOrcamento: "",
      }
    }
  },

  async create(orcamento: Omit<Orcamento, "id">): Promise<Orcamento> {
    try {
      const supabase = getClientSupabaseInstance()

      // Processar e comprimir imagens antes de salvar
      const itensProcessados = await Promise.all(
        orcamento.itens.map(async (item) => {
          let imagemProcessada = item.imagem

          // Se tiver imagem e for base64, comprimir
          if (imagemProcessada && imagemProcessada.startsWith("data:image")) {
            try {
              imagemProcessada = await comprimirImagem(imagemProcessada, 0.6)
            } catch (err) {
              console.error("Erro ao comprimir imagem:", err)
            }
          }

          return {
            ...item,
            imagem: imagemProcessada,
          }
        }),
      )

      const { data, error } = await supabase
        .from("orcamentos")
        .insert({
          numero: orcamento.numero,
          data: orcamento.data,
          cliente_id: orcamento.cliente?.id,
          itens: itensProcessados,
          observacoes: orcamento.observacoes,
          condicoes_pagamento: orcamento.condicoesPagamento,
          prazo_entrega: orcamento.prazoEntrega,
          validade_orcamento: orcamento.validadeOrcamento,
        })
        .select()
        .single()

      if (error) {
        console.error("Erro ao criar orçamento:", error)
        throw new Error("Erro ao criar orçamento")
      }

      return {
        id: data.id,
        numero: data.numero,
        data: data.data,
        cliente: orcamento.cliente,
        itens: processarItens((data.itens as any[]) || []),
        observacoes: data.observacoes || "",
        condicoesPagamento: data.condicoes_pagamento || "",
        prazoEntrega: data.prazo_entrega || "",
        validadeOrcamento: data.validade_orcamento || "",
      }
    } catch (error) {
      console.error("Erro ao criar orçamento:", error)
      throw new Error("Erro ao criar orçamento")
    }
  },

  async update(orcamento: Orcamento): Promise<Orcamento> {
    try {
      const supabase = getClientSupabaseInstance()

      // Processar e comprimir imagens antes de salvar
      const itensProcessados = await Promise.all(
        orcamento.itens.map(async (item) => {
          let imagemProcessada = item.imagem

          // Se tiver imagem e for base64, comprimir
          if (imagemProcessada && imagemProcessada.startsWith("data:image")) {
            try {
              imagemProcessada = await comprimirImagem(imagemProcessada, 0.6)
            } catch (err) {
              console.error("Erro ao comprimir imagem:", err)
            }
          }

          return {
            ...item,
            imagem: imagemProcessada,
          }
        }),
      )

      const { data, error } = await supabase
        .from("orcamentos")
        .update({
          numero: orcamento.numero,
          data: orcamento.data,
          cliente_id: orcamento.cliente?.id,
          itens: itensProcessados,
          observacoes: orcamento.observacoes,
          condicoes_pagamento: orcamento.condicoesPagamento,
          prazo_entrega: orcamento.prazoEntrega,
          validade_orcamento: orcamento.validadeOrcamento,
        })
        .eq("id", orcamento.id)
        .select()
        .single()

      if (error) {
        console.error("Erro ao atualizar orçamento:", error)
        throw new Error("Erro ao atualizar orçamento")
      }

      return {
        id: data.id,
        numero: data.numero,
        data: data.data,
        cliente: orcamento.cliente,
        itens: processarItens((data.itens as any[]) || []),
        observacoes: data.observacoes || "",
        condicoesPagamento: data.condicoes_pagamento || "",
        prazoEntrega: data.prazo_entrega || "",
        validadeOrcamento: data.validade_orcamento || "",
      }
    } catch (error) {
      console.error("Erro ao atualizar orçamento:", error)
      throw new Error("Erro ao atualizar orçamento")
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const supabase = getClientSupabaseInstance()
      const { error } = await supabase.from("orcamentos").delete().eq("id", id)

      if (error) {
        console.error("Erro ao excluir orçamento:", error)
        throw new Error("Erro ao excluir orçamento")
      }
    } catch (error) {
      console.error("Erro ao excluir orçamento:", error)
      throw new Error("Erro ao excluir orçamento")
    }
  },
}
