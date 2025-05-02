"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import {
  Plus,
  Trash2,
  Pencil,
  Save,
  X,
  Package,
  DollarSign,
  Shirt,
  Palette,
  Ruler,
  AlertCircle,
  FileText,
} from "lucide-react"
import type { Produto, Tecido } from "@/types/types"
import { supabase } from "@/lib/supabase"
import { mockProdutos } from "@/lib/mock-data"

// Helper function to generate UUID
const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// Function to fetch the next sequential product code from Supabase
const obterProximoCodigoProduto = async (): Promise<string> => {
  try {
    // Now that we know the column exists, we can directly query it
    const { data, error } = await supabase
      .from("produtos")
      .select("codigo")
      .order("codigo", { ascending: false })
      .limit(1)

    if (error) {
      console.error("Erro ao obter o último código do produto:", error)
      return "P0001" // Default code if there's an error
    }

    if (data && data.length > 0 && data[0].codigo) {
      // Extract the numeric part from the code (remove the 'P' prefix)
      const ultimoCodigo = data[0].codigo
      const numeroMatch = ultimoCodigo.match(/^P?(\d+)$/)

      if (numeroMatch && numeroMatch[1]) {
        const numero = Number.parseInt(numeroMatch[1], 10) + 1
        return "P" + String(numero).padStart(4, "0") // Format the new code
      }
    }

    // If no valid code was found, start with P0001
    return "P0001"
  } catch (error) {
    console.error("Erro ao obter o próximo código do produto:", error)
    return "P0001" // Return a default code in case of any error
  }
}

interface GerenciadorProdutosProps {
  produtos: Produto[]
  adicionarProduto: (produto: Produto) => void
  setProdutos: (produtos: Produto[]) => void
}

export default function GerenciadorProdutos({ produtos, adicionarProduto, setProdutos }: GerenciadorProdutosProps) {
  // Modificar o estado do novo produto para incluir o código
  const [novoProduto, setNovoProduto] = useState<Partial<Produto>>({
    codigo: "",
    nome: "",
    valorBase: 0,
    tecidos: [],
    cores: [],
    tamanhosDisponiveis: [],
  })

  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Estados para gerenciar tecidos
  const [novoTecido, setNovoTecido] = useState<Tecido>({ nome: "", composicao: "" })
  const [novaCor, setNovaCor] = useState("")
  const [novoTamanho, setNovoTamanho] = useState("")

  // Carregar produtos do Supabase ao montar o componente
  useEffect(() => {
    const carregarProdutos = async () => {
      try {
        setIsLoading(true)

        // Buscar produtos
        const { data: produtosData, error: produtosError } = await supabase.from("produtos").select("*").order("nome")

        if (produtosError) {
          console.warn("Erro ao carregar produtos do Supabase, usando dados mock:", produtosError)
          setProdutos(mockProdutos)
          return
        }

        if (produtosData) {
          // Para cada produto, buscar seus tecidos
          const produtosCompletos = await Promise.all(
            produtosData.map(async (produto) => {
              // Buscar tecidos do produto
              const { data: tecidosData, error: tecidosError } = await supabase
                .from("tecidos")
                .select("*")
                .eq("produto_id", produto.id)

              if (tecidosError) throw tecidosError

              // Converter para o formato da aplicação
              return {
                id: produto.id,
                codigo: produto.codigo || "",
                nome: produto.nome,
                valorBase: Number(produto.valor_base),
                tecidos: tecidosData
                  ? tecidosData.map((t) => ({
                      nome: t.nome,
                      composicao: t.composicao || "",
                    }))
                  : [],
                cores: produto.cores || [],
                tamanhosDisponiveis: produto.tamanhos_disponiveis || [],
              } as Produto
            }),
          )

          setProdutos(produtosCompletos)
        }
      } catch (error) {
        console.error("Erro ao carregar produtos:", error)
        setProdutos(mockProdutos)
      } finally {
        setIsLoading(false)
      }
    }

    carregarProdutos()
  }, [setProdutos])

  // Modificar a função handleAdicionarProduto para gerar o código
  const handleAdicionarProduto = async () => {
    if (novoProduto.nome && novoProduto.valorBase) {
      try {
        setIsLoading(true)
        setError(null)

        // Gerar um UUID para o novo produto
        const produtoId = generateUUID()

        // Obter o próximo código sequencial
        const codigo = novoProduto.codigo || (await obterProximoCodigoProduto())

        // Inserir produto no Supabase
        const { data: insertedData, error: produtoError } = await supabase
          .from("produtos")
          .insert({
            id: produtoId,
            codigo,
            nome: novoProduto.nome,
            valor_base: novoProduto.valorBase,
            cores: novoProduto.cores || [],
            tamanhos_disponiveis: novoProduto.tamanhosDisponiveis || [],
          })
          .select()

        if (produtoError) throw produtoError

        if (insertedData && insertedData[0]) {
          // Inserir tecidos do produto
          if (novoProduto.tecidos && novoProduto.tecidos.length > 0) {
            const tecidosParaInserir = novoProduto.tecidos.map((tecido) => ({
              nome: tecido.nome,
              composicao: tecido.composicao,
              produto_id: insertedData[0].id,
            }))

            const { error: tecidosError } = await supabase.from("tecidos").insert(tecidosParaInserir)

            if (tecidosError) throw tecidosError
          }

          // Converter para o formato da aplicação
          const novoProdutoFormatado: Produto = {
            id: insertedData[0].id,
            codigo: insertedData[0].codigo || codigo,
            nome: insertedData[0].nome,
            valorBase: Number(insertedData[0].valor_base),
            tecidos: novoProduto.tecidos || [],
            cores: novoProduto.cores || [],
            tamanhosDisponiveis: novoProduto.tamanhosDisponiveis || [],
          }

          // Adicionar à lista local
          adicionarProduto(novoProdutoFormatado)

          // Limpar formulário
          setNovoProduto({
            codigo: "",
            nome: "",
            valorBase: 0,
            tecidos: [],
            cores: [],
            tamanhosDisponiveis: [],
          })
          setNovoTecido({ nome: "", composicao: "" })
          setNovaCor("")
          setNovoTamanho("")
        }
      } catch (error) {
        console.error("Erro ao adicionar produto:", error)
        setError(`Erro ao adicionar produto: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleRemoverProduto = async (id: string) => {
    // Confirmar antes de excluir
    if (!window.confirm("Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.")) {
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Verificar se o produto está sendo usado em algum item de orçamento
      const { data: itensRelacionados, error: itensError } = await supabase
        .from("itens_orcamento")
        .select("id, orcamento_id")
        .eq("produto_id", id)

      if (itensError) throw itensError

      // Se existirem itens relacionados, perguntar ao usuário se deseja excluí-los também
      if (itensRelacionados && itensRelacionados.length > 0) {
        const confirmarExclusao = window.confirm(
          `Este produto está sendo usado em ${itensRelacionados.length} item(ns) de orçamento. Todos esses itens serão excluídos também. Deseja continuar?`,
        )

        if (!confirmarExclusao) {
          setIsLoading(false)
          return
        }

        // Excluir os itens de orçamento relacionados
        const { error: deleteItensError } = await supabase.from("itens_orcamento").delete().eq("produto_id", id)

        if (deleteItensError) throw deleteItensError
      }

      // Remover tecidos do produto
      const { error: tecidosError } = await supabase.from("tecidos").delete().eq("produto_id", id)

      if (tecidosError) throw tecidosError

      // Remover produto
      const { error: produtoError } = await supabase.from("produtos").delete().eq("id", id)

      if (produtoError) throw produtoError

      // Remover da lista local
      setProdutos(produtos.filter((produto) => produto.id !== id))
    } catch (error) {
      console.error("Erro ao remover produto:", error)
      setError(`Erro ao remover produto: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
    } finally {
      setIsLoading(false)
    }
  }

  const iniciarEdicao = (produto: Produto) => {
    setEditandoId(produto.id)
    setProdutoEditando({ ...produto })
  }

  const cancelarEdicao = () => {
    setEditandoId(null)
    setProdutoEditando(null)
  }

  const salvarEdicao = async () => {
    if (produtoEditando) {
      try {
        setIsLoading(true)
        setError(null)

        // Atualizar produto no Supabase
        const { error: produtoError } = await supabase
          .from("produtos")
          .update({
            codigo: produtoEditando.codigo,
            nome: produtoEditando.nome,
            valor_base: produtoEditando.valorBase,
            cores: produtoEditando.cores,
            tamanhos_disponiveis: produtoEditando.tamanhosDisponiveis,
            updated_at: new Date().toISOString(),
          })
          .eq("id", produtoEditando.id)

        if (produtoError) throw produtoError

        // Remover tecidos antigos
        const { error: deleteTecidosError } = await supabase
          .from("tecidos")
          .delete()
          .eq("produto_id", produtoEditando.id)

        if (deleteTecidosError) throw deleteTecidosError

        // Inserir novos tecidos
        if (produtoEditando.tecidos && produtoEditando.tecidos.length > 0) {
          const tecidosParaInserir = produtoEditando.tecidos.map((tecido) => ({
            nome: tecido.nome,
            composicao: tecido.composicao,
            produto_id: produtoEditando.id,
          }))

          const { error: tecidosError } = await supabase.from("tecidos").insert(tecidosParaInserir)

          if (tecidosError) throw tecidosError
        }

        // Atualizar na lista local
        setProdutos(produtos.map((produto) => (produto.id === produtoEditando.id ? produtoEditando : produto)))
        setEditandoId(null)
        setProdutoEditando(null)
      } catch (error) {
        console.error("Erro ao atualizar produto:", error)
        setError(`Erro ao atualizar produto: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
      } finally {
        setIsLoading(false)
      }
    }
  }

  // Funções para adicionar tecidos, cores e tamanhos
  const adicionarTecido = () => {
    if (novoTecido.nome && novoTecido.composicao) {
      if (editandoId && produtoEditando) {
        setProdutoEditando({
          ...produtoEditando,
          tecidos: [...produtoEditando.tecidos, { ...novoTecido }],
        })
      } else {
        setNovoProduto({
          ...novoProduto,
          tecidos: [...(novoProduto.tecidos || []), { ...novoTecido }],
        })
      }
      setNovoTecido({ nome: "", composicao: "" })
    }
  }

  const removerTecido = (index: number) => {
    if (editandoId && produtoEditando) {
      setProdutoEditando({
        ...produtoEditando,
        tecidos: produtoEditando.tecidos.filter((_, i) => i !== index),
      })
    } else {
      setNovoProduto({
        ...novoProduto,
        tecidos: (novoProduto.tecidos || []).filter((_, i) => i !== index),
      })
    }
  }

  const adicionarCor = () => {
    if (novaCor) {
      if (editandoId && produtoEditando) {
        setProdutoEditando({
          ...produtoEditando,
          cores: [...produtoEditando.cores, novaCor],
        })
      } else {
        setNovoProduto({
          ...novoProduto,
          cores: [...(novoProduto.cores || []), novaCor],
        })
      }
      setNovaCor("")
    }
  }

  const removerCor = (index: number) => {
    if (editandoId && produtoEditando) {
      setProdutoEditando({
        ...produtoEditando,
        cores: produtoEditando.cores.filter((_, i) => i !== index),
      })
    } else {
      setNovoProduto({
        ...novoProduto,
        cores: (novoProduto.cores || []).filter((_, i) => i !== index),
      })
    }
  }

  const adicionarTamanho = () => {
    if (novoTamanho) {
      if (editandoId && produtoEditando) {
        setProdutoEditando({
          ...produtoEditando,
          tamanhosDisponiveis: [...produtoEditando.tamanhosDisponiveis, novoTamanho],
        })
      } else {
        setNovoProduto({
          ...novoProduto,
          tamanhosDisponiveis: [...(novoProduto.tamanhosDisponiveis || []), novoTamanho],
        })
      }
      setNovoTamanho("")
    }
  }

  const removerTamanho = (index: number) => {
    if (editandoId && produtoEditando) {
      setProdutoEditando({
        ...produtoEditando,
        tamanhosDisponiveis: produtoEditando.tamanhosDisponiveis.filter((_, i) => i !== index),
      })
    } else {
      setNovoProduto({
        ...novoProduto,
        tamanhosDisponiveis: (novoProduto.tamanhosDisponiveis || []).filter((_, i) => i !== index),
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-primary flex items-center gap-2">
          <span className="bg-primary text-white p-1 rounded-md text-xs">PRODUTOS</span>
          Gerenciar Produtos
        </h3>
        <span className="text-sm text-gray-500">{produtos.length} produtos cadastrados</span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {isLoading && produtos.length === 0 ? (
          <div className="text-center py-4">Carregando produtos...</div>
        ) : (
          produtos.map((produto) => (
            <Card key={produto.id} className="overflow-hidden shadow-sm border-0 hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                {editandoId === produto.id && produtoEditando ? (
                  <div className="p-4 space-y-4 bg-accent/50">
                    {/* Adicionar campo de código no formulário de edição */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor={`edit-codigo-${produto.id}`} className="text-primary flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Código
                        </Label>
                        <Input
                          id={`edit-codigo-${produto.id}`}
                          value={produtoEditando.codigo}
                          onChange={(e) =>
                            setProdutoEditando({
                              ...produtoEditando,
                              codigo: e.target.value,
                            })
                          }
                          className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                          disabled={true} // Código não deve ser editável manualmente
                        />
                      </div>
                      <div>
                        <Label htmlFor={`edit-nome-${produto.id}`} className="text-primary flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Nome
                        </Label>
                        <Input
                          id={`edit-nome-${produto.id}`}
                          value={produtoEditando.nome}
                          onChange={(e) =>
                            setProdutoEditando({
                              ...produtoEditando,
                              nome: e.target.value,
                            })
                          }
                          className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`edit-valor-${produto.id}`} className="text-primary flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Valor Base
                        </Label>
                        <Input
                          id={`edit-valor-${produto.id}`}
                          type="number"
                          value={produtoEditando.valorBase}
                          onChange={(e) =>
                            setProdutoEditando({
                              ...produtoEditando,
                              valorBase: Number.parseFloat(e.target.value),
                            })
                          }
                          className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>

                    {/* Tecidos */}
                    <div>
                      <Label className="text-primary flex items-center gap-2">
                        <Shirt className="h-4 w-4" />
                        Tecidos Disponíveis
                      </Label>
                      <div className="mt-2 space-y-2">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Nome do tecido"
                            value={novoTecido.nome}
                            onChange={(e) => setNovoTecido({ ...novoTecido, nome: e.target.value })}
                            className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                          />
                          <Input
                            placeholder="Composição"
                            value={novoTecido.composicao}
                            onChange={(e) => setNovoTecido({ ...novoTecido, composicao: e.target.value })}
                            className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                          />
                          <Button
                            onClick={adicionarTecido}
                            className="bg-primary hover:bg-primary-dark text-white"
                            disabled={!novoTecido.nome || !novoTecido.composicao}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-1 max-h-32 overflow-y-auto p-2 bg-white rounded-md">
                          {produtoEditando.tecidos.map((tecido, index) => (
                            <div key={index} className="flex justify-between items-center p-2 bg-accent rounded-md">
                              <div>
                                <span className="font-medium">{tecido.nome}</span>
                                <span className="text-xs text-gray-500 ml-2">({tecido.composicao})</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removerTecido(index)}
                                className="h-6 w-6 text-gray-500 hover:text-red-500 hover:bg-red-50"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          {produtoEditando.tecidos.length === 0 && (
                            <p className="text-sm text-gray-500 italic p-2">Nenhum tecido adicionado</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Cores */}
                    <div>
                      <Label className="text-primary flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        Cores Disponíveis
                      </Label>
                      <div className="mt-2 space-y-2">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Nome da cor"
                            value={novaCor}
                            onChange={(e) => setNovaCor(e.target.value)}
                            className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                          />
                          <Button
                            onClick={adicionarCor}
                            className="bg-primary hover:bg-primary-dark text-white"
                            disabled={!novaCor}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 bg-white rounded-md">
                          {produtoEditando.cores.map((cor, index) => (
                            <div key={index} className="flex items-center gap-1 bg-accent px-2 py-1 rounded-full">
                              <span className="text-sm">{cor}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removerCor(index)}
                                className="h-5 w-5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full p-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                          {produtoEditando.cores.length === 0 && (
                            <p className="text-sm text-gray-500 italic p-2">Nenhuma cor adicionada</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Tamanhos */}
                    <div>
                      <Label className="text-primary flex items-center gap-2">
                        <Ruler className="h-4 w-4" />
                        Tamanhos Disponíveis
                      </Label>
                      <div className="mt-2 space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                          <div className="border rounded-md p-3 bg-white">
                            <div className="flex items-center mb-2">
                              <input
                                type="radio"
                                id={editandoId ? `tamanho-tipo-1-edit` : `tamanho-tipo-1-novo`}
                                name={editandoId ? `tamanho-tipo-edit` : `tamanho-tipo-novo`}
                                className="mr-2"
                                checked={(editandoId
                                  ? produtoEditando?.tamanhosDisponiveis
                                  : novoProduto.tamanhosDisponiveis || []
                                ).some((t) =>
                                  ["PP", "P", "M", "G", "GG", "G1", "G2", "G3", "G4", "G5", "G6", "G7"].includes(t),
                                )}
                                onChange={() => {
                                  if (editandoId && produtoEditando) {
                                    setProdutoEditando({
                                      ...produtoEditando,
                                      tamanhosDisponiveis: [
                                        "PP",
                                        "P",
                                        "M",
                                        "G",
                                        "GG",
                                        "G1",
                                        "G2",
                                        "G3",
                                        "G4",
                                        "G5",
                                        "G6",
                                        "G7",
                                      ],
                                    })
                                  } else {
                                    setNovoProduto({
                                      ...novoProduto,
                                      tamanhosDisponiveis: [
                                        "PP",
                                        "P",
                                        "M",
                                        "G",
                                        "GG",
                                        "G1",
                                        "G2",
                                        "G3",
                                        "G4",
                                        "G5",
                                        "G6",
                                        "G7",
                                      ],
                                    })
                                  }
                                }}
                              />
                              <Label
                                htmlFor={editandoId ? `tamanho-tipo-1-edit` : `tamanho-tipo-1-novo`}
                                className="font-medium"
                              >
                                Padrão (PP ao G7)
                              </Label>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {["PP", "P", "M", "G", "GG", "G1", "G2", "G3", "G4", "G5", "G6", "G7"].map((tamanho) => (
                                <div key={tamanho} className="flex items-center gap-1 bg-accent px-2 py-1 rounded-full">
                                  <span className="text-sm font-medium">{tamanho}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="border rounded-md p-3 bg-white">
                            <div className="flex items-center mb-2">
                              <input
                                type="radio"
                                id={editandoId ? `tamanho-tipo-2-edit` : `tamanho-tipo-2-novo`}
                                name={editandoId ? `tamanho-tipo-edit` : `tamanho-tipo-novo`}
                                className="mr-2"
                                checked={(editandoId
                                  ? produtoEditando?.tamanhosDisponiveis
                                  : novoProduto.tamanhosDisponiveis || []
                                ).some((t) => t.match(/^(3[68]|[4-5][02468])$/))}
                                onChange={() => {
                                  const numericos = Array.from({ length: 12 }, (_, i) => (36 + i * 2).toString())
                                  if (editandoId && produtoEditando) {
                                    setProdutoEditando({
                                      ...produtoEditando,
                                      tamanhosDisponiveis: numericos,
                                    })
                                  } else {
                                    setNovoProduto({
                                      ...novoProduto,
                                      tamanhosDisponiveis: numericos,
                                    })
                                  }
                                }}
                              />
                              <Label
                                htmlFor={editandoId ? `tamanho-tipo-2-edit` : `tamanho-tipo-2-novo`}
                                className="font-medium"
                              >
                                Numérico (36 ao 58 - pares)
                              </Label>
                            </div>
                            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                              {Array.from({ length: 12 }, (_, i) => (36 + i * 2).toString()).map((tamanho) => (
                                <div key={tamanho} className="flex items-center gap-1 bg-accent px-2 py-1 rounded-full">
                                  <span className="text-sm font-medium">{tamanho}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="border rounded-md p-3 bg-white">
                            <div className="flex items-center mb-2">
                              <input
                                type="radio"
                                id={editandoId ? `tamanho-tipo-3-edit` : `tamanho-tipo-3-novo`}
                                name={editandoId ? `tamanho-tipo-edit` : `tamanho-tipo-novo`}
                                className="mr-2"
                                checked={(editandoId
                                  ? produtoEditando?.tamanhosDisponiveis
                                  : novoProduto.tamanhosDisponiveis || []
                                ).some((t) => t.match(/^([0-9]|1[0-3])$/))}
                                onChange={() => {
                                  const infantis = Array.from({ length: 14 }, (_, i) => i.toString())
                                  if (editandoId && produtoEditando) {
                                    setProdutoEditando({
                                      ...produtoEditando,
                                      tamanhosDisponiveis: infantis,
                                    })
                                  } else {
                                    setNovoProduto({
                                      ...novoProduto,
                                      tamanhosDisponiveis: infantis,
                                    })
                                  }
                                }}
                              />
                              <Label
                                htmlFor={editandoId ? `tamanho-tipo-3-edit` : `tamanho-tipo-3-novo`}
                                className="font-medium"
                              >
                                Infantil (0 ao 13)
                              </Label>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {Array.from({ length: 14 }, (_, i) => i.toString()).map((tamanho) => (
                                <div key={tamanho} className="flex items-center gap-1 bg-accent px-2 py-1 rounded-full">
                                  <span className="text-sm font-medium">{tamanho}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
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
                    <div className="flex justify-between items-start">
                      {/* Modificar a exibição do produto para mostrar o código */}
                      <div className="flex items-start gap-3">
                        <div className="bg-primary text-white p-2 rounded-full">
                          <Package className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            <span className="text-primary">{produto.codigo}</span> - {produto.nome}
                          </h4>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {produto.valorBase.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => iniciarEdicao(produto)}
                          className="h-8 w-8 text-primary hover:text-primary-dark hover:bg-primary/10"
                          disabled={isLoading}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoverProduto(produto.id)}
                          className="h-8 w-8 text-gray-500 hover:text-red-500 hover:bg-red-50"
                          disabled={isLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 text-sm">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-accent/50 p-3 rounded-md">
                        <div>
                          <p className="font-medium text-primary text-xs mb-1">Tecidos</p>
                          <div className="text-xs">
                            {produto.tecidos.map((tecido, index) => (
                              <p key={index}>
                                {tecido.nome}: <span className="text-gray-500">{tecido.composicao}</span>
                              </p>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-primary text-xs mb-1">Cores</p>
                          <p className="text-xs">{produto.cores.join(", ")}</p>
                        </div>
                        <div>
                          <p className="font-medium text-primary text-xs mb-1">Tamanhos</p>
                          <p className="text-xs">{produto.tamanhosDisponiveis.join(", ")}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card className="overflow-hidden shadow-sm border-0 border-t-4 border-t-primary">
        <CardContent className="p-4">
          <h4 className="font-medium mb-4 text-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Novo Produto
          </h4>
          <div className="space-y-4">
            {/* Adicionar campo de código no formulário de novo produto */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="codigo-produto" className="text-primary flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Código
                </Label>
                <Input
                  id="codigo-produto"
                  value={novoProduto.codigo}
                  className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                  disabled={true} // Código será gerado automaticamente
                  placeholder="Gerado automaticamente"
                />
              </div>
              <div>
                <Label htmlFor="nome-produto" className="text-primary flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Nome
                </Label>
                <Input
                  id="nome-produto"
                  value={novoProduto.nome}
                  onChange={(e) => setNovoProduto({ ...novoProduto, nome: e.target.value })}
                  className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <Label htmlFor="valor-base" className="text-primary flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Valor Base
                </Label>
                <Input
                  id="valor-base"
                  type="number"
                  value={novoProduto.valorBase || ""}
                  onChange={(e) =>
                    setNovoProduto({
                      ...novoProduto,
                      valorBase: Number.parseFloat(e.target.value),
                    })
                  }
                  className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Tecidos */}
            <div>
              <Label className="text-primary flex items-center gap-2">
                <Shirt className="h-4 w-4" />
                Tecidos Disponíveis
              </Label>
              <div className="mt-2 space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Nome do tecido"
                    value={novoTecido.nome}
                    onChange={(e) => setNovoTecido({ ...novoTecido, nome: e.target.value })}
                    className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  <Input
                    placeholder="Composição"
                    value={novoTecido.composicao}
                    onChange={(e) => setNovoTecido({ ...novoTecido, composicao: e.target.value })}
                    className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  <Button
                    onClick={adicionarTecido}
                    className="bg-primary hover:bg-primary-dark text-white"
                    disabled={!novoTecido.nome || !novoTecido.composicao}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto p-2 bg-white rounded-md">
                  {(novoProduto.tecidos || []).map((tecido, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-accent rounded-md">
                      <div>
                        <span className="font-medium">{tecido.nome}</span>
                        <span className="text-xs text-gray-500 ml-2">({tecido.composicao})</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removerTecido(index)}
                        className="h-6 w-6 text-gray-500 hover:text-red-500 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {(novoProduto.tecidos || []).length === 0 && (
                    <p className="text-sm text-gray-500 italic p-2">Nenhum tecido adicionado</p>
                  )}
                </div>
              </div>
            </div>

            {/* Cores */}
            <div>
              <Label className="text-primary flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Cores Disponíveis
              </Label>
              <div className="mt-2 space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Nome da cor"
                    value={novaCor}
                    onChange={(e) => setNovaCor(e.target.value)}
                    className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  <Button
                    onClick={adicionarCor}
                    className="bg-primary hover:bg-primary-dark text-white"
                    disabled={!novaCor}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 bg-white rounded-md">
                  {(novoProduto.cores || []).map((cor, index) => (
                    <div key={index} className="flex items-center gap-1 bg-accent px-2 py-1 rounded-full">
                      <span className="text-sm">{cor}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removerCor(index)}
                        className="h-5 w-5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {(novoProduto.cores || []).length === 0 && (
                    <p className="text-sm text-gray-500 italic p-2">Nenhuma cor adicionada</p>
                  )}
                </div>
              </div>
            </div>

            {/* Tamanhos */}
            <div>
              <Label className="text-primary flex items-center gap-2">
                <Ruler className="h-4 w-4" />
                Tamanhos Disponíveis
              </Label>
              <div className="mt-2 space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="border rounded-md p-3 bg-white">
                    <div className="flex items-center mb-2">
                      <input
                        type="radio"
                        id={`tamanho-tipo-1-novo`}
                        name={`tamanho-tipo-novo`}
                        className="mr-2"
                        checked={(novoProduto.tamanhosDisponiveis || []).some((t) =>
                          ["PP", "P", "M", "G", "GG", "G1", "G2", "G3", "G4", "G5", "G6", "G7"].includes(t),
                        )}
                        onChange={() => {
                          setNovoProduto({
                            ...novoProduto,
                            tamanhosDisponiveis: ["PP", "P", "M", "G", "GG", "G1", "G2", "G3", "G4", "G5", "G6", "G7"],
                          })
                        }}
                      />
                      <Label htmlFor={`tamanho-tipo-1-novo`} className="font-medium">
                        Padrão (PP ao G7)
                      </Label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {["PP", "P", "M", "G", "GG", "G1", "G2", "G3", "G4", "G5", "G6", "G7"].map((tamanho) => (
                        <div key={tamanho} className="flex items-center gap-1 bg-accent px-2 py-1 rounded-full">
                          <span className="text-sm font-medium">{tamanho}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border rounded-md p-3 bg-white">
                    <div className="flex items-center mb-2">
                      <input
                        type="radio"
                        id={`tamanho-tipo-2-novo`}
                        name={`tamanho-tipo-novo`}
                        className="mr-2"
                        checked={(novoProduto.tamanhosDisponiveis || []).some((t) => t.match(/^(3[68]|[4-5][02468])$/))}
                        onChange={() => {
                          const numericos = Array.from({ length: 12 }, (_, i) => (36 + i * 2).toString())
                          setNovoProduto({
                            ...novoProduto,
                            tamanhosDisponiveis: numericos,
                          })
                        }}
                      />
                      <Label htmlFor={`tamanho-tipo-2-novo`} className="font-medium">
                        Numérico (36 ao 58 - pares)
                      </Label>
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                      {Array.from({ length: 12 }, (_, i) => (36 + i * 2).toString()).map((tamanho) => (
                        <div key={tamanho} className="flex items-center gap-1 bg-accent px-2 py-1 rounded-full">
                          <span className="text-sm font-medium">{tamanho}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border rounded-md p-3 bg-white">
                    <div className="flex items-center mb-2">
                      <input
                        type="radio"
                        id={`tamanho-tipo-3-novo`}
                        name={`tamanho-tipo-novo`}
                        className="mr-2"
                        checked={(novoProduto.tamanhosDisponiveis || []).some((t) => t.match(/^([0-9]|1[0-3])$/))}
                        onChange={() => {
                          const infantis = Array.from({ length: 14 }, (_, i) => i.toString())
                          setNovoProduto({
                            ...novoProduto,
                            tamanhosDisponiveis: infantis,
                          })
                        }}
                      />
                      <Label htmlFor={`tamanho-tipo-3-novo`} className="font-medium">
                        Infantil (0 ao 13)
                      </Label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: 14 }, (_, i) => i.toString()).map((tamanho) => (
                        <div key={tamanho} className="flex items-center gap-1 bg-accent px-2 py-1 rounded-full">
                          <span className="text-sm font-medium">{tamanho}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Button
              onClick={handleAdicionarProduto}
              className="w-full bg-primary hover:bg-primary-dark text-white transition-colors"
              disabled={isLoading || !novoProduto.nome || !novoProduto.valorBase}
            >
              <Plus className="h-4 w-4 mr-2" /> {isLoading ? "Adicionando..." : "Adicionar Produto"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
