"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { FileText, Search, Calendar, Building, DollarSign, Loader2, PlusCircle, Eye, Edit, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { Orcamento } from "@/types/types"

interface ListaOrcamentosProps {
  onSelectOrcamento: (orcamentoId: string) => void
  onNovoOrcamento: () => void
  onDeleteOrcamento: (orcamentoId: string) => void
}

export default function ListaOrcamentos({
  onSelectOrcamento,
  onNovoOrcamento,
  onDeleteOrcamento,
}: ListaOrcamentosProps) {
  const [orcamentos, setOrcamentos] = useState<Partial<Orcamento>[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    carregarOrcamentos()
  }, [])

  const carregarOrcamentos = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from("orcamentos")
        .select("id, numero, data, cliente:cliente_id(nome, cnpj), itens")
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

  const filtrarOrcamentos = () => {
    if (!searchTerm) return orcamentos

    const termLower = searchTerm.toLowerCase()
    return orcamentos.filter(
      (orcamento) =>
        orcamento.numero?.toLowerCase().includes(termLower) ||
        orcamento.cliente?.nome.toLowerCase().includes(termLower) ||
        orcamento.cliente?.cnpj.toLowerCase().includes(termLower),
    )
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

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar por número, cliente ou CNPJ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
        />
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
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary text-white p-2 rounded-full">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{orcamento.numero}</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>{formatarData(orcamento.data)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => orcamento.id && onSelectOrcamento(orcamento.id)}
                      className="text-primary border-primary hover:bg-primary/10"
                    >
                      <Eye className="h-4 w-4 mr-1" /> Visualizar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => orcamento.id && onSelectOrcamento(orcamento.id)}
                      className="text-success border-success hover:bg-success/10"
                    >
                      <Edit className="h-4 w-4 mr-1" /> Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => orcamento.id && onDeleteOrcamento(orcamento.id)}
                      className="text-destructive border-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Excluir
                    </Button>
                  </div>
                </div>
                <div className="mt-3 text-sm grid grid-cols-1 md:grid-cols-3 gap-2 bg-accent/50 p-3 rounded-md">
                  <div>
                    <p className="flex items-center gap-2">
                      <Building className="h-3 w-3 text-gray-500" />
                      <span className="font-medium">{orcamento.cliente?.nome || "Cliente não especificado"}</span>
                    </p>
                    {orcamento.cliente?.cnpj && <p className="text-xs text-gray-500 ml-5">{orcamento.cliente.cnpj}</p>}
                  </div>
                  <div>
                    <p className="flex items-center gap-2">
                      <span className="text-gray-500">Itens:</span>
                      <span className="font-medium">{orcamento.itens?.length || 0}</span>
                    </p>
                  </div>
                  <div>
                    <p className="flex items-center gap-2 font-medium">
                      <DollarSign className="h-3 w-3 text-gray-500" />
                      <span>R$ {calcularTotal(orcamento).toFixed(2)}</span>
                    </p>
                  </div>
                </div>
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
