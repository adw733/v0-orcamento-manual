"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  FileText,
  Search,
  Calendar,
  Building,
  Loader2,
  PlusCircle,
  Eye,
  Trash2,
  ChevronUp,
  ChevronDown,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { Orcamento } from "@/types/types"

interface ListaOrcamentosProps {
  onSelectOrcamento: (orcamentoId: string) => void
  onNovoOrcamento: () => void
  onDeleteOrcamento: (orcamentoId: string) => Promise<void>
  onUpdateStatus?: (orcamentoId: string, status: string) => Promise<void>
  reloadRef?: React.MutableRefObject<(() => Promise<void>) | null>
}

export default function ListaOrcamentos({
  onSelectOrcamento,
  onNovoOrcamento,
  onDeleteOrcamento,
  reloadRef,
  onUpdateStatus,
}: ListaOrcamentosProps) {
  const [orcamentos, setOrcamentos] = useState<Partial<Orcamento>[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("4")
  const [error, setError] = useState<string | null>(null)

  // Estados para ordenação
  const [ordenacao, setOrdenacao] = useState<{ campo: string; direcao: "asc" | "desc" }>({
    campo: "numero",
    direcao: "desc",
  })

  // Expor a função de recarregar para o componente pai
  useEffect(() => {
    if (reloadRef) {
      reloadRef.current = carregarOrcamentos
    }
  }, [reloadRef])

  useEffect(() => {
    carregarOrcamentos()
  }, [])

  const carregarOrcamentos = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from("orcamentos")
        .select("id, numero, data, cliente:cliente_id(nome, cnpj), itens, created_at, updated_at, status")
        .is("deleted_at", null) // Adicionar esta linha para filtrar orçamentos excluídos
        .order("numero", { ascending: false })

      if (error) {
        console.error("Erro ao carregar orçamentos:", error)
        setError(`Erro ao carregar orçamentos: ${error.message}`)
        return
      }

      // Converter para o formato da aplicação
      const orcamentosFormatados = data.map((orcamento) => {
        let itensParseados = []
        let valorFrete = 0
        let nomeContato = ""
        let telefoneContato = ""

        // Verificar se o campo itens existe e não é nulo
        if (orcamento.itens) {
          try {
            // Verificar se é uma string antes de fazer o parse
            if (typeof orcamento.itens === "string") {
              // Verificar se a string não está vazia
              if (orcamento.itens.trim() !== "") {
                const itensObj = JSON.parse(orcamento.itens)

                // Verificar se o JSON tem a nova estrutura (com metadados)
                if (itensObj.items && Array.isArray(itensObj.items)) {
                  itensParseados = itensObj.items
                  // Extrair o valor do frete e informações de contato dos metadados
                  if (itensObj.metadados) {
                    if (typeof itensObj.metadados.valorFrete === "number") {
                      valorFrete = itensObj.metadados.valorFrete
                    }
                    nomeContato = itensObj.metadados.nomeContato || ""
                    telefoneContato = itensObj.metadados.telefoneContato || ""
                  }
                } else if (Array.isArray(itensObj)) {
                  // Formato antigo (array simples)
                  itensParseados = itensObj
                }
              }
            } else if (typeof orcamento.itens === "object") {
              // Se já for um objeto, verificar a estrutura
              if (orcamento.itens.items && Array.isArray(orcamento.itens.items)) {
                itensParseados = orcamento.itens.items
                // Extrair o valor do frete e informações de contato dos metadados
                if (orcamento.itens.metadados) {
                  if (typeof orcamento.itens.metadados.valorFrete === "number") {
                    valorFrete = orcamento.itens.metadados.valorFrete
                  }
                  nomeContato = orcamento.itens.metadados.nomeContato || ""
                  telefoneContato = orcamento.itens.metadados.telefoneContato || ""
                }
              } else if (Array.isArray(orcamento.itens)) {
                // Formato antigo (array simples)
                itensParseados = orcamento.itens
              }
            }
          } catch (parseError) {
            console.error(`Erro ao fazer parse do JSON para o orçamento ${orcamento.id}:`, parseError)
            // Continuar com um array vazio em caso de erro
          }
        }

        return {
          id: orcamento.id,
          numero: orcamento.numero,
          data: orcamento.data,
          cliente: orcamento.cliente
            ? {
                id: orcamento.cliente.id,
                nome: orcamento.cliente.nome,
                cnpj: orcamento.cliente.cnpj || "",
              }
            : null,
          itens: Array.isArray(itensParseados) ? itensParseados : [],
          created_at: orcamento.created_at,
          updated_at: orcamento.updated_at,
          status: orcamento.status ? mapearStatusAntigo(orcamento.status) : "5", // Converter status antigos e definir "5" (Proposta) como padrão
          valorFrete: valorFrete, // Adicionar o valor do frete
          nomeContato: nomeContato, // Adicionar o nome do contato
          telefoneContato: telefoneContato, // Adicionar o telefone do contato
        }
      })

      setOrcamentos(orcamentosFormatados)
    } catch (error) {
      console.error("Erro ao carregar orçamentos:", error)
      setError(`Erro ao carregar orçamentos: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
    } finally {
      setIsLoading(false)
    }
  }

  const calcularTotal = (orcamento: Partial<Orcamento>) => {
    if (!orcamento.itens || !Array.isArray(orcamento.itens)) return 0

    // Calcular o total dos itens
    const totalItens = orcamento.itens.reduce((total, item) => {
      return total + (item.quantidade || 0) * (item.valorUnitario || 0)
    }, 0)

    // Adicionar o valor do frete, se existir
    const valorFrete = orcamento.valorFrete || 0

    // Retornar o total (itens + frete)
    return totalItens + valorFrete
  }

  const atualizarStatusOrcamento = async (orcamentoId: string, novoStatus: string) => {
    try {
      const { error } = await supabase.from("orcamentos").update({ status: novoStatus }).eq("id", orcamentoId)

      if (error) {
        console.error("Erro ao atualizar status:", error)
        return
      }

      // Atualizar o status localmente
      setOrcamentos(orcamentos.map((orc) => (orc.id === orcamentoId ? { ...orc, status: novoStatus } : orc)))

      // Chamar a função de callback se existir
      if (onUpdateStatus) {
        await onUpdateStatus(orcamentoId, novoStatus)
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
    }
  }

  // Função para alternar a ordenação
  const alternarOrdenacao = (campo: string) => {
    if (ordenacao.campo === campo) {
      setOrdenacao({
        campo,
        direcao: ordenacao.direcao === "asc" ? "desc" : "asc",
      })
    } else {
      setOrdenacao({
        campo,
        direcao: "asc",
      })
    }
  }

  const filtrarOrcamentos = () => {
    let resultado = orcamentos

    // Filtrar por termo de busca
    if (searchTerm) {
      const termLower = searchTerm.toLowerCase()
      resultado = resultado.filter(
        (orcamento) =>
          orcamento.numero?.toLowerCase().includes(termLower) ||
          orcamento.cliente?.nome.toLowerCase().includes(termLower) ||
          orcamento.cliente?.cnpj.toLowerCase().includes(termLower),
      )
    }

    // Filtrar por status
    if (statusFilter !== "todos") {
      resultado = resultado.filter((orcamento) => {
        // Mapear status antigos para novos códigos numéricos
        const statusMapeado = mapearStatusAntigo(orcamento.status || "")
        return statusMapeado === statusFilter
      })
    }

    // Ordenar os resultados
    resultado = resultado.sort((a, b) => {
      let valorA, valorB

      switch (ordenacao.campo) {
        case "numero":
          // Extrair apenas os números para comparação numérica
          valorA = Number.parseInt(extrairNumeroOrcamento(a.numero || "0"), 10) || 0
          valorB = Number.parseInt(extrairNumeroOrcamento(b.numero || "0"), 10) || 0
          break
        case "data":
          valorA = a.data || ""
          valorB = b.data || ""
          break
        case "cliente":
          valorA = a.cliente?.nome || ""
          valorB = b.cliente?.nome || ""
          break
        case "valor":
          valorA = calcularTotal(a)
          valorB = calcularTotal(b)
          break
        case "status":
          valorA = a.status || ""
          valorB = b.status || ""
          break
        case "created_at":
        default:
          valorA = a.created_at || ""
          valorB = b.created_at || ""
      }

      if (ordenacao.campo === "numero" || ordenacao.campo === "valor") {
        // Comparação numérica
        return ordenacao.direcao === "asc"
          ? (valorA as number) - (valorB as number)
          : (valorB as number) - (valorA as number)
      } else if (typeof valorA === "string" && typeof valorB === "string") {
        // Comparação de strings
        return ordenacao.direcao === "asc" ? valorA.localeCompare(valorB) : valorB.localeCompare(valorA)
      } else {
        // Fallback para outros tipos
        return ordenacao.direcao === "asc"
          ? (valorA as number) - (valorB as number)
          : (valorB as number) - (valorA as number)
      }
    })

    return resultado
  }

  const formatarData = (dataString?: string) => {
    if (!dataString) return ""
    // Adicionar o horário para evitar problemas de fuso horário
    const data = new Date(`${dataString}T12:00:00`)
    return data.toLocaleDateString("pt-BR")
  }

  // Modificar a função getStatusClassName para incluir os novos status
  const getStatusClassName = (status: string) => {
    switch (status) {
      case "5":
      case "proposta":
        return "bg-blue-100 text-blue-700 border-blue-300"
      case "4":
      case "execucao":
        return "bg-amber-100 text-amber-700 border-amber-300"
      case "1":
      case "finalizado":
        return "bg-green-100 text-green-700 border-green-300"
      case "2":
      case "entregue":
        return "bg-purple-100 text-purple-700 border-purple-300"
      case "3":
      case "cobranca":
        return "bg-red-100 text-red-700 border-red-300"
      default:
        return "bg-gray-100 text-gray-700 border-gray-300"
    }
  }

  // Função para mapear status antigos para novos códigos numéricos
  const mapearStatusAntigo = (status: string): string => {
    switch (status) {
      case "proposta":
        return "5"
      case "execucao":
        return "4"
      case "finalizado":
        return "1"
      default:
        return status
    }
  }

  const extrairNumeroOrcamento = (numeroCompleto?: string) => {
    if (!numeroCompleto) return ""
    // Extrair apenas os dígitos numéricos do início da string
    const match = numeroCompleto.match(/^\d+/)
    return match ? match[0] : numeroCompleto
  }

  const formatarDescricaoPedido = (numeroCompleto: string, nomeContato?: string) => {
    // Extrair as partes do formato "0129 - CAMISA SOCIAL MASCULINA MANGA LONGA MIZU CIMENTOS - WILLIAN"
    const partes = numeroCompleto.split(" - ")
    if (partes.length >= 2) {
      const numero = partes[0] // "0129"

      // Extrair a empresa do nome do produto (assumindo que são as últimas 2-3 palavras)
      const produtoParts = partes[1].split(" ")
      let empresa = ""

      // Se o produto tem pelo menos 3 palavras, pegamos as últimas 2-3 como empresa
      if (produtoParts.length >= 3) {
        // Pegar as últimas 2 ou 3 palavras como empresa
        const palavrasEmpresa = produtoParts.slice(-Math.min(3, Math.floor(produtoParts.length / 2)))
        empresa = palavrasEmpresa.join(" ")
      } else {
        empresa = partes[1] // Se for curto, usar todo o texto
      }

      // Adicionar o nome do contato se disponível
      return nomeContato ? `${numero} - ${empresa} - ${nomeContato}` : `${numero} - ${empresa}`
    }
    return numeroCompleto
  }

  // Função simplificada para resumir produtos sem pluralização e sem quantidades
  const resumirProdutosDoOrcamento = (orcamento: Partial<Orcamento>): string => {
    if (!orcamento.itens || !Array.isArray(orcamento.itens) || orcamento.itens.length === 0) return ""

    // Extrair apenas as categorias principais dos produtos
    const categoriasProdutos = new Set<string>()

    orcamento.itens.forEach((item) => {
      // Obter o nome do produto de qualquer fonte disponível
      let nomeProduto = ""
      if (item.produtoNome) {
        nomeProduto = item.produtoNome
      } else if (item.descricao) {
        const partes = item.descricao.split(" - ")
        if (partes.length >= 2) {
          nomeProduto = partes[1]
        } else {
          nomeProduto = item.descricao
        }
      } else if (item.produto && typeof item.produto === "object" && item.produto.nome) {
        nomeProduto = item.produto.nome
      }

      if (!nomeProduto) return

      // Extrair apenas a categoria principal (primeira ou duas primeiras palavras)
      const palavras = nomeProduto.split(" ")
      let categoria = ""

      // Lista de tipos de vestuário comuns
      const tiposVestuario = [
        "CAMISA",
        "CAMISETA",
        "CALÇA",
        "JAQUETA",
        "COLETE",
        "JALECO",
        "MACACÃO",
        "UNIFORME",
        "BONÉ",
        "CHAPÉU",
        "AVENTAL",
      ]

      // Se a primeira palavra for um tipo de vestuário conhecido
      if (palavras.length > 0 && tiposVestuario.includes(palavras[0])) {
        // Qualificadores comuns que podem ser incluídos
        const qualificadores = ["SOCIAL", "POLO", "OPERACIONAL", "EXECUTIVA"]

        if (palavras.length > 1 && qualificadores.includes(palavras[1])) {
          // Se a segunda palavra for um qualificador importante, incluí-la
          categoria = `${palavras[0]} ${palavras[1]}`
        } else {
          // Caso contrário, usar apenas o tipo de vestuário
          categoria = palavras[0]
        }
      } else if (palavras.length > 0) {
        // Para outros tipos de produtos, usar apenas a primeira palavra
        categoria = palavras[0]
      }

      // Adicionar a categoria ao conjunto (sem pluralização)
      if (categoria) {
        categoriasProdutos.add(categoria)
      }
    })

    // Se não encontrou categorias
    if (categoriasProdutos.size === 0) return ""

    // Converter o conjunto em array e limitar a 5 categorias para não ficar muito longo
    const categoriasArray = Array.from(categoriasProdutos).slice(0, 5)

    // Se houver mais categorias além das 5 principais
    if (categoriasProdutos.size > 5) {
      categoriasArray.push("OUTROS")
    }

    // Juntar as categorias com " / "
    return categoriasArray.join(" / ")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-primary flex items-center gap-2">
          <span className="bg-primary text-white p-1 rounded-md text-xs">ORÇAMENTOS</span>
          Orçamentos Salvos
        </h3>
        <span className="text-sm text-gray-500">{orcamentos.length} orçamentos cadastrados</span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md">
          <p className="text-sm">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={carregarOrcamentos}
            className="mt-2 text-red-700 border-red-300 hover:bg-red-100"
          >
            Tentar novamente
          </Button>
        </div>
      )}

      <div className="flex justify-between items-center gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por número, cliente ou CNPJ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full"
          />
        </div>
        <Button onClick={onNovoOrcamento} className="bg-primary hover:bg-primary-dark text-white transition-colors">
          <PlusCircle className="h-4 w-4 mr-2" /> Novo Orçamento
        </Button>
      </div>

      {/* Modificar os botões de filtro de status */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          variant={statusFilter === "todos" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("todos")}
          className={statusFilter === "todos" ? "bg-primary text-white" : ""}
        >
          Todos
        </Button>
        <Button
          variant={statusFilter === "5" || statusFilter === "proposta" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("5")}
          className={
            statusFilter === "5" || statusFilter === "proposta"
              ? "bg-blue-500 text-white"
              : "text-blue-500 border-blue-500 hover:bg-blue-50"
          }
        >
          5 - Proposta
        </Button>
        <Button
          variant={statusFilter === "4" || statusFilter === "execucao" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("4")}
          className={
            statusFilter === "4" || statusFilter === "execucao"
              ? "bg-amber-500 text-white"
              : "text-amber-500 border-amber-500 hover:bg-amber-50"
          }
        >
          4 - Execução
        </Button>
        <Button
          variant={statusFilter === "3" || statusFilter === "cobranca" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("3")}
          className={
            statusFilter === "3" || statusFilter === "cobranca"
              ? "bg-red-500 text-white"
              : "text-red-500 border-red-500 hover:bg-red-50"
          }
        >
          3 - Emitir Cobrança
        </Button>
        <Button
          variant={statusFilter === "2" || statusFilter === "entregue" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("2")}
          className={
            statusFilter === "2" || statusFilter === "entregue"
              ? "bg-purple-500 text-white"
              : "text-purple-500 border-purple-500 hover:bg-purple-50"
          }
        >
          2 - Entregue
        </Button>
        <Button
          variant={statusFilter === "1" || statusFilter === "finalizado" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("1")}
          className={
            statusFilter === "1" || statusFilter === "finalizado"
              ? "bg-green-500 text-white"
              : "text-green-500 border-green-500 hover:bg-green-50"
          }
        >
          1 - Finalizada
        </Button>
      </div>

      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead
                  className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer hover:bg-muted"
                  onClick={() => alternarOrdenacao("numero")}
                >
                  <div className="flex items-center">
                    Número
                    {ordenacao.campo === "numero" &&
                      (ordenacao.direcao === "asc" ? (
                        <ChevronUp className="ml-1 h-4 w-4" />
                      ) : (
                        <ChevronDown className="ml-1 h-4 w-4" />
                      ))}
                  </div>
                </TableHead>
                <TableHead
                  className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer hover:bg-muted"
                  onClick={() => alternarOrdenacao("data")}
                >
                  <div className="flex items-center">
                    Data
                    {ordenacao.campo === "data" &&
                      (ordenacao.direcao === "asc" ? (
                        <ChevronUp className="ml-1 h-4 w-4" />
                      ) : (
                        <ChevronDown className="ml-1 h-4 w-4" />
                      ))}
                  </div>
                </TableHead>
                <TableHead
                  className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer hover:bg-muted"
                  onClick={() => alternarOrdenacao("cliente")}
                >
                  <div className="flex items-center">
                    Cliente / Contato
                    {ordenacao.campo === "cliente" &&
                      (ordenacao.direcao === "asc" ? (
                        <ChevronUp className="ml-1 h-4 w-4" />
                      ) : (
                        <ChevronDown className="ml-1 h-4 w-4" />
                      ))}
                  </div>
                </TableHead>
                <TableHead className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">
                  CNPJ
                </TableHead>
                <TableHead
                  className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer hover:bg-muted"
                  onClick={() => alternarOrdenacao("valor")}
                >
                  <div className="flex items-center">
                    Valor Total
                    {ordenacao.campo === "valor" &&
                      (ordenacao.direcao === "asc" ? (
                        <ChevronUp className="ml-1 h-4 w-4" />
                      ) : (
                        <ChevronDown className="ml-1 h-4 w-4" />
                      ))}
                  </div>
                </TableHead>
                <TableHead
                  className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer hover:bg-muted"
                  onClick={() => alternarOrdenacao("status")}
                >
                  <div className="flex items-center">
                    Status
                    {ordenacao.campo === "status" &&
                      (ordenacao.direcao === "asc" ? (
                        <ChevronUp className="ml-1 h-4 w-4" />
                      ) : (
                        <ChevronDown className="ml-1 h-4 w-4" />
                      ))}
                  </div>
                </TableHead>
                <TableHead className="px-4 py-3 text-center font-medium text-muted-foreground">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="px-4 py-4 text-center text-muted-foreground">
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : filtrarOrcamentos().length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="px-4 py-4 text-center text-muted-foreground">
                    <div className="text-center py-8 bg-accent/30 rounded-lg">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <h4 className="text-lg font-medium text-gray-600">Nenhum orçamento encontrado</h4>
                      <p className="text-gray-500 mt-1">
                        {searchTerm ? "Tente uma busca diferente" : "Crie seu primeiro orçamento"}
                      </p>
                      {!searchTerm && (
                        <Button onClick={onNovoOrcamento} className="mt-4 bg-primary hover:bg-primary-dark text-white">
                          <PlusCircle className="h-4 w-4 mr-2" /> Criar Orçamento
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtrarOrcamentos().map((orcamento) => (
                  <TableRow key={orcamento.id} className="border-t hover:bg-muted/50">
                    <TableCell className="px-4 py-3 align-middle">
                      <span className="font-medium text-primary">
                        {extrairNumeroOrcamento(orcamento.numero)} -{" "}
                        {orcamento.cliente?.nome?.toUpperCase() || "SEM EMPRESA"}
                        {orcamento.nomeContato ? ` - ${orcamento.nomeContato.toUpperCase()}` : ""}
                      </span>
                      <div className="text-xs text-gray-500 mt-0.5">{resumirProdutosDoOrcamento(orcamento)}</div>
                    </TableCell>
                    <TableCell className="px-4 py-3 align-middle">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-gray-500" />
                        <span>{formatarData(orcamento.data)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 align-middle">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                          <Building className="h-3 w-3 text-gray-500" />
                          <span>{orcamento.cliente?.nome || "Cliente não especificado"}</span>
                        </div>
                        {orcamento.nomeContato && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-gray-600">
                            <span className="font-medium">Contato:</span> {orcamento.nomeContato}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 align-middle hidden md:table-cell">
                      {orcamento.cliente?.cnpj || "-"}
                    </TableCell>
                    <TableCell className="px-4 py-3 align-middle">
                      <span className="font-medium">R$ {calcularTotal(orcamento).toFixed(2)}</span>
                    </TableCell>
                    <TableCell className="px-4 py-3 align-middle">
                      {/* Modificar o select de status na tabela */}
                      <select
                        value={orcamento.status || "5"}
                        onChange={(e) => atualizarStatusOrcamento(orcamento.id!, e.target.value)}
                        className={`text-xs font-medium px-2 py-1 rounded-full border ${getStatusClassName(orcamento.status || "5")}`}
                      >
                        <option value="5">5 - Proposta</option>
                        <option value="4">4 - Execução</option>
                        <option value="3">3 - Emitir Cobrança</option>
                        <option value="2">2 - Entregue</option>
                        <option value="1">1 - Finalizada</option>
                      </select>
                    </TableCell>
                    <TableCell className="px-4 py-3 align-middle">
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => orcamento.id && onSelectOrcamento(orcamento.id)}
                          className="h-8 w-8 text-primary hover:text-primary-dark hover:bg-primary/10"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (orcamento.id) {
                              if (
                                window.confirm(
                                  "Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita.",
                                )
                              ) {
                                onDeleteOrcamento(orcamento.id)
                              }
                            }
                          }}
                          className="h-8 w-8 text-gray-500 hover:text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
