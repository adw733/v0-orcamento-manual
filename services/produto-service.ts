import { getClientSupabaseInstance } from "@/lib/supabase"
import type { Produto, Tecido } from "@/types/types"

export const produtoService = {
  async getAll(): Promise<Produto[]> {
    const supabase = getClientSupabaseInstance()
    const { data, error } = await supabase.from("produtos").select("*").order("nome")

    if (error) {
      console.error("Erro ao buscar produtos:", error)
      throw new Error("Erro ao buscar produtos")
    }

    return data.map((produto) => ({
      id: produto.id,
      nome: produto.nome,
      valorBase: Number(produto.valor_base),
      tecidos: produto.tecidos as Tecido[],
      cores: produto.cores as string[],
      tamanhosDisponiveis: produto.tamanhos_disponiveis as string[],
    }))
  },

  async create(produto: Omit<Produto, "id">): Promise<Produto> {
    const supabase = getClientSupabaseInstance()
    const { data, error } = await supabase
      .from("produtos")
      .insert({
        nome: produto.nome,
        valor_base: produto.valorBase,
        tecidos: produto.tecidos,
        cores: produto.cores,
        tamanhos_disponiveis: produto.tamanhosDisponiveis,
      })
      .select()
      .single()

    if (error) {
      console.error("Erro ao criar produto:", error)
      throw new Error("Erro ao criar produto")
    }

    return {
      id: data.id,
      nome: data.nome,
      valorBase: Number(data.valor_base),
      tecidos: data.tecidos as Tecido[],
      cores: data.cores as string[],
      tamanhosDisponiveis: data.tamanhos_disponiveis as string[],
    }
  },

  async update(produto: Produto): Promise<Produto> {
    const supabase = getClientSupabaseInstance()
    const { data, error } = await supabase
      .from("produtos")
      .update({
        nome: produto.nome,
        valor_base: produto.valorBase,
        tecidos: produto.tecidos,
        cores: produto.cores,
        tamanhos_disponiveis: produto.tamanhosDisponiveis,
      })
      .eq("id", produto.id)
      .select()
      .single()

    if (error) {
      console.error("Erro ao atualizar produto:", error)
      throw new Error("Erro ao atualizar produto")
    }

    return {
      id: data.id,
      nome: data.nome,
      valorBase: Number(data.valor_base),
      tecidos: data.tecidos as Tecido[],
      cores: data.cores as string[],
      tamanhosDisponiveis: data.tamanhos_disponiveis as string[],
    }
  },

  async delete(id: string): Promise<void> {
    const supabase = getClientSupabaseInstance()
    const { error } = await supabase.from("produtos").delete().eq("id", id)

    if (error) {
      console.error("Erro ao excluir produto:", error)
      throw new Error("Erro ao excluir produto")
    }
  },
}
