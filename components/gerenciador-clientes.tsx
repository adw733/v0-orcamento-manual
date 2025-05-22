"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Plus,
  Trash2,
  Pencil,
  Save,
  X,
  Building,
  Phone,
  Mail,
  AlertCircle,
  FileText,
  Search,
  ChevronUp,
  ChevronDown,
} from "lucide-react"
import type { Cliente } from "@/types/types"
import { supabase } from "@/lib/supabase"
import { mockClientes } from "@/lib/mock-data"

// Helper function to generate UUID
const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// Função para obter o próximo código de cliente
const obterProximoCodigoCliente = async (): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from("clientes")
      .select("codigo")
      .order("codigo", { ascending: false })
      .limit(1)

    if (error) {
      console.error("Erro ao obter o último código do cliente:", error)
      return "C0001" // Retorna o código inicial com prefixo C
    }

    // Se não houver dados ou o array estiver vazio
    if (!data || data.length === 0 || !data[0].codigo) {
      return "C0001" // Código inicial com prefixo C
    }

    const ultimoCodigo = data[0].codigo.trim()

    // Extrair apenas os dígitos do código
    const numerosApenas = ultimoCodigo.replace(/\D/g, "")

    // Se não conseguirmos extrair números, começar do C0001
    if (!numerosApenas) {
      console.warn("Formato de código inválido encontrado:", ultimoCodigo)
      return "C0001"
    }

    // Converter para número e incrementar
    const proximoCodigoNumerico = Number.parseInt(numerosApenas, 10) + 1

    // Verificar se a conversão foi bem-sucedida
    if (isNaN(proximoCodigoNumerico)) {
      console.warn("Erro ao converter código para número:", ultimoCodigo)
      return "C0001"
    }

    // Formatar com zeros à esquerda para garantir 4 dígitos e adicionar prefixo C
    const proximoCodigoFormatado = "C" + String(proximoCodigoNumerico).padStart(4, "0")

    console.log(`Último código: ${ultimoCodigo}, Próximo código: ${proximoCodigoFormatado}`)
    return proximoCodigoFormatado
  } catch (error) {
    console.error("Erro ao obter o próximo código do cliente:", error)
    return "C0001" // Retorna o código inicial com prefixo C
  }
}

// Função para atualizar códigos de clientes existentes
const atualizarCodigosClientesExistentes = async (): Promise<{ success: boolean; message: string }> => {
  try {
    // Buscar todos os clientes sem código
    const { data: clientesSemCodigo, error } = await supabase
      .from("clientes")
      .select("id, codigo")
      .or("codigo.is.null,codigo.eq.")
      .order("created_at", { ascending: true })

    if (error) throw error

    if (clientesSemCodigo && clientesSemCodigo.length > 0) {
      // Buscar o último código existente para continuar a sequência
      const { data: ultimoCliente, error: ultimoError } = await supabase
        .from("clientes")
        .select("codigo")
        .not("codigo", "is", null)
        .neq("codigo", "")
        .order("codigo", { ascending: false })
        .limit(1)

      let contador = 1
      if (!ultimoError && ultimoCliente && ultimoCliente.length > 0 && ultimoCliente[0].codigo) {
        const match = ultimoCliente[0].codigo.match(/^C(\d+)$/)
        if (match && match[1]) {
          contador = Number.parseInt(match[1], 10) + 1
        }
      }

      // Atualizar cada cliente sem código
      for (const cliente of clientesSemCodigo) {
        const novoCodigo = "C" + String(contador).padStart(4, "0")
        contador++

        await supabase.from("clientes").update({ codigo: novoCodigo }).eq("id", cliente.id)
      }

      return {
        success: true,
        message: `${clientesSemCodigo.length} clientes atualizados com códigos sequenciais.`,
      }
    }

    return { success: true, message: "Todos os clientes já possuem códigos." }
  } catch (error) {
    console.error("Erro ao atualizar códigos de clientes:", error)
    return {
      success: false,
      message: `Erro ao atualizar códigos: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
    }
  }
}

// Tipo para ordenação
type SortDirection = "asc" | "desc" | null
type SortField = "codigo" | "nome" | "cnpj" | "telefone" | "email" | null

interface GerenciadorClientesProps {
  clientes: Cliente[]
  adicionarCliente: (cliente: Cliente) => void
  setClientes: (clientes: Cliente[]) => void
}

export default function GerenciadorClientes({ clientes, adicionarCliente, setClientes }: GerenciadorClientesProps) {
  // Estado para novo cliente
  const [novoCliente, setNovoCliente] = useState<Partial<Cliente>>({
    codigo: "",
    nome: "",
    cnpj: "",
    endereco: "",
    telefone: "",
    email: "",
  })

  // Estados para gerenciamento da UI
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filtro, setFiltro] = useState("")
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [sortField, setSortField] = useState<SortField>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [atualizandoCodigos, setAtualizandoCodigos] = useState(false)

  // Função para alternar ordenação
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      // Se já estiver ordenando por este campo, alterne a direção
      if (sortDirection === "asc") {
        setSortDirection("desc")
      } else if (sortDirection === "desc") {
        // Se já estiver em ordem descendente, remova a ordenação
        setSortField(null)
        setSortDirection(null)
      }
    } else {
      // Se for um novo campo, comece com ascendente
      setSortField(field)
      setSortDirection("asc")
    }
  }

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

  // Modificar o método handleAdicionarCliente para converter para maiúsculas
  const handleAdicionarCliente = async () => {
    if (novoCliente.nome) {
      try {
        setIsLoading(true)
        setError(null)

        // Gerar um UUID para o novo cliente
        const clienteId = generateUUID()

        // Obter o próximo código sequencial
        const codigo = await obterProximoCodigoCliente()

        // Verificar se o código foi gerado corretamente
        if (!codigo || codigo === "0NaN") {
          throw new Error("Erro ao gerar código do cliente. Por favor, tente novamente.")
        }

        // Inserir no Supabase com dados em maiúsculas
        const { data, error } = await supabase
          .from("clientes")
          .insert({
            id: clienteId,
            codigo,
            nome: novoCliente.nome.toUpperCase(),
            cnpj: novoCliente.cnpj ? novoCliente.cnpj.toUpperCase() : null,
            endereco: novoCliente.endereco ? novoCliente.endereco.toUpperCase() : null,
            telefone: novoCliente.telefone ? novoCliente.telefone.toUpperCase() : null,
            email: novoCliente.email ? novoCliente.email.toUpperCase() : null,
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

  // Remover cliente
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

  // Funções de edição
  const iniciarEdicao = (cliente: Cliente) => {
    setEditandoId(cliente.id)
    setClienteEditando({ ...cliente })
  }

  const cancelarEdicao = () => {
    setEditandoId(null)
    setClienteEditando(null)
  }

  // Modificar o método salvarEdicao para converter para maiúsculas
  const salvarEdicao = async () => {
    if (clienteEditando) {
      try {
        setIsLoading(true)
        setError(null)

        // Atualizar no Supabase com dados em maiúsculas
        const { error } = await supabase
          .from("clientes")
          .update({
            nome: clienteEditando.nome.toUpperCase(),
            cnpj: clienteEditando.cnpj ? clienteEditando.cnpj.toUpperCase() : null,
            endereco: clienteEditando.endereco ? clienteEditando.endereco.toUpperCase() : null,
            telefone: clienteEditando.telefone ? clienteEditando.telefone.toUpperCase() : null,
            email: clienteEditando.email ? clienteEditando.email.toUpperCase() : null,
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

  // Filtrar e ordenar clientes
  const clientesFiltradosEOrdenados = clientes
    .filter(
      (cliente) =>
        cliente.nome.toLowerCase().includes(filtro.toLowerCase()) ||
        cliente.codigo.toLowerCase().includes(filtro.toLowerCase()) ||
        cliente.cnpj.toLowerCase().includes(filtro.toLowerCase()) ||
        cliente.email.toLowerCase().includes(filtro.toLowerCase()) ||
        cliente.telefone.toLowerCase().includes(filtro.toLowerCase()),
    )
    .sort((a, b) => {
      if (!sortField || !sortDirection) return 0

      // Função auxiliar para comparação de strings
      const compareStrings = (strA: string, strB: string) => {
        return sortDirection === "asc"
          ? strA.localeCompare(strB, "pt-BR", { sensitivity: "base" })
          : strB.localeCompare(strA, "pt-BR", { sensitivity: "base" })
      }

      // Ordenar com base no campo selecionado
      switch (sortField) {
        case "codigo":
          return compareStrings(a.codigo, b.codigo)
        case "nome":
          return compareStrings(a.nome, b.nome)
        case "cnpj":
          return compareStrings(a.cnpj, b.cnpj)
        case "telefone":
          return compareStrings(a.telefone, b.telefone)
        case "email":
          return compareStrings(a.email, b.email)
        default:
          return 0
      }
    })

  // Componente para o ícone de ordenação
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    if (sortDirection === "asc") return <ChevronUp className="ml-1 h-4 w-4" />
    return <ChevronDown className="ml-1 h-4 w-4" />
  }

  // Componente para o cabeçalho ordenável
  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead
      className={`cursor-pointer hover:bg-muted/60 ${field === "cnpj" || field === "telefone" ? "hidden md:table-cell" : field === "email" || field === "contato" ? "hidden lg:table-cell" : ""}`}
      onClick={() => toggleSort(field)}
    >
      <div className="flex items-center">
        {children}
        <SortIcon field={field} />
      </div>
    </TableHead>
  )

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

      {/* Barra de pesquisa */}
      <div className="flex justify-between items-center gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Pesquisar clientes..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="pl-10 pr-4 py-2 w-full"
          />
        </div>
        <Button
          onClick={() => setMostrarFormulario(true)}
          className="bg-primary hover:bg-primary-dark text-white transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" /> Novo Cliente
        </Button>
        <Button
          onClick={async () => {
            setAtualizandoCodigos(true)
            const resultado = await atualizarCodigosClientesExistentes()
            if (resultado.success) {
              // Recarregar dados
              window.location.reload()
            }
            setAtualizandoCodigos(false)
          }}
          variant="outline"
          className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
          disabled={atualizandoCodigos}
        >
          <FileText className="h-4 w-4 mr-2" />
          {atualizandoCodigos ? "Atualizando..." : "Atualizar Códigos"}
        </Button>
      </div>

      {/* Tabela de clientes com ordenação */}
      <div className="border rounded-md shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <SortableHeader field="codigo">Código</SortableHeader>
              <SortableHeader field="nome">Nome</SortableHeader>
              <SortableHeader field="cnpj">CNPJ</SortableHeader>
              <SortableHeader field="telefone">Telefone</SortableHeader>
              <SortableHeader field="email">Email</SortableHeader>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && clientesFiltradosEOrdenados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  Carregando clientes...
                </TableCell>
              </TableRow>
            ) : clientesFiltradosEOrdenados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            ) : (
              clientesFiltradosEOrdenados.map((cliente) => {
                // Garantir que o cliente tem todas as propriedades necessárias
                const clienteSeguro = {
                  id: cliente.id || "",
                  codigo: cliente.codigo || "",
                  nome: cliente.nome || "",
                  cnpj: cliente.cnpj || "",
                  endereco: cliente.endereco || "",
                  telefone: cliente.telefone || "",
                  email: cliente.email || "",
                  contato: cliente.contato || "",
                }

                return (
                  <TableRow key={clienteSeguro.id} className="hover:bg-muted/30">
                    {editandoId === cliente.id && clienteEditando ? (
                      <TableCell colSpan={7}>
                        <div className="p-4 space-y-4 bg-accent/50 rounded-md">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label
                                htmlFor={`edit-codigo-${cliente.id}`}
                                className="text-primary flex items-center gap-2"
                              >
                                <FileText className="h-4 w-4" />
                                Código
                              </Label>
                              <Input
                                id={`edit-codigo-${cliente.id}`}
                                value={clienteEditando.codigo}
                                className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                                disabled={true}
                              />
                            </div>
                            <div>
                              <Label
                                htmlFor={`edit-nome-${cliente.id}`}
                                className="text-primary flex items-center gap-2"
                              >
                                <Building className="h-4 w-4" />
                                Nome Empresa
                              </Label>
                              <Input
                                id={`edit-nome-${cliente.id}`}
                                value={clienteEditando.nome}
                                onChange={(e) =>
                                  setClienteEditando({
                                    ...clienteEditando,
                                    nome: e.target.value.toUpperCase(),
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
                                  cnpj: e.target.value.toUpperCase(),
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
                                  endereco: e.target.value.toUpperCase(),
                                })
                              }
                              className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label
                                htmlFor={`edit-telefone-${cliente.id}`}
                                className="text-primary flex items-center gap-2"
                              >
                                <Phone className="h-4 w-4" />
                                Telefone
                              </Label>
                              <Input
                                id={`edit-telefone-${cliente.id}`}
                                value={clienteEditando.telefone}
                                onChange={(e) =>
                                  setClienteEditando({
                                    ...clienteEditando,
                                    telefone: e.target.value.toUpperCase(),
                                  })
                                }
                                className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                              />
                            </div>
                            <div>
                              <Label
                                htmlFor={`edit-email-${cliente.id}`}
                                className="text-primary flex items-center gap-2"
                              >
                                <Mail className="h-4 w-4" />
                                Email
                              </Label>
                              <Input
                                id={`edit-email-${cliente.id}`}
                                value={clienteEditando.email}
                                onChange={(e) =>
                                  setClienteEditando({
                                    ...clienteEditando,
                                    email: e.target.value.toUpperCase(),
                                  })
                                }
                                className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={cancelarEdicao}
                              className="text-gray-500 hover:text-gray-700"
                            >
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
                      </TableCell>
                    ) : (
                      <>
                        <TableCell className="font-medium">{cliente.codigo || "-"}</TableCell>
                        <TableCell>{clienteSeguro.nome}</TableCell>
                        <TableCell className="hidden md:table-cell">{clienteSeguro.cnpj}</TableCell>
                        <TableCell className="hidden md:table-cell">{clienteSeguro.telefone}</TableCell>
                        <TableCell className="hidden lg:table-cell">{clienteSeguro.email}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
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
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Botão para mostrar/esconder o formulário */}

      {/* Formulário para adicionar novo cliente - visível apenas quando mostrarFormulario for true */}
      {mostrarFormulario && (
        <Card className="overflow-hidden shadow-sm border-0 border-t-4 border-t-secondary mt-4 animate-in slide-in-from-top duration-300">
          <CardContent className="p-4">
            <h4 className="font-medium mb-4 text-secondary flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Novo Cliente
            </h4>
            <div className="space-y-4">
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
                    disabled={true}
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
                    onChange={(e) => setNovoCliente({ ...novoCliente, nome: e.target.value.toUpperCase() })}
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
                  onChange={(e) => setNovoCliente({ ...novoCliente, cnpj: e.target.value.toUpperCase() })}
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
                  onChange={(e) => setNovoCliente({ ...novoCliente, endereco: e.target.value.toUpperCase() })}
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
                    onChange={(e) => setNovoCliente({ ...novoCliente, telefone: e.target.value.toUpperCase() })}
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
                    onChange={(e) => setNovoCliente({ ...novoCliente, email: e.target.value.toUpperCase() })}
                    className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setMostrarFormulario(false)} className="flex-1">
                  <X className="h-4 w-4 mr-2" /> Cancelar
                </Button>
                <Button
                  onClick={() => {
                    handleAdicionarCliente()
                    if (!isLoading) setMostrarFormulario(false)
                  }}
                  className="flex-1 bg-secondary hover:bg-secondary-dark text-white transition-colors"
                  disabled={isLoading || !novoCliente.nome}
                >
                  <Plus className="h-4 w-4 mr-2" /> {isLoading ? "Adicionando..." : "Adicionar Cliente"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
