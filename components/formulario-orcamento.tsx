"use client"

import React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Edit, Check, X, ImageIcon, DollarSign, Loader2, ChevronUp, ChevronDown } from "lucide-react"
import type { Cliente, Produto, Orcamento, ItemOrcamento, Estampa } from "@/types/types"
import { supabase } from "@/lib/supabase"
import { toast } from "@/components/ui/use-toast"

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
  handleClienteChange: (clienteId: string) => void
}

// Update the tamanhosPadrao object to include all possible sizes
const tamanhosPadrao = {
  // Padrão (PP ao G7)
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
  // Numérico (36 ao 62) - apenas tamanhos pares
  "36": 0,
  "38": 0,
  "40": 0,
  "42": 0,
  "44": 0,
  "46": 0,
  "48": 0,
  "50": 0,
  "52": 0,
  "54": 0,
  "56": 0,
  "58": 0,
  "60": 0,
  "62": 0,
  // Infantil (0 ao 13)
  "0": 0,
  "1": 0,
  "2": 0,
  "3": 0,
  "4": 0,
  "5": 0,
  "6": 0,
  "7": 0,
  "8": 0,
  "9": 0,
  "10": 0,
  "11": 0,
  "12": 0,
  "13": 0,
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

// Substituir o componente EstampaInput por um novo que suporta múltiplas estampas
const EstampaInput = ({
  estampas = [],
  onChange,
}: {
  estampas?: Estampa[]
  onChange: (estampas: Estampa[]) => void
}) => {
  // Função para gerar um UUID válido em vez de um ID personalizado
  const generateId = () => {
    return generateUUID()
  }

  // Adicionar uma nova estampa
  const adicionarEstampa = () => {
    const novaEstampa: Estampa = {
      id: generateId(),
      posicao: undefined,
      tipo: undefined,
      largura: undefined,
    }
    onChange([...estampas, novaEstampa])
  }

  // Remover uma estampa
  const removerEstampa = (id: string) => {
    onChange(estampas.filter((estampa) => estampa.id !== id))
  }

  // Atualizar uma estampa específica
  const atualizarEstampa = (id: string, campo: string, valor: string | number) => {
    onChange(estampas.map((estampa) => (estampa.id === id ? { ...estampa, [campo]: valor } : estampa)))
  }

  const posicoes = [
    "Peito esquerdo",
    "Peito direito",
    "Costas",
    "Bolso esquerdo",
    "Bolso direito",
    "Manga esquerda",
    "Manga direita",
  ]
  const tipos = ["Bordado", "Silk", "DTF", "Sublimação"]

  return (
    <div className="space-y-4">
      {estampas.map((estampa, index) => (
        <div key={estampa.id} className="border rounded-md p-3 bg-accent/30 relative">
          <button
            type="button"
            onClick={() => removerEstampa(estampa.id!)}
            className="absolute top-2 right-2 text-gray-500 hover:text-red-500 bg-white rounded-full p-1 shadow-sm"
          >
            <X className="h-4 w-4" />
          </button>

          <h4 className="font-medium mb-3 text-primary">Arte {index + 1}</h4>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor={`estampa-posicao-${estampa.id}`} className="text-primary mb-1.5">
                Posição
              </Label>
              <Select
                value={estampa.posicao || ""}
                onValueChange={(value) => atualizarEstampa(estampa.id!, "posicao", value)}
              >
                <SelectTrigger className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary">
                  <SelectValue placeholder="Selecione a posição" />
                </SelectTrigger>
                <SelectContent>
                  {posicoes.map((posicao) => (
                    <SelectItem key={posicao} value={posicao}>
                      {posicao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor={`estampa-tipo-${estampa.id}`} className="text-primary mb-1.5">
                Tipo
              </Label>
              <Select
                value={estampa.tipo || ""}
                onValueChange={(value) => atualizarEstampa(estampa.id!, "tipo", value)}
              >
                <SelectTrigger className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tipos.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor={`estampa-largura-${estampa.id}`} className="text-primary mb-1.5">
                Largura (cm)
              </Label>
              <Input
                id={`estampa-largura-${estampa.id}`}
                type="number"
                value={estampa.largura || ""}
                onChange={(e) => atualizarEstampa(estampa.id!, "largura", Number(e.target.value))}
                className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="0"
                min="0"
                step="0.5"
              />
            </div>
          </div>
        </div>
      ))}

      <Button
        type="button"
        onClick={adicionarEstampa}
        variant="outline"
        className="w-full mt-2 border-dashed border-2 hover:bg-accent/20"
      >
        <Plus className="h-4 w-4 mr-2" /> Adicionar Arte
      </Button>
    </div>
  )
}

// Modifique a função renderTabelaTamanhos para preservar a ordem original dos tamanhos
const renderTabelaTamanhos = (
  tamanhos: Record<string, number>,
  quantidade: number,
  isEditing: boolean,
  onChange: (tamanho: string, valor: number) => void,
  tamanhosDisponiveis?: string[],
) => {
  // Criar um objeto que mantém apenas os tamanhos disponíveis, mas preserva a ordem original
  const tamanhosFiltrados: Record<string, number> = {}

  // Percorrer os tamanhos na ordem original do tamanhosPadrao
  Object.keys(tamanhosPadrao).forEach((tamanho) => {
    // Se não houver lista de tamanhos disponíveis OU o tamanho estiver na lista de disponíveis
    if (!tamanhosDisponiveis || tamanhosDisponiveis.includes(tamanho)) {
      // Adicionar o tamanho ao objeto filtrado, mantendo seu valor atual
      tamanhosFiltrados[tamanho] = tamanhos[tamanho] || 0
    }
  })

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
  const containerRef = useRef<HTMLDivElement>(null)

  // Adicionar event listener para o evento de colar
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!isEditing) return

      // Verificar se há itens na área de transferência
      if (e.clipboardData && e.clipboardData.items) {
        const items = e.clipboardData.items

        // Procurar por uma imagem nos itens colados
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") !== -1) {
            // Encontrou uma imagem, obter o arquivo
            const file = items[i].getAsFile()
            if (file) {
              e.preventDefault() // Prevenir o comportamento padrão

              // Converter para base64 e atualizar o estado
              converterImagemParaBase64(file, (base64) => {
                onChange(base64)
                toast({
                  title: "Imagem colada com sucesso!",
                  description: "A imagem da área de transferência foi adicionada.",
                })
              })
              break
            }
          }
        }
      }
    }

    // Adicionar o event listener ao documento
    document.addEventListener("paste", handlePaste)

    // Remover o event listener quando o componente for desmontado
    return () => {
      document.removeEventListener("paste", handlePaste)
    }
  }, [isEditing, onChange])

  if (!isEditing) return null

  return (
    <div className="mt-4" ref={containerRef}>
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
        <div className="text-sm text-gray-500 italic">
          Você também pode colar uma imagem diretamente da área de transferência (Ctrl+V)
        </div>
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

export default function FormularioOrcamento({
  orcamento,
  clientes,
  produtos,
  atualizarOrcamento,
  adicionarItem,
  removerItem,
  atualizarItem,
  calcularTotal,
  handleClienteChange,
}: FormularioOrcamentoProps) {
  const [linhaAtiva, setLinhaAtiva] = useState<string | null>(null)
  const [editandoItem, setEditandoItem] = useState<string | null>(null)
  // Atualizar a inicialização de novoItem
  const [novoItem, setNovoItem] = useState<Partial<ItemOrcamento>>({
    produtoId: "",
    quantidade: 0,
    valorUnitario: 0,
    tamanhos: { ...tamanhosPadrao },
    imagem: "",
    observacaoComercial: "",
    observacaoTecnica: "",
    estampas: [],
  })
  const [itemEmEdicao, setItemEmEdicao] = useState<ItemOrcamento | null>(null)
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null)

  // Refs para os inputs de arquivo
  const novoImagemInputRef = useRef<HTMLInputElement>(null)
  const editImagemInputRef = useRef<HTMLInputElement>(null)

  // Mostrar tabela de tamanhos automaticamente quando um produto for selecionado
  useEffect(() => {
    if (novoItem.produtoId) {
      // Produto selecionado, mostrar tabela de tamanhos
    }
  }, [novoItem.produtoId])

  const handleProdutoChange = async (produtoId: string) => {
    try {
      setIsLoading(true)
      setErrorMessage(null)

      // Primeiro, verificar se o produto está na lista local
      const produtoLocal = produtos.find((p) => p.id === produtoId)

      if (produtoLocal) {
        // Se o produto estiver na lista local, use-o diretamente
        setProdutoSelecionado(produtoLocal)
        setNovoItem({
          ...novoItem,
          produtoId,
          produto: produtoLocal,
          valorUnitario: produtoLocal.valorBase,
        })
        setIsLoading(false)
        return
      }

      // Se não estiver na lista local, busque do Supabase
      // Buscar o produto completo
      const { data: produtosData, error: produtoError } = await supabase
        .from("produtos")
        .select("*")
        .eq("id", produtoId)
        .single()

      if (produtoError) {
        throw produtoError
      }

      if (produtosData) {
        // Buscar tecidos do produto
        const { data: tecidosData, error: tecidosError } = await supabase
          .from("tecidos")
          .select("*")
          .eq("produto_id", produtoId)

        if (tecidosError) throw tecidosError

        // Converter para o formato da aplicação
        const produto: Produto = {
          id: produtosData.id,
          nome: produtosData.nome,
          valorBase: Number(produtosData.valor_base),
          tecidos: tecidosData
            ? tecidosData.map((t) => ({
                nome: t.nome,
                composicao: t.composicao || "",
              }))
            : [],
          cores: produtosData.cores || [],
          tamanhosDisponiveis: produtosData.tamanhos_disponiveis || [],
        }

        setProdutoSelecionado(produto)
        setNovoItem({
          ...novoItem,
          produtoId,
          produto,
          valorUnitario: produto.valorBase,
        })
      } else {
        // Produto não encontrado
        setErrorMessage("Produto não encontrado no banco de dados")
        setProdutoSelecionado(null)
        setNovoItem({
          ...novoItem,
          produtoId: "",
          produto: undefined,
          valorUnitario: 0,
        })
      }
    } catch (error) {
      console.error("Erro ao carregar produto:", error)
      setErrorMessage(`Erro ao carregar produto: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
      setProdutoSelecionado(null)
      setNovoItem({
        ...novoItem,
        produtoId: "",
        produto: undefined,
        valorUnitario: 0,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Substituir handleEstampaChange por handleEstampasChange
  const handleEstampasChange = (estampas: Estampa[]) => {
    if (editandoItem && itemEmEdicao) {
      setItemEmEdicao({
        ...itemEmEdicao,
        estampas,
      })
    } else {
      setNovoItem({
        ...novoItem,
        estampas,
      })
    }
  }

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
          imagem: "",
          observacaoComercial: "",
          observacaoTecnica: "",
          estampas: [],
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

  // Adicione esta função após a função handleCorChange
  const handleTextUppercase = (e: React.ChangeEvent<HTMLInputElement>, field: keyof Orcamento) => {
    const value = e.target.value.toUpperCase()
    atualizarOrcamento({ [field]: value })
  }

  // Funções para mover itens para cima ou para baixo
  const moverItemParaCima = (index: number) => {
    if (index <= 0) return // Já está no topo

    const novosItens = [...orcamento.itens]
    // Trocar o item atual com o item acima
    const temp = novosItens[index]
    novosItens[index] = novosItens[index - 1]
    novosItens[index - 1] = temp

    // Atualizar o orçamento com a nova ordem
    atualizarOrcamento({ itens: novosItens })
  }

  const moverItemParaBaixo = (index: number) => {
    if (index >= orcamento.itens.length - 1) return // Já está no final

    const novosItens = [...orcamento.itens]
    // Trocar o item atual com o item abaixo
    const temp = novosItens[index]
    novosItens[index] = novosItens[index + 1]
    novosItens[index + 1] = temp

    // Atualizar o orçamento com a nova ordem
    atualizarOrcamento({ itens: novosItens })
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

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md mb-4">
          <p className="text-sm">{errorMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="numero" className="text-primary mb-1.5">
            Número do Orçamento
          </Label>
          <Input
            id="numero"
            value={orcamento.numero.split(" - ")[0]} // Extrair apenas o número
            onChange={(e) => {
              // Preservar o restante do formato ao atualizar apenas o número
              const numeroAtual = e.target.value
              const partes = orcamento.numero.split(" - ")

              // Se tiver o formato padrão, manter a parte após o número
              if (partes.length > 1) {
                atualizarOrcamento({ numero: `${numeroAtual} - ${partes.slice(1).join(" - ")}` })
              } else {
                // Caso não tenha o formato padrão, usar apenas o número
                atualizarOrcamento({ numero: numeroAtual })
              }
            }}
            className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="Apenas o número"
          />
          {orcamento.numero.includes(" - ") && (
            <p className="text-xs text-gray-500 mt-1">Formato completo: {orcamento.numero}</p>
          )}
        </div>
        <div>
          <Label htmlFor="data" className="text-primary mb-1.5">
            Data
          </Label>
          <Input
            id="data"
            type="date"
            value={orcamento.data}
            onChange={(e) => {
              // Garantir que a data seja armazenada no formato YYYY-MM-DD
              const dataFormatada = e.target.value
              atualizarOrcamento({ data: dataFormatada })
            }}
            className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <Label htmlFor="status" className="text-primary mb-1.5">
            Status
          </Label>
          <Select value={orcamento.status || "5"} onValueChange={(value) => atualizarOrcamento({ status: value })}>
            <SelectTrigger className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary">
              <SelectValue placeholder="Selecione o status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 - Proposta</SelectItem>
              <SelectItem value="4">4 - Execução</SelectItem>
              <SelectItem value="3">3 - Emitir Cobrança</SelectItem>
              <SelectItem value="2">2 - Entregue</SelectItem>
              <SelectItem value="1">1 - Finalizada</SelectItem>
            </SelectContent>
          </Select>
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
                {cliente.cnpj} - {cliente.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <Label htmlFor="nomeContato" className="text-primary mb-1.5">
              Nome do Contato
            </Label>
            <Input
              id="nomeContato"
              value={orcamento.nomeContato || ""}
              onChange={(e) => atualizarOrcamento({ nomeContato: e.target.value })}
              className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Nome da pessoa de contato"
            />
          </div>
          <div>
            <Label htmlFor="telefoneContato" className="text-primary mb-1.5">
              Telefone do Contato
            </Label>
            <Input
              id="telefoneContato"
              value={orcamento.telefoneContato || ""}
              onChange={(e) => atualizarOrcamento({ telefoneContato: e.target.value })}
              className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="(00) 00000-0000"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-medium text-lg text-primary">Itens do Orçamento</h3>
        <p className="text-sm text-gray-500 mb-2">
          <span className="inline-block mr-1">💡</span>
          Dica: Você pode arrastar os itens para reordená-los. Uma linha azul indicará onde o item será posicionado.
        </p>

        <div className="border rounded-md overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-primary text-white">
              <tr>
                <th className="p-3 w-[5%] rounded-tl-md"></th>
                <th className="text-left p-3 w-[40%]">Produto</th>
                <th className="text-center p-3 w-[15%]">Valor Unit.</th>
                <th className="text-center p-3 w-[10%]">Qtd.</th>
                <th className="text-right p-3 w-[15%]">Total</th>
                <th className="p-3 w-[15%] rounded-tr-md text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {orcamento.itens.map((item, index) => (
                <React.Fragment key={item.id}>
                  {dragOverItemId === item.id && (
                    <tr className="border-t">
                      <td colSpan={6} className="p-0">
                        <div className="h-1 bg-primary animate-pulse rounded-full mx-2"></div>
                      </td>
                    </tr>
                  )}
                  <tr
                    className={`border-t hover:bg-accent/30 transition-colors ${
                      editandoItem === item.id ? "bg-accent/50" : ""
                    }`}
                    draggable={true}
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", item.id)
                      e.currentTarget.classList.add("opacity-50")
                    }}
                    onDragEnd={(e) => {
                      e.currentTarget.classList.remove("opacity-50")
                      setDragOverItemId(null)
                    }}
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.dataTransfer.dropEffect = "move"
                      if (dragOverItemId !== item.id) {
                        setDragOverItemId(item.id)
                      }
                    }}
                    onDragLeave={(e) => {
                      // Verificar se realmente saiu do elemento (e não apenas entrou em um filho)
                      const relatedTarget = e.relatedTarget as Node
                      if (!e.currentTarget.contains(relatedTarget)) {
                        setDragOverItemId(null)
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      setDragOverItemId(null)
                      const draggedItemId = e.dataTransfer.getData("text/plain")
                      const draggedIndex = orcamento.itens.findIndex((i) => i.id === draggedItemId)
                      const targetIndex = index

                      if (draggedIndex !== targetIndex) {
                        const novosItens = [...orcamento.itens]
                        const [itemRemovido] = novosItens.splice(draggedIndex, 1)
                        novosItens.splice(targetIndex, 0, itemRemovido)
                        atualizarOrcamento({ itens: novosItens })

                        // Mostrar toast de confirmação
                        toast({
                          title: "Item reordenado",
                          description: "A ordem dos itens foi atualizada e salva com sucesso.",
                          duration: 2000,
                        })
                      }
                    }}
                  >
                    <td className="p-3 text-center">
                      <div className="flex flex-col items-center gap-1 cursor-grab" title="Arraste para reordenar">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => moverItemParaCima(index)}
                          disabled={index === 0 || isLoading}
                          className="h-6 w-6 rounded-full hover:bg-primary/10"
                          title="Mover para cima"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => moverItemParaBaixo(index)}
                          disabled={index === orcamento.itens.length - 1 || isLoading}
                          className="h-6 w-6 rounded-full hover:bg-primary/10"
                          title="Mover para baixo"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium">{item.produto?.nome}</div>
                      {item.observacaoComercial && (
                        <div className="text-xs mt-1 text-gray-600 italic">{item.observacaoComercial}</div>
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
                      <td colSpan={6} className="p-4 bg-accent/50 border-t border-b">
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            {/* Seleção de tecido */}
                            {produtoSelecionado?.tecidos && produtoSelecionado.tecidos.length > 0 && (
                              <div>
                                <Label htmlFor="tecido" className="text-primary mb-1.5">
                                  Tecido
                                </Label>
                                <Select
                                  value={itemEmEdicao.tecidoSelecionado?.nome || ""}
                                  onValueChange={handleTecidoChange}
                                >
                                  <SelectTrigger className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary">
                                    <SelectValue placeholder="Selecione o tecido" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {produtoSelecionado.tecidos.map((tecido) => (
                                      <SelectItem key={tecido.nome} value={tecido.nome}>
                                        {tecido.nome} {tecido.composicao ? `- ${tecido.composicao}` : ""}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            {/* Seleção de cor */}
                            {produtoSelecionado?.cores && produtoSelecionado.cores.length > 0 && (
                              <div>
                                <Label htmlFor="cor" className="text-primary mb-1.5">
                                  Cor
                                </Label>
                                <Select value={itemEmEdicao.corSelecionada || ""} onValueChange={handleCorChange}>
                                  <SelectTrigger className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary">
                                    <SelectValue placeholder="Selecione a cor" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {produtoSelecionado.cores.map((cor) => (
                                      <SelectItem key={cor} value={cor}>
                                        {cor}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>

                          {/* Tabela de tamanhos */}
                          {renderTabelaTamanhos(
                            itemEmEdicao.tamanhos,
                            itemEmEdicao.quantidade,
                            true,
                            handleTamanhoChange,
                            produtoSelecionado?.tamanhosDisponiveis,
                          )}

                          {/* Observações */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="observacaoComercial" className="text-primary mb-1.5">
                                Observação Comercial
                              </Label>
                              <Textarea
                                id="observacaoComercial"
                                value={itemEmEdicao.observacaoComercial || ""}
                                onChange={(e) =>
                                  setItemEmEdicao({
                                    ...itemEmEdicao,
                                    observacaoComercial: e.target.value,
                                  })
                                }
                                className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                                rows={3}
                              />
                            </div>
                            <div>
                              <Label htmlFor="observacaoTecnica" className="text-primary mb-1.5">
                                Observação Técnica
                              </Label>
                              <Textarea
                                id="observacaoTecnica"
                                value={itemEmEdicao.observacaoTecnica || ""}
                                onChange={(e) =>
                                  setItemEmEdicao({
                                    ...itemEmEdicao,
                                    observacaoTecnica: e.target.value,
                                  })
                                }
                                className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                                rows={3}
                              />
                            </div>
                          </div>

                          {/* Gerenciador de imagem */}
                          <GerenciadorImagem
                            imagem={itemEmEdicao.imagem}
                            onChange={(novaImagem) =>
                              setItemEmEdicao({
                                ...itemEmEdicao,
                                imagem: novaImagem,
                              })
                            }
                            inputRef={editImagemInputRef}
                          />

                          {/* Estampas */}
                          <div>
                            <Label className="text-primary mb-1.5">Estampas</Label>
                            <EstampaInput estampas={itemEmEdicao.estampas || []} onChange={handleEstampasChange} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}

              {/* Adicionar linha de destaque no final da lista */}
              {dragOverItemId === "end-of-list" && (
                <tr className="border-t">
                  <td colSpan={6} className="p-0">
                    <div className="h-1 bg-primary animate-pulse rounded-full mx-2"></div>
                  </td>
                </tr>
              )}
              <tr
                className="border-t hover:bg-accent/30 transition-colors"
                onDragOver={(e) => {
                  e.preventDefault()
                  e.dataTransfer.dropEffect = "move"
                  if (dragOverItemId !== "end-of-list") {
                    setDragOverItemId("end-of-list")
                  }
                }}
                onDragLeave={(e) => {
                  const relatedTarget = e.relatedTarget as Node
                  if (!e.currentTarget.contains(relatedTarget)) {
                    setDragOverItemId(null)
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragOverItemId(null)
                  const draggedItemId = e.dataTransfer.getData("text/plain")
                  const draggedIndex = orcamento.itens.findIndex((i) => i.id === draggedItemId)

                  // Mover para o final da lista
                  if (draggedIndex !== -1 && draggedIndex !== orcamento.itens.length - 1) {
                    const novosItens = [...orcamento.itens]
                    const [itemRemovido] = novosItens.splice(draggedIndex, 1)
                    novosItens.push(itemRemovido)
                    atualizarOrcamento({ itens: novosItens })

                    // Mostrar toast de confirmação
                    toast({
                      title: "Item reordenado",
                      description: "O item foi movido para o final da lista.",
                      duration: 2000,
                    })
                  }
                }}
              >
                <td className="p-3"></td>
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
            </tbody>
            <tfoot className="bg-primary text-white">
              <tr>
                <td colSpan={4} className="p-3 text-right font-medium">
                  Valor dos Produtos:
                </td>
                <td className="p-3 text-right font-medium">R$ {calcularTotal().toFixed(2)}</td>
                <td></td>
              </tr>
              <tr>
                <td colSpan={4} className="p-3 text-right font-medium">
                  Valor do Frete:
                </td>
                <td className="p-3 text-right font-medium">
                  <div className="flex justify-end">
                    <span className="mr-2">R$</span>
                    <Input
                      type="number"
                      value={orcamento.valorFrete || ""}
                      onChange={(e) =>
                        atualizarOrcamento({ valorFrete: e.target.value ? Number(e.target.value) : undefined })
                      }
                      className="w-24 h-7 text-right text-black border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                      placeholder="0,00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </td>
                <td></td>
              </tr>
              <tr>
                <td colSpan={4} className="p-3 text-right font-bold">
                  Total do Orçamento:
                </td>
                <td className="p-3 text-right font-bold">
                  R$ {(calcularTotal() + (orcamento.valorFrete || 0)).toFixed(2)}
                </td>
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
            onChange={(e) => handleTextUppercase(e, "condicoesPagamento")}
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
            onChange={(e) => handleTextUppercase(e, "prazoEntrega")}
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
            onChange={(e) => handleTextUppercase(e, "validadeOrcamento")}
            className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>
    </div>
  )
}
