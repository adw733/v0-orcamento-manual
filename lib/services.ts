import { supabase } from "@/lib/supabase"
import type { Cliente, Produto, Orcamento, ItemOrcamento } from "@/types/types"

// Define the Estampa type
export interface Estampa {
  id?: string
  posicao?: string
  tipo?: string
  largura?: number
}

// Serviços para Clientes
export const clienteService = {
  async listarTodos(): Promise<Cliente[]> {
    const { data, error } = await supabase.from("clientes").select("*").order("nome")

    if (error) {
      console.error("Erro ao listar clientes:", error)
      throw error
    }

    return data.map((cliente) => ({
      id: cliente.id,
      nome: cliente.nome,
      cnpj: cliente.cnpj || "",
      endereco: cliente.endereco || "",
      telefone: cliente.telefone || "",
      email: cliente.email || "",
      contato: cliente.contato || "",
    }))
  },

  async adicionar(cliente: Omit<Cliente, "id">): Promise<Cliente> {
    const { data, error } = await supabase
      .from("clientes")
      .insert({
        nome: cliente.nome,
        cnpj: cliente.cnpj || null,
        endereco: cliente.endereco || null,
        telefone: cliente.telefone || null,
        email: cliente.email || null,
        contato: cliente.contato || null,
      })
      .select()

    if (error) {
      console.error("Erro ao adicionar cliente:", error)
      throw error
    }

    return {
      id: data[0].id,
      nome: data[0].nome,
      cnpj: data[0].cnpj || "",
      endereco: data[0].endereco || "",
      telefone: data[0].telefone || "",
      email: data[0].email || "",
      contato: data[0].contato || "",
    }
  },

  async atualizar(cliente: Cliente): Promise<void> {
    const { error } = await supabase
      .from("clientes")
      .update({
        nome: cliente.nome,
        cnpj: cliente.cnpj || null,
        endereco: cliente.endereco || null,
        telefone: cliente.telefone || null,
        email: cliente.email || null,
        contato: cliente.contato || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", cliente.id)

    if (error) {
      console.error("Erro ao atualizar cliente:", error)
      throw error
    }
  },

  async remover(id: string): Promise<void> {
    const { error } = await supabase.from("clientes").delete().eq("id", id)

    if (error) {
      console.error("Erro ao remover cliente:", error)
      throw error
    }
  },
}

// Serviços para Produtos
export const produtoService = {
  async listarTodos(): Promise<Produto[]> {
    // Buscar produtos
    const { data: produtosData, error: produtosError } = await supabase.from("produtos").select("*").order("nome")

    if (produtosError) {
      console.error("Erro ao listar produtos:", produtosError)
      throw produtosError
    }

    // Para cada produto, buscar seus tecidos
    const produtosCompletos = await Promise.all(
      produtosData.map(async (produto) => {
        // Buscar tecidos do produto
        const { data: tecidosData, error: tecidosError } = await supabase
          .from("tecidos")
          .select("*")
          .eq("produto_id", produto.id)

        if (tecidosError) {
          console.error("Erro ao listar tecidos do produto:", tecidosError)
          throw tecidosError
        }

        // Converter para o formato da aplicação
        return {
          id: produto.id,
          nome: produto.nome,
          valorBase: Number(produto.valor_base),
          tecidos: tecidosData
            ? tecidosData.map((t) => ({
                nome: t.nome,
                composicao: t.composicao || "",
              }))
            : [],
          cores: produto.cores || [],
          tamanhosDisponiveis: produto.tamanhos_disponiveis || [],
        } as Produto
      }),
    )

    return produtosCompletos
  },

  async adicionar(produto: Omit<Produto, "id">): Promise<Produto> {
    // Inserir produto
    const { data: produtoData, error: produtoError } = await supabase
      .from("produtos")
      .insert({
        nome: produto.nome,
        valor_base: produto.valorBase,
        cores: produto.cores || [],
        tamanhos_disponiveis: produto.tamanhosDisponiveis || [],
      })
      .select()

    if (produtoError) {
      console.error("Erro ao adicionar produto:", produtoError)
      throw produtoError
    }

    // Inserir tecidos do produto
    if (produto.tecidos && produto.tecidos.length > 0) {
      const tecidosParaInserir = produto.tecidos.map((tecido) => ({
        nome: tecido.nome,
        composicao: tecido.composicao,
        produto_id: produtoData[0].id,
      }))

      const { error: tecidosError } = await supabase.from("tecidos").insert(tecidosParaInserir)

      if (tecidosError) {
        console.error("Erro ao adicionar tecidos do produto:", tecidosError)
        throw tecidosError
      }
    }

    return {
      id: produtoData[0].id,
      nome: produtoData[0].nome,
      valorBase: Number(produtoData[0].valor_base),
      tecidos: produto.tecidos || [],
      cores: produto.cores || [],
      tamanhosDisponiveis: produto.tamanhosDisponiveis || [],
    }
  },

  async atualizar(produto: Produto): Promise<void> {
    // Atualizar produto
    const { error: produtoError } = await supabase
      .from("produtos")
      .update({
        nome: produto.nome,
        valor_base: produto.valorBase,
        cores: produto.cores,
        tamanhos_disponiveis: produto.tamanhosDisponiveis,
        updated_at: new Date().toISOString(),
      })
      .eq("id", produto.id)

    if (produtoError) {
      console.error("Erro ao atualizar produto:", produtoError)
      throw produtoError
    }

    // Remover tecidos antigos
    const { error: deleteTecidosError } = await supabase.from("tecidos").delete().eq("produto_id", produto.id)

    if (deleteTecidosError) {
      console.error("Erro ao remover tecidos antigos:", deleteTecidosError)
      throw deleteTecidosError
    }

    // Inserir novos tecidos
    if (produto.tecidos && produto.tecidos.length > 0) {
      const tecidosParaInserir = produto.tecidos.map((tecido) => ({
        nome: tecido.nome,
        composicao: tecido.composicao,
        produto_id: produto.id,
      }))

      const { error: tecidosError } = await supabase.from("tecidos").insert(tecidosParaInserir)

      if (tecidosError) {
        console.error("Erro ao adicionar novos tecidos:", tecidosError)
        throw tecidosError
      }
    }
  },

  async remover(id: string): Promise<void> {
    // Remover tecidos do produto
    const { error: tecidosError } = await supabase.from("tecidos").delete().eq("produto_id", id)

    if (tecidosError) {
      console.error("Erro ao remover tecidos do produto:", tecidosError)
      throw tecidosError
    }

    // Remover produto
    const { error: produtoError } = await supabase.from("produtos").delete().eq("id", id)

    if (produtoError) {
      console.error("Erro ao remover produto:", produtoError)
      throw produtoError
    }
  },
}

// Serviços para Orçamentos
export const orcamentoService = {
  // Atualizar a função listarTodos para lidar com múltiplas artes
  async listarTodos(): Promise<Orcamento[]> {
    const { data, error } = await supabase
      .from("orcamentos")
      .select("*, cliente:cliente_id(*)")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Erro ao listar orçamentos:", error)
      throw error
    }

    // Converter para o formato da aplicação
    const orcamentos = await Promise.all(
      data.map(async (orcamento) => {
        // Carregar itens do orçamento
        const { data: itensData, error: itensError } = await supabase
          .from("itens_orcamento")
          .select("*, produto:produto_id(*)")
          .eq("orcamento_id", orcamento.id)

        if (itensError) {
          console.error("Erro ao listar itens do orçamento:", itensError)
          throw itensError
        }

        // Converter itens para o formato da aplicação
        const itensFormatados: ItemOrcamento[] = itensData
          ? await Promise.all(
              itensData.map(async (item) => {
                // Buscar o produto completo com tecidos
                let produto: Produto | undefined = undefined
                if (item.produto) {
                  const { data: tecidosData, error: tecidosError } = await supabase
                    .from("tecidos")
                    .select("*")
                    .eq("produto_id", item.produto.id)

                  if (tecidosError) {
                    console.error("Erro ao listar tecidos do produto:", tecidosError)
                    throw tecidosError
                  }

                  produto = {
                    id: item.produto.id,
                    nome: item.produto.nome,
                    valorBase: Number(item.produto.valor_base),
                    tecidos: tecidosData
                      ? tecidosData.map((t) => ({
                          nome: t.nome,
                          composicao: t.composicao || "",
                        }))
                      : [],
                    cores: item.produto.cores || [],
                    tamanhosDisponiveis: item.produto.tamanhos_disponiveis || [],
                  }
                }

                // Carregar estampas do item
                const { data: estampasData, error: estampasError } = await supabase
                  .from("estampas")
                  .select("*")
                  .eq("item_orcamento_id", item.id)

                if (estampasError) {
                  console.error("Erro ao listar estampas do item:", estampasError)
                  throw estampasError
                }

                // Converter estampas para o formato da aplicação
                const estampas: Estampa[] = estampasData
                  ? estampasData.map((estampa) => ({
                      id: estampa.id,
                      posicao: estampa.posicao || undefined,
                      tipo: estampa.tipo || undefined,
                      largura: estampa.largura || undefined,
                    }))
                  : []

                return {
                  id: item.id,
                  produtoId: item.produto_id || "",
                  produto,
                  quantidade: item.quantidade,
                  valorUnitario: Number(item.valor_unitario),
                  tecidoSelecionado: item.tecido_nome
                    ? {
                        nome: item.tecido_nome,
                        composicao: item.tecido_composicao || "",
                      }
                    : undefined,
                  corSelecionada: item.cor_selecionada || undefined,
                  estampas: estampas,
                  tamanhos: (item.tamanhos as ItemOrcamento["tamanhos"]) || {},
                  imagem: item.imagem || undefined,
                  observacao: item.observacao || undefined,
                }
              }),
            )
          : []

        // Converter cliente
        const clienteFormatado = orcamento.cliente
          ? {
              id: orcamento.cliente.id,
              nome: orcamento.cliente.nome,
              cnpj: orcamento.cliente.cnpj || "",
              endereco: orcamento.cliente.endereco || "",
              telefone: orcamento.cliente.telefone || "",
              email: orcamento.cliente.email || "",
              contato: orcamento.cliente.contato || "",
            }
          : null

        return {
          id: orcamento.id,
          numero: orcamento.numero,
          data: orcamento.data,
          cliente: clienteFormatado,
          itens: itensFormatados,
          observacoes: orcamento.observacoes || "",
          condicoesPagamento: orcamento.condicoesPagamento || "À vista",
          prazoEntrega: orcamento.prazoEntrega || "30 dias",
          validadeOrcamento: orcamento.validadeOrcamento || "15 dias",
        } as Orcamento
      }),
    )

    return orcamentos
  },

  async obterPorId(id: string): Promise<Orcamento | null> {
    const { data, error } = await supabase.from("orcamentos").select("*, cliente:cliente_id(*)").eq("id", id).single()

    if (error) {
      if (error.code === "PGRST116") {
        // Não encontrado
        return null
      }
      console.error("Erro ao obter orçamento:", error)
      throw error
    }

    // Carregar itens do orçamento
    const { data: itensData, error: itensError } = await supabase
      .from("itens_orcamento")
      .select("*, produto:produto_id(*)")
      .eq("orcamento_id", data.id)

    if (itensError) {
      console.error("Erro ao listar itens do orçamento:", itensError)
      throw itensError
    }

    // Converter itens para o formato da aplicação
    const itensFormatados: ItemOrcamento[] = itensData
      ? await Promise.all(
          itensData.map(async (item) => {
            // Buscar o produto completo com tecidos
            let produto: Produto | undefined = undefined
            if (item.produto) {
              const { data: tecidosData, error: tecidosError } = await supabase
                .from("tecidos")
                .select("*")
                .eq("produto_id", item.produto.id)

              if (tecidosError) {
                console.error("Erro ao listar tecidos do produto:", tecidosError)
                throw tecidosError
              }

              produto = {
                id: item.produto.id,
                nome: item.produto.nome,
                valorBase: Number(item.produto.valor_base),
                tecidos: tecidosData
                  ? tecidosData.map((t) => ({
                      nome: t.nome,
                      composicao: t.composicao || "",
                    }))
                  : [],
                cores: item.produto.cores || [],
                tamanhosDisponiveis: item.produto.tamanhos_disponiveis || [],
              }
            }

            // Carregar estampas do item
            const { data: estampasData, error: estampasError } = await supabase
              .from("estampas")
              .select("*")
              .eq("item_orcamento_id", item.id)

            if (estampasError) {
              console.error("Erro ao listar estampas do item:", estampasError)
              throw estampasError
            }

            // Converter estampas para o formato da aplicação
            const estampas: Estampa[] = estampasData
              ? estampasData.map((estampa) => ({
                  id: estampa.id,
                  posicao: estampa.posicao || undefined,
                  tipo: estampa.tipo || undefined,
                  largura: estampa.largura || undefined,
                }))
              : []

            return {
              id: item.id,
              produtoId: item.produto_id || "",
              produto,
              quantidade: item.quantidade,
              valorUnitario: Number(item.valor_unitario),
              tecidoSelecionado: item.tecido_nome
                ? {
                    nome: item.tecido_nome,
                    composicao: item.tecido_composicao || "",
                  }
                : undefined,
              corSelecionada: item.cor_selecionada || undefined,
              estampas: estampas,
              tamanhos: (item.tamanhos as ItemOrcamento["tamanhos"]) || {},
              imagem: item.imagem || undefined,
              observacao: item.observacao || undefined,
            }
          }),
        )
      : []

    // Converter cliente
    const clienteFormatado = data.cliente
      ? {
          id: data.cliente.id,
          nome: data.cliente.nome,
          cnpj: data.cliente.cnpj || "",
          endereco: data.cliente.endereco || "",
          telefone: data.cliente.telefone || "",
          email: data.cliente.email || "",
          contato: data.cliente.contato || "",
        }
      : null

    return {
      id: data.id,
      numero: data.numero,
      data: data.data,
      cliente: clienteFormatado,
      itens: itensFormatados,
      observacoes: data.observacoes || "",
      condicoesPagamento: data.condicoes_pagamento || "À vista",
      prazoEntrega: data.prazo_entrega || "30 dias",
      validadeOrcamento: data.validade_orcamento || "15 dias",
    }
  },

  async salvar(orcamento: Orcamento): Promise<string> {
    if (!orcamento.cliente) {
      throw new Error("Orçamento deve ter um cliente")
    }

    // Se já tem ID, atualizar
    if (orcamento.id) {
      const { error } = await supabase
        .from("orcamentos")
        .update({
          numero: orcamento.numero,
          data: orcamento.data,
          cliente_id: orcamento.cliente.id,
          observacoes: orcamento.observacoes,
          condicoes_pagamento: orcamento.condicoesPagamento,
          prazo_entrega: orcamento.prazoEntrega,
          validade_orcamento: orcamento.validadeOrcamento,
          itens: JSON.stringify(orcamento.itens),
          updated_at: new Date().toISOString(),
        })
        .eq("id", orcamento.id)

      if (error) {
        console.error("Erro ao atualizar orçamento:", error)
        throw error
      }

      return orcamento.id
    } else {
      // Criar novo orçamento
      const { data, error } = await supabase
        .from("orcamentos")
        .insert({
          numero: orcamento.numero,
          data: orcamento.data,
          cliente_id: orcamento.cliente.id,
          observacoes: orcamento.observacoes,
          condicoes_pagamento: orcamento.condicoesPagamento,
          prazo_entrega: orcamento.prazoEntrega,
          validade_orcamento: orcamento.validadeOrcamento,
          itens: JSON.stringify(orcamento.itens),
        })
        .select()

      if (error) {
        console.error("Erro ao criar orçamento:", error)
        throw error
      }

      return data[0].id
    }
  },

  // Atualizar a função adicionarItem para lidar com múltiplas artes
  async adicionarItem(orcamentoId: string, item: Omit<ItemOrcamento, "id">): Promise<string> {
    // Inserir o item principal
    const { data, error } = await supabase
      .from("itens_orcamento")
      .insert({
        orcamento_id: orcamentoId,
        produto_id: item.produtoId,
        quantidade: item.quantidade,
        valor_unitario: item.valorUnitario,
        tecido_nome: item.tecidoSelecionado?.nome,
        tecido_composicao: item.tecidoSelecionado?.composicao,
        cor_selecionada: item.corSelecionada,
        tamanhos: item.tamanhos,
        imagem: item.imagem,
        // Remover o campo observacao que está causando o erro
      })
      .select()

    if (error) {
      console.error("Erro ao adicionar item:", error)
      throw error
    }

    const itemId = data[0].id

    // Inserir as estampas do item
    if (item.estampas && item.estampas.length > 0) {
      const estampasParaInserir = item.estampas.map((estampa) => ({
        item_orcamento_id: itemId,
        posicao: estampa.posicao,
        tipo: estampa.tipo,
        largura: estampa.largura,
      }))

      const { error: estampasError } = await supabase.from("estampas").insert(estampasParaInserir)

      if (estampasError) {
        console.error("Erro ao adicionar estampas:", estampasError)
        throw estampasError
      }
    }

    return itemId
  },

  // Atualizar a função atualizarItem para lidar com múltiplas artes
  async atualizarItem(id: string, item: Partial<ItemOrcamento>): Promise<void> {
    // Atualizar o item principal
    const { error } = await supabase
      .from("itens_orcamento")
      .update({
        quantidade: item.quantidade,
        valor_unitario: item.valorUnitario,
        tecido_nome: item.tecidoSelecionado?.nome,
        tecido_composicao: item.tecidoSelecionado?.composicao,
        cor_selecionada: item.corSelecionada,
        tamanhos: item.tamanhos,
        imagem: item.imagem,
        // Remover o campo observacao que está causando o erro
      })
      .eq("id", id)

    if (error) {
      console.error("Erro ao atualizar item:", error)
      throw error
    }

    // Atualizar as estampas do item
    if (item.estampas) {
      // Primeiro, remover todas as estampas existentes
      const { error: deleteEstampasError } = await supabase.from("estampas").delete().eq("item_orcamento_id", id)

      if (deleteEstampasError) {
        console.error("Erro ao remover estampas antigas:", deleteEstampasError)
        throw deleteEstampasError
      }

      // Inserir as novas estampas
      if (item.estampas.length > 0) {
        const estampasParaInserir = item.estampas.map((estampa) => ({
          item_orcamento_id: id,
          posicao: estampa.posicao,
          tipo: estampa.tipo,
          largura: estampa.largura,
        }))

        const { error: estampasError } = await supabase.from("estampas").insert(estampasParaInserir)

        if (estampasError) {
          console.error("Erro ao adicionar novas estampas:", estampasError)
          throw estampasError
        }
      }
    }
  },

  async removerItem(id: string): Promise<void> {
    const { error } = await supabase.from("itens_orcamento").delete().eq("id", id)

    if (error) {
      console.error("Erro ao remover item:", error)
      throw error
    }
  },
}
