"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Trash2, Pencil, Save, X, Building, Phone, Mail, User, AlertCircle, FileText } from "lucide-react"
import type { Cliente } from "@/types/types"
import { supabase } from "@/lib/supabase"
import { mockClientes } from "@/lib/mock-data"

// Helper function to generate UUID
const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// Function to get the next sequential code from Supabase
const obterProximoCodigoCliente = async (): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from("clientes")
      .select("codigo")
      .order("codigo", { ascending: false })
      .limit(1)

    if (error) {
      console.error("Erro ao obter o último código do cliente:", error)
      return "0001" // Retorna o código inicial se houver um erro
    }

    if (data && data.length > 0) {
      const ultimoCodigo = data[0].codigo
      const proximoCodigoNumerico = Number.parseInt(ultimoCodigo, 10) + 1
      const proximoCodigoFormatado = String(proximoCodigoNumerico).padStart(4, "0")
      return proximoCodigoFormatado
    } else {
      return "0001" // Retorna o código inicial se não houver clientes
    }
  } catch (error) {
    console.error("Erro ao obter o próximo código do cliente:", error)
    return "0001" // Retorna o código inicial se houver um erro
  }
}

interface GerenciadorClientesProps {
  clientes: Cliente[]
  adicionarCliente: (cliente: Cliente) => void
  setClientes: (clientes: Cliente[]) => void
}

export default function GerenciadorClientes({ clientes, adicionarCliente, setClientes }: GerenciadorClientesProps) {
  // Modificar o estado do novo cliente para incluir o código
  const [novoCliente, setNovoCliente] = useState<Partial<Cliente>>({
    codigo: "",
    nome: "",
    cnpj: "",
    endereco: "",
    telefone: "",
    email: "",
    contato: "",
  })

  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Carregar clientes do Supabase ao montar o componente
  useEffect(() => {
    const carregarClientes = async () => {
      try {
        setIsLoading(true)
        const { data, error } = await supabase.from("clientes").select("*").order("nome")

        if (error) {
          console.warn("Erro ao carregar clientes do Supabase, usando dados mock:", error)
          setClientes(mockClientes)
          return
        }

        if (data) {
          // Converter os dados do Supabase para o formato da aplicação
          const clientesFormatados: Cliente[] = data.map((cliente) => ({
            id: cliente.id,
            codigo: cliente.codigo || "",
            nome: cliente.nome,
            cnpj: cliente.cnpj || "",
            endereco: cliente.endereco || "",
            telefone: cliente.telefone || "",
            email: cliente.email || "",
            contato: cliente.contato || "",
          }))

          setClientes(clientesFormatados)
        }
      } catch (error) {
        console.error("Erro ao carregar clientes:", error)
        setClientes(mockClientes)
      } finally {
        setIsLoading(false)
      }
    }

    carregarClientes()
  }, [setClientes])

  // Modificar a função handleAdicionarCliente para gerar o código
  const handleAdicionarCliente = async () => {
    if (novoCliente.nome) {
      try {
        setIsLoading(true)
        setError(null)

        // Gerar um UUID para o novo cliente
        const clienteId = generateUUID()

        // Obter o próximo código sequencial
        const codigo = await obterProximoCodigoCliente()

        // Inserir no Supabase
        const { data, error } = await supabase
          .from("clientes")
          .insert({
            id: clienteId,
            codigo,
            nome: novoCliente.nome,
            cnpj: novoCliente.cnpj || null,
            endereco: novoCliente.endereco || null,
            telefone: novoCliente.telefone || null,
            email: novoCliente.email || null,
            contato: novoCliente.contato || null,
          })
          .select()

        if (error) throw error

        if (data && data[0]) {
          // Converter para o formato da aplicação
          const novoClienteFormatado: Cliente = {
            id: data[0].id,
            codigo: data[0].codigo || "",
            nome: data[0].nome,
            cnpj: data[0].cnpj || "",
            endereco: data[0].endereco || "",
            telefone: data[0].telefone || "",
            email: data[0].email || "",
            contato: data[0].contato || "",
          }

          // Adicionar à lista local
          adicionarCliente(novoClienteFormatado)

          // Limpar formulário
          setNovoCliente({
            codigo: "",
            nome: "",
            cnpj: "",
            endereco: "",
            telefone: "",
            email: "",
            contato: "",
          })
        }
      } catch (error) {
        console.error("Erro ao adicionar cliente:", error)
        setError(`Erro ao adicionar cliente: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleRemoverCliente = async (id: string) => {
    // Confirmar antes de excluir
    if (!window.confirm("Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.")) {
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Verificar se o cliente está sendo usado em algum orçamento
      const { data: orcamentosRelacionados, error: orcamentosError } = await supabase
        .from("orcamentos")
        .select("id, numero")
        .eq("cliente_id", id)

      if (orcamentosError) throw orcamentosError

      // Se existirem orçamentos relacionados, perguntar ao usuário se deseja excluí-los também
      if (orcamentosRelacionados && orcamentosRelacionados.length > 0) {
        const confirmarExclusao = window.confirm(
          `Este cliente está associado a ${orcamentosRelacionados.length} orçamento(s). Todos esses orçamentos serão excluídos também. Deseja continuar?`,
        )

        if (!confirmarExclusao) {
          setIsLoading(false)
          return
        }

        // Excluir os itens de orçamento relacionados primeiro
        for (const orcamento of orcamentosRelacionados) {
          const { error: itensError } = await supabase.from("itens_orcamento").delete().eq("orcamento_id", orcamento.id)

          if (itensError) throw itensError
        }

        // Excluir os orçamentos relacionados
        const { error: deleteOrcamentosError } = await supabase.from("orcamentos").delete().eq("cliente_id", id)

        if (deleteOrcamentosError) throw deleteOrcamentosError
      }

      // Agora podemos excluir o cliente com segurança
      const { error } = await supabase.from("clientes").delete().eq("id", id)

      if (error) throw error

      // Remover da lista local
      setClientes(clientes.filter((cliente) => cliente.id !== id))
    } catch (error) {
      console.error("Erro ao remover cliente:", error)
      setError(`Erro ao remover cliente: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
    } finally {
      setIsLoading(false)
    }
  }

  const iniciarEdicao = (cliente: Cliente) => {
    setEditandoId(cliente.id)
    setClienteEditando({ ...cliente })
  }

  const cancelarEdicao = () => {
    setEditandoId(null)
    setClienteEditando(null)
  }

  const salvarEdicao = async () => {
    if (clienteEditando) {
      try {
        setIsLoading(true)
        setError(null)

        // Atualizar no Supabase
        const { error } = await supabase
          .from("clientes")
          .update({
            nome: clienteEditando.nome,
            cnpj: clienteEditando.cnpj || null,
            endereco: clienteEditando.endereco || null,
            telefone: clienteEditando.telefone || null,
            email: clienteEditando.email || null,
            contato: clienteEditando.contato || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", clienteEditando.id)

        if (error) throw error

        // Atualizar na lista local
        setClientes(clientes.map((cliente) => (cliente.id === clienteEditando.id ? clienteEditando : cliente)))
        setEditandoId(null)
        setClienteEditando(null)
      } catch (error) {
        console.error("Erro ao atualizar cliente:", error)
        setError(`Erro ao atualizar cliente: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-primary flex items-center gap-2">
          <span className="bg-primary text-white p-1 rounded-md text-xs">CLIENTES</span>
          Gerenciar Clientes
        </h3>
        <span className="text-sm text-gray-500">{clientes.length} clientes cadastrados</span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {isLoading && clientes.length === 0 ? (
          <div className="text-center py-4">Carregando clientes...</div>
        ) : (
          clientes.map((cliente) => (
            <Card key={cliente.id} className="overflow-hidden shadow-sm border-0 hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                {editandoId === cliente.id && clienteEditando ? (
                  <div className="p-4 space-y-4 bg-accent/50">
                    {/* Adicionar campo de código no formulário de edição */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`edit-codigo-${cliente.id}`} className="text-primary flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Código
                        </Label>
                        <Input
                          id={`edit-codigo-${cliente.id}`}
                          value={clienteEditando.codigo}
                          onChange={(e) =>
                            setClienteEditando({
                              ...clienteEditando,
                              codigo: e.target.value,
                            })
                          }
                          className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                          disabled={true} // Código não deve ser editável manualmente
                        />
                      </div>
                      <div>
                        <Label htmlFor={`edit-nome-${cliente.id}`} className="text-primary flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          Nome Empresa
                        </Label>
                        <Input
                          id={`edit-nome-${cliente.id}`}
                          value={clienteEditando.nome}
                          onChange={(e) =>
                            setClienteEditando({
                              ...clienteEditando,
                              nome: e.target.value,
                            })
                          }
                          className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor={`edit-cnpj-${cliente.id}`} className="text-primary flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        CNPJ
                      </Label>
                      <Input
                        id={`edit-cnpj-${cliente.id}`}
                        value={clienteEditando.cnpj}
                        onChange={(e) =>
                          setClienteEditando({
                            ...clienteEditando,
                            cnpj: e.target.value,
                          })
                        }
                        className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`edit-endereco-${cliente.id}`} className="text-primary">
                        Endereço
                      </Label>
                      <Input
                        id={`edit-endereco-${cliente.id}`}
                        value={clienteEditando.endereco}
                        onChange={(e) =>
                          setClienteEditando({
                            ...clienteEditando,
                            endereco: e.target.value,
                          })
                        }
                        className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`edit-telefone-${cliente.id}`} className="text-primary flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Telefone
                        </Label>
                        <Input
                          id={`edit-telefone-${cliente.id}`}
                          value={clienteEditando.telefone}
                          onChange={(e) =>
                            setClienteEditando({
                              ...clienteEditando,
                              telefone: e.target.value,
                            })
                          }
                          className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`edit-email-${cliente.id}`} className="text-primary flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email
                        </Label>
                        <Input
                          id={`edit-email-${cliente.id}`}
                          value={clienteEditando.email}
                          onChange={(e) =>
                            setClienteEditando({
                              ...clienteEditando,
                              email: e.target.value,
                            })
                          }
                          className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={cancelarEdicao} className="text-gray-500 hover:text-gray-700">
                        <X className="h-4 w-4 mr-2" /> Cancelar
                      </Button>
                      <Button
                        onClick={salvarEdicao}
                        className="bg-primary hover:bg-primary-dark text-white"
                        disabled={isLoading}
                      >
                        <Save className="h-4 w-4 mr-2" /> {isLoading ? "Salvando..." : "Salvar"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4">
                    {/* Modificar a exibição do cliente para mostrar o código */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3">
                        <div className="bg-primary text-white p-2 rounded-full">
                          <Building className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            <span className="text-primary">{cliente.codigo}</span> - {cliente.nome}
                          </h4>
                          <p className="text-sm text-gray-500">{cliente.cnpj}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => iniciarEdicao(cliente)}
                          className="h-8 w-8 text-primary hover:text-primary-dark hover:bg-primary/10"
                          disabled={isLoading}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoverCliente(cliente.id)}
                          className="h-8 w-8 text-gray-500 hover:text-red-500 hover:bg-red-50"
                          disabled={isLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 text-sm grid grid-cols-1 md:grid-cols-2 gap-2 bg-accent/50 p-3 rounded-md">
                      <p className="flex items-center gap-2">
                        <span className="text-gray-500">Endereço:</span> {cliente.endereco}
                      </p>
                      <p className="flex items-center gap-2">
                        <Phone className="h-3 w-3 text-gray-500" /> {cliente.telefone}
                      </p>
                      <p className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-gray-500" /> {cliente.email}
                      </p>
                      <p className="flex items-center gap-2">
                        <User className="h-3 w-3 text-gray-500" /> {cliente.contato}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card className="overflow-hidden shadow-sm border-0 border-t-4 border-t-secondary">
        <CardContent className="p-4">
          <h4 className="font-medium mb-4 text-secondary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Novo Cliente
          </h4>
          <div className="space-y-4">
            {/* Adicionar campo de código no formulário de novo cliente */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="codigo" className="text-primary flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Código
                </Label>
                <Input
                  id="codigo"
                  value={novoCliente.codigo}
                  className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                  disabled={true} // Código será gerado automaticamente
                  placeholder="Gerado automaticamente"
                />
              </div>
              <div>
                <Label htmlFor="nome" className="text-primary flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Nome Empresa
                </Label>
                <Input
                  id="nome"
                  value={novoCliente.nome}
                  onChange={(e) => setNovoCliente({ ...novoCliente, nome: e.target.value })}
                  className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="cnpj" className="text-primary flex items-center gap-2">
                <FileText className="h-4 w-4" />
                CNPJ
              </Label>
              <Input
                id="cnpj"
                value={novoCliente.cnpj}
                onChange={(e) => setNovoCliente({ ...novoCliente, cnpj: e.target.value })}
                className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <Label htmlFor="endereco" className="text-primary">
                Endereço
              </Label>
              <Input
                id="endereco"
                value={novoCliente.endereco}
                onChange={(e) => setNovoCliente({ ...novoCliente, endereco: e.target.value })}
                className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="telefone" className="text-primary flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Telefone
                </Label>
                <Input
                  id="telefone"
                  value={novoCliente.telefone}
                  onChange={(e) => setNovoCliente({ ...novoCliente, telefone: e.target.value })}
                  className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-primary flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  value={novoCliente.email}
                  onChange={(e) => setNovoCliente({ ...novoCliente, email: e.target.value })}
                  className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <Button
              onClick={handleAdicionarCliente}
              className="w-full bg-secondary hover:bg-secondary-dark text-white transition-colors"
              disabled={isLoading || !novoCliente.nome}
            >
              <Plus className="h-4 w-4 mr-2" /> {isLoading ? "Adicionando..." : "Adicionar Cliente"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
