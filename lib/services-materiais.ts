import { supabase } from "@/lib/supabase"

// Interfaces para cores e tecidos
export interface Cor {
  id: string
  nome: string
  codigo_hex?: string
}

export interface TecidoBase {
  id: string
  nome: string
  composicao: string
}

// Serviço para gerenciar cores
export const corService = {
  async listarTodas(): Promise<Cor[]> {
    const { data, error } = await supabase.from("cores").select("*").order("nome")

    if (error) {
      console.error("Erro ao listar cores:", error)
      throw error
    }

    return data.map((cor) => ({
      id: cor.id,
      nome: cor.nome,
      codigo_hex: cor.codigo_hex,
    }))
  },

  async adicionar(cor: Omit<Cor, "id">): Promise<Cor> {
    const { data, error } = await supabase
      .from("cores")
      .insert({
        nome: cor.nome.toUpperCase(),
        codigo_hex: cor.codigo_hex,
      })
      .select()

    if (error) {
      console.error("Erro ao adicionar cor:", error)
      throw error
    }

    return {
      id: data[0].id,
      nome: data[0].nome,
      codigo_hex: data[0].codigo_hex,
    }
  },

  async atualizar(cor: Cor): Promise<void> {
    const { error } = await supabase
      .from("cores")
      .update({
        nome: cor.nome.toUpperCase(),
        codigo_hex: cor.codigo_hex,
        updated_at: new Date().toISOString(),
      })
      .eq("id", cor.id)

    if (error) {
      console.error("Erro ao atualizar cor:", error)
      throw error
    }
  },

  async remover(id: string): Promise<void> {
    const { error } = await supabase.from("cores").delete().eq("id", id)

    if (error) {
      console.error("Erro ao remover cor:", error)
      throw error
    }
  },
}

// Serviço para gerenciar tecidos base
export const tecidoBaseService = {
  async listarTodos(): Promise<TecidoBase[]> {
    const { data, error } = await supabase.from("tecidos_base").select("*").order("nome")

    if (error) {
      console.error("Erro ao listar tecidos base:", error)
      throw error
    }

    return data.map((tecido) => ({
      id: tecido.id,
      nome: tecido.nome,
      composicao: tecido.composicao || "",
    }))
  },

  async adicionar(tecido: Omit<TecidoBase, "id">): Promise<TecidoBase> {
    const { data, error } = await supabase
      .from("tecidos_base")
      .insert({
        nome: tecido.nome.toUpperCase(),
        composicao: tecido.composicao.toUpperCase(),
      })
      .select()

    if (error) {
      console.error("Erro ao adicionar tecido base:", error)
      throw error
    }

    return {
      id: data[0].id,
      nome: data[0].nome,
      composicao: data[0].composicao || "",
    }
  },

  async atualizar(tecido: TecidoBase): Promise<void> {
    const { error } = await supabase
      .from("tecidos_base")
      .update({
        nome: tecido.nome.toUpperCase(),
        composicao: tecido.composicao.toUpperCase(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", tecido.id)

    if (error) {
      console.error("Erro ao atualizar tecido base:", error)
      throw error
    }
  },

  async remover(id: string): Promise<void> {
    const { error } = await supabase.from("tecidos_base").delete().eq("id", id)

    if (error) {
      console.error("Erro ao remover tecido base:", error)
      throw error
    }
  },
}
