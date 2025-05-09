"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Trash2, Pencil, Save, X, FolderPlus, AlertCircle, Tag, FolderOpen, Check } from "lucide-react"

// Interface para a categoria
export interface Categoria {
  id: string
  nome: string
  descricao?: string
  cor?: string
}

// Cores predefinidas para categorias
export const CORES_CATEGORIAS = [
  "#4f46e5", // indigo
  "#0ea5e9", // sky
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#6b7280", // gray
]

// Helper function to generate UUID
const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// Categorias padrão
export const CATEGORIAS_PADRAO: Categoria[] = [
  { id: generateUUID(), nome: "Camisetas", descricao: "Camisas em geral", cor: CORES_CATEGORIAS[0] },
  { id: generateUUID(), nome: "Camisas", descricao: "Camisas sociais e polos", cor: CORES_CATEGORIAS[1] },
  { id: generateUUID(), nome: "Uniformes Brim", descricao: "Calças e jaquetas de brim", cor: CORES_CATEGORIAS[2] },
  { id: generateUUID(), nome: "Jalecos", descricao: "Jalecos e aventais", cor: CORES_CATEGORIAS[3] },
  { id: generateUUID(), nome: "Outros", descricao: "Outros tipos de produtos", cor: CORES_CATEGORIAS[7] },
]

interface GerenciadorCategoriasProps {
  onClose: () => void
  onCategoriaAdded?: (categoria: Categoria) => void
  onCategoriaUpdated?: (categoria: Categoria) => void
  onCategoriaDeleted?: (id: string) => void
}

export default function GerenciadorCategorias({
  onClose,
  onCategoriaAdded,
  onCategoriaUpdated,
  onCategoriaDeleted,
}: GerenciadorCategoriasProps) {
  // Versão simplificada que não depende do banco de dados
  const [categorias, setCategorias] = useState<Categoria[]>(CATEGORIAS_PADRAO)
  const [novaCategoria, setNovaCategoria] = useState<Partial<Categoria>>({
    nome: "",
    descricao: "",
    cor: CORES_CATEGORIAS[0],
  })
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [categoriaEditando, setCategoriaEditando] = useState<Categoria | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Modificar o método handleAdicionarCategoria para converter para maiúsculas
  const handleAdicionarCategoria = () => {
    if (novaCategoria.nome) {
      try {
        setIsLoading(true)
        setError(null)

        // Gerar um UUID para a nova categoria
        const categoriaId = generateUUID()

        // Criar objeto da nova categoria com nome em maiúsculas
        const novaCategoriaCompleta: Categoria = {
          id: categoriaId,
          nome: novaCategoria.nome.toUpperCase(),
          descricao: novaCategoria.descricao ? novaCategoria.descricao.toUpperCase() : "",
          cor: novaCategoria.cor || CORES_CATEGORIAS[0],
        }

        // Adicionar à lista local
        setCategorias([...categorias, novaCategoriaCompleta])

        // Notificar componente pai
        if (onCategoriaAdded) {
          onCategoriaAdded(novaCategoriaCompleta)
        }

        // Limpar formulário
        setNovaCategoria({
          nome: "",
          descricao: "",
          cor: CORES_CATEGORIAS[0],
        })
      } catch (error) {
        console.error("Erro ao adicionar categoria:", error)
        setError(`Erro ao adicionar categoria: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleRemoverCategoria = (id: string, nome: string) => {
    // Não permitir remover a categoria "Outros"
    if (nome === "Outros") {
      setError("A categoria 'Outros' não pode ser removida.")
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Remover da lista local
      setCategorias(categorias.filter((cat) => cat.id !== id))

      // Notificar componente pai
      if (onCategoriaDeleted) {
        onCategoriaDeleted(id)
      }
    } catch (error) {
      console.error("Erro ao remover categoria:", error)
      setError(`Erro ao remover categoria: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
    } finally {
      setIsLoading(false)
    }
  }

  const iniciarEdicao = (categoria: Categoria) => {
    setEditandoId(categoria.id)
    setCategoriaEditando({ ...categoria })
  }

  const cancelarEdicao = () => {
    setEditandoId(null)
    setCategoriaEditando(null)
  }

  // Modificar o método salvarEdicao para converter para maiúsculas
  const salvarEdicao = () => {
    if (categoriaEditando) {
      try {
        setIsLoading(true)
        setError(null)

        // Garantir que os dados estejam em maiúsculas
        const categoriaAtualizada = {
          ...categoriaEditando,
          nome: categoriaEditando.nome.toUpperCase(),
          descricao: categoriaEditando.descricao ? categoriaEditando.descricao.toUpperCase() : "",
        }

        // Atualizar na lista local
        setCategorias(categorias.map((cat) => (cat.id === categoriaAtualizada.id ? categoriaAtualizada : cat)))

        // Notificar componente pai
        if (onCategoriaUpdated) {
          onCategoriaUpdated(categoriaAtualizada)
        }

        // Limpar estado de edição
        setEditandoId(null)
        setCategoriaEditando(null)
      } catch (error) {
        console.error("Erro ao atualizar categoria:", error)
        setError(`Erro ao atualizar categoria: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 bg-primary text-white flex justify-between items-center">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Gerenciar Categorias
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-primary-dark">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <CardContent className="p-4 overflow-y-auto flex-grow">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md flex items-center gap-2 mb-4">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Formulário para adicionar nova categoria */}
            <div className="border rounded-md p-4">
              <h4 className="font-medium text-primary mb-3 flex items-center gap-2">
                <FolderPlus className="h-4 w-4" />
                Nova Categoria
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome-categoria" className="text-sm font-medium">
                    Nome
                  </Label>
                  <Input
                    id="nome-categoria"
                    value={novaCategoria.nome}
                    onChange={(e) => setNovaCategoria({ ...novaCategoria, nome: e.target.value.toUpperCase() })}
                    placeholder="Ex: CAMISETAS"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="descricao-categoria" className="text-sm font-medium">
                    Descrição (opcional)
                  </Label>
                  <Input
                    id="descricao-categoria"
                    value={novaCategoria.descricao || ""}
                    onChange={(e) => setNovaCategoria({ ...novaCategoria, descricao: e.target.value.toUpperCase() })}
                    placeholder="Ex: CAMISETAS EM GERAL"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="mt-4">
                <Label className="text-sm font-medium">Cor</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {CORES_CATEGORIAS.map((cor) => (
                    <button
                      key={cor}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                        novaCategoria.cor === cor ? "border-primary" : "border-transparent"
                      }`}
                      style={{ backgroundColor: cor }}
                      onClick={() => setNovaCategoria({ ...novaCategoria, cor })}
                    >
                      {novaCategoria.cor === cor && <Check className="h-4 w-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleAdicionarCategoria}
                className="w-full mt-4 bg-primary hover:bg-primary-dark text-white"
                disabled={isLoading || !novaCategoria.nome}
              >
                <Plus className="h-4 w-4 mr-2" />
                {isLoading ? "Adicionando..." : "Adicionar Categoria"}
              </Button>
            </div>

            {/* Lista de categorias existentes */}
            <div>
              <h4 className="font-medium text-primary mb-3 flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Categorias Existentes
              </h4>

              {isLoading && categorias.length === 0 ? (
                <div className="text-center py-4 text-gray-500">Carregando categorias...</div>
              ) : categorias.length === 0 ? (
                <div className="text-center py-4 text-gray-500">Nenhuma categoria cadastrada.</div>
              ) : (
                <div className="space-y-3">
                  {categorias.map((categoria) => (
                    <div
                      key={categoria.id}
                      className={`border rounded-md p-3 ${editandoId === categoria.id ? "bg-gray-50" : "bg-white"}`}
                    >
                      {editandoId === categoria.id && categoriaEditando ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor={`edit-nome-${categoria.id}`} className="text-sm font-medium">
                                Nome
                              </Label>
                              <Input
                                id={`edit-nome-${categoria.id}`}
                                value={categoriaEditando.nome}
                                onChange={(e) =>
                                  setCategoriaEditando({ ...categoriaEditando, nome: e.target.value.toUpperCase() })
                                }
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`edit-descricao-${categoria.id}`} className="text-sm font-medium">
                                Descrição
                              </Label>
                              <Input
                                id={`edit-descricao-${categoria.id}`}
                                value={categoriaEditando.descricao || ""}
                                onChange={(e) =>
                                  setCategoriaEditando({
                                    ...categoriaEditando,
                                    descricao: e.target.value.toUpperCase(),
                                  })
                                }
                                className="mt-1"
                              />
                            </div>
                          </div>

                          <div>
                            <Label className="text-sm font-medium">Cor</Label>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {CORES_CATEGORIAS.map((cor) => (
                                <button
                                  key={cor}
                                  type="button"
                                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                    categoriaEditando.cor === cor ? "border-primary" : "border-transparent"
                                  }`}
                                  style={{ backgroundColor: cor }}
                                  onClick={() => setCategoriaEditando({ ...categoriaEditando, cor })}
                                >
                                  {categoriaEditando.cor === cor && <Check className="h-3 w-3 text-white" />}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 mt-2">
                            <Button variant="outline" size="sm" onClick={cancelarEdicao} className="text-gray-500">
                              <X className="h-4 w-4 mr-1" />
                              Cancelar
                            </Button>
                            <Button
                              size="sm"
                              onClick={salvarEdicao}
                              className="bg-primary hover:bg-primary-dark text-white"
                              disabled={isLoading}
                            >
                              <Save className="h-4 w-4 mr-1" />
                              {isLoading ? "Salvando..." : "Salvar"}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-6 h-6 rounded-full flex-shrink-0"
                              style={{ backgroundColor: categoria.cor || CORES_CATEGORIAS[0] }}
                            ></div>
                            <div>
                              <h5 className="font-medium">{categoria.nome}</h5>
                              {categoria.descricao && <p className="text-sm text-gray-500">{categoria.descricao}</p>}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => iniciarEdicao(categoria)}
                              className="text-primary hover:bg-primary/10"
                              disabled={isLoading}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoverCategoria(categoria.id, categoria.nome)}
                              className="text-gray-500 hover:text-red-500 hover:bg-red-50"
                              disabled={isLoading || categoria.nome === "Outros"} // Não permitir excluir a categoria "Outros"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>

        <div className="p-4 border-t flex justify-end">
          <Button onClick={onClose} className="bg-primary hover:bg-primary-dark text-white">
            Concluído
          </Button>
        </div>
      </Card>
    </div>
  )
}
