"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { FileText, Search, Calendar, Building, Loader2, PlusCircle, Eye, Trash2 } from "lucide-react"
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
  const [statusFilter, setStatusFilter] = useState<string>("todos")
  const [error, setError] = useState<string | null>(null)

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
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Erro ao carregar orçamentos:", error)
        setError(`Erro ao carregar orçamentos: ${error.message}`)
        return
      }

      // Converter para o formato da aplicação
      const orcamentosFormatados = data.map((orcamento) => {
        let itensParseados = []

        // Verificar se o campo itens existe e não é nulo
        if (orcamento.itens) {
          try {
            // Verificar se é uma string antes de fazer o parse
            if (typeof orcamento.itens === "string") {
              // Verificar se a string não está vazia
              if (orcamento.itens.trim() !== "") {
                itensParseados = JSON.parse(orcamento.itens)
              }
            } else {
              // Se já for um objeto, usar diretamente
              itensParseados = orcamento.itens
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
          status: orcamento.status || "proposta", // Definir "proposta" como padrão se não houver status
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

    return orcamento.itens.reduce((total, item) => {
      return total + (item.quantidade || 0) * (item.valorUnitario || 0)
    }, 0)
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
      resultado = resultado.filter((orcamento) => orcamento.status === statusFilter)
    }

    return resultado
  }

  const formatarData = (dataString?: string) => {
    if (!dataString) return ""
    const data = new Date(dataString)
    return data.toLocaleDateString("pt-BR")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-primary flex items-center gap-2">
          <span className="bg-primary text-white p-1 rounded-md text-xs">ORÇAMENTOS</span>
          Orçamentos Salvos
        </h3>
        <Button onClick={onNovoOrcamento} className="bg-secondary hover:bg-secondary-dark text-white">
          <PlusCircle className="h-4 w-4 mr-2" /> Novo Orçamento
        </Button>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por número, cliente ou CNPJ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={statusFilter === "todos" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("todos")}
            className={statusFilter === "todos" ? "bg-primary text-white" : ""}
          >
            Todos
          </Button>
          <Button
            variant={statusFilter === "proposta" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("proposta")}
            className={
              statusFilter === "proposta" ? "bg-blue-500 text-white" : "text-blue-500 border-blue-500 hover:bg-blue-50"
            }
          >
            Proposta
          </Button>
          <Button
            variant={statusFilter === "execucao" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("execucao")}
            className={
              statusFilter === "execucao"
                ? "bg-amber-500 text-white"
                : "text-amber-500 border-amber-500 hover:bg-amber-50"
            }
          >
            Em Execução
          </Button>
          <Button
            variant={statusFilter === "finalizado" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("finalizado")}
            className={
              statusFilter === "finalizado"
                ? "bg-green-500 text-white"
                : "text-green-500 border-green-500 hover:bg-green-50"
            }
          >
            Finalizado
          </Button>
        </div>
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

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtrarOrcamentos().length > 0 ? (
          filtrarOrcamentos().map((orcamento) => (
            <Card key={orcamento.id} className="overflow-hidden shadow-sm border-0 hover:shadow-md transition-shadow">
              <CardContent className="p-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-2">
                    <div className="bg-primary text-white p-2 rounded-full">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{orcamento.numero}</h4>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                        <Calendar className="h-3 w-3" />
                        <span>{formatarData(orcamento.data)}</span>
                        <span>•</span>
                        <Building className="h-3 w-3" />
                        <span>{orcamento.cliente?.nome || "Cliente não especificado"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium text-primary px-2 py-1 bg-primary/5 rounded-md">
                      R$ {calcularTotal(orcamento).toFixed(2)}
                    </div>
                    <select
                      value={orcamento.status || "proposta"}
                      onChange={(e) => atualizarStatusOrcamento(orcamento.id!, e.target.value)}
                      className={`text-xs font-medium px-2 py-1 rounded-full border ${
                        orcamento.status === "proposta"
                          ? "bg-blue-100 text-blue-700 border-blue-300"
                          : orcamento.status === "execucao"
                            ? "bg-amber-100 text-amber-700 border-amber-300"
                            : orcamento.status === "finalizado"
                              ? "bg-green-100 text-green-700 border-green-300"
                              : "bg-gray-100 text-gray-700 border-gray-300"
                      }`}
                    >
                      <option value="proposta">Proposta</option>
                      <option value="execucao">Em Execução</option>
                      <option value="finalizado">Finalizado</option>
                    </select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => orcamento.id && onSelectOrcamento(orcamento.id)}
                      className="text-primary border-primary hover:bg-primary/10"
                    >
                      <Eye className="h-4 w-4 mr-1" /> Ver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
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
                      className="text-destructive border-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {orcamento.cliente?.cnpj && (
                  <div className="mt-1 ml-8 text-xs text-gray-500">CNPJ: {orcamento.cliente.cnpj}</div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
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
        )}
      </div>
    </div>
  )
}
