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
      // Criar um novo documento PDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      // Capturar o orçamento principal (primeira div com a classe especificada)
      const orcamentoElement = documentoRef.current.querySelector(".border.border-gray-300.rounded-md.overflow-hidden")
      if (!orcamentoElement) {
        throw new Error("Elemento do orçamento não encontrado")
      }

      // Renderizar o orçamento principal
      const orcamentoCanvas = await html2canvas(orcamentoElement as HTMLElement, {
        scale: 2,
        useCORS: true,
        logging: false,
      })

      // Adicionar o orçamento ao PDF
      const imgData = orcamentoCanvas.toDataURL("image/jpeg", 0.95)
      const imgWidth = 210 - 20 // A4 width - margins
      const imgHeight = (orcamentoCanvas.height * imgWidth) / orcamentoCanvas.width
      pdf.addImage(imgData, "JPEG", 10, 10, imgWidth, imgHeight)

      // Processar as fichas técnicas
      if (orcamento.itens.length > 0) {
        // Obter todos os elementos de ficha técnica
        const fichaTecnicaElements = documentoRef.current.querySelectorAll('[id^="ficha-"]')

        if (fichaTecnicaElements && fichaTecnicaElements.length > 0) {
          // Para cada ficha técnica, adicionar uma nova página ao PDF
          for (let i = 0; i < fichaTecnicaElements.length; i++) {
            const fichaTecnicaElement = fichaTecnicaElements[i] as HTMLElement

            // Adicionar nova página para cada ficha técnica
            pdf.addPage()

            // Renderizar a ficha técnica
            const fichaTecnicaCanvas = await html2canvas(fichaTecnicaElement, {
              scale: 2,
              useCORS: true,
              logging: false,
            })

            // Adicionar a ficha técnica ao PDF
            const fichaTecnicaImgData = fichaTecnicaCanvas.toDataURL("image/jpeg", 0.95)
            const fichaTecnicaImgWidth = 210 - 20 // A4 width - margins
            const fichaTecnicaImgHeight = (fichaTecnicaCanvas.height * fichaTecnicaImgWidth) / fichaTecnicaCanvas.width
            pdf.addImage(fichaTecnicaImgData, "JPEG", 10, 10, fichaTecnicaImgWidth, fichaTecnicaImgHeight)
          }
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
