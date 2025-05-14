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
  Printer,
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
  const [statusFilter, setStatusFilter] = useState<string>("4")
  const [error, setError] = useState<string | null>(null)
  const [exportandoPDF, setExportandoPDF] = useState(false)
  const [imprimindo, setImprimindo] = useState(false)
  const tabelaRef = useRef<HTMLDivElement>(null)
  const impressaoRef = useRef<HTMLDivElement>(null)

  // Estados para ordenação
  const [ordenacao, setOrdenacao] = useState<{ campo: string; direcao: "asc" | "desc" }>({
    campo: "orcamentoNumero",
    direcao: "asc",
  })

  // Adicionar um novo estado para controlar o modo de visualização
  const [modoVisualizacao, setModoVisualizacao] = useState<"orcamento" | "produto">("orcamento")

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
  }, [produtos, searchTerm, statusFilter, ordenacao, modoVisualizacao])

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

  // Modificar a função filtrarProdutos para incluir a lógica de agrupamento por produto
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
      resultado = resultado.filter((produto) => {
        // Mapear status antigos para novos códigos numéricos
        const statusMapeado = mapearStatusAntigo(produto.status || "")
        return statusMapeado === statusFilter
      })
    }

    // Ordenar os resultados com base no modo de visualização
    if (modoVisualizacao === "orcamento") {
      // Ordenação original por orçamento
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
    } else {
      // Ordenação por tipo de produto
      resultado = resultado.sort((a, b) => {
        // Primeiro ordenar por nome do produto
        const comparacaoProduto =
          ordenacao.direcao === "asc"
            ? a.produtoNome.localeCompare(b.produtoNome)
            : b.produtoNome.localeCompare(a.produtoNome)

        // Se os produtos forem diferentes, retornar a comparação de produtos
        if (comparacaoProduto !== 0) {
          return comparacaoProduto
        }

        // Se os produtos forem iguais, ordenar por número de orçamento
        const comparacaoOrcamento = a.orcamentoNumero.localeCompare(b.orcamentoNumero)

        // Se os orçamentos forem diferentes, retornar a comparação de orçamentos
        if (comparacaoOrcamento !== 0) {
          return comparacaoOrcamento
        }

        // Se os orçamentos forem iguais, ordenar por tamanho
        return ordenarTamanhos(a.tamanho, b.tamanho)
      })
    }

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
      case "5":
      case "proposta":
        return "bg-blue-100 text-blue-700 border-blue-300"
      case "4":
      case "execucao":
        return "bg-amber-100 text-amber-700 border-amber-300"
      case "3":
      case "cobranca":
        return "bg-red-100 text-red-700 border-red-300"
      case "2":
      case "entregue":
        return "bg-purple-100 text-purple-700 border-purple-300"
      case "1":
      case "finalizado":
        return "bg-green-100 text-green-700 border-green-300"
      default:
        return "bg-gray-100 text-gray-700 border-gray-300"
    }
  }

  // Função para extrair a empresa da descrição do produto
  const extrairEmpresa = (descricaoProduto: string, clienteNome: string): string => {
    // Lista de palavras-chave que geralmente indicam nomes de empresas
    const palavrasChaveEmpresas = [
      "LTDA",
      "ME",
      "EIRELI",
      "S/A",
      "SA",
      "EMPRESA",
      "INDÚSTRIA",
      "INDUSTRIA",
      "COMÉRCIO",
      "COMERCIO",
      "SERVIÇOS",
      "SERVICOS",
      "CALDEIRARIA",
      "CIMENTOS",
      "CONSTRUTORA",
    ]

    // Verificar se alguma palavra-chave está presente na descrição
    for (const palavraChave of palavrasChaveEmpresas) {
      if (descricaoProduto.includes(palavraChave)) {
        // Encontrar a posição da palavra-chave
        const posicao = descricaoProduto.indexOf(palavraChave)

        // Encontrar o início da empresa (algumas palavras antes da palavra-chave)
        const palavras = descricaoProduto.substring(0, posicao + palavraChave.length).split(" ")

        // Pegar as últimas 2-3 palavras incluindo a palavra-chave
        const numPalavras = Math.min(3, palavras.length)
        return palavras.slice(-numPalavras).join(" ")
      }
    }

    // Se não encontrou palavras-chave, verificar se o nome do cliente está na descrição
    if (clienteNome && descricaoProduto.includes(clienteNome)) {
      return clienteNome
    }

    // Se não encontrou nada, pegar as últimas 2 palavras da descrição
    const palavras = descricaoProduto.split(" ")
    if (palavras.length > 2) {
      return palavras.slice(-2).join(" ")
    }

    // Se tem apenas 1-2 palavras, usar a última
    return palavras[palavras.length - 1]
  }

  // Modifique a função formatarDescricaoPedido para usar uma abordagem padronizada
  const formatarDescricaoPedido = (descricao: string, clienteNome: string, nomeContato: string): string => {
    // Extrair apenas o número do orçamento (primeira parte antes do hífen)
    const numero = descricao.split("-")[0].trim()

    // Extrair a empresa e o contato do orcamento atual
    const empresa = clienteNome || ""
    const contato = nomeContato || ""

    // Retornar no formato "numero - empresa - contato"
    return `${numero} - ${empresa} - ${contato}`
  }

  // Função para desenhar uma linha grossa no PDF
  const desenharLinhaGrossa = (pdf: any, yPosition: number, margin: number, contentWidth: number) => {
    pdf.setDrawColor(100, 100, 100) // Cor cinza escura para a linha
    pdf.setLineWidth(0.5) // Espessura reduzida e padronizada para todas as linhas grossas
    pdf.line(margin, yPosition, margin + contentWidth, yPosition)
    pdf.setLineWidth(0.1) // Restaurar a espessura padrão
    pdf.setDrawColor(0, 0, 0) // Restaurar a cor padrão
  }

  // Função para mapear status antigos para novos códigos numéricos
  const mapearStatusAntigo = (status: string): string => {
    switch (status) {
      case "proposta":
        return "5"
      case "execucao":
        return "4"
      case "cobranca":
        return "3"
      case "entregue":
        return "2"
      case "finalizado":
        return "1"
      default:
        return status
    }
  }

  // Função para criar o cabeçalho da tabela na impressão
  const criarCabecalhoTabela = (modo: "orcamento" | "produto") => {
    const headerRow = document.createElement("tr")
    headerRow.className = "cabecalho-tabela"

    if (modo === "orcamento") {
      // Cabeçalho para modo orçamento
      const headers = ["Produto", "Cor", "Tamanho", "Qtd", "Observação"]
      const classes = ["coluna-produto", "coluna-cor", "coluna-tamanho", "coluna-qtd", "coluna-obs"]

      headers.forEach((header, index) => {
        const th = document.createElement("th")
        th.textContent = header
        th.className = classes[index]
        headerRow.appendChild(th)
      })
    } else {
      // Cabeçalho para modo produto
      const headers = ["Produto", "Número e Contato", "Tamanho", "Cor", "Qtd", "Observação"]
      const classes = ["coluna-produto", "coluna-numero", "coluna-tamanho", "coluna-cor", "coluna-qtd", "coluna-obs"]

      headers.forEach((header, index) => {
        const th = document.createElement("th")
        th.textContent = header
        th.className = classes[index]
        headerRow.appendChild(th)
      })
    }

    return headerRow
  }

  // Função para imprimir a tabela diretamente
  const imprimirTabela = () => {
    try {
      setImprimindo(true)

      // Criar um elemento temporário para a impressão
      const conteudoImpressao = document.createElement("div")
      conteudoImpressao.className = "conteudo-impressao"

      // Adicionar estilos específicos para impressão
      const estilosImpressao = document.createElement("style")
      estilosImpressao.textContent = `
        @page {
          size: A4 portrait;
          margin: 10mm;
        }
        body {
          font-family: Arial, sans-serif;
          font-size: 9pt;
          line-height: 1.2;
        }
        .conteudo-impressao {
          width: 100%;
          max-width: 190mm; /* A4 width - margins */
        }
        .titulo-impressao {
          font-size: 14pt;
          font-weight: bold;
          margin-bottom: 5mm;
          text-align: center;
        }
        .subtitulo-impressao {
          font-size: 10pt;
          margin-bottom: 3mm;
          text-align: center;
        }
        .data-impressao {
          font-size: 8pt;
          margin-bottom: 5mm;
          text-align: right;
        }
        .grupo-tabela {
          margin-bottom: 10mm;
          page-break-inside: avoid;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          page-break-inside: avoid;
          margin-bottom: 5mm;
        }
        tr {
          page-break-inside: avoid;
          page-break-after: auto;
        }
        th, td {
          border: 0.5pt solid #ddd;
          padding: 2mm 1mm;
          text-align: left;
          font-size: 8pt;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
        th {
          background-color: #f0f0f0;
          font-weight: bold;
        }
        .coluna-produto {
          width: 25%;
        }
        .coluna-numero {
          width: 15%;
        }
        .coluna-tamanho {
          width: 10%;
        }
        .coluna-cor {
          width: 10%;
        }
        .coluna-qtd {
          width: 5%;
          text-align: center;
        }
        .coluna-obs {
          width: 35%; /* Aproximadamente 5cm */
        }
        .separador-grupo {
          border-top: 4pt solid #666;
          height: 4pt;
        }
        .separador-item {
          border-top: 2pt solid #999;
          height: 2pt;
        }
        .cabecalho-grupo {
          background-color: #f5f5f5;
          font-weight: bold;
          font-size: 10pt;
          padding: 3mm 2mm;
          border: none;
          text-align: left;
          margin-bottom: 2mm;
        }
        .cabecalho-tabela {
          background-color: #e0e0e0;
        }
        .linha-alternada {
          background-color: #f9f9f9;
        }
        @media print {
          body * {
            visibility: hidden;
          }
          .conteudo-impressao, .conteudo-impressao * {
            visibility: visible;
          }
          .conteudo-impressao {
            position: absolute;
            left: 0;
            top: 0;
          }
        }
      `
      document.head.appendChild(estilosImpressao)

      // Adicionar título
      const titulo = document.createElement("div")
      titulo.className = "titulo-impressao"
      titulo.textContent =
        modoVisualizacao === "orcamento" ? "Tabela de Produtos por Orçamento" : "Tabela de Produtos Agrupados por Tipo"
      conteudoImpressao.appendChild(titulo)

      // Adicionar data de geração
      const dataGeracao = document.createElement("div")
      dataGeracao.className = "data-impressao"
      dataGeracao.textContent = `Gerado em: ${new Date().toLocaleDateString("pt-BR")}`
      conteudoImpressao.appendChild(dataGeracao)

      // Agrupar produtos com base no modo de visualização
      const agrupamentos: { [key: string]: ProdutoOrcamento[] } = {}

      if (modoVisualizacao === "orcamento") {
        // Agrupar por orçamento
        produtosFiltrados.forEach((produto) => {
          if (!agrupamentos[produto.orcamentoId]) {
            agrupamentos[produto.orcamentoId] = []
          }
          agrupamentos[produto.orcamentoId].push(produto)
        })
      } else {
        // Agrupar por tipo de produto
        produtosFiltrados.forEach((produto) => {
          if (!agrupamentos[produto.produtoNome]) {
            agrupamentos[produto.produtoNome] = []
          }
          agrupamentos[produto.produtoNome].push(produto)
        })
      }

      // Processar cada grupo
      Object.keys(agrupamentos).forEach((chaveGrupo, grupoIndex) => {
        const produtosDoGrupo = agrupamentos[chaveGrupo]
        const primeiroItem = produtosDoGrupo[0]

        // Criar um container para o grupo
        const grupoContainer = document.createElement("div")
        grupoContainer.className = "grupo-tabela"

        // Adicionar cabeçalho do grupo
        const cabecalhoGrupo = document.createElement("div")
        cabecalhoGrupo.className = "cabecalho-grupo"

        if (modoVisualizacao === "orcamento") {
          cabecalhoGrupo.textContent = `Orçamento: ${formatarDescricaoPedido(primeiroItem.orcamentoNumero, primeiroItem.clienteNome, primeiroItem.nomeContato)}`
          cabecalhoGrupo.title = `Data: ${formatarData(primeiroItem.orcamentoData)} | Cliente: ${primeiroItem.clienteNome} | Contato: ${primeiroItem.nomeContato || "Não especificado"}`

          // Adicionar informações adicionais
          const infoAdicional = document.createElement("div")
          infoAdicional.style.fontSize = "8pt"
          infoAdicional.style.fontWeight = "normal"
          infoAdicional.style.marginTop = "1mm"
          infoAdicional.textContent = `Data: ${formatarData(primeiroItem.orcamentoData)} | Cliente: ${primeiroItem.clienteNome} | Contato: ${primeiroItem.nomeContato || "Não especificado"}`
          cabecalhoGrupo.appendChild(infoAdicional)
        } else {
          cabecalhoGrupo.textContent = `Produto: ${chaveGrupo}`
        }

        grupoContainer.appendChild(cabecalhoGrupo)

        // Criar tabela para este grupo
        const tabela = document.createElement("table")

        // Adicionar cabeçalho da tabela
        const thead = document.createElement("thead")
        thead.appendChild(criarCabecalhoTabela(modoVisualizacao))
        tabela.appendChild(thead)

        // Criar corpo da tabela
        const tbody = document.createElement("tbody")

        // Ordenar os produtos com base no modo
        const produtosOrdenados = [...produtosDoGrupo]

        if (modoVisualizacao === "orcamento") {
          // Ordenar por nome do produto e depois por tamanho
          produtosOrdenados.sort((a, b) => {
            const comparacaoProduto = a.produtoNome.localeCompare(b.produtoNome)
            if (comparacaoProduto !== 0) return comparacaoProduto
            return ordenarTamanhos(a.tamanho, b.tamanho)
          })
        } else {
          // Ordenar por número de orçamento e depois por tamanho
          produtosOrdenados.sort((a, b) => {
            const comparacaoOrcamento = a.orcamentoNumero.localeCompare(b.orcamentoNumero)
            if (comparacaoOrcamento !== 0) return comparacaoOrcamento
            return ordenarTamanhos(a.tamanho, b.tamanho)
          })
        }

        let orcamentoAnterior = ""
        let totalQuantidade = 0

        // Adicionar linhas de produtos
        produtosOrdenados.forEach((produto, index) => {
          // Verificar se é um novo orçamento no modo produto
          const isNovoOrcamentoNoProduto =
            modoVisualizacao === "produto" && orcamentoAnterior !== "" && orcamentoAnterior !== produto.orcamentoId

          // Se for um novo orçamento no modo produto, adicionar uma linha separadora antes
          if (isNovoOrcamentoNoProduto) {
            const separatorRow = document.createElement("tr")
            separatorRow.className = "separador-item"
            const separatorCell = document.createElement("td")
            separatorCell.colSpan = modoVisualizacao === "orcamento" ? 5 : 6
            separatorCell.style.padding = "0"
            separatorCell.style.height = "6px"
            separatorCell.style.backgroundColor = "#f0f0f0"
            separatorCell.style.borderTop = "2pt solid #666"
            separatorCell.style.borderBottom = "1pt solid #999"
            separatorRow.appendChild(separatorCell)
            tbody.appendChild(separatorRow)
          }

          // Adicionar linha para o produto
          const row = document.createElement("tr")
          row.className = index % 2 === 1 ? "linha-alternada" : ""

          if (modoVisualizacao === "orcamento") {
            // Células para modo orçamento
            const cells = [
              { text: produto.produtoNome, class: "coluna-produto" },
              { text: produto.cor, class: "coluna-cor" },
              { text: produto.tamanho, class: "coluna-tamanho" },
              { text: produto.quantidade.toString(), class: "coluna-qtd" },
              { text: "", class: "coluna-obs" },
            ]

            cells.forEach((cellInfo) => {
              const td = document.createElement("td")
              td.textContent = cellInfo.text
              td.className = cellInfo.class
              row.appendChild(td)
            })
          } else {
            // Células para modo produto
            const numeroEContato = produto.nomeContato
              ? `${produto.orcamentoNumero.split(" - ")[0]} - ${produto.nomeContato}`
              : produto.orcamentoNumero.split(" - ")[0]

            const cells = [
              { text: produto.produtoNome, class: "coluna-produto" },
              { text: numeroEContato, class: "coluna-numero" },
              { text: produto.tamanho, class: "coluna-tamanho" },
              { text: produto.cor, class: "coluna-cor" },
              { text: produto.quantidade.toString(), class: "coluna-qtd" },
              { text: "", class: "coluna-obs" },
            ]

            cells.forEach((cellInfo) => {
              const td = document.createElement("td")
              td.textContent = cellInfo.text
              td.className = cellInfo.class
              row.appendChild(td)
            })
          }

          tbody.appendChild(row)

          // Somar a quantidade para o total
          totalQuantidade += produto.quantidade

          // Atualizar o orçamento anterior
          orcamentoAnterior = produto.orcamentoId
        })

        // Adicionar linha de total
        const totalRow = document.createElement("tr")
        totalRow.style.fontWeight = "bold"
        totalRow.style.backgroundColor = "#f0f0f0"

        if (modoVisualizacao === "orcamento") {
          const totalCell1 = document.createElement("td")
          totalCell1.colSpan = 3
          totalCell1.textContent = "Total"
          totalCell1.style.textAlign = "right"
          totalRow.appendChild(totalCell1)

          const totalCell2 = document.createElement("td")
          totalCell2.textContent = totalQuantidade.toString()
          totalCell2.className = "coluna-qtd"
          totalRow.appendChild(totalCell2)

          const totalCell3 = document.createElement("td")
          totalCell3.className = "coluna-obs"
          totalRow.appendChild(totalCell3)
        } else {
          const totalCell1 = document.createElement("td")
          totalCell1.colSpan = 4
          totalCell1.textContent = "Total"
          totalCell1.style.textAlign = "right"
          totalRow.appendChild(totalCell1)

          const totalCell2 = document.createElement("td")
          totalCell2.textContent = totalQuantidade.toString()
          totalCell2.className = "coluna-qtd"
          totalRow.appendChild(totalCell2)

          const totalCell3 = document.createElement("td")
          totalCell3.className = "coluna-obs"
          totalRow.appendChild(totalCell3)
        }

        tbody.appendChild(totalRow)

        tabela.appendChild(tbody)
        grupoContainer.appendChild(tabela)
        conteudoImpressao.appendChild(grupoContainer)
      })

      // Adicionar o conteúdo ao DOM temporariamente
      document.body.appendChild(conteudoImpressao)

      // Imprimir
      window.print()

      // Remover elementos temporários após a impressão
      setTimeout(() => {
        document.body.removeChild(conteudoImpressao)
        document.head.removeChild(estilosImpressao)
        setImprimindo(false)
      }, 1000)
    } catch (error) {
      console.error("Erro ao imprimir tabela:", error)
      alert("Erro ao imprimir tabela. Tente novamente.")
      setImprimindo(false)
    }
  }

  // Modificar a função exportarParaPDF para suportar ambos os modos de visualização
  // Adicionar o parâmetro modo à função
  const exportarParaPDF = async (modo: "orcamento" | "produto" = modoVisualizacao) => {
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

      // Agrupar produtos com base no modo de visualização
      const agrupamentos: { [key: string]: ProdutoOrcamento[] } = {}

      if (modo === "orcamento") {
        // Agrupar por orçamento
        produtosFiltrados.forEach((produto) => {
          if (!agrupamentos[produto.orcamentoId]) {
            agrupamentos[produto.orcamentoId] = []
          }
          agrupamentos[produto.orcamentoId].push(produto)
        })
      } else {
        // Agrupar por tipo de produto
        produtosFiltrados.forEach((produto) => {
          if (!agrupamentos[produto.produtoNome]) {
            agrupamentos[produto.produtoNome] = []
          }
          agrupamentos[produto.produtoNome].push(produto)
        })
      }

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

      // Título baseado no modo de visualização
      const titulo = modo === "orcamento" ? "Tabela de Produtos por Orçamento" : "Tabela de Produtos Agrupados por Tipo"
      pdf.text(titulo, margin, margin + 10)

      // Adicionar data de geração
      pdf.setFontSize(10)
      pdf.setFont("helvetica", "normal")
      const dataAtual = new Date().toLocaleDateString("pt-BR")
      pdf.text(`Gerado em: ${dataAtual}`, margin, margin + 16)

      let yPosition = margin + 25 // Posição inicial após o título
      let pageCount = 1

      // Função para verificar se um grupo cabe na página atual
      const verificarEspacoParaGrupo = (numProdutos: number) => {
        // Altura estimada para cada linha de produto (7mm)
        const alturaEstimadaPorProduto = 7
        // Altura estimada para o cabeçalho do grupo (10mm)
        const alturaEstimadaCabecalho = 10
        // Altura total estimada para o grupo
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

        if (modo === "orcamento") {
          // Cabeçalho para modo orçamento
          pdf.text("Produto", margin + 5, yPosition + 5)
          pdf.text("Cor", margin + 95, yPosition + 5)
          pdf.text("Tamanho", margin + 120, yPosition + 5)
          pdf.text("Qtd", margin + 145, yPosition + 5)
          pdf.text("Obs", margin + 160, yPosition + 5)
        } else {
          // Cabeçalho para modo produto
          pdf.text("Produto", margin + 5, yPosition + 5)
          pdf.text("Número e Contato", margin + 70, yPosition + 5)
          pdf.text("Tamanho", margin + 130, yPosition + 5)
          pdf.text("Cor", margin + 155, yPosition + 5)
          pdf.text("Qtd", margin + 180, yPosition + 5)
        }

        yPosition += 8

        // Adicionar linha grossa abaixo do cabeçalho
        desenharLinhaGrossa(pdf, yPosition, margin, contentWidth)
      }

      // Processar cada grupo
      for (const chaveGrupo of Object.keys(agrupamentos)) {
        const produtosDoGrupo = agrupamentos[chaveGrupo]

        // Verificar se o grupo cabe na página atual, senão adicionar nova página
        if (!verificarEspacoParaGrupo(produtosDoGrupo.length)) {
          pdf.addPage()
          pageCount++
          yPosition = margin + 10
        }

        // Adicionar informações do grupo
        const primeiroItem = produtosDoGrupo[0]
        pdf.setFont("helvetica", "bold")
        pdf.setFontSize(11)
        pdf.setTextColor(0, 0, 0)

        if (modo === "orcamento") {
          // Título para modo orçamento
          pdf.text(
            `Orçamento: ${formatarDescricaoPedido(primeiroItem.orcamentoNumero, primeiroItem.clienteNome, primeiroItem.nomeContato)}`,
            margin,
            yPosition + 5,
          )

          pdf.setFont("helvetica", "normal")
          pdf.setFontSize(9)
          pdf.text(
            `Data: ${formatarData(primeiroItem.orcamentoData)} | Cliente: ${primeiroItem.clienteNome} | Contato: ${primeiroItem.nomeContato || "Não especificado"}`,
            margin,
            yPosition + 10,
          )
        } else {
          // Título para modo produto
          pdf.text(`Produto: ${chaveGrupo}`, margin, yPosition + 5)
        }

        yPosition += 15

        // Desenhar cabeçalho da tabela
        desenharCabecalhoTabela()

        // Adicionar produtos do grupo
        pdf.setFont("helvetica", "normal")
        pdf.setFontSize(8)
        pdf.setTextColor(0, 0, 0)

        // Ordenar os produtos com base no modo
        const produtosOrdenados = [...produtosDoGrupo]

        if (modo === "orcamento") {
          // Ordenar por nome do produto e depois por tamanho
          produtosOrdenados.sort((a, b) => {
            const comparacaoProduto = a.produtoNome.localeCompare(b.produtoNome)
            if (comparacaoProduto !== 0) return comparacaoProduto
            return ordenarTamanhos(a.tamanho, b.tamanho)
          })
        } else {
          // Ordenar por número de orçamento e depois por tamanho
          produtosOrdenados.sort((a, b) => {
            const comparacaoOrcamento = a.orcamentoNumero.localeCompare(b.orcamentoNumero)
            if (comparacaoOrcamento !== 0) return comparacaoOrcamento
            return ordenarTamanhos(a.tamanho, b.tamanho)
          })
        }

        // Garantir que os produtos estejam ordenados corretamente para detectar mudanças de orçamento
        if (modo === "produto") {
          // Ordenar primeiro por nome do produto e depois por número de orçamento
          produtosOrdenados.sort((a, b) => {
            const comparacaoProduto = a.produtoNome.localeCompare(b.produtoNome)
            if (comparacaoProduto !== 0) return comparacaoProduto
            return a.orcamentoNumero.localeCompare(b.orcamentoNumero)
          })
        }

        let orcamentoAnterior = ""
        let totalQuantidade = 0

        for (let i = 0; i < produtosOrdenados.length; i++) {
          const produto = produtosOrdenados[i]
          const isUltimaLinha = i === produtosOrdenados.length - 1

          // Verificar se é um novo orçamento no modo produto
          if (modo === "produto" && orcamentoAnterior !== "" && orcamentoAnterior !== produto.orcamentoId) {
            // Adicionar uma linha mais grossa para separar os orçamentos
            // Primeiro uma linha de fundo cinza
            pdf.setFillColor(240, 240, 240)
            pdf.rect(margin, yPosition, contentWidth, 3, "F")

            // Depois uma linha mais grossa e escura
            pdf.setDrawColor(50, 50, 50) // Cor cinza mais escura para maior contraste
            pdf.setLineWidth(1.5) // Linha muito mais grossa para garantir visibilidade
            pdf.line(margin, yPosition, margin + contentWidth, yPosition)

            // Adicionar uma segunda linha para reforçar
            pdf.setLineWidth(0.8)
            pdf.setDrawColor(100, 100, 100)
            pdf.line(margin, yPosition + 2, margin + contentWidth, yPosition + 2)

            // Restaurar configurações padrão
            pdf.setLineWidth(0.1)
            pdf.setDrawColor(0, 0, 0)

            yPosition += 4 // Aumentar o espaço após a linha para melhor visualização
          }

          // Desenhar linha alternada para melhor legibilidade
          if (i % 2 === 1) {
            pdf.setFillColor(248, 248, 248)
            pdf.rect(margin, yPosition, contentWidth, 6, "F")
          }

          if (modo === "orcamento") {
            // Renderizar linha no modo orçamento
            const produtoNomeLimitado =
              produto.produtoNome.length > 40 ? produto.produtoNome.substring(0, 40) + "..." : produto.produtoNome
            pdf.text(produtoNomeLimitado, margin + 5, yPosition + 4)

            const corLimitada = produto.cor.length > 12 ? produto.cor.substring(0, 12) + "..." : produto.cor
            pdf.text(corLimitada, margin + 95, yPosition + 4)

            pdf.text(produto.tamanho, margin + 120, yPosition + 4)
            pdf.text(produto.quantidade.toString(), margin + 145, yPosition + 4)
          } else {
            // Renderizar linha no modo produto
            // Mostrar o nome do produto em todas as linhas
            const produtoNomeLimitado =
              produto.produtoNome.length > 30 ? produto.produtoNome.substring(0, 30) + "..." : produto.produtoNome
            pdf.text(produtoNomeLimitado, margin + 5, yPosition + 4)

            // Extrair apenas o número do orçamento e adicionar o contato
            const numeroOrcamento = produto.orcamentoNumero.split(" - ")[0] || produto.orcamentoNumero
            const textoOrcamento = produto.nomeContato
              ? `${numeroOrcamento} - ${produto.nomeContato.substring(0, 15)}`
              : numeroOrcamento
            pdf.text(textoOrcamento, margin + 70, yPosition + 4)

            pdf.text(produto.tamanho, margin + 130, yPosition + 4)

            const corLimitada = produto.cor.length > 12 ? produto.cor.substring(0, 12) + "..." : produto.cor
            pdf.text(corLimitada, margin + 155, yPosition + 4)

            pdf.text(produto.quantidade.toString(), margin + 180, yPosition + 4)
          }

          // Somar a quantidade para o total
          totalQuantidade += produto.quantidade

          // Avançar para a próxima linha
          yPosition += 6

          // Se for a última linha, adicionar uma linha grossa no final
          if (isUltimaLinha) {
            desenharLinhaGrossa(pdf, yPosition, margin, contentWidth)

            // Adicionar linha de total
            yPosition += 6

            pdf.setFont("helvetica", "bold")
            pdf.setFontSize(9)

            if (modo === "orcamento") {
              pdf.text("Total:", margin + 120, yPosition + 4)
              pdf.text(totalQuantidade.toString(), margin + 145, yPosition + 4)
            } else {
              pdf.text("Total:", margin + 155, yPosition + 4)
              pdf.text(totalQuantidade.toString(), margin + 180, yPosition + 4)
            }

            yPosition += 6
            desenharLinhaGrossa(pdf, yPosition, margin, contentWidth)
          }

          // Verificar se precisa adicionar nova página
          if (yPosition > pageHeight - margin) {
            pdf.addPage()
            pageCount++
            yPosition = margin + 10
            desenharCabecalhoTabela()
          }

          // Atualizar o orçamento anterior para a próxima iteração
          orcamentoAnterior = produto.orcamentoId
        }

        // Adicionar espaço entre grupos
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

      // Salvar o PDF com nome baseado no modo
      const nomeArquivo = modo === "orcamento" ? "tabela-produtos-por-orcamento.pdf" : "tabela-produtos-por-tipo.pdf"
      pdf.save(nomeArquivo)
    } catch (error) {
      console.error("Erro ao exportar para PDF:", error)
      alert("Erro ao exportar para PDF. Tente novamente.")
    } finally {
      setExportandoPDF(false)
    }
  }

  const isNovoOrcamento = (index: number): boolean => {
    if (index === 0) return true
    return produtosFiltrados[index].orcamentoId !== produtosFiltrados[index - 1].orcamentoId
  }

  const isNovoProduto = (index: number): boolean => {
    if (index === 0) return true
    return produtosFiltrados[index].produtoNome !== produtosFiltrados[index - 1].produtoNome
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
            onClick={imprimirTabela}
            disabled={imprimindo || produtosFiltrados.length === 0}
            className="flex items-center gap-1"
          >
            {imprimindo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
            {imprimindo ? "Imprimindo..." : "Imprimir Tabela"}
          </Button>
          <div className="border-l border-gray-200 h-8 mx-2"></div>
          <div className="flex items-center gap-2">
            <Button
              variant={modoVisualizacao === "orcamento" ? "default" : "outline"}
              size="sm"
              onClick={() => setModoVisualizacao("orcamento")}
              className="flex items-center gap-1"
            >
              <FileText className="h-4 w-4" />
              Por Orçamento
            </Button>
            <Button
              variant={modoVisualizacao === "produto" ? "default" : "outline"}
              size="sm"
              onClick={() => setModoVisualizacao("produto")}
              className="flex items-center gap-1"
            >
              <Tag className="h-4 w-4" />
              Por Produto
            </Button>
          </div>
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
              <SelectItem value="5">5 - Proposta</SelectItem>
              <SelectItem value="4">4 - Execução</SelectItem>
              <SelectItem value="3">3 - Emitir Cobrança</SelectItem>
              <SelectItem value="2">2 - Entregue</SelectItem>
              <SelectItem value="1">1 - Finalizada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border overflow-hidden" ref={tabelaRef}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                {modoVisualizacao === "orcamento" ? (
                  // Cabeçalho para modo orçamento (original)
                  <>
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
                      <div className="flex items-center">Observação</div>
                    </TableHead>
                  </>
                ) : (
                  // Cabeçalho para modo produto
                  <>
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
                      onClick={() => alternarOrdenacao("orcamentoNumero")}
                    >
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        Número e Contato
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
                      <div className="flex items-center">Observação</div>
                    </TableHead>
                  </>
                )}
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
                    {/* Separador entre orçamentos diferentes ou produtos diferentes, dependendo do modo */}
                    {isNovoOrcamento(index) && index > 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="p-0 h-2 bg-gray-100">
                          <div className="border-t-2 border-gray-200"></div>
                        </TableCell>
                      </TableRow>
                    )}

                    {/* Separador entre produtos diferentes do mesmo orçamento ou orçamentos diferentes do mesmo produto */}
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
                      {modoVisualizacao === "orcamento" ? (
                        // Células para modo orçamento (original)
                        <>
                          <TableCell className="px-4 py-0.5 align-middle">
                            {formatarData(produto.orcamentoData)}
                          </TableCell>
                          <TableCell className="px-4 py-0.5 align-middle">
                            <div>
                              <span className="font-medium text-primary">
                                {formatarDescricaoPedido(
                                  produto.orcamentoNumero,
                                  produto.clienteNome,
                                  produto.nomeContato,
                                )}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-0.5 align-middle">{produto.produtoNome}</TableCell>
                          <TableCell className="px-4 py-0.5 align-middle">{produto.cor}</TableCell>
                          <TableCell className="px-4 py-0.5 align-middle">{produto.tamanho}</TableCell>
                          <TableCell className="px-4 py-0.5 align-middle font-medium">{produto.quantidade}</TableCell>

                          <TableCell className="px-4 py-0.5 align-middle min-w-[150px] h-[30px]">
                            {/* Célula em branco para anotações manuais */}
                          </TableCell>
                        </>
                      ) : (
                        // Células para modo produto
                        <>
                          <TableCell className="px-4 py-0.5 align-middle">
                            <span className="font-medium">{produto.produtoNome}</span>
                          </TableCell>
                          <TableCell className="px-4 py-0.5 align-middle">
                            {produto.orcamentoNumero.split(" - ")[0] || produto.orcamentoNumero}
                            {produto.nomeContato && (
                              <span className="text-gray-500 text-xs block">{produto.nomeContato}</span>
                            )}
                          </TableCell>
                          <TableCell className="px-4 py-0.5 align-middle">{produto.tamanho}</TableCell>
                          <TableCell className="px-4 py-0.5 align-middle">{produto.cor}</TableCell>
                          <TableCell className="px-4 py-0.5 align-middle font-medium">{produto.quantidade}</TableCell>
                          <TableCell className="px-4 py-0.5 align-middle min-w-[150px] h-[30px]">
                            {/* Célula em branco para anotações manuais */}
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  </>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Div oculta para impressão */}
      <div ref={impressaoRef} className="hidden"></div>
    </div>
  )
}
