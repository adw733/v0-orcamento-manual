"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Trash2, Eye, Plus } from "lucide-react"
import { orcamentoService } from "@/services/orcamento-service"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import type { Orcamento } from "@/types/types"

interface GerenciadorOrcamentosProps {
  carregarOrcamento: (id: string) => Promise<void>
  novoOrcamento: () => void
  orcamentoAtualId: string | null
}

export default function GerenciadorOrcamentos({
  carregarOrcamento,
  novoOrcamento,
  orcamentoAtualId,
}: GerenciadorOrcamentosProps) {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    carregarOrcamentos()
  }, [])

  const carregarOrcamentos = async () => {
    setIsLoading(true)
    try {
      const orcamentosCarregados = await orcamentoService.getAll()
      setOrcamentos(orcamentosCarregados)
    } catch (error) {
      console.error("Erro ao carregar orçamentos:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os orçamentos.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoverOrcamento = async (id: string) => {
    if (confirm("Tem certeza que deseja remover este orçamento?")) {
      setIsDeleting(id)
      try {
        await orcamentoService.delete(id)
        setOrcamentos(orcamentos.filter((orcamento) => orcamento.id !== id))
        toast({
          title: "Sucesso",
          description: "Orçamento removido com sucesso!",
        })

        // Se o orçamento atual foi removido, criar um novo
        if (orcamentoAtualId === id) {
          novoOrcamento()
        }
      } catch (error) {
        console.error("Erro ao remover orçamento:", error)
        toast({
          title: "Erro",
          description: "Não foi possível remover o orçamento.",
          variant: "destructive",
        })
      } finally {
        setIsDeleting(null)
      }
    }
  }

  const formatarData = (dataString: string) => {
    const data = new Date(dataString)
    return data.toLocaleDateString("pt-BR")
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-primary flex items-center gap-2">
            <span className="bg-primary text-white p-1 rounded-md text-xs">ORÇAMENTOS</span>
            Orçamentos Salvos
          </h3>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden shadow-sm border-0">
              <CardContent className="p-0">
                <div className="p-4">
                  <Skeleton className="h-24 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-primary flex items-center gap-2">
          <span className="bg-primary text-white p-1 rounded-md text-xs">ORÇAMENTOS</span>
          Orçamentos Salvos
        </h3>
        <Button onClick={novoOrcamento} className="bg-secondary hover:bg-secondary-dark text-white">
          <Plus className="h-4 w-4 mr-2" /> Novo Orçamento
        </Button>
      </div>

      {orcamentos.length === 0 ? (
        <Card className="overflow-hidden shadow-sm border-0">
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">Nenhum orçamento salvo ainda.</p>
            <Button onClick={novoOrcamento} className="mt-4 bg-secondary hover:bg-secondary-dark text-white">
              <Plus className="h-4 w-4 mr-2" /> Criar Primeiro Orçamento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orcamentos.map((orcamento) => (
            <Card
              key={orcamento.id}
              className={`overflow-hidden shadow-sm border-0 hover:shadow-md transition-shadow ${
                orcamentoAtualId === orcamento.id ? "border-l-4 border-l-primary" : ""
              }`}
            >
              <CardContent className="p-0">
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary text-white p-2 rounded-full">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{orcamento.numero}</h4>
                        <p className="text-sm text-gray-500">Data: {formatarData(orcamento.data)}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Cliente: {orcamento.cliente?.nome || "Sem cliente"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => carregarOrcamento(orcamento.id)}
                        className="h-8 w-8 text-primary hover:text-primary-dark hover:bg-primary/10"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoverOrcamento(orcamento.id)}
                        className="h-8 w-8 text-gray-500 hover:text-red-500 hover:bg-red-50"
                        disabled={isDeleting === orcamento.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 text-sm grid grid-cols-1 md:grid-cols-3 gap-2 bg-accent/50 p-3 rounded-md">
                    <p className="flex items-center gap-2">
                      <span className="text-gray-500">Itens:</span> {orcamento.itens.length}
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-gray-500">Prazo:</span> {orcamento.prazoEntrega}
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-gray-500">Pagamento:</span> {orcamento.condicoesPagamento}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
