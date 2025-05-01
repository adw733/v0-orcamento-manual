"use client"

import { useState, useRef, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FileDown, FileText, Users, ShoppingBag, Save, List } from "lucide-react"
import FormularioOrcamento from "@/components/formulario-orcamento"
import VisualizacaoDocumento from "@/components/visualizacao-documento"
import GerenciadorClientes from "@/components/gerenciador-clientes"
import GerenciadorProdutos from "@/components/gerenciador-produtos"
import GerenciadorOrcamentos from "@/components/gerenciador-orcamentos"
import type { Cliente, Produto, Orcamento, ItemOrcamento } from "@/types/types"
import { clienteService } from "@/services/cliente-service"
import { produtoService } from "@/services/produto-service"
import { orcamentoService } from "@/services/orcamento-service"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import { useToast } from "@/components/ui/use-toast"

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
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [orcamentoAtual, setOrcamentoAtual] = useState<string | null>(null)

  const documentoRef = useRef<HTMLDivElement>(null)

  const { toast } = useToast()

  useEffect(() => {
    const carregarDados = async () => {
      setIsLoading(true)
      try {
        // Carregar clientes
        const clientesData = await clienteService.getAll()
        setClientes(clientesData)

        // Carregar produtos
        const produtosData = await produtoService.getAll()
        setProdutos(produtosData)
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados iniciais.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    carregarDados()
  }, [])

  // Modifique a função handleExportPDF para melhorar a qualidade das imagens no PDF
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

      // Capturar o orçamento principal
      const orcamentoElement = documentoRef.current.querySelector(".border.border-gray-300.rounded-md.overflow-hidden")
      if (!orcamentoElement) {
        throw new Error("Elemento do orçamento não encontrado")
      }

      // Renderizar o orçamento principal com melhor qualidade
      const orcamentoCanvas = await html2canvas(orcamentoElement as HTMLElement, {
        scale: 2.5, // Aumentar a escala para melhor qualidade
        useCORS: true,
        logging: true, // Ativar logs para debug
        allowTaint: true, // Permitir imagens de outros domínios
        backgroundColor: "#ffffff",
      })

      // Adicionar o orçamento ao PDF
      const imgData = orcamentoCanvas.toDataURL("image/jpeg", 0.95)
      const imgWidth = 210 - 20 // A4 width - margins
      const imgHeight = (orcamentoCanvas.height * imgWidth) / orcamentoCanvas.width
      pdf.addImage(imgData, "JPEG", 10, 10, imgWidth, imgHeight)

      // Capturar e adicionar cada ficha técnica em uma nova página
      const fichasTecnicas = documentoRef.current.querySelectorAll(".border.border-gray-300.rounded-md.overflow-hidden")

      if (fichasTecnicas.length > 1) {
        for (let i = 1; i < fichasTecnicas.length; i++) {
          // Adicionar nova página para cada ficha técnica
          pdf.addPage()

          // Renderizar a ficha técnica com melhor qualidade
          const fichaCanvas = await html2canvas(fichasTecnicas[i] as HTMLElement, {
            scale: 2.5, // Aumentar a escala para melhor qualidade
            useCORS: true,
            logging: true, // Ativar logs para debug
            allowTaint: true, // Permitir imagens de outros domínios
            backgroundColor: "#ffffff",
          })

          // Adicionar a ficha técnica ao PDF
          const fichaImgData = fichaCanvas.toDataURL("image/jpeg", 0.95)
          const fichaImgWidth = 210 - 20 // A4 width - margins
          const fichaImgHeight = (fichaCanvas.height * fichaImgWidth) / fichaCanvas.width
          pdf.addImage(fichaImgData, "JPEG", 10, 10, fichaImgWidth, fichaImgHeight)
        }
      }

      // Salvar o PDF
      pdf.save(`${orcamento.numero}.pdf`)

      toast({
        title: "Sucesso",
        description: "PDF gerado com sucesso!",
      })
    } catch (error) {
      console.error("Erro ao gerar PDF:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao gerar o PDF. Por favor, tente novamente.",
        variant: "destructive",
      })
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

  const atualizarOrcamento = (novoOrcamento: Partial<Orcamento>) => {
    setOrcamento({ ...orcamento, ...novoOrcamento })
  }

  const adicionarItem = (item: ItemOrcamento) => {
    setOrcamento({
      ...orcamento,
      itens: [...orcamento.itens, { ...item, id: Date.now().toString() }],
    })
  }

  const removerItem = (id: string) => {
    setOrcamento({
      ...orcamento,
      itens: orcamento.itens.filter((item) => item.id !== id),
    })
  }

  const atualizarItem = (id: string, novoItem: Partial<ItemOrcamento>) => {
    setOrcamento({
      ...orcamento,
      itens: orcamento.itens.map((item) => (item.id === id ? { ...item, ...novoItem } : item)),
    })
  }

  const calcularTotal = () => {
    return orcamento.itens.reduce((total, item) => {
      return total + item.quantidade * item.valorUnitario
    }, 0)
  }

  // Modifique a função salvarOrcamento para garantir que as imagens sejam preservadas
  const salvarOrcamento = async () => {
    if (!orcamento.cliente) {
      toast({
        title: "Erro",
        description: "Selecione um cliente antes de salvar o orçamento.",
        variant: "destructive",
      })
      return
    }

    if (orcamento.itens.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um item ao orçamento.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      // Verificar se há imagens nos itens
      console.log(
        "Salvando orçamento com itens:",
        orcamento.itens.map((item) => ({
          id: item.id,
          produto: item.produto?.nome,
          temImagem: !!item.imagem,
          imagemLength: item.imagem ? item.imagem.length : 0,
        })),
      )

      // Garantir que os itens tenham todas as propriedades necessárias
      const orcamentoParaSalvar = {
        ...orcamento,
        itens: orcamento.itens.map((item) => ({
          ...item,
          // Garantir que a imagem seja mantida
          imagem: item.imagem || null,
        })),
      }

      let orcamentoSalvo: Orcamento

      if (orcamentoAtual) {
        // Atualizar orçamento existente
        orcamentoSalvo = await orcamentoService.update({
          ...orcamentoParaSalvar,
          id: orcamentoAtual,
        })
        toast({
          title: "Sucesso",
          description: "Orçamento atualizado com sucesso!",
        })
      } else {
        // Criar novo orçamento
        orcamentoSalvo = await orcamentoService.create(orcamentoParaSalvar)
        setOrcamentoAtual(orcamentoSalvo.id)
        toast({
          title: "Sucesso",
          description: "Orçamento salvo com sucesso!",
        })
      }

      // Atualizar o estado com o orçamento salvo para garantir consistência
      setOrcamento({
        ...orcamentoSalvo,
        itens: orcamentoSalvo.itens.map((item) => ({
          ...item,
          imagem: item.imagem || undefined,
        })),
      })
    } catch (error) {
      console.error("Erro ao salvar orçamento:", error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar o orçamento.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Modifique a função carregarOrcamento para garantir que as imagens sejam carregadas corretamente
  const carregarOrcamento = async (id: string) => {
    setIsLoading(true)
    try {
      const orcamentoCarregado = await orcamentoService.getById(id)

      // Verificar se as imagens foram carregadas corretamente
      console.log(
        "Orçamento carregado com itens:",
        orcamentoCarregado.itens.map((item) => ({
          id: item.id,
          produto: item.produto?.nome,
          temImagem: !!item.imagem,
          imagemLength: item.imagem ? item.imagem.length : 0,
        })),
      )

      // Garantir que os itens tenham todas as propriedades necessárias
      const itensProcessados = orcamentoCarregado.itens.map((item) => ({
        ...item,
        // Garantir que a imagem seja mantida
        imagem: item.imagem || undefined,
      }))

      setOrcamento({
        ...orcamentoCarregado,
        itens: itensProcessados,
      })
      setOrcamentoAtual(id)
      toast({
        title: "Sucesso",
        description: "Orçamento carregado com sucesso!",
      })
    } catch (error) {
      console.error("Erro ao carregar orçamento:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar o orçamento.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const novoOrcamento = () => {
    setOrcamentoAtual(null)
    setOrcamento({
      numero: "ORC-" + new Date().getFullYear() + "-" + String(Math.floor(Math.random() * 1000)).padStart(3, "0"),
      data: new Date().toISOString().split("T")[0],
      cliente: null,
      itens: [],
      observacoes: "",
      condicoesPagamento: "À vista",
      prazoEntrega: "30 dias",
      validadeOrcamento: "15 dias",
    })
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
            onClick={salvarOrcamento}
            disabled={isSaving || isLoading}
            className="flex items-center gap-2 bg-success hover:bg-success/80 text-white transition-all shadow-sm"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Salvando..." : "Salvar Orçamento"}
          </Button>
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
            <TabsList className="grid grid-cols-4 w-full mb-2 bg-accent">
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
              <TabsTrigger
                value="orcamentos"
                className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm flex items-center gap-2"
              >
                <List className="h-4 w-4" />
                Orçamentos
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
            <TabsContent value="orcamentos">
              <Card className="shadow-sm border-0">
                <CardContent className="p-6">
                  <GerenciadorOrcamentos
                    carregarOrcamento={carregarOrcamento}
                    novoOrcamento={novoOrcamento}
                    orcamentoAtualId={orcamentoAtual}
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
