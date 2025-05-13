"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Loader2, Trash2, RefreshCw } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function LixeiraOrcamentos({ onRestaurarOrcamento, onExcluirPermanentemente, reloadRef }) {
  const [orcamentos, setOrcamentos] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState(null)

  useEffect(() => {
    if (reloadRef) {
      reloadRef.current = carregarOrcamentosExcluidos
    }
  }, [reloadRef])

  useEffect(() => {
    carregarOrcamentosExcluidos()
  }, [])

  const carregarOrcamentosExcluidos = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from("orcamentos")
        .select("id, numero, data, cliente:cliente_id(nome, cnpj)")
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false })

      if (error) throw error
      setOrcamentos(data || [])
    } catch (error) {
      console.error("Erro ao carregar orçamentos excluídos:", error)
      setError(`Erro ao carregar orçamentos excluídos: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-primary">Orçamentos na Lixeira</h3>
        <span className="text-sm text-gray-500">{orcamentos.length} orçamentos na lixeira</span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md">
          <p className="text-sm">{error}</p>
          <Button variant="outline" size="sm" onClick={carregarOrcamentosExcluidos} className="mt-2">
            Tentar novamente
          </Button>
        </div>
      )}

      <div className="flex justify-between items-center gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por número ou cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full"
          />
        </div>
        <Button
          onClick={() => {
            if (window.confirm("Tem certeza que deseja limpar a lixeira? Esta ação não pode ser desfeita.")) {
              // Implementar limpeza da lixeira
            }
          }}
          className="bg-red-500 hover:bg-red-600 text-white"
          disabled={orcamentos.length === 0 || isLoading}
        >
          <Trash2 className="h-4 w-4 mr-2" /> Limpar Lixeira
        </Button>
      </div>

      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Número</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Excluído em</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : orcamentos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Trash2 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <h4 className="text-lg font-medium text-gray-600">Lixeira vazia</h4>
                    <p className="text-gray-500 mt-1">Não há orçamentos excluídos para mostrar</p>
                  </TableCell>
                </TableRow>
              ) : (
                orcamentos.map((orcamento) => (
                  <TableRow key={orcamento.id} className="hover:bg-muted/50">
                    <TableCell>{orcamento.numero}</TableCell>
                    <TableCell>{orcamento.data}</TableCell>
                    <TableCell>{orcamento.cliente?.nome || "Cliente não especificado"}</TableCell>
                    <TableCell>{new Date(orcamento.deleted_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onRestaurarOrcamento(orcamento.id)}
                          className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-50"
                          title="Restaurar orçamento"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (window.confirm("Tem certeza que deseja excluir permanentemente este orçamento?")) {
                              onExcluirPermanentemente(orcamento.id)
                            }
                          }}
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                          title="Excluir permanentemente"
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
