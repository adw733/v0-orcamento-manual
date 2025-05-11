"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Search,
  Calendar,
  Tag,
  Palette,
  Ruler,
  FileText,
  Loader2,
  Filter,
  ChevronUp,
  ChevronDown,
  Download,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ProdutoOrcamento {
  id: string
  orcamentoId: string
  orcamentoNumero: string
  orcamentoData: string
  clienteNome: string
  nomeContato: string
  produtoId: string
  produtoNome: string
  tamanho: string
  cor: string
  quantidade: number
  observacao: string
  status: string
  ordemItem: number
}

export default function TabelaProdutos() {
  const [produtos, setProdutos] = useState<ProdutoOrcamento[]>([])
  const [produtosFiltrados, setProdutosFiltrados] = useState<ProdutoOrcamento[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("execucao")
  const [error, setError] = useState<string | null>(null)
  const [exportandoPDF, setExportandoPDF] = useState(false)
  const tabelaRef = useRef<HTMLDivElement>(null)

  // Estados para ordenação
  const [ordenacao, setOrdenacao] = useState<{ campo: string; direcao: "asc" | "desc" }>({
    campo: "orcamentoNumero",
    direcao: "asc",
  })

  // Função para ordenar tamanhos
  const ordenarTamanhos = (tamanhoA: string, tamanhoB: string) => {
    // Definir a ordem dos tamanhos padrão
    const ordemTamanhosPadrao = ["PP", "P", "M", "G", "GG", "G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9", "G10"]

    // Verificar se ambos os tamanhos estão na lista de tamanhos padrão
    const indexA = ordemTamanhosPadrao.indexOf(tamanhoA)
    const indexB = ordemTamanhosPadrao.indexOf(tamanhoB)

    // Se ambos estão na lista, ordenar conforme a ordem definida
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB
    }

    // Se apenas um está na lista, priorizar o que está na lista
    if (indexA !== -1) return -1
    if (indexB !== -1) return 1

    // Se nenhum está na lista, verificar se são números
    const numA = Number.parseInt(tamanhoA)
    const numB = Number.parseInt(tamanhoB)

    // Se ambos são números, ordenar numericamente
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB
    }

    // Caso contrário, ordenar alfabeticamente
    return tamanhoA.localeCompare(tamanhoB)
  }

  useEffect(() => {
    carregarProdutos()
  }, [])

  useEffect(() => {
    filtrarProdutos()
  }, [produtos, searchTerm, statusFilter, ordenacao])

  const carregarProdutos = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Buscar todos os orçamentos com seus clientes
      const { data: orcamentosData, error: orcamentosError } = await supabase
        .from("orcamentos")
        .select("id, numero, data, cliente:cliente_id(nome), itens, status")
        .order("numero", { ascending: true })

      if (orcamentosError) {
        console.error("Erro ao carregar orçamentos:", orcamentosError)
        setError(`Erro ao carregar orçamentos: ${orcamentosError.message}`)
        return
      }

      // Array para armazenar todos os produtos de todos os orçamentos
      const todosProdutos: ProdutoOrcamento[] = []

      // Processar cada orçamento
      for (const orcamento of orcamentosData) {
        let itens = []
        let nomeContato = ""

        // Processar os itens do orçamento
        if (orcamento.itens) {
          try {
            let itensObj
            if (typeof orcamento.itens === "string") {
              itensObj = JSON.parse(orcamento.itens)
            } else {
              itensObj = orcamento.itens
            }

            // Verificar se o JSON tem a nova estrutura (com metadados)
            if (itensObj.items && Array.isArray(itensObj.items)) {
              itens = itensObj.items
              // Extrair informações de contato dos metadados
              if (itensObj.metadados) {
                nomeContato = itensObj.metadados.nomeContato || ""
              }
            } else if (Array.isArray(itensObj)) {
              // Formato antigo (array simples)
              itens = itensObj
            }
          } catch (parseError) {
            console.error(`Erro ao fazer parse do JSON para o orçamento ${orcamento.id}:`, parseError)
            continue
          }
        }

        // Para cada item do orçamento, processar os tamanhos
        for (let itemIndex = 0; itemIndex < itens.length; itemIndex++) {
          const item = itens[itemIndex]
          // Buscar o produto para obter o nome
          const { data: produtoData, error: produtoError } = await supabase
            .from("produtos")
            .select("nome")
            .eq("id", item.produtoId)
            .single()

          if (produtoError) {
            console.error(`Erro ao buscar produto ${item.produtoId}:`, produtoError)
            continue
          }

          const produtoNome = produtoData?.nome || "Produto não encontrado"
          const cor = item.corSelecionada || "Não especificada"

          // Para cada tamanho no item, criar uma entrada na tabela
          if (item.tamanhos && Object.keys(item.tamanhos).length > 0) {
            // Ordenar os tamanhos antes de processá-los
            const tamanhos = Object.entries(item.tamanhos)
              .filter(([_, quantidade]) => Number(quantidade) > 0)
              .sort(([tamanhoA], [tamanhoB]) => ordenarTamanhos(tamanhoA, tamanhoB))

            for (const [tamanho, quantidade] of tamanhos) {
              todosProdutos.push({
                id: `${orcamento.id}_${item.id}_${tamanho}`,
                orcamentoId: orcamento.id,
                orcamentoNumero: orcamento.numero,
                orcamentoData: orcamento.data,
                clienteNome: orcamento.cliente?.nome || "Cliente não especificado",
                nomeContato: nomeContato,
                produtoId: item.produtoId,
                produtoNome: produtoNome,
                tamanho: tamanho,
                cor: cor,
                quantidade: Number(quantidade),
                observacao: "",
                status: orcamento.status || "proposta",
                ordemItem: itemIndex,
              })
            }
          } else {
            // Se não houver tamanhos especificados, adicionar uma entrada genérica
            todosProdutos.push({
              id: `${orcamento.id}_${item.id}_unico`,
              orcamentoId: orcamento.id,
              orcamentoNumero: orcamento.numero,
              orcamentoData: orcamento.data,
              clienteNome: orcamento.cliente?.nome || "Cliente não especificado",
              nomeContato: nomeContato,
              produtoId: item.produtoId,
              produtoNome: produtoNome,
              tamanho: "Único",
              cor: cor,
              quantidade: item.quantidade || 0,
              observacao: "",
              status: orcamento.status || "proposta",
              ordemItem: itemIndex,
            })
          }
        }
      }

      setProdutos(todosProdutos)
      setProdutosFiltrados(todosProdutos)
    } catch (error) {
      console.error("Erro ao carregar produtos:", error)
      setError(`Erro ao carregar produtos: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
    } finally {
      setIsLoading(false)
    }
  }

  const filtrarProdutos = () => {
    let resultado = [...produtos]

    // Filtrar por termo de busca
    if (searchTerm) {
      const termLower = searchTerm.toLowerCase()
      resultado = resultado.filter(
        (produto) =>
          produto.orcamentoNumero.toLowerCase().includes(termLower) ||
          produto.clienteNome.toLowerCase().includes(termLower) ||
          produto.produtoNome.toLowerCase().includes(termLower) ||
          produto.cor.toLowerCase().includes(termLower) ||
          produto.tamanho.toLowerCase().includes(termLower) ||
          produto.observacao.toLowerCase().includes(termLower),
      )
    }

    // Filtrar por status
    if (statusFilter !== "todos") {
      resultado = resultado.filter((produto) => produto.status === statusFilter)
    }

    // Ordenar os resultados
    resultado = resultado.sort((a, b) => {
      // Se estamos ordenando por um campo específico
      if (ordenacao.campo !== "orcamentoNumero") {
        let valorA, valorB

        switch (ordenacao.campo) {
          case "orcamentoData":
            valorA = a.orcamentoData
            valorB = b.orcamentoData
            break
          case "clienteNome":
            valorA = a.clienteNome
            valorB = b.clienteNome
            break
          case "produtoNome":
            valorA = a.produtoNome
            valorB = b.produtoNome
            break
          case "tamanho":
            // Usar a função de ordenação personalizada para tamanhos
            return ordenarTamanhos(a.tamanho, b.tamanho) * (ordenacao.direcao === "asc" ? 1 : -1)
          case "cor":
            valorA = a.cor
            valorB = b.cor
            break
          case "quantidade":
            valorA = a.quantidade
            valorB = b.quantidade
            break
          default:
            valorA = a.orcamentoData
            valorB = b.orcamentoData
        }

        if (typeof valorA === "string" && typeof valorB === "string") {
          return ordenacao.direcao === "asc" ? valorA.localeCompare(valorB) : valorB.localeCompare(valorA)
        } else {
          return ordenacao.direcao === "asc"
            ? (valorA as number) - (valorB as number)
            : (valorB as number) - (valorA as number)
        }
      } else {
        // Ordenação padrão por número de orçamento
        const comparacaoOrcamento =
          ordenacao.direcao === "asc"
            ? a.orcamentoNumero.localeCompare(b.orcamentoNumero)
            : b.orcamentoNumero.localeCompare(a.orcamentoNumero)

        // Se forem do mesmo orçamento, ordenar primeiro por nome do produto e depois por tamanho
        if (comparacaoOrcamento === 0) {
          // Comparar nomes de produtos primeiro (ordem alfabética)
          const comparacaoProduto = a.produtoNome.localeCompare(b.produtoNome)

          // Se os produtos forem diferentes, retornar a comparação de produtos
          if (comparacaoProduto !== 0) {
            return comparacaoProduto
          }

          // Se os produtos forem iguais, ordenar por tamanho
          return ordenarTamanhos(a.tamanho, b.tamanho)
        }

        return comparacaoOrcamento
      }
    })

    setProdutosFiltrados(resultado)
  }

  const alternarOrdenacao = (campo: string) => {
    if (ordenacao.campo === campo) {
      setOrdenacao({
        campo,
        direcao: ordenacao.direcao === "asc" ? "desc" : "asc",
      })
    } else {
      setOrdenacao({
        campo,
        direcao: "asc",
      })
    }
  }

  const formatarData = (dataString?: string) => {
    if (!dataString) return ""
    const data = new Date(dataString)
    return data.toLocaleDateString("pt-BR")
  }

  const getStatusClassName = (status: string) => {
    switch (status) {
      case "proposta":
        return "bg-blue-100 text-blue-700 border-blue-300"
      case "execucao":
        return "bg-amber-100 text-amber-700 border-amber-300"
      case "finalizado":
        return "bg-green-100 text-green-700 border-green-300"
      default:
        return "bg-gray-100 text-gray-700 border-gray-300"
    }
  }

  const formatarDescricaoPedido = (numeroCompleto: string, nomeContato?: string) => {
    // Extrair apenas a parte relevante no formato "0145 - CAMISETA POLIMIX CONCRETO LTDA"
    const partes = numeroCompleto.split(" - ")
    if (partes.length >= 2) {
      // Adicionar o nome do contato se disponível
      return nomeContato ? `${partes[0]} - ${partes[1]} - ${nomeContato}` : `${partes[0]} - ${partes[1]}`
    }
    return numeroCompleto
  }

  // Função para verificar se o produto é o primeiro de um novo orçamento na lista filtrada
  const isNovoOrcamento = (index: number) => {
    if (index === 0) return true

    const orcamentoAtual = produtosFiltrados[index].orcamentoId
    const orcamentoAnterior = produtosFiltrados[index - 1].orcamentoId

    return orcamentoAtual !== orcamentoAnterior
  }

  // Função para verificar se o produto é diferente do anterior dentro do mesmo orçamento
  const isNovoProduto = (index: number) => {
    if (index === 0) return true

    const produtoAtual = produtosFiltrados[index].produtoNome
    const produtoAnterior = produtosFiltrados[index - 1].produtoNome
    const orcamentoAtual = produtosFiltrados[index].orcamentoId
    const orcamentoAnterior = produtosFiltrados[index - 1].orcamentoId

    // Se for um novo orçamento, não é considerado um novo produto para separação
    if (orcamentoAtual !== orcamentoAnterior) return false

    // Se for o mesmo orçamento mas produto diferente, retorna true
    return produtoAtual !== produtoAnterior
  }

  // Função para desenhar uma linha grossa no PDF
  const desenharLinhaGrossa = (pdf: any, yPosition: number, margin: number, contentWidth: number) => {
    pdf.setDrawColor(100, 100, 100) // Cor cinza escura para a linha
    pdf.setLineWidth(0.5) // Espessura reduzida e padronizada para todas as linhas grossas
    pdf.line(margin, yPosition, margin + contentWidth, yPosition)
    pdf.setLineWidth(0.1) // Restaurar a espessura padrão
    pdf.setDrawColor(0, 0, 0) // Restaurar a cor padrão
  }

  // Função para exportar a tabela para PDF
  const exportarParaPDF = async () => {
    try {
      setExportandoPDF(true)

      // Importar dinamicamente as bibliotecas necessárias
      const [jspdfModule, html2canvasModule] = await Promise.all([import("jspdf"), import("html2canvas")])

      const jsPDF = jspdfModule.default
      const html2canvas = html2canvasModule.default

      // Criar uma nova instância do jsPDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      // Configurações da página A4 com margens reduzidas
      const pageWidth = 210
      const pageHeight = 297
      const margin = 5 // Reduzido de 10 para 5
      const contentWidth = pageWidth - margin * 2
      const contentHeight = pageHeight - margin * 2

      // Agrupar produtos por orçamento
      const orcamentos: { [key: string]: ProdutoOrcamento[] } = {}
      produtosFiltrados.forEach((produto) => {
        if (!orcamentos[produto.orcamentoId]) {
          orcamentos[produto.orcamentoId] = []
        }
        orcamentos[produto.orcamentoId].push(produto)
      })

      // Criar uma cópia da tabela para manipulação
      const container = document.createElement("div")
      container.style.position = "absolute"
      container.style.left = "-9999px"
      container.style.width = `${contentWidth}mm`
      container.style.backgroundColor = "#ffffff"
      container.style.padding = "0"
      container.style.margin = "0"
      container.style.boxSizing = "border-box"
      document.body.appendChild(container)

      // Adicionar título ao PDF
      pdf.setFontSize(16)
      pdf.setFont("helvetica", "bold")
      pdf.text("Tabela de Produtos por Orçamento", margin, margin + 10)

      // Adicionar data de geração
      pdf.setFontSize(10)
      pdf.setFont("helvetica", "normal")
      const dataAtual = new Date().toLocaleDateString("pt-BR")
      pdf.text(`Gerado em: ${dataAtual}`, margin, margin + 16)

      let yPosition = margin + 25 // Posição inicial após o título
      let pageCount = 1

      // Função para verificar se um orçamento cabe na página atual
      const verificarEspacoParaOrcamento = (numProdutos: number) => {
        // Altura estimada para cada linha de produto (7mm)
        const alturaEstimadaPorProduto = 7
        // Altura estimada para o cabeçalho do orçamento (10mm)
        const alturaEstimadaCabecalho = 10
        // Altura total estimada para o orçamento
        const alturaEstimadaTotal = alturaEstimadaCabecalho + numProdutos * alturaEstimadaPorProduto

        // Verificar se cabe na página atual
        return yPosition + alturaEstimadaTotal <= pageHeight - margin
      }

      // Função para desenhar o cabeçalho da tabela
      const desenharCabecalhoTabela = () => {
        // Adicionar linha grossa no topo do cabeçalho
        desenharLinhaGrossa(pdf, yPosition, margin, contentWidth)

        pdf.setFillColor(240, 240, 240)
        pdf.rect(margin, yPosition, contentWidth, 8, "F")

        pdf.setFont("helvetica", "bold")
        pdf.setFontSize(9)
        pdf.setTextColor(80, 80, 80)

        // Ajustadas as posições e larguras das colunas
        pdf.text("Produto", margin + 5, yPosition + 5) // Início no começo da tabela
        pdf.text("Cor", margin + 95, yPosition + 5) // Reduzida e reposicionada
        pdf.text("Tamanho", margin + 120, yPosition + 5) // Reduzida e reposicionada
        pdf.text("Qtd", margin + 145, yPosition + 5) // Reduzida e reposicionada
        pdf.text("Obs", margin + 160, yPosition + 5) // Aumentada em 1cm (10mm)

        yPosition += 8

        // Adicionar linha grossa abaixo do cabeçalho
        desenharLinhaGrossa(pdf, yPosition, margin, contentWidth)
      }

      // Processar cada orçamento
      for (const orcamentoId of Object.keys(orcamentos)) {
        const produtosDoOrcamento = orcamentos[orcamentoId]

        // Verificar se o orçamento cabe na página atual, senão adicionar nova página
        if (!verificarEspacoParaOrcamento(produtosDoOrcamento.length)) {
          pdf.addPage()
          pageCount++
          yPosition = margin + 10
        }

        // Adicionar informações do orçamento
        const primeiroItem = produtosDoOrcamento[0]
        pdf.setFont("helvetica", "bold")
        pdf.setFontSize(11)
        pdf.setTextColor(0, 0, 0)
        pdf.text(
          `Orçamento: ${formatarDescricaoPedido(primeiroItem.orcamentoNumero, primeiroItem.nomeContato)}`,
          margin,
          yPosition + 5,
        )

        pdf.setFont("helvetica", "normal")
        pdf.setFontSize(9)
        // Reorganizar para mostrar data / cliente / contato
        pdf.text(
          `Data: ${formatarData(primeiroItem.orcamentoData)} | Cliente: ${primeiroItem.clienteNome} | Contato: ${primeiroItem.nomeContato || "Não especificado"}`,
          margin,
          yPosition + 10,
        )

        yPosition += 15

        // Desenhar cabeçalho da tabela
        desenharCabecalhoTabela()

        // Adicionar produtos do orçamento
        pdf.setFont("helvetica", "normal")
        pdf.setFontSize(8)
        pdf.setTextColor(0, 0, 0)

        // Ordenar os produtos primeiro por nome do produto e depois por tamanho
        const produtosAgrupados = [...produtosDoOrcamento].sort((a, b) => {
          // Primeiro ordenar por nome do produto (ordem alfabética)
          const comparacaoProduto = a.produtoNome.localeCompare(b.produtoNome)

          // Se os produtos forem diferentes, retornar a comparação de produtos
          if (comparacaoProduto !== 0) {
            return comparacaoProduto
          }

          // Se os produtos forem iguais, ordenar por tamanho
          return ordenarTamanhos(a.tamanho, b.tamanho)
        })

        let produtoNomeAnterior = ""

        for (let i = 0; i < produtosAgrupados.length; i++) {
          const produto = produtosAgrupados[i]
          const isUltimaLinha = i === produtosAgrupados.length - 1
          const isNovoProduto = i === 0 || produto.produtoNome !== produtosAgrupados[i - 1].produtoNome

          // Se for um novo produto, adicionar uma linha mais grossa para separar (exceto para o primeiro produto)
          if (isNovoProduto && i > 0) {
            desenharLinhaGrossa(pdf, yPosition - 1, margin, contentWidth)
          }

          // Desenhar linha alternada para melhor legibilidade
          if (i % 2 === 1) {
            pdf.setFillColor(248, 248, 248)
            pdf.rect(margin, yPosition, contentWidth, 6, "F")
          }

          // Ajustar o texto do produto para evitar sobreposição
          const produtoNomeLimitado =
            produto.produtoNome.length > 40 ? produto.produtoNome.substring(0, 40) + "..." : produto.produtoNome
          pdf.text(produtoNomeLimitado, margin + 5, yPosition + 4) // Início no começo da tabela

          // Ajustar o texto da cor para evitar sobreposição
          const corLimitada = produto.cor.length > 12 ? produto.cor.substring(0, 12) + "..." : produto.cor
          pdf.text(corLimitada, margin + 95, yPosition + 4) // Reduzida e reposicionada

          pdf.text(produto.tamanho, margin + 120, yPosition + 4) // Reduzida e reposicionada
          pdf.text(produto.quantidade.toString(), margin + 145, yPosition + 4) // Reduzida e reposicionada

          // Deixar a coluna de observação vazia conforme solicitado
          // Não adicionar nenhum texto na posição da observação

          // Avançar para a próxima linha
          yPosition += 6

          // Se for a última linha, adicionar uma linha grossa no final
          if (isUltimaLinha) {
            desenharLinhaGrossa(pdf, yPosition, margin, contentWidth)
          }

          // Verificar se precisa adicionar nova página
          if (yPosition > pageHeight - margin) {
            pdf.addPage()
            pageCount++
            yPosition = margin + 10
            desenharCabecalhoTabela()
          }

          produtoNomeAnterior = produto.produtoNome
        }

        // Adicionar espaço entre orçamentos
        yPosition += 10
      }

      // Adicionar numeração de páginas
      const totalPages = pageCount
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i)
        pdf.setFont("helvetica", "normal")
        pdf.setFontSize(8)
        pdf.text(`Página ${i} de ${totalPages}`, pageWidth - margin - 25, pageHeight - margin)
      }

      // Remover o elemento temporário
      document.body.removeChild(container)

      // Salvar o PDF
      pdf.save("tabela-produtos-orcamento.pdf")
    } catch (error) {
      console.error("Erro ao exportar para PDF:", error)
      alert("Erro ao exportar para PDF. Tente novamente.")
    } finally {
      setExportandoPDF(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-primary flex items-center gap-2">
          <span className="bg-primary text-white p-1 rounded-md text-xs">PRODUTOS</span>
          Tabela de Produtos por Orçamento
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportarParaPDF}
            disabled={exportandoPDF || produtosFiltrados.length === 0}
            className="flex items-center gap-1"
          >
            {exportandoPDF ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {exportandoPDF ? "Exportando..." : "Exportar para PDF"}
          </Button>
          <span className="text-sm text-gray-500">{produtosFiltrados.length} produtos encontrados</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md">
          <p className="text-sm">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={carregarProdutos}
            className="mt-2 text-red-700 border-red-300 hover:bg-red-100"
          >
            Tentar novamente
          </Button>
        </div>
      )}

      <div className="flex justify-between items-center gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por número, cliente, produto, cor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="proposta">Proposta</SelectItem>
              <SelectItem value="execucao">Em Execução</SelectItem>
              <SelectItem value="finalizado">Finalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border overflow-hidden" ref={tabelaRef}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead
                  className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer hover:bg-muted"
                  onClick={() => alternarOrdenacao("orcamentoData")}
                >
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Data
                    {ordenacao.campo === "orcamentoData" &&
                      (ordenacao.direcao === "asc" ? (
                        <ChevronUp className="ml-1 h-4 w-4" />
                      ) : (
                        <ChevronDown className="ml-1 h-4 w-4" />
                      ))}
                  </div>
                </TableHead>
                <TableHead
                  className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer hover:bg-muted"
                  onClick={() => alternarOrdenacao("orcamentoNumero")}
                >
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Descrição do Pedido
                    {ordenacao.campo === "orcamentoNumero" &&
                      (ordenacao.direcao === "asc" ? (
                        <ChevronUp className="ml-1 h-4 w-4" />
                      ) : (
                        <ChevronDown className="ml-1 h-4 w-4" />
                      ))}
                  </div>
                </TableHead>
                <TableHead
                  className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer hover:bg-muted"
                  onClick={() => alternarOrdenacao("produtoNome")}
                >
                  <div className="flex items-center">
                    <Tag className="h-4 w-4 mr-2" />
                    Produto
                    {ordenacao.campo === "produtoNome" &&
                      (ordenacao.direcao === "asc" ? (
                        <ChevronUp className="ml-1 h-4 w-4" />
                      ) : (
                        <ChevronDown className="ml-1 h-4 w-4" />
                      ))}
                  </div>
                </TableHead>
                <TableHead
                  className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer hover:bg-muted"
                  onClick={() => alternarOrdenacao("cor")}
                >
                  <div className="flex items-center">
                    <Palette className="h-4 w-4 mr-2" />
                    Cor
                    {ordenacao.campo === "cor" &&
                      (ordenacao.direcao === "asc" ? (
                        <ChevronUp className="ml-1 h-4 w-4" />
                      ) : (
                        <ChevronDown className="ml-1 h-4 w-4" />
                      ))}
                  </div>
                </TableHead>
                <TableHead
                  className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer hover:bg-muted"
                  onClick={() => alternarOrdenacao("tamanho")}
                >
                  <div className="flex items-center">
                    <Ruler className="h-4 w-4 mr-2" />
                    Tamanho
                    {ordenacao.campo === "tamanho" &&
                      (ordenacao.direcao === "asc" ? (
                        <ChevronUp className="ml-1 h-4 w-4" />
                      ) : (
                        <ChevronDown className="ml-1 h-4 w-4" />
                      ))}
                  </div>
                </TableHead>
                <TableHead
                  className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer hover:bg-muted"
                  onClick={() => alternarOrdenacao("quantidade")}
                >
                  <div className="flex items-center">
                    Qtd
                    {ordenacao.campo === "quantidade" &&
                      (ordenacao.direcao === "asc" ? (
                        <ChevronUp className="ml-1 h-4 w-4" />
                      ) : (
                        <ChevronDown className="ml-1 h-4 w-4" />
                      ))}
                  </div>
                </TableHead>
                <TableHead className="px-4 py-3 text-left font-medium text-muted-foreground">
                  <div className="flex items-center">Status</div>
                </TableHead>
                <TableHead className="px-4 py-3 text-left font-medium text-muted-foreground">
                  <div className="flex items-center">Observação</div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="px-4 py-4 text-center text-muted-foreground">
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : produtosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="px-4 py-4 text-center text-muted-foreground">
                    <div className="text-center py-8 bg-accent/30 rounded-lg">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <h4 className="text-lg font-medium text-gray-600">Nenhum produto encontrado</h4>
                      <p className="text-gray-500 mt-1">
                        {searchTerm || statusFilter !== "todos"
                          ? "Tente uma busca diferente"
                          : "Não há produtos cadastrados"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                produtosFiltrados.map((produto, index) => (
                  <>
                    {/* Separador entre orçamentos diferentes */}
                    {isNovoOrcamento(index) && index > 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="p-0 h-2 bg-gray-100">
                          <div className="border-t-2 border-gray-200"></div>
                        </TableCell>
                      </TableRow>
                    )}

                    {/* Separador entre produtos diferentes do mesmo orçamento */}
                    {isNovoProduto(index) && index > 0 && !isNovoOrcamento(index) && (
                      <TableRow>
                        <TableCell colSpan={8} className="p-0 h-0.5">
                          <div className="border-t-2 border-gray-300"></div>
                        </TableCell>
                      </TableRow>
                    )}

                    {/* Linha do produto */}
                    <TableRow
                      key={produto.id}
                      className={`border-t hover:bg-muted/50 ${
                        isNovoOrcamento(index) ? "border-t-2 border-t-primary/20" : "border-t-gray-100"
                      }`}
                    >
                      <TableCell className="px-4 py-0.5 align-middle">{formatarData(produto.orcamentoData)}</TableCell>
                      <TableCell className="px-4 py-0.5 align-middle">
                        <span className="font-medium text-primary">
                          {formatarDescricaoPedido(produto.orcamentoNumero, produto.nomeContato)}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-0.5 align-middle">{produto.produtoNome}</TableCell>
                      <TableCell className="px-4 py-0.5 align-middle">{produto.cor}</TableCell>
                      <TableCell className="px-4 py-0.5 align-middle">{produto.tamanho}</TableCell>
                      <TableCell className="px-4 py-0.5 align-middle font-medium">{produto.quantidade}</TableCell>
                      <TableCell className="px-4 py-0.5 align-middle">
                        <span
                          className={`text-xs font-medium px-1.5 py-0.5 rounded-full border ${getStatusClassName(produto.status)}`}
                        >
                          {produto.status === "proposta"
                            ? "Proposta"
                            : produto.status === "execucao"
                              ? "Em Execução"
                              : produto.status === "finalizado"
                                ? "Finalizado"
                                : produto.status}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-0.5 align-middle min-w-[150px] h-[30px]">
                        {/* Célula em branco para anotações manuais */}
                      </TableCell>
                    </TableRow>
                  </>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
