"use client"

import { useState, useRef, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FileDown, FileText, Users, ShoppingBag } from "lucide-react"
import FormularioOrcamento from "@/components/formulario-orcamento"
import VisualizacaoDocumento from "@/components/visualizacao-documento"
import GerenciadorClientes from "@/components/gerenciador-clientes"
import GerenciadorProdutos from "@/components/gerenciador-produtos"
import type { Cliente, Produto, Orcamento, ItemOrcamento } from "@/types/types"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import { supabase } from "@/lib/supabase"
import { mockClientes, mockProdutos } from "@/lib/mock-data"

// Helper function to generate UUID
const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export default function GeradorOrcamento() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [orcamento, setOrcamento] = useState<Orcamento>({
    numero: "ORC-" + new Date().getFullYear() + "-" + String(Math.floor(Math.random() * 1000)).padStart(3, "0"),
    data: new Date().toISOString().split("T")[0],
    cliente: null,
    itens: [],
    observacoes: "",
    condicoesPagamento: "À vista",
    prazoEntrega: "30 dias",
    validadeOrcamento: "15 dias",
  })
  const [isExporting, setIsExporting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [orcamentoSalvo, setOrcamentoSalvo] = useState<string | null>(null)

  const documentoRef = useRef<HTMLDivElement>(null)

  // Carregar orçamento salvo, se houver
  useEffect(() => {
    const carregarOrcamentoSalvo = async () => {
      try {
        const { data, error } = await supabase
          .from("orcamentos")
          .select("*, cliente:cliente_id(*)")
          .order("created_at", { ascending: false })
          .limit(1)

        if (error) {
          console.warn("Erro ao carregar orçamento do Supabase:", error)
          return
        }

        if (data && data.length > 0) {
          const orcamentoData = data[0]

          // Carregar itens do orçamento
          const { data: itensData, error: itensError } = await supabase
            .from("itens_orcamento")
            .select("*, produto:produto_id(*)")
            .eq("orcamento_id", orcamentoData.id)

          if (itensError) throw itensError

          // Converter para o formato da aplicação
          const itensFormatados: ItemOrcamento[] = itensData
            ? itensData.map((item) => {
                // Buscar o produto completo
                const produto = item.produto
                  ? {
                      id: item.produto.id,
                      nome: item.produto.nome,
                      valorBase: Number(item.produto.valor_base),
                      tecidos: [], // Será preenchido depois
                      cores: item.produto.cores || [],
                      tamanhosDisponiveis: item.produto.tamanhos_disponiveis || [],
                    }
                  : undefined

                return {
                  id: item.id,
                  produtoId: item.produto_id || "",
                  produto,
                  quantidade: item.quantidade,
                  valorUnitario: Number(item.valor_unitario),
                  tecidoSelecionado: item.tecido_nome
                    ? {
                        nome: item.tecido_nome,
                        composicao: item.tecido_composicao || "",
                      }
                    : undefined,
                  corSelecionada: item.cor_selecionada || undefined,
                  descricaoEstampa: item.descricao_estampa || undefined,
                  tamanhos: (item.tamanhos as ItemOrcamento["tamanhos"]) || {},
                  imagem: item.imagem || undefined,
                }
              })
            : []

          // Converter cliente
          const clienteFormatado = orcamentoData.cliente
            ? {
                id: orcamentoData.cliente.id,
                nome: orcamentoData.cliente.nome,
                cnpj: orcamentoData.cliente.cnpj || "",
                endereco: orcamentoData.cliente.endereco || "",
                telefone: orcamentoData.cliente.telefone || "",
                email: orcamentoData.cliente.email || "",
                contato: orcamentoData.cliente.contato || "",
              }
            : null

          // Atualizar o estado do orçamento
          setOrcamento({
            id: orcamentoData.id,
            numero: orcamentoData.numero,
            data: orcamentoData.data,
            cliente: clienteFormatado,
            itens: itensFormatados,
            observacoes: orcamentoData.observacoes || "",
            condicoesPagamento: orcamentoData.condicoes_pagamento || "À vista",
            prazoEntrega: orcamentoData.prazo_entrega || "30 dias",
            validadeOrcamento: orcamentoData.validade_orcamento || "15 dias",
          })

          setOrcamentoSalvo(orcamentoData.id)
        }
      } catch (error) {
        console.error("Erro ao carregar orçamento:", error)
      }
    }

    carregarOrcamentoSalvo()
  }, [])

  // Initialize with mock data if empty
  useEffect(() => {
    if (clientes.length === 0) {
      setClientes(mockClientes)
    }
    if (produtos.length === 0) {
      setProdutos(mockProdutos)
    }
  }, [clientes.length, produtos.length, setClientes, setProdutos])

  const handleExportPDF = async () => {
    if (isExporting || !documentoRef.current) return
    setIsExporting(true)

    try {
      // Configurações para melhorar a qualidade
      const scale = 2 // Escala para qualidade

      // Dimensões da página A4 em pontos (jsPDF usa pontos por padrão)
      // A4 = 210mm x 297mm = 595.28pt x 841.89pt
      const pdfOptions = {
        orientation: "portrait",
        unit: "pt",
        format: "a4",
        compress: true,
        precision: 16,
      }

      // Criar um novo documento PDF
      const pdf = new jsPDF(pdfOptions)

      // Dimensões da página A4 em pontos
      const pageWidth = 595.28
      const pageHeight = 841.89
      const margin = 40 // Margem em pontos (aproximadamente 14mm)
      const contentWidth = pageWidth - margin * 2
      const contentHeight = pageHeight - margin * 2

      // Função para renderizar um elemento HTML para canvas
      const renderElementToCanvas = async (element) => {
        if (!element) return null

        const canvas = await html2canvas(element, {
          scale: scale,
          useCORS: true,
          logging: false,
          allowTaint: true,
          backgroundColor: "#ffffff",
        })

        return canvas
      }

      // Função para adicionar uma imagem ao PDF com dimensionamento adequado
      const addImageToPDF = (canvas, x, y, maxWidth, maxHeight) => {
        if (!canvas) return { width: 0, height: 0 }

        // Calcular dimensões proporcionais
        let imgWidth = canvas.width / scale
        let imgHeight = canvas.height / scale

        // Redimensionar se for maior que o espaço disponível
        if (imgWidth > maxWidth) {
          const ratio = maxWidth / imgWidth
          imgWidth = maxWidth
          imgHeight = imgHeight * ratio
        }

        // Verificar altura após redimensionamento da largura
        if (imgHeight > maxHeight) {
          const ratio = maxHeight / imgHeight
          imgHeight = maxHeight
          imgWidth = imgWidth * ratio
        }

        // Converter canvas para dataURL
        const imgData = canvas.toDataURL("image/jpeg", 0.95)

        // Adicionar ao PDF
        pdf.addImage(imgData, "JPEG", x, y, imgWidth, imgHeight)

        return { width: imgWidth, height: imgHeight }
      }

      // Capturar o documento inteiro
      const mainElement = documentoRef.current

      // Renderizar cabeçalho (será reutilizado em cada página)
      const headerElement = mainElement.querySelector(".bg-gradient-to-r.from-primary.to-primary-dark")
      const headerCanvas = await renderElementToCanvas(headerElement)

      // Função para adicionar cabeçalho a cada página
      const addHeaderToPage = () => {
        const headerDimensions = addImageToPDF(headerCanvas, margin, margin, contentWidth, 100)
        return margin + headerDimensions.height + 20 // Retorna a posição Y após o cabeçalho
      }

      // PÁGINA 1: ORÇAMENTO PRINCIPAL
      let currentY = addHeaderToPage()

      // Renderizar seção de dados do cliente
      const clienteElement = mainElement.querySelector(".border-b.pb-4")
      const clienteCanvas = await renderElementToCanvas(clienteElement)

      if (clienteCanvas) {
        const clienteDimensions = addImageToPDF(clienteCanvas, margin, currentY, contentWidth, 150)
        currentY += clienteDimensions.height + 20
      }

      // Renderizar seção de itens do orçamento
      const itensElement = mainElement.querySelector(".page-break-inside-avoid:nth-of-type(2)")
      const itensCanvas = await renderElementToCanvas(itensElement)

      if (itensCanvas) {
        // Verificar se cabe na página atual, senão adicionar nova página
        const estimatedHeight = (itensCanvas.height / scale) * (contentWidth / (itensCanvas.width / scale))

        if (currentY + estimatedHeight > pageHeight - margin) {
          pdf.addPage()
          currentY = addHeaderToPage()
        }

        const itensDimensions = addImageToPDF(
          itensCanvas,
          margin,
          currentY,
          contentWidth,
          pageHeight - currentY - margin,
        )
        currentY += itensDimensions.height + 20
      }

      // Renderizar seção de observações e condições
      const obsElement = mainElement.querySelector(".space-y-4.page-break-inside-avoid")
      const obsCanvas = await renderElementToCanvas(obsElement)

      if (obsCanvas) {
        // Verificar se cabe na página atual, senão adicionar nova página
        const estimatedHeight = (obsCanvas.height / scale) * (contentWidth / (obsCanvas.width / scale))

        if (currentY + estimatedHeight > pageHeight - margin) {
          pdf.addPage()
          currentY = addHeaderToPage()
        }

        addImageToPDF(obsCanvas, margin, currentY, contentWidth, pageHeight - currentY - margin)
      }

      // PÁGINAS DE FICHAS TÉCNICAS - Uma por página
      const fichasTecnicas = mainElement.querySelectorAll('[id^="ficha-"]')

      for (const ficha of fichasTecnicas) {
        // Sempre começar uma nova página para cada ficha técnica
        pdf.addPage()
        currentY = addHeaderToPage()

        // Renderizar título e informações básicas
        const tituloFicha = ficha.querySelector("h3")?.parentElement
        if (tituloFicha) {
          const tituloCanvas = await renderElementToCanvas(tituloFicha)
          const tituloDimensions = addImageToPDF(tituloCanvas, margin, currentY, contentWidth, 80)
          currentY += tituloDimensions.height + 20
        }

        // Renderizar imagem do produto (se existir)
        const imagemContainer = ficha.querySelector(".flex.justify-center")
        if (imagemContainer) {
          const imgCanvas = await renderElementToCanvas(imagemContainer)
          // Limitar a altura da imagem para garantir que outros elementos caibam na página
          const maxImgHeight = 250
          const imgDimensions = addImageToPDF(imgCanvas, margin, currentY, contentWidth * 0.8, maxImgHeight)
          currentY += imgDimensions.height + 20
        }

        // Renderizar informações de tecido, cor e estampa
        const infoGrid = ficha.querySelector(".grid.grid-cols-1.md\\:grid-cols-3")
        if (infoGrid) {
          const gridCanvas = await renderElementToCanvas(infoGrid)
          const gridDimensions = addImageToPDF(gridCanvas, margin, currentY, contentWidth, 150)
          currentY += gridDimensions.height + 20
        }

        // Renderizar tabela de tamanhos
        const h4Elements = ficha.querySelectorAll("h4")
        let tabelaSection = null

        // Encontrar o elemento h4 que contém o texto "Quantidades por Tamanho"
        for (const h4 of h4Elements) {
          if (h4.textContent && h4.textContent.includes("Quantidades por Tamanho")) {
            tabelaSection = h4.parentElement
            break
          }
        }

        if (tabelaSection) {
          const tabelaCanvas = await renderElementToCanvas(tabelaSection)
          // Verificar se a tabela cabe na página atual
          const estimatedHeight = (tabelaCanvas.height / scale) * (contentWidth / (tabelaCanvas.width / scale))

          if (currentY + estimatedHeight > pageHeight - margin) {
            pdf.addPage()
            currentY = addHeaderToPage()
          }

          addImageToPDF(tabelaCanvas, margin, currentY, contentWidth, pageHeight - currentY - margin)
        }
      }

      // Salvar o PDF
      pdf.save(`${orcamento.numero}.pdf`)
    } catch (error) {
      console.error("Erro ao gerar PDF:", error)
      alert("Ocorreu um erro ao gerar o PDF. Por favor, tente novamente.")
    } finally {
      setIsExporting(false)
    }
  }

  const adicionarCliente = (cliente: Cliente) => {
    setClientes([...clientes, cliente])
  }

  const adicionarProduto = (produto: Produto) => {
    setProdutos([...produtos, produto])
  }

  const atualizarOrcamento = async (novoOrcamento: Partial<Orcamento>) => {
    const orcamentoAtualizado = { ...orcamento, ...novoOrcamento }
    setOrcamento(orcamentoAtualizado)

    // Salvar no Supabase se houver cliente selecionado
    if (orcamentoAtualizado.cliente) {
      try {
        setIsLoading(true)

        let orcamentoId = orcamentoSalvo

        // Se não tiver ID, criar novo orçamento
        if (!orcamentoId) {
          const { data, error } = await supabase
            .from("orcamentos")
            .insert({
              numero: orcamentoAtualizado.numero,
              data: orcamentoAtualizado.data,
              cliente_id: orcamentoAtualizado.cliente.id,
              observacoes: orcamentoAtualizado.observacoes,
              condicoes_pagamento: orcamentoAtualizado.condicoesPagamento,
              prazo_entrega: orcamentoAtualizado.prazoEntrega,
              validade_orcamento: orcamentoAtualizado.validadeOrcamento,
              itens: JSON.stringify(orcamentoAtualizado.itens),
            })
            .select()

          if (error) throw error

          if (data && data[0]) {
            orcamentoId = data[0].id
            setOrcamentoSalvo(orcamentoId)

            // Atualizar o ID do orçamento no estado
            setOrcamento({
              ...orcamentoAtualizado,
              id: orcamentoId,
            })
          }
        } else {
          // Atualizar orçamento existente
          const { error } = await supabase
            .from("orcamentos")
            .update({
              numero: orcamentoAtualizado.numero,
              data: orcamentoAtualizado.data,
              cliente_id: orcamentoAtualizado.cliente.id,
              observacoes: orcamentoAtualizado.observacoes,
              condicoes_pagamento: orcamentoAtualizado.condicoesPagamento,
              prazo_entrega: orcamentoAtualizado.prazoEntrega,
              validade_orcamento: orcamentoAtualizado.validadeOrcamento,
              itens: JSON.stringify(orcamentoAtualizado.itens),
              updated_at: new Date().toISOString(),
            })
            .eq("id", orcamentoId)

          if (error) throw error
        }
      } catch (error) {
        console.error("Erro ao salvar orçamento:", error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const adicionarItem = async (item: ItemOrcamento) => {
    const itensAtualizados = [...orcamento.itens, item]
    setOrcamento({
      ...orcamento,
      itens: itensAtualizados,
    })

    // Salvar no Supabase se houver orçamento salvo
    if (orcamentoSalvo) {
      try {
        setIsLoading(true)

        const { error } = await supabase.from("itens_orcamento").insert({
          orcamento_id: orcamentoSalvo,
          produto_id: item.produtoId,
          quantidade: item.quantidade,
          valor_unitario: item.valorUnitario,
          tecido_nome: item.tecidoSelecionado?.nome,
          tecido_composicao: item.tecidoSelecionado?.composicao,
          cor_selecionada: item.corSelecionada,
          descricao_estampa: item.descricaoEstampa,
          tamanhos: item.tamanhos,
          imagem: item.imagem,
        })

        if (error) throw error

        // Atualizar o orçamento no Supabase
        await supabase
          .from("orcamentos")
          .update({
            itens: JSON.stringify(itensAtualizados),
            updated_at: new Date().toISOString(),
          })
          .eq("id", orcamentoSalvo)
      } catch (error) {
        console.error("Erro ao adicionar item:", error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const removerItem = async (id: string) => {
    const itensAtualizados = orcamento.itens.filter((item) => item.id !== id)
    setOrcamento({
      ...orcamento,
      itens: itensAtualizados,
    })

    // Remover do Supabase se houver orçamento salvo
    if (orcamentoSalvo) {
      try {
        setIsLoading(true)

        const { error } = await supabase.from("itens_orcamento").delete().eq("id", id)

        if (error) throw error

        // Atualizar o orçamento no Supabase
        await supabase
          .from("orcamentos")
          .update({
            itens: JSON.stringify(itensAtualizados),
            updated_at: new Date().toISOString(),
          })
          .eq("id", orcamentoSalvo)
      } catch (error) {
        console.error("Erro ao remover item:", error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const atualizarItem = async (id: string, novoItem: Partial<ItemOrcamento>) => {
    const itensAtualizados = orcamento.itens.map((item) => (item.id === id ? { ...item, ...novoItem } : item))
    setOrcamento({
      ...orcamento,
      itens: itensAtualizados,
    })

    // Atualizar no Supabase se houver orçamento salvo
    if (orcamentoSalvo) {
      try {
        setIsLoading(true)

        const itemAtualizado = itensAtualizados.find((item) => item.id === id)

        if (itemAtualizado) {
          const { error } = await supabase
            .from("itens_orcamento")
            .update({
              quantidade: itemAtualizado.quantidade,
              valor_unitario: itemAtualizado.valorUnitario,
              tecido_nome: itemAtualizado.tecidoSelecionado?.nome,
              tecido_composicao: itemAtualizado.tecidoSelecionado?.composicao,
              cor_selecionada: itemAtualizado.corSelecionada,
              descricao_estampa: itemAtualizado.descricaoEstampa,
              tamanhos: itemAtualizado.tamanhos,
              imagem: itemAtualizado.imagem,
            })
            .eq("id", id)

          if (error) throw error

          // Atualizar o orçamento no Supabase
          await supabase
            .from("orcamentos")
            .update({
              itens: JSON.stringify(itensAtualizados),
              updated_at: new Date().toISOString(),
            })
            .eq("id", orcamentoSalvo)
        }
      } catch (error) {
        console.error("Erro ao atualizar item:", error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const calcularTotal = () => {
    return orcamento.itens.reduce((total, item) => {
      return total + item.quantidade * item.valorUnitario
    }, 0)
  }

  return (
    <div className="space-y-6 py-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-primary">Gerador de Orçamento e Ficha Técnica</h1>
          <p className="text-gray-500 mt-1">Crie orçamentos profissionais para uniformes industriais</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleExportPDF}
            disabled={isExporting || isLoading}
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white transition-all shadow-sm"
          >
            <FileDown className="h-4 w-4" />
            {isExporting ? "Gerando PDF..." : "Exportar PDF"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4 w-full overflow-hidden">
          <Tabs defaultValue="orcamento" className="w-full">
            <TabsList className="grid grid-cols-3 w-full mb-2 bg-accent">
              <TabsTrigger
                value="orcamento"
                className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Orçamento
              </TabsTrigger>
              <TabsTrigger
                value="clientes"
                className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Clientes
              </TabsTrigger>
              <TabsTrigger
                value="produtos"
                className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm flex items-center gap-2"
              >
                <ShoppingBag className="h-4 w-4" />
                Produtos
              </TabsTrigger>
            </TabsList>
            <TabsContent value="orcamento" className="space-y-4">
              <Card className="shadow-sm border-0">
                <CardContent className="p-6">
                  <FormularioOrcamento
                    orcamento={orcamento}
                    clientes={clientes}
                    produtos={produtos}
                    atualizarOrcamento={atualizarOrcamento}
                    adicionarItem={adicionarItem}
                    removerItem={removerItem}
                    atualizarItem={atualizarItem}
                    calcularTotal={calcularTotal}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="clientes">
              <Card className="shadow-sm border-0">
                <CardContent className="p-6">
                  <GerenciadorClientes
                    clientes={clientes}
                    adicionarCliente={adicionarCliente}
                    setClientes={setClientes}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="produtos">
              <Card className="shadow-sm border-0">
                <CardContent className="p-6">
                  <GerenciadorProdutos
                    produtos={produtos}
                    adicionarProduto={adicionarProduto}
                    setProdutos={setProdutos}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
          <div className="p-4 h-[calc(100vh-150px)] overflow-auto">
            <div ref={documentoRef}>
              <VisualizacaoDocumento orcamento={orcamento} calcularTotal={calcularTotal} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
