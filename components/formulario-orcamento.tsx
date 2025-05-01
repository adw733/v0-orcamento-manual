"use client"

import React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Edit, Check, X, ImageIcon, DollarSign, Loader2 } from "lucide-react"
import type { Cliente, Produto, Orcamento, ItemOrcamento } from "@/types/types"
import { supabase } from "@/lib/supabase"

// Helper function to generate UUID
const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

interface FormularioOrcamentoProps {
  orcamento: Orcamento
  clientes: Cliente[]
  produtos: Produto[]
  atualizarOrcamento: (orcamento: Partial<Orcamento>) => void
  adicionarItem: (item: ItemOrcamento) => void
  removerItem: (id: string) => void
  atualizarItem: (id: string, item: Partial<ItemOrcamento>) => void
  calcularTotal: () => number
}

const tamanhosPadrao = {
  PP: 0,
  P: 0,
  M: 0,
  G: 0,
  GG: 0,
  G1: 0,
  G2: 0,
  G3: 0,
  G4: 0,
  G5: 0,
  G6: 0,
  G7: 0,
}

// Componente isolado para o campo de descrição da estampa
const DescricaoEstampaInput = ({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) => {
  const [localValue, setLocalValue] = useState(value || "")

  // Sincroniza o valor local quando o valor externo muda
  useEffect(() => {
    setLocalValue(value || "")
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)
  }

  const handleBlur = () => {
    onChange(localValue)
  }

  return (
    <Textarea
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder="Descreva os detalhes da estampa (posição, cores, tamanho, etc.)"
      className="mt-1 border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
      rows={3}
    />
  )
}

// Componente isolado para o campo de observação
const ObservacaoInput = ({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) => {
  const [localValue, setLocalValue] = useState(value || "")

  // Sincroniza o valor local quando o valor externo muda
  useEffect(() => {
    setLocalValue(value || "")
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)
  }

  const handleBlur = () => {
    onChange(localValue)
  }

  return (
    <Textarea
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder="Observações sobre o item (detalhes, especificações, etc.)"
      className="mt-1 border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
      rows={2}
    />
  )
}

// With this new component:
const ObservacaoField = ({
  observacao,
  onObservacaoChange,
  isEditing = true,
}: {
  observacao?: string
  onObservacaoChange: (observacao: string) => void
  isEditing?: boolean
}) => {
  if (!isEditing) return null

  return (
    <div className="mt-4">
      <Label className="text-primary">Observação</Label>
      <ObservacaoInput value={observacao || ""} onChange={onObservacaoChange} />
    </div>
  )
}

export default function FormularioOrcamento({
  orcamento,
  clientes,
  produtos,
  atualizarOrcamento,
  adicionarItem,
  removerItem,
  atualizarItem,
  calcularTotal,
}: FormularioOrcamentoProps) {
  const [linhaAtiva, setLinhaAtiva] = useState<string | null>(null)
  const [editandoItem, setEditandoItem] = useState<string | null>(null)
  const [novoItem, setNovoItem] = useState<Partial<ItemOrcamento>>({
    produtoId: "",
    quantidade: 0,
    valorUnitario: 0,
    tamanhos: { ...tamanhosPadrao },
    imagem: "",
    observacao: "",
  })
  const [itemEmEdicao, setItemEmEdicao] = useState<ItemOrcamento | null>(null)
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Refs para os inputs de arquivo
  const novoImagemInputRef = useRef<HTMLInputElement>(null)
  const editImagemInputRef = useRef<HTMLInputElement>(null)

  // Carregar clientes do Supabase ao montar o componente
  useEffect(() => {
    const carregarClientes = async () => {
      if (clientes.length === 0) {
        try {
          setIsLoading(true)
          const { data, error } = await supabase.from("clientes").select("*").order("nome")

          if (error) {
            console.warn("Erro ao carregar clientes do Supabase, usando dados mock:", error)
            // Os clientes serão carregados pelo componente pai (GeradorOrcamento)
          }
        } catch (error) {
          console.error("Erro ao carregar clientes:", error)
        } finally {
          setIsLoading(false)
        }
      }
    }

    carregarClientes()
  }, [clientes])

  // Mostrar tabela de tamanhos automaticamente quando um produto for selecionado
  useEffect(() => {
    if (novoItem.produtoId) {
      // Produto selecionado, mostrar tabela de tamanhos
    }
  }, [novoItem.produtoId])

  const handleClienteChange = (clienteId: string) => {
    const cliente = clientes.find((c) => c.id === clienteId) || null
    atualizarOrcamento({ cliente })
  }

  const handleProdutoChange = async (produtoId: string) => {
    try {
      setIsLoading(true)

      // Buscar o produto completo
      const { data: produtoData, error: produtoError } = await supabase
        .from("produtos")
        .select("*")
        .eq("id", produtoId)
        .single()

      if (produtoError) throw produtoError

      if (produtoData) {
        // Buscar tecidos do produto
        const { data: tecidosData, error: tecidosError } = await supabase
          .from("tecidos")
          .select("*")
          .eq("produto_id", produtoId)

        if (tecidosError) throw tecidosError

        // Converter para o formato da aplicação
        const produto: Produto = {
          id: produtoData.id,
          nome: produtoData.nome,
          valorBase: Number(produtoData.valor_base),
          tecidos: tecidosData
            ? tecidosData.map((t) => ({
                nome: t.nome,
                composicao: t.composicao || "",
              }))
            : [],
          cores: produtoData.cores || [],
          tamanhosDisponiveis: produtoData.tamanhos_disponiveis || [],
        }

        setProdutoSelecionado(produto)
        setNovoItem({
          ...novoItem,
          produtoId,
          produto,
          valorUnitario: produto.valorBase,
        })
      }
    } catch (error) {
      console.error("Erro ao carregar produto:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Update the handleAdicionarItem function to use UUID
  const handleAdicionarItem = async () => {
    if (novoItem.produtoId && novoItem.valorUnitario) {
      try {
        setIsLoading(true)

        // Generate UUID for the new item
        const novoItemCompleto = {
          ...(novoItem as ItemOrcamento),
          id: generateUUID(),
          quantidade: novoItem.quantidade || 1,
        }

        // Adicionar item
        await adicionarItem(novoItemCompleto)

        // Limpar formulário
        setNovoItem({
          produtoId: "",
          quantidade: 0,
          valorUnitario: 0,
          tamanhos: { ...tamanhosPadrao },
          observacao: "",
          imagem: "",
        })
        setProdutoSelecionado(null)
        setLinhaAtiva(null)
      } catch (error) {
        console.error("Erro ao adicionar item:", error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const iniciarEdicaoItem = (item: ItemOrcamento) => {
    setItemEmEdicao({ ...item })
    setEditandoItem(item.id)
    // Buscar o produto para ter acesso às opções de tecido, cor e tamanho
    if (item.produto) {
      setProdutoSelecionado(item.produto)
    }
  }

  const salvarEdicaoItem = async () => {
    if (itemEmEdicao) {
      try {
        setIsLoading(true)
        await atualizarItem(itemEmEdicao.id, itemEmEdicao)
        setEditandoItem(null)
        setItemEmEdicao(null)
        setProdutoSelecionado(null)
      } catch (error) {
        console.error("Erro ao salvar item:", error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const cancelarEdicaoItem = () => {
    setEditandoItem(null)
    setItemEmEdicao(null)
    setProdutoSelecionado(null)
  }

  const handleTamanhoChange = (tamanho: keyof ItemOrcamento["tamanhos"], valor: number) => {
    if (itemEmEdicao) {
      const novosTamanhos = { ...itemEmEdicao.tamanhos, [tamanho]: valor }
      const novaQuantidade = Object.values(novosTamanhos).reduce((sum, val) => sum + val, 0)

      setItemEmEdicao({
        ...itemEmEdicao,
        tamanhos: novosTamanhos,
        quantidade: novaQuantidade,
      })
    }
  }

  const handleNovoTamanhoChange = (tamanho: keyof ItemOrcamento["tamanhos"], valor: number) => {
    const novosTamanhos = { ...novoItem.tamanhos, [tamanho]: valor }
    const novaQuantidade = Object.values(novosTamanhos).reduce((sum, val) => sum + val, 0)

    setNovoItem({
      ...novoItem,
      tamanhos: novosTamanhos,
      quantidade: novaQuantidade,
    })
  }

  // Função para converter imagem para base64
  const converterImagemParaBase64 = (file: File, callback: (base64: string) => void) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      callback(base64String)
    }
    reader.readAsDataURL(file)
  }

  // Manipulador para upload de imagem para novo item
  const handleNovaImagem = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      converterImagemParaBase64(file, (base64) => {
        setNovoItem({ ...novoItem, imagem: base64 })
      })
    }
  }

  // Manipulador para upload de imagem para item em edição
  const handleEditarImagem = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && itemEmEdicao) {
      converterImagemParaBase64(file, (base64) => {
        setItemEmEdicao({ ...itemEmEdicao, imagem: base64 })
      })
    }
  }

  // Manipuladores para tecido e cor
  const handleTecidoChange = (tecidoNome: string) => {
    if (produtoSelecionado) {
      const tecido = produtoSelecionado.tecidos.find((t) => t.nome === tecidoNome)
      if (tecido) {
        if (editandoItem && itemEmEdicao) {
          setItemEmEdicao({
            ...itemEmEdicao,
            tecidoSelecionado: tecido,
          })
        } else {
          setNovoItem({
            ...novoItem,
            tecidoSelecionado: tecido,
          })
        }
      }
    }
  }

  const handleCorChange = (cor: string) => {
    if (editandoItem && itemEmEdicao) {
      setItemEmEdicao({
        ...itemEmEdicao,
        corSelecionada: cor,
      })
    } else {
      setNovoItem({
        ...novoItem,
        corSelecionada: cor,
      })
    }
  }

  // Manipuladores para descrição da estampa
  const handleDescricaoEstampaChange = (descricao: string) => {
    if (editandoItem && itemEmEdicao) {
      setItemEmEdicao({
        ...itemEmEdicao,
        descricaoEstampa: descricao,
      })
    } else {
      setNovoItem({
        ...novoItem,
        descricaoEstampa: descricao,
      })
    }
  }

  // Add this function near the other handler functions:
  const handleObservacaoChange = (observacao: string) => {
    if (editandoItem && itemEmEdicao) {
      setItemEmEdicao({
        ...itemEmEdicao,
        observacao,
      })
    } else {
      setNovoItem({
        ...novoItem,
        observacao,
      })
    }
  }

  // Versão redimensionada da tabela de tamanhos
  const renderTabelaTamanhos = (
    tamanhos: Record<string, number>,
    quantidade: number,
    isEditing: boolean,
    onChange: (tamanho: string, valor: number) => void,
    tamanhosDisponiveis?: string[],
  ) => {
    // Filtrar apenas os tamanhos disponíveis para o produto
    const tamanhosFiltrados = tamanhosDisponiveis
      ? Object.fromEntries(Object.entries(tamanhos).filter(([tamanho]) => tamanhosDisponiveis.includes(tamanho)))
      : tamanhos

    return (
      <div className="space-y-2">
        <h4 className="font-medium text-primary">Tamanhos</h4>
        <div className="border border-gray-200 rounded-md">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-accent">
                <th className="border-b p-1 text-center font-medium text-xs text-primary w-[5%]">TAM.</th>
                {Object.keys(tamanhosFiltrados).map((tamanho) => (
                  <th
                    key={`header-${tamanho}`}
                    className="border-b p-1 text-center font-medium text-xs text-primary w-[7%]"
                  >
                    {tamanho}
                  </th>
                ))}
                <th className="border-b p-1 text-center font-medium text-xs text-primary w-[5%]">TOT.</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border-b p-1 text-center font-medium text-xs bg-accent">QTD.</td>
                {Object.entries(tamanhosFiltrados).map(([tamanho, valor]) => (
                  <td key={`cell-${tamanho}`} className="border-b p-1 text-center">
                    <div className="flex justify-center">
                      <input
                        type="number"
                        min="0"
                        value={valor}
                        onChange={(e) => onChange(tamanho, Number.parseInt(e.target.value) || 0)}
                        className="w-8 h-7 text-center text-xs border border-gray-300 rounded-md focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </td>
                ))}
                <td className="border-b p-1 text-center font-medium text-sm bg-accent">{quantidade}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // Componente para gerenciar imagem (upload, prévia, remoção)
  const GerenciadorImagem = ({
    imagem,
    onChange,
    inputRef,
    isEditing = true,
  }: {
    imagem?: string
    onChange: (novaImagem: string) => void
    inputRef: React.RefObject<HTMLInputElement>
    isEditing?: boolean
  }) => {
    if (!isEditing) return null

    return (
      <div className="mt-4">
        <Label className="text-primary">Imagem para Ficha Técnica</Label>
        <div className="flex items-center gap-4 mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-2 border-dashed border-2 hover:bg-accent transition-colors"
          >
            <ImageIcon className="h-4 w-4" />
            {imagem ? "Trocar Imagem" : "Adicionar Imagem"}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                converterImagemParaBase64(file, (base64) => {
                  onChange(base64)
                })
              }
            }}
            className="hidden"
          />
          {imagem && (
            <div className="relative">
              <img
                src={imagem || "/placeholder.svg"}
                alt="Prévia da imagem"
                className="h-20 w-20 object-cover rounded-md border shadow-sm"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                onClick={() => onChange("")}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {isLoading && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-md shadow-lg flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span>Processando...</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="numero" className="text-primary mb-1.5">
            Número do Orçamento
          </Label>
          <Input
            id="numero"
            value={orcamento.numero}
            onChange={(e) => atualizarOrcamento({ numero: e.target.value })}
            className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <Label htmlFor="data" className="text-primary mb-1.5">
            Data
          </Label>
          <Input
            id="data"
            type="date"
            value={orcamento.data}
            onChange={(e) => atualizarOrcamento({ data: e.target.value })}
            className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="cliente" className="text-primary mb-1.5">
          Selecione o Cliente
        </Label>
        <Select value={orcamento.cliente?.id || ""} onValueChange={handleClienteChange}>
          <SelectTrigger className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary">
            <SelectValue placeholder="Selecione um cliente" />
          </SelectTrigger>
          <SelectContent>
            {clientes.map((cliente) => (
              <SelectItem key={cliente.id} value={cliente.id}>
                {cliente.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <h3 className="font-medium text-lg text-primary">Itens do Orçamento</h3>

        <div className="border rounded-md overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-primary text-white">
              <tr>
                <th className="text-left p-3 w-[45%] rounded-tl-md">Produto</th>
                <th className="text-center p-3 w-[15%]">Valor Unit.</th>
                <th className="text-center p-3 w-[10%]">Qtd.</th>
                <th className="text-right p-3 w-[15%]">Total</th>
                <th className="p-3 w-[15%] rounded-tr-md text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {orcamento.itens.map((item) => (
                <React.Fragment key={item.id}>
                  <tr className="border-t hover:bg-accent/30 transition-colors">
                    <td className="p-3">
                      <div className="font-medium">{item.produto?.nome}</div>
                      {item.observacao && (
                        <div className="text-xs mt-1 text-gray-600 italic">
                          {item.observacao.length > 50 ? `${item.observacao.substring(0, 50)}...` : item.observacao}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {editandoItem === item.id ? (
                        <Input
                          type="number"
                          value={itemEmEdicao?.valorUnitario || 0}
                          onChange={(e) =>
                            setItemEmEdicao({
                              ...itemEmEdicao!,
                              valorUnitario: Number.parseFloat(e.target.value) || 0,
                            })
                          }
                          className="h-9 text-center w-28 border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      ) : (
                        <span className="flex items-center justify-center gap-1">
                          <DollarSign className="h-3 w-3 text-gray-500" />
                          {item.valorUnitario.toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center font-medium">{item.quantidade}</td>
                    <td className="p-3 text-right font-medium">
                      <span className="flex items-center justify-end gap-1">
                        <DollarSign className="h-3 w-3 text-gray-500" />
                        {(item.quantidade * item.valorUnitario).toFixed(2)}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {editandoItem === item.id ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
                              onClick={salvarEdicaoItem}
                              disabled={isLoading}
                            >
                              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                              onClick={cancelarEdicaoItem}
                              disabled={isLoading}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-primary hover:text-primary-dark hover:bg-primary/10"
                              onClick={() => iniciarEdicaoItem(item)}
                              disabled={isLoading}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removerItem(item.id)}
                              className="h-8 w-8 text-gray-500 hover:text-red-500 hover:bg-red-50"
                              disabled={isLoading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  {editandoItem === item.id && itemEmEdicao && (
                    <tr>
                      <td colSpan={5} className="p-4 bg-accent/50 border-t border-b">
                        {/* Seletor de Tecido, Cor e Descrição da Estampa */}
                        <ObservacaoField
                          observacao={itemEmEdicao.observacao}
                          onObservacaoChange={handleObservacaoChange}
                        />

                        {/* Tabela de Tamanhos */}
                        {renderTabelaTamanhos(
                          itemEmEdicao.tamanhos,
                          itemEmEdicao.quantidade,
                          true,
                          (tamanho, valor) => handleTamanhoChange(tamanho as keyof ItemOrcamento["tamanhos"], valor),
                          item.produto?.tamanhosDisponiveis,
                        )}

                        {/* Gerenciador de imagem para o item em edição */}
                        <GerenciadorImagem
                          imagem={itemEmEdicao.imagem}
                          onChange={(novaImagem) => setItemEmEdicao({ ...itemEmEdicao, imagem: novaImagem })}
                          inputRef={editImagemInputRef}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}

              {/* Linha para adicionar novo item */}
              <tr className="border-t hover:bg-accent/30 transition-colors">
                <td className="p-3" onClick={() => setLinhaAtiva("novo")}>
                  {linhaAtiva === "novo" ? (
                    <Select value={novoItem.produtoId || ""} onValueChange={handleProdutoChange}>
                      <SelectTrigger className="h-9 border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary">
                        <SelectValue placeholder="Selecione um produto" />
                      </SelectTrigger>
                      <SelectContent>
                        {produtos.map((produto) => (
                          <SelectItem key={produto.id} value={produto.id}>
                            {produto.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-primary h-9 hover:bg-primary/10 hover:text-primary-dark"
                      onClick={() => setLinhaAtiva("novo")}
                      disabled={isLoading}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar item...
                    </Button>
                  )}
                </td>
                <td className="p-3">
                  {linhaAtiva === "novo" && (
                    <Input
                      type="number"
                      value={novoItem.valorUnitario || ""}
                      onChange={(e) => setNovoItem({ ...novoItem, valorUnitario: Number.parseFloat(e.target.value) })}
                      className="h-9 text-center border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                      placeholder="0,00"
                    />
                  )}
                </td>
                <td className="p-3 text-center">
                  {linhaAtiva === "novo" && <div className="text-center font-medium">{novoItem.quantidade || 0}</div>}
                </td>
                <td className="p-3 text-right font-medium">
                  {linhaAtiva === "novo" && novoItem.valorUnitario && novoItem.quantidade ? (
                    <span className="flex items-center justify-end gap-1">
                      <DollarSign className="h-3 w-3 text-gray-500" />
                      {(novoItem.quantidade * novoItem.valorUnitario).toFixed(2)}
                    </span>
                  ) : (
                    ""
                  )}
                </td>
                <td className="p-3 text-center">
                  {linhaAtiva === "novo" && (
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleAdicionarItem}
                        disabled={isLoading || !novoItem.produtoId || !novoItem.valorUnitario}
                        className="h-8 w-8 text-white bg-primary hover:bg-primary-dark disabled:bg-gray-300"
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      </Button>
                    </div>
                  )}
                </td>
              </tr>

              {/* Linha para mostrar tamanhos do novo item - sempre visível quando um produto é selecionado */}
              {linhaAtiva === "novo" && novoItem.produtoId && (
                <tr>
                  <td colSpan={5} className="p-4 bg-accent/50 border-t border-b">
                    {/* Seletor de Tecido, Cor e Descrição da Estampa */}
                    <ObservacaoField observacao={novoItem.observacao} onObservacaoChange={handleObservacaoChange} />

                    {/* Tabela de Tamanhos */}
                    {renderTabelaTamanhos(
                      novoItem.tamanhos || {},
                      novoItem.quantidade || 0,
                      true,
                      (tamanho, valor) => handleNovoTamanhoChange(tamanho as keyof ItemOrcamento["tamanhos"], valor),
                      produtoSelecionado?.tamanhosDisponiveis,
                    )}

                    {/* Gerenciador de imagem para o novo item */}
                    <GerenciadorImagem
                      imagem={novoItem.imagem}
                      onChange={(novaImagem) => setNovoItem({ ...novoItem, imagem: novaImagem })}
                      inputRef={novoImagemInputRef}
                    />
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-primary text-white">
              <tr>
                <td colSpan={3} className="p-3 text-right font-medium">
                  Total do Orçamento:
                </td>
                <td className="p-3 text-right font-bold">R$ {calcularTotal().toFixed(2)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div>
        <Label htmlFor="observacoes" className="text-primary mb-1.5">
          Observações
        </Label>
        <Textarea
          id="observacoes"
          value={orcamento.observacoes}
          onChange={(e) => atualizarOrcamento({ observacoes: e.target.value })}
          rows={3}
          className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="condicoesPagamento" className="text-primary mb-1.5">
            Condições de Pagamento
          </Label>
          <Input
            id="condicoesPagamento"
            value={orcamento.condicoesPagamento}
            onChange={(e) => atualizarOrcamento({ condicoesPagamento: e.target.value })}
            className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <Label htmlFor="prazoEntrega" className="text-primary mb-1.5">
            Prazo de Entrega
          </Label>
          <Input
            id="prazoEntrega"
            value={orcamento.prazoEntrega}
            onChange={(e) => atualizarOrcamento({ prazoEntrega: e.target.value })}
            className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <Label htmlFor="validadeOrcamento" className="text-primary mb-1.5">
            Validade do Orçamento
          </Label>
          <Input
            id="validadeOrcamento"
            value={orcamento.validadeOrcamento}
            onChange={(e) => atualizarOrcamento({ validadeOrcamento: e.target.value })}
            className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>
    </div>
  )
}
