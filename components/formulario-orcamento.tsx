"use client"

import React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Edit, Check, X, DollarSign, ImageIcon, Loader2 } from "lucide-react"
import type { Cliente, Produto, Orcamento, ItemOrcamento } from "@/types/types"
import { useToast } from "@/components/ui/use-toast"

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
    descricaoEstampa: "",
  })
  const [itemEmEdicao, setItemEmEdicao] = useState<ItemOrcamento | null>(null)
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null)
  const [imagemPreview, setImagemPreview] = useState<string | null>(null)
  const [imagemEditPreview, setImagemEditPreview] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const { toast } = useToast()

  const handleClienteChange = (clienteId: string) => {
    const cliente = clientes.find((c) => c.id === clienteId) || null
    atualizarOrcamento({ cliente })
  }

  const handleProdutoChange = (produtoId: string) => {
    const produto = produtos.find((p) => p.id === produtoId)
    if (produto) {
      setProdutoSelecionado(produto)
      setNovoItem({
        ...novoItem,
        produtoId,
        produto,
        valorUnitario: produto.valorBase,
      })
    }
  }

  // Função para comprimir imagem base64
  const comprimirImagem = (base64Image: string, qualidade = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.src = base64Image
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")

        // Calcular novas dimensões (reduzir para 50% se for muito grande)
        let width = img.width
        let height = img.height

        if (width > 800 || height > 800) {
          const ratio = Math.min(800 / width, 800 / height)
          width = width * ratio
          height = height * ratio
        }

        canvas.width = width
        canvas.height = height

        if (!ctx) {
          reject(new Error("Não foi possível obter o contexto do canvas"))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        // Converter para JPEG com qualidade reduzida
        const compressedImage = canvas.toDataURL("image/jpeg", qualidade)
        resolve(compressedImage)
      }

      img.onerror = () => {
        reject(new Error("Erro ao carregar a imagem"))
      }
    })
  }

  // Função para lidar com o upload de imagens
  const handleImagemUpload = async (event: React.ChangeEvent<HTMLInputElement>, isEditing: boolean) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Verificar o tamanho do arquivo (limitar a 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "A imagem é muito grande. O tamanho máximo é 5MB.",
        variant: "destructive",
      })
      return
    }

    setIsUploadingImage(true)

    try {
      // Converter o arquivo para base64
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64Image = e.target?.result as string

        try {
          // Comprimir a imagem
          const compressedImage = await comprimirImagem(base64Image, 0.6)

          if (isEditing && itemEmEdicao) {
            setImagemEditPreview(compressedImage)
            setItemEmEdicao({
              ...itemEmEdicao,
              imagem: compressedImage,
            })
          } else {
            setImagemPreview(compressedImage)
            setNovoItem({
              ...novoItem,
              imagem: compressedImage,
            })
          }

          toast({
            title: "Sucesso",
            description: "Imagem carregada com sucesso!",
          })
        } catch (error) {
          console.error("Erro ao comprimir imagem:", error)
          toast({
            title: "Erro",
            description: "Não foi possível processar a imagem.",
            variant: "destructive",
          })
        } finally {
          setIsUploadingImage(false)
        }
      }

      reader.onerror = () => {
        toast({
          title: "Erro",
          description: "Não foi possível ler o arquivo.",
          variant: "destructive",
        })
        setIsUploadingImage(false)
      }

      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Erro ao processar a imagem:", error)
      toast({
        title: "Erro",
        description: "Não foi possível processar a imagem.",
        variant: "destructive",
      })
      setIsUploadingImage(false)
    }
  }

  const handleRemoverImagem = (isEditing: boolean) => {
    if (isEditing && itemEmEdicao) {
      setImagemEditPreview(null)
      setItemEmEdicao({
        ...itemEmEdicao,
        imagem: undefined,
      })
    } else {
      setImagemPreview(null)
      setNovoItem({
        ...novoItem,
        imagem: undefined,
      })
    }

    toast({
      title: "Sucesso",
      description: "Imagem removida com sucesso!",
    })
  }

  const handleAdicionarItem = () => {
    if (novoItem.produtoId && novoItem.valorUnitario) {
      const novoItemCompleto: ItemOrcamento = {
        ...(novoItem as ItemOrcamento),
        id: Date.now().toString(),
        quantidade: novoItem.quantidade || 1,
      }

      adicionarItem(novoItemCompleto)

      // Limpar o estado
      setNovoItem({
        produtoId: "",
        quantidade: 0,
        valorUnitario: 0,
        tamanhos: { ...tamanhosPadrao },
        tecidoSelecionado: undefined,
        corSelecionada: undefined,
        descricaoEstampa: "",
        imagem: "",
      })
      setProdutoSelecionado(null)
      setLinhaAtiva(null)
      setImagemPreview(null)

      toast({
        title: "Item adicionado",
        description: "O item foi adicionado ao orçamento com sucesso.",
      })
    }
  }

  const iniciarEdicaoItem = (item: ItemOrcamento) => {
    setItemEmEdicao({ ...item })
    setEditandoItem(item.id)

    // Se o item já tem uma imagem, mostrar o preview
    if (item.imagem) {
      setImagemEditPreview(item.imagem)
    } else {
      setImagemEditPreview(null)
    }

    // Buscar o produto para ter acesso às opções de tecido, cor e tamanho
    if (item.produto) {
      setProdutoSelecionado(item.produto)
    }
  }

  const salvarEdicaoItem = () => {
    if (itemEmEdicao) {
      atualizarItem(itemEmEdicao.id, itemEmEdicao)

      // Limpar o estado
      setEditandoItem(null)
      setItemEmEdicao(null)
      setProdutoSelecionado(null)
      setImagemEditPreview(null)

      toast({
        title: "Sucesso",
        description: "Item atualizado com sucesso!",
      })
    }
  }

  const cancelarEdicaoItem = () => {
    setEditandoItem(null)
    setItemEmEdicao(null)
    setProdutoSelecionado(null)
    setImagemEditPreview(null)
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

  // Componente para upload de imagem
  const ImagemUploader = ({
    isEditing,
    imagemPreview,
  }: { isEditing: boolean; imagemPreview: string | null | undefined }) => {
    return (
      <div className="mt-4">
        <Label className="text-primary">Imagem para Ficha Técnica</Label>
        <div className="flex flex-wrap items-start gap-4 mt-2">
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById(isEditing ? "edit-image-input" : "new-image-input")?.click()}
              className="flex items-center gap-2"
              disabled={isUploadingImage}
            >
              {isUploadingImage ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <ImageIcon className="h-4 w-4" />
                  {imagemPreview ? "Trocar Imagem" : "Adicionar Imagem"}
                </>
              )}
            </Button>
            <input
              id={isEditing ? "edit-image-input" : "new-image-input"}
              type="file"
              accept="image/*"
              onChange={(e) => handleImagemUpload(e, isEditing)}
              className="hidden"
              disabled={isUploadingImage}
            />
            {imagemPreview && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => handleRemoverImagem(isEditing)}
                className="w-fit"
                disabled={isUploadingImage}
              >
                <X className="h-4 w-4 mr-2" /> Remover imagem
              </Button>
            )}
          </div>
          {imagemPreview && (
            <div className="border rounded-md p-2 shadow-sm">
              <img
                src={imagemPreview || "/placeholder.svg"}
                alt="Prévia da imagem"
                className="h-32 object-contain"
                onError={(e) => {
                  console.error("Erro ao carregar imagem preview")
                  ;(e.target as HTMLImageElement).src = "/generic-product-display.png"
                }}
              />
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
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
        <select
          id="cliente"
          value={orcamento.cliente?.id || ""}
          onChange={(e) => handleClienteChange(e.target.value)}
          className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
        >
          <option value="">Selecione um cliente</option>
          {clientes.map((cliente) => (
            <option key={cliente.id} value={cliente.id}>
              {cliente.nome}
            </option>
          ))}
        </select>
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
                      {item.tecidoSelecionado && (
                        <div className="text-xs mt-1">
                          <span className="bg-primary text-white px-1.5 py-0.5 rounded text-[10px] mr-1">TECIDO</span>
                          {item.tecidoSelecionado.nome}
                        </div>
                      )}
                      {item.corSelecionada && (
                        <div className="text-xs mt-1">
                          <span className="bg-primary text-white px-1.5 py-0.5 rounded text-[10px] mr-1">COR</span>
                          {item.corSelecionada}
                        </div>
                      )}
                      {item.descricaoEstampa && (
                        <div className="text-xs mt-1">
                          <span className="bg-primary text-white px-1.5 py-0.5 rounded text-[10px] mr-1">ESTAMPA</span>
                          {item.descricaoEstampa.length > 30
                            ? `${item.descricaoEstampa.substring(0, 30)}...`
                            : item.descricaoEstampa}
                        </div>
                      )}
                      {item.imagem && (
                        <div className="text-xs mt-1">
                          <span className="bg-success text-white px-1.5 py-0.5 rounded text-[10px] mr-1">IMAGEM</span>
                          Imagem incluída
                        </div>
                      )}
                    </td>
                    <td className="p-3">
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
                              onClick={salvarEdicaoItem}
                              className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
                              disabled={isUploadingImage}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={cancelarEdicaoItem}
                              className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                              disabled={isUploadingImage}
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
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removerItem(item.id)}
                              className="h-8 w-8 text-gray-500 hover:text-red-500 hover:bg-red-50"
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
                        <div className="space-y-4">
                          {/* Seletor de Tecido */}
                          <div>
                            <Label className="text-primary">Tecido</Label>
                            <select
                              value={itemEmEdicao.tecidoSelecionado?.nome || ""}
                              onChange={(e) => {
                                const tecido = item.produto?.tecidos.find((t) => t.nome === e.target.value)
                                if (tecido) {
                                  setItemEmEdicao({
                                    ...itemEmEdicao,
                                    tecidoSelecionado: tecido,
                                  })
                                }
                              }}
                              className="w-full h-10 px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                            >
                              <option value="">Selecione o tecido</option>
                              {item.produto?.tecidos.map((tecido, index) => (
                                <option key={index} value={tecido.nome}>
                                  {tecido.nome} - {tecido.composicao}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Seletor de Cor */}
                          <div>
                            <Label className="text-primary">Cor</Label>
                            <select
                              value={itemEmEdicao.corSelecionada || ""}
                              onChange={(e) => {
                                setItemEmEdicao({
                                  ...itemEmEdicao,
                                  corSelecionada: e.target.value,
                                })
                              }}
                              className="w-full h-10 px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                            >
                              <option value="">Selecione a cor</option>
                              {item.produto?.cores.map((cor, index) => (
                                <option key={index} value={cor}>
                                  {cor}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Descrição da Estampa */}
                          <div>
                            <Label className="text-primary">Descrição da Estampa</Label>
                            <textarea
                              value={itemEmEdicao.descricaoEstampa || ""}
                              onChange={(e) => {
                                setItemEmEdicao({
                                  ...itemEmEdicao,
                                  descricaoEstampa: e.target.value,
                                })
                              }}
                              placeholder="Descreva os detalhes da estampa (posição, cores, tamanho, etc.)"
                              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                              rows={3}
                            />
                          </div>

                          {/* Tabela de Tamanhos */}
                          {renderTabelaTamanhos(
                            itemEmEdicao.tamanhos,
                            itemEmEdicao.quantidade,
                            true,
                            (tamanho, valor) => handleTamanhoChange(tamanho as keyof ItemOrcamento["tamanhos"], valor),
                            item.produto?.tamanhosDisponiveis,
                          )}

                          {/* Componente de upload de imagem */}
                          <ImagemUploader isEditing={true} imagemPreview={imagemEditPreview} />
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}

              {/* Linha para adicionar novo item */}
              <tr className="border-t hover:bg-accent/30 transition-colors">
                <td className="p-3" onClick={() => setLinhaAtiva("novo")}>
                  {linhaAtiva === "novo" ? (
                    <select
                      value={novoItem.produtoId || ""}
                      onChange={(e) => handleProdutoChange(e.target.value)}
                      className="w-full h-9 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                      <option value="">Selecione um produto</option>
                      {produtos.map((produto) => (
                        <option key={produto.id} value={produto.id}>
                          {produto.nome}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-primary h-9 hover:bg-primary/10 hover:text-primary-dark"
                      onClick={() => setLinhaAtiva("novo")}
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
                        disabled={!novoItem.produtoId || !novoItem.valorUnitario || isUploadingImage}
                        className="h-8 w-8 text-white bg-primary hover:bg-primary-dark disabled:bg-gray-300"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </td>
              </tr>

              {/* Linha para mostrar tamanhos do novo item - sempre visível quando um produto é selecionado */}
              {linhaAtiva === "novo" && novoItem.produtoId && (
                <tr>
                  <td colSpan={5} className="p-4 bg-accent/50 border-t border-b">
                    <div className="space-y-4">
                      {/* Seletor de Tecido */}
                      <div>
                        <Label className="text-primary">Tecido</Label>
                        <select
                          value={novoItem.tecidoSelecionado?.nome || ""}
                          onChange={(e) => {
                            const tecido = produtoSelecionado?.tecidos.find((t) => t.nome === e.target.value)
                            if (tecido) {
                              setNovoItem({
                                ...novoItem,
                                tecidoSelecionado: tecido,
                              })
                            }
                          }}
                          className="w-full h-10 px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        >
                          <option value="">Selecione o tecido</option>
                          {produtoSelecionado?.tecidos.map((tecido, index) => (
                            <option key={index} value={tecido.nome}>
                              {tecido.nome} - {tecido.composicao}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Seletor de Cor */}
                      <div>
                        <Label className="text-primary">Cor</Label>
                        <select
                          value={novoItem.corSelecionada || ""}
                          onChange={(e) => {
                            setNovoItem({
                              ...novoItem,
                              corSelecionada: e.target.value,
                            })
                          }}
                          className="w-full h-10 px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        >
                          <option value="">Selecione a cor</option>
                          {produtoSelecionado?.cores.map((cor, index) => (
                            <option key={index} value={cor}>
                              {cor}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Descrição da Estampa */}
                      <div>
                        <Label className="text-primary">Descrição da Estampa</Label>
                        <textarea
                          value={novoItem.descricaoEstampa || ""}
                          onChange={(e) => {
                            setNovoItem({
                              ...novoItem,
                              descricaoEstampa: e.target.value,
                            })
                          }}
                          placeholder="Descreva os detalhes da estampa (posição, cores, tamanho, etc.)"
                          className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                          rows={3}
                        />
                      </div>

                      {/* Tabela de Tamanhos */}
                      {renderTabelaTamanhos(
                        novoItem.tamanhos || {},
                        novoItem.quantidade || 0,
                        true,
                        (tamanho, valor) => handleNovoTamanhoChange(tamanho as keyof ItemOrcamento["tamanhos"], valor),
                        produtoSelecionado?.tamanhosDisponiveis,
                      )}

                      {/* Componente de upload de imagem */}
                      <ImagemUploader isEditing={false} imagemPreview={imagemPreview} />
                    </div>
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
        <textarea
          id="observacoes"
          value={orcamento.observacoes}
          onChange={(e) => atualizarOrcamento({ observacoes: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
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
