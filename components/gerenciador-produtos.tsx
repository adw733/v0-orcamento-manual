"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Trash2, Pencil, Save, X, Package, DollarSign, Shirt, Palette, Ruler } from "lucide-react"
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

interface GerenciadorProdutosProps {
  produtos: Produto[]
  adicionarProduto: (produto: Produto) => void
  setProdutos: (produtos: Produto[]) => void
}

export default function GerenciadorProdutos({ produtos, adicionarProduto, setProdutos }: GerenciadorProdutosProps) {
  const [novoProduto, setNovoProduto] = useState<Partial<Produto>>({
    nome: "",
    valorBase: 0,
    tecidos: [],
    cores: [],
    tamanhosDisponiveis: [],
  })

  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null)
  const [isLoading, setIsLoading] = useState(false)

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

  const handleAdicionarProduto = async () => {
    if (novoProduto.nome && novoProduto.valorBase) {
      try {
        setIsLoading(true)

        // Inserir produto no Supabase
        const { data: produtoData, error: produtoError } = await supabase
          .from("produtos")
          .insert({
            id: generateUUID(),
            nome: novoProduto.nome,
            valor_base: novoProduto.valorBase,
            cores: novoProduto.cores || [],
            tamanhos_disponiveis: novoProduto.tamanhosDisponiveis || [],
          })
          .select()

        if (produtoError) throw produtoError

        if (produtoData && produtoData[0]) {
          // Inserir tecidos do produto
          if (novoProduto.tecidos && novoProduto.tecidos.length > 0) {
            const tecidosParaInserir = novoProduto.tecidos.map((tecido) => ({
              nome: tecido.nome,
              composicao: tecido.composicao,
              produto_id: produtoData[0].id,
            }))

            const { error: tecidosError } = await supabase.from("tecidos").insert(tecidosParaInserir)

            if (tecidosError) throw tecidosError
          }

          // Converter para o formato da aplicação
          const novoProdutoFormatado: Produto = {
            id: produtoData[0].id,
            nome: produtoData[0].nome,
            valorBase: Number(produtoData[0].valor_base),
            tecidos: novoProduto.tecidos || [],
            cores: novoProduto.cores || [],
            tamanhosDisponiveis: novoProduto.tamanhosDisponiveis || [],
          }

          // Adicionar à lista local
          adicionarProduto(novoProdutoFormatado)

          // Limpar formulário
          setNovoProduto({
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
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleRemoverProduto = async (id: string) => {
    try {
      setIsLoading(true)

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

        // Atualizar produto no Supabase
        const { error: produtoError } = await supabase
          .from("produtos")
          .update({
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

      <div className="space-y-4">
        {isLoading && produtos.length === 0 ? (
          <div className="text-center py-4">Carregando produtos...</div>
        ) : (
          produtos.map((produto) => (
            <Card key={produto.id} className="overflow-hidden shadow-sm border-0 hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                {editandoId === produto.id && produtoEditando ? (
                  <div className="p-4 space-y-4 bg-accent/50">
                    <div className="grid grid-cols-2 gap-4">
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
                      <div className="mt-2 space-y-2">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Tamanho (ex: PP, P, M...)"
                            value={novoTamanho}
                            onChange={(e) => setNovoTamanho(e.target.value)}
                            className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                          />
                          <Button
                            onClick={adicionarTamanho}
                            className="bg-primary hover:bg-primary-dark text-white"
                            disabled={!novoTamanho}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 bg-white rounded-md">
                          {produtoEditando.tamanhosDisponiveis.map((tamanho, index) => (
                            <div key={index} className="flex items-center gap-1 bg-accent px-2 py-1 rounded-full">
                              <span className="text-sm font-medium">{tamanho}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removerTamanho(index)}
                                className="h-5 w-5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full p-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                          {produtoEditando.tamanhosDisponiveis.length === 0 && (
                            <p className="text-sm text-gray-500 italic p-2">Nenhum tamanho adicionado</p>
                          )}
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
                      <div className="flex items-start gap-3">
                        <div className="bg-primary text-white p-2 rounded-full">
                          <Package className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{produto.nome}</h4>
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
            <div className="grid grid-cols-2 gap-4">
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
              <div className="mt-2 space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Tamanho (ex: PP, P, M...)"
                    value={novoTamanho}
                    onChange={(e) => setNovoTamanho(e.target.value)}
                    className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  <Button
                    onClick={adicionarTamanho}
                    className="bg-primary hover:bg-primary-dark text-white"
                    disabled={!novoTamanho}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 bg-white rounded-md">
                  {(novoProduto.tamanhosDisponiveis || []).map((tamanho, index) => (
                    <div key={index} className="flex items-center gap-1 bg-accent px-2 py-1 rounded-full">
                      <span className="text-sm font-medium">{tamanho}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removerTamanho(index)}
                        className="h-5 w-5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {(novoProduto.tamanhosDisponiveis || []).length === 0 && (
                    <p className="text-sm text-gray-500 italic p-2">Nenhum tamanho adicionado</p>
                  )}
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
