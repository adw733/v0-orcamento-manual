import { getClientSupabaseInstance } from "@/lib/supabase"
import type { Cliente } from "@/types/types"

export const clienteService = {
  async getAll(): Promise<Cliente[]> {
    const supabase = getClientSupabaseInstance()
    const { data, error } = await supabase.from("clientes").select("*").order("nome")

    if (error) {
      console.error("Erro ao buscar clientes:", error)
      throw new Error("Erro ao buscar clientes")
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

  async create(cliente: Omit<Cliente, "id">): Promise<Cliente> {
    const supabase = getClientSupabaseInstance()
    const { data, error } = await supabase
      .from("clientes")
      .insert({
        nome: cliente.nome,
        cnpj: cliente.cnpj,
        endereco: cliente.endereco,
        telefone: cliente.telefone,
        email: cliente.email,
        contato: cliente.contato,
      })
      .select()
      .single()

    if (error) {
      console.error("Erro ao criar cliente:", error)
      throw new Error("Erro ao criar cliente")
    }

    return {
      id: data.id,
      nome: data.nome,
      cnpj: data.cnpj || "",
      endereco: data.endereco || "",
      telefone: data.telefone || "",
      email: data.email || "",
      contato: data.contato || "",
    }
  },

  async update(cliente: Cliente): Promise<Cliente> {
    const supabase = getClientSupabaseInstance()
    const { data, error } = await supabase
      .from("clientes")
      .update({
        nome: cliente.nome,
        cnpj: cliente.cnpj,
        endereco: cliente.endereco,
        telefone: cliente.telefone,
        email: cliente.email,
        contato: cliente.contato,
      })
      .eq("id", cliente.id)
      .select()
      .single()

    if (error) {
      console.error("Erro ao atualizar cliente:", error)
      throw new Error("Erro ao atualizar cliente")
    }

    return {
      id: data.id,
      nome: data.nome,
      cnpj: data.cnpj || "",
      endereco: data.endereco || "",
      telefone: data.telefone || "",
      email: data.email || "",
      contato: data.contato || "",
    }
  },

  async delete(id: string): Promise<void> {
    const supabase = getClientSupabaseInstance()
    const { error } = await supabase.from("clientes").delete().eq("id", id)

    if (error) {
      console.error("Erro ao excluir cliente:", error)
      throw new Error("Erro ao excluir cliente")
    }
  },
}
