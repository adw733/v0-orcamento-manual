"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Printer, Save, Check, AlertCircle, FileDown } from "lucide-react"
import FormularioOrcamento from "@/components/formulario-orcamento"
import VisualizacaoDocumento from "@/components/visualizacao-documento"
import GerenciadorClientes from "@/components/gerenciador-clientes"
import GerenciadorProdutos from "@/components/gerenciador-produtos"
import type { Cliente, Produto, Orcamento, ItemOrcamento, Estampa, DadosEmpresa } from "@/types/types"
import { supabase } from "@/lib/supabase"
import { mockClientes, mockProdutos } from "@/lib/mock-data"
import ListaOrcamentos from "@/components/lista-orcamentos"
import AssistenteIA from "@/components/assistente-ia"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset } from "@/components/ui/sidebar"
// Adicionar a importação do GerenciadorMateriais no início do arquivo, junto com as outras importações
import GerenciadorMateriais from "@/components/gerenciador-materiais"
// Adicionar a importação do GerenciadorEmpresa e DadosEmpresa
import GerenciadorEmpresa from "@/components/gerenciador-empresa"
// Importar o GerenciadorCategorias
import GerenciadorCategorias from "@/components/gerenciador-categorias"
// Adicionar a importação do componente TabelaProdutos no início do arquivo, junto com as outras importações
import TabelaProdutos from "@/components/tabela-produtos"

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
    condicoesPagamento: "45 DIAS FORA QUINZENA",
    prazoEntrega: "45 DIAS",
    validadeOrcamento: "15 DIAS",
    status: "5", // Atualizar para o novo formato de status
    valorFrete: 0, // Inicializar o valor do frete
    nomeContato: "",
    telefoneContato: "",
  })
  const [isPrinting, setIsPrinting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [orcamentoSalvo, setOrcamentoSalvo] = useState<string | null>(null)
  // Adicionar um novo estado para controlar se estamos criando um novo orçamento
  const [criandoNovoOrcamento, setCriandoNovoOrcamento] = useState(false)
  // Adicionar estado para feedback de salvamento
  const [feedbackSalvamento, setFeedbackSalvamento] = useState<{
    visivel: boolean
    sucesso: boolean
    mensagem: string
  }>({
    visivel: false,
    sucesso: false,
    mensagem: "",
  })
  // Adicionar estado para controlar a aba ativa
  const [abaAtiva, setAbaAtiva] = useState("orcamento")
  // Adicionar o estado para os dados da empresa
  const [dadosEmpresa, setDadosEmpresa] = useState<DadosEmpresa | null>(null)

  const documentoRef = useRef<HTMLDivElement>(null)
  const orcamentoRef = useRef<HTMLDivElement>(null)
  const fichasTecnicasRef = useRef<HTMLDivElement[]>([])

  const recarregarOrcamentosRef = useRef<(() => Promise<void>) | null>(null)

  // Função para obter o próximo número de orçamento
  const obterProximoNumeroOrcamento = async (): Promise<string> => {
    try {
      // Buscar o último orçamento para obter o número mais recente
      const { data, error } = await supabase
        .from("orcamentos")
        .select("numero")
        .order("created_at", { ascending: false })
        .limit(1)

      if (error) {
        console.error("Erro ao buscar último número de orçamento:", error)
        // Se houver erro, começar do 0140
        return "0140"
      }

      if (data && data.length > 0) {
        // Extrair o número do formato "XXXX - ..."
        const ultimoNumero = data[0].numero.split(" - ")[0]
        // Verificar se é um número válido
        const numeroAtual = Number.parseInt(ultimoNumero, 10)

        if (!isNaN(numeroAtual)) {
          // Incrementar e formatar com zeros à esquerda
          const proximoNumero = (numeroAtual + 1).toString().padStart(4, "0")
          return proximoNumero
        }
      }

      // Se não houver orçamentos ou o formato for inválido, começar do 0140
      return "0140"
    } catch (error) {
      console.error("Erro ao obter próximo número de orçamento:", error)
      return "0140"
    }
  }

  // Atualizar o status padrão para "5" (Proposta) ao criar um novo orçamento
  const criarNovoOrcamento = async () => {
    try {
      setIsLoading(true)

      // Obter o próximo número de orçamento
      const proximoNumero = await obterProximoNumeroOrcamento()

      setOrcamento({
        numero: proximoNumero + " - ", // O restante será preenchido quando o cliente for selecionado
        data: new Date().toISOString().split("T")[0],
        cliente: null,
        itens: [],
        observacoes: "",
        condicoesPagamento: "45 DIAS FORA QUINZENA",
        prazoEntrega: "45 DIAS",
        validadeOrcamento: "15 DIAS",
        status: "5", // Atualizar para o novo formato de status
        valorFrete: 0,
        nomeContato: "",
        telefoneContato: "",
      })
      setOrcamentoSalvo(null)
      setCriandoNovoOrcamento(true)
    } catch (error) {
      console.error("Erro ao criar novo orçamento:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Iniciar sempre com um orçamento vazio ao carregar a página
  useEffect(() => {
    criarNovoOrcamento()
  }, [])

  // Initialize with mock data if empty
  useEffect(() => {
    // Adicionar a função para carregar os dados da empresa
    const carregarDadosEmpresa = async () => {
      try {
        const { data, error } = await supabase.from("empresa").select("*").single()

        if (error) {
          if (error.code === "PGRST116") {
            // Não encontrou registros
            console.log("Nenhum dado de empresa encontrado.")
            return
          }
          throw error
        }

        if (data) {
          setDadosEmpresa(data)
        }
      } catch (error) {
        console.error("Erro ao carregar dados da empresa:", error)
      }
    }

    const carregarDadosIniciais = async () => {
      try {
        setIsLoading(true)

        // Carregar dados da empresa
        await carregarDadosEmpresa()

        // Carregar clientes
        const { data: clientesData, error: clientesError } = await supabase.from("clientes").select("*").order("nome")

        if (clientesError) {
          console.warn("Erro ao carregar clientes do Supabase, usando dados mock:", clientesError)
          if (clientes.length === 0) {
            setClientes(mockClientes)
          }
        } else if (clientesData && clientesData.length > 0) {
          // Converter para o formato da aplicação
          const clientesFormatados: Cliente[] = clientesData.map((cliente) => ({
            id: cliente.id,
            nome: cliente.nome,
            cnpj: cliente.cnpj || "",
            endereco: cliente.endereco || "",
            telefone: cliente.telefone || "",
            email: cliente.email || "",
            contato: cliente.contato || "",
          }))

          setClientes(clientesFormatados)
        } else if (clientes.length === 0) {
          setClientes(mockClientes)
        }

        // Carregar produtos
        const { data: produtosData, error: produtosError } = await supabase.from("produtos").select("*").order("nome")

        if (produtosError) {
          console.warn("Erro ao carregar produtos do Supabase, usando dados mock:", produtosError)
          if (produtos.length === 0) {
            setProdutos(mockProdutos)
          }
        } else if (produtosData && produtosData.length > 0) {
          // Verificar se há produtos sem código e atualizar se necessário
          const produtosSemCodigo = produtosData.filter((p) => !p.codigo)
          if (produtosSemCodigo.length > 0) {
            console.log(`Encontrados ${produtosSemCodigo.length} produtos sem código. Atualizando...`)

            // Atualizar códigos sequencialmente
            let contador = 1
            const ultimoProdutoComCodigo = produtosData
              .filter((p) => p.codigo)
              .sort((a, b) => {
                const numA = a.codigo ? Number.parseInt(a.codigo.replace(/\D/g, "")) : 0
                const numB = b.codigo ? Number.parseInt(b.codigo.replace(/\D/g, "")) : 0
                return numB - numA
              })[0]

            if (ultimoProdutoComCodigo && ultimoProdutoComCodigo.codigo) {
              const match = ultimoProdutoComCodigo.codigo.match(/^P?(\d+)$/)
              if (match && match[1]) {
                contador = Number.parseInt(match[1], 10) + 1
              }
            }

            // Atualizar cada produto sem código
            for (const produto of produtosSemCodigo) {
              const novoCodigo = "P" + String(contador).padStart(4, "0")
              contador++

              await supabase.from("produtos").update({ codigo: novoCodigo }).eq("id", produto.id)

              // Atualizar o código no objeto local
              produto.codigo = novoCodigo
            }
          }

          // Para cada produto, buscar seus tecidos
          const produtosCompletos = await Promise.all(
            produtosData.map(async (produto) => {
              // Buscar tecidos do produto
              const { data: tecidosData, error: tecidosError } = await supabase
                .from("tecidos")
                .select("*")
                .eq("produto_id", produto.id)

              if (tecidosError) {
                console.error("Erro ao listar tecidos do produto:", tecidosError)
                return {
                  id: produto.id,
                  codigo: produto.codigo || `P${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`, // Código aleatório se não existir
                  nome: produto.nome,
                  valorBase: Number(produto.valor_base),
                  tecidos: [],
                  cores: produto.cores || [],
                  tamanhosDisponiveis: produto.tamanhos_disponiveis || [],
                  categoria: produto.categoria || "Outros",
                }
              }

              // Converter para o formato da aplicação
              return {
                id: produto.id,
                codigo: produto.codigo || `P${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`, // Código aleatório se não existir
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
                categoria: produto.categoria || "Outros",
              } as Produto
            }),
          )

          setProdutos(produtosCompletos)
        } else if (produtos.length === 0) {
          // Adicionar códigos aos produtos mock
          const produtosComCodigo = mockProdutos.map((p, index) => ({
            ...p,
            codigo: `P${String(index + 1).padStart(4, "0")}`,
          }))
          setProdutos(produtosComCodigo)
        }
      } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error)
        // Usar dados mock como fallback apenas se não houver dados
        if (clientes.length === 0) {
          setClientes(mockClientes)
        }
        if (produtos.length === 0) {
          // Adicionar códigos aos produtos mock
          const produtosComCodigo = mockProdutos.map((p, index) => ({
            ...p,
            codigo: `P${String(index + 1).padStart(4, "0")}`,
          }))
          setProdutos(produtosComCodigo)
        }
      } finally {
        setIsLoading(false)
      }
    }

    carregarDadosIniciais()
  }, [])

  // Esconder feedback após 3 segundos
  useEffect(() => {
    if (feedbackSalvamento.visivel) {
      const timer = setTimeout(() => {
        setFeedbackSalvamento((prev) => ({ ...prev, visivel: false }))
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [feedbackSalvamento.visivel])

  // Vamos também melhorar a função handlePrint para garantir consistência

  // Substitua a função handlePrint por esta versão atualizada:
  const handlePrint = () => {
    setIsPrinting(true)

    // Adicionar estilos de impressão dinamicamente
    const style = document.createElement("style")
    style.id = "print-styles"
    style.innerHTML = `
  @media print {
    @page {
      size: A4;
      margin: 10mm; /* Adicionar margem de 10mm em todos os lados */
    }
    
    body * {
      visibility: hidden;
    }
    
    #print-container, #print-container * {
      visibility: visible;
    }
    
    #print-container {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      padding: 10mm; /* Adicionar padding interno */
    }
    
    /* Preservar cores e fundos na impressão */
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    
    /* Garantir que os gradientes e cores de fundo sejam impressos */
    .bg-gradient-to-r, .bg-primary, .bg-accent, .bg-white, .bg-white\\/10 {
      print-color-adjust: exact !important;
      -webkit-print-color-adjust: exact !important;
    }
    
    /* Garantir que o texto branco permaneça branco */
    .text-white {
      color: white !important;
    }
    
    /* Garantir que as bordas sejam impressas */
    .border, .border-t, .border-b, .border-l, .border-r {
      border-color: inherit !important;
    }
    
    /* Remover bordas arredondadas na impressão */
    .rounded-md, .rounded-lg, .rounded-tl-md, .rounded-tr-md {
      border-radius: 0 !important;
    }
    
    /* Ajustar espaçamentos para impressão */
    .p-6 {
      padding: 1rem !important;
    }
    
    .space-y-6 > * + * {
      margin-top: 1rem !important;
    }
    
    .page-break-inside-avoid {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    
    .page-break-before {
      page-break-before: always !important;
      break-before: always !important;
    }
    
    table {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    
    h3, h4 {
      page-break-after: avoid !important;
      break-after: avoid !important;
    }
    
    img {
      max-height: 350px;
      max-width: 100%;
      object-fit: contain;
    }
    
    .ficha-tecnica {
      page-break-before: always !important;
      break-before: always !important;
    }
    
    /* Garantir que cada ficha técnica comece em uma nova página */
    .ficha-tecnica:not(:first-child) {
      margin-top: 20px;
    }
    
    /* Ajustar layout da tabela de tamanhos */
    .tamanhos-container {
      max-height: none !important;
      overflow: visible !important;
      display: flex !important;
      flex-wrap: wrap !important;
    }
    
    .tamanho-texto {
      margin-right: 8px !important;
      white-space: nowrap !important;
      font-size: 0.8rem !important;
      padding: 1px 0 !important;
    }
  }
  `
    document.head.appendChild(style)

    // Criar um container temporário para impressão
    const printContainer = document.createElement("div")
    printContainer.id = "print-container"

    if (documentoRef.current) {
      // Clonar o conteúdo do documento
      const clonedContent = documentoRef.current.cloneNode(true)

      // Ajustar estilos do clone para impressão
      const elementosArredondados = (clonedContent as HTMLElement).querySelectorAll(
        ".rounded-md, .rounded-lg, .rounded-tl-md, .rounded-tr-md",
      )
      elementosArredondados.forEach((el) => {
        ;(el as HTMLElement).style.borderRadius = "0"
      })

      const elementosComPadding = (clonedContent as HTMLElement).querySelectorAll(".p-6")
      elementosComPadding.forEach((el) => {
        ;(el as HTMLElement).style.padding = "1rem"
      })

      printContainer.appendChild(clonedContent)
      document.body.appendChild(printContainer)

      // Imprimir
      setTimeout(() => {
        window.print()

        // Limpar após a impressão
        document.body.removeChild(printContainer)
        document.head.removeChild(style)
        setIsPrinting(false)
      }, 500)
    } else {
      setIsPrinting(false)
    }
  }

  // Nova implementação da função handleGeneratePDF que realmente gera e faz download do PDF
  const handleGeneratePDF = async () => {
    try {
      setIsLoading(true)
      setFeedbackSalvamento({
        visivel: true,
        sucesso: true,
        mensagem: "Gerando PDF, aguarde...",
      })

      if (!documentoRef.current) {
        throw new Error("Elemento do documento não encontrado")
      }

      // Nome do arquivo baseado no número do orçamento e cliente
      const numeroOrcamento = orcamento.numero.split(" - ")[0]
      const nomeCliente = orcamento.cliente
        ? orcamento.cliente.nome.replace(/\s+/g, "_").substring(0, 20)
        : "sem_cliente"
      const nomeContato = orcamento.nomeContato
        ? orcamento.nomeContato.replace(/\s+/g, "_").substring(0, 20)
        : "sem_contato"
      const nomeArquivo = `01 - ORCAMENTO_${numeroOrcamento}_${nomeCliente.toUpperCase()}_${nomeContato.toUpperCase()}.pdf`

      // Importar a função generatePDF dinamicamente
      const { generatePDF } = await import("@/lib/pdf-utils")

      // Gerar o PDF usando a função atualizada
      await generatePDF(documentoRef.current, nomeArquivo)

      setFeedbackSalvamento({
        visivel: true,
        sucesso: true,
        mensagem: `PDF "${nomeArquivo}" gerado e baixado com sucesso!`,
      })
    } catch (error) {
      console.error("Erro ao gerar PDF:", error)
      setFeedbackSalvamento({
        visivel: true,
        sucesso: false,
        mensagem: `Erro ao gerar PDF: ${error instanceof Error ? error.message : "Tente novamente"}`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const adicionarCliente = (cliente: Cliente) => {
    setClientes([...clientes, cliente])
  }

  const adicionarProduto = (produto: Produto) => {
    setProdutos([...produtos, produto])
  }

  // Função para salvar orçamento como uma nova versão
  const salvarNovoOrcamento = async () => {
    if (!orcamento.cliente) {
      setFeedbackSalvamento({
        visivel: true,
        sucesso: false,
        mensagem: "Selecione um cliente antes de salvar o orçamento",
      })
      return
    }

    try {
      setIsLoading(true)

      // Verificar se o cliente existe no banco de dados
      const { data: clienteExiste, error: clienteError } = await supabase
        .from("clientes")
        .select("id")
        .eq("id", orcamento.cliente.id)
        .single()

      if (clienteError || !clienteExiste) {
        // Se o cliente não existir no banco de dados, tente criá-lo
        const { data: novoCliente, error: novoClienteError } = await supabase
          .from("clientes")
          .insert({
            id: orcamento.cliente.id,
            nome: orcamento.cliente.nome,
            cnpj: orcamento.cliente.cnpj || null,
            endereco: orcamento.cliente.endereco || null,
            telefone: orcamento.cliente.telefone || null,
            email: orcamento.cliente.email || null,
            contato: orcamento.cliente.contato || null,
          })
          .select()

        if (novoClienteError) {
          throw new Error(`Cliente não encontrado no banco de dados: ${novoClienteError.message}`)
        }
      }

      // Obter o próximo número de orçamento
      const proximoNumero = await obterProximoNumeroOrcamento()

      // Formatar o número do orçamento com os dados do cliente e do primeiro item
      const itemDescricao = orcamento.itens.length > 0 ? orcamento.itens[0].produto?.nome || "Item" : "Item"
      const novoNumero = `${proximoNumero} - ${itemDescricao} ${orcamento.cliente.nome} ${orcamento.cliente.contato}`

      // Criar um objeto com metadados adicionais para incluir no JSON
      const metadados = {
        valorFrete: orcamento.valorFrete || 0,
        nomeContato: orcamento.nomeContato || "",
        telefoneContato: orcamento.telefoneContato || "",
      }

      const { data, error } = await supabase
        .from("orcamentos")
        .insert({
          numero: novoNumero,
          data: orcamento.data,
          cliente_id: orcamento.cliente.id,
          observacoes: orcamento.observacoes,
          condicoes_pagamento: orcamento.condicoesPagamento,
          prazo_entrega: orcamento.prazoEntrega,
          validade_orcamento: orcamento.validadeOrcamento,
          status: orcamento.status || "proposta", // Adicionar status
          // Incluir metadados junto com os itens no JSON
          itens: JSON.stringify({
            items: orcamento.itens || [],
            metadados: metadados,
          }),
          // Remove these fields as they don't exist in the database
          // nome_contato: orcamento.nomeContato,
          // telefone_contato: orcamento.telefoneContato,
        })
        .select()

      if (error) throw error

      if (data && data[0]) {
        const novoOrcamentoId = data[0].id

        // Salvar os itens do orçamento
        for (const item of orcamento.itens) {
          // Verificar se o produto existe no banco de dados
          const { data: produtoExiste, error: produtoError } = await supabase
            .from("produtos")
            .select("id")
            .eq("id", item.produtoId)

          if (produtoError || !produtoExiste || produtoExiste.length === 0) {
            // Se o produto não existir e tivermos os dados completos, tente criá-lo
            if (item.produto) {
              await supabase.from("produtos").insert({
                id: item.produtoId,
                nome: item.produto.nome,
                valor_base: item.produto.valorBase,
                cores: item.produto.cores || [],
                tamanhos_disponiveis: item.produto.tamanhosDisponiveis || [],
              })

              // Inserir tecidos do produto se existirem
              if (item.produto.tecidos && item.produto.tecidos.length > 0) {
                const tecidosParaInserir = item.produto.tecidos.map((tecido) => ({
                  nome: tecido.nome,
                  composicao: tecido.composicao,
                  produto_id: item.produtoId,
                }))

                await supabase.from("tecidos").insert(tecidosParaInserir)
              }
            }
          }

          // Inserir o item com um novo ID
          const novoItemId = generateUUID()
          const { data: itemInserido, error: itemError } = await supabase
            .from("itens_orcamento")
            .insert({
              id: novoItemId,
              orcamento_id: novoOrcamentoId,
              produto_id: item.produtoId,
              quantidade: item.quantidade,
              valor_unitario: item.valorUnitario,
              tecido_nome: item.tecidoSelecionado?.nome,
              tecido_composicao: item.tecidoSelecionado?.composicao,
              cor_selecionada: item.corSelecionada,
              tamanhos: item.tamanhos,
              imagem: item.imagem,
              // Remover o campo observacao que está causando o erro
            })
            .select()

          if (itemError) throw itemError

          // Inserir as estampas do item
          if (item.estampas && item.estampas.length > 0) {
            const estampasParaInserir = item.estampas.map((estampa) => ({
              id: estampa.id || generateUUID(),
              item_orcamento_id: novoItemId,
              posicao: estampa.posicao,
              tipo: estampa.tipo,
              largura: estampa.largura,
            }))

            const { error: estampasError } = await supabase.from("estampas").insert(estampasParaInserir)

            if (estampasError) throw estampasError
          }
        }

        // Atualizar o estado com o novo orçamento
        setOrcamento({
          ...orcamento,
          id: novoOrcamentoId,
          numero: novoNumero,
        })
        setOrcamentoSalvo(novoOrcamentoId)
        setCriandoNovoOrcamento(false)

        // Mostrar feedback de sucesso
        setFeedbackSalvamento({
          visivel: true,
          sucesso: true,
          mensagem: "Novo orçamento salvo com sucesso!",
        })
      }
    } catch (error) {
      console.error("Erro ao salvar novo orçamento:", error)
      setFeedbackSalvamento({
        visivel: true,
        sucesso: false,
        mensagem: `Erro ao salvar o orçamento: ${error instanceof Error ? error.message : "Tente novamente"}`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Função para atualizar orçamento existente
  const atualizarOrcamentoExistente = async () => {
    if (!orcamento.cliente || !orcamentoSalvo) {
      setFeedbackSalvamento({
        visivel: true,
        sucesso: false,
        mensagem: "Selecione um cliente antes de atualizar o orçamento",
      })
      return
    }

    try {
      setIsLoading(true)

      // Verificar se o cliente existe no banco de dados
      const { data: clienteExiste, error: clienteError } = await supabase
        .from("clientes")
        .select("id")
        .eq("id", orcamento.cliente.id)
        .single()

      if (clienteError) {
        // Se o cliente não existir no banco de dados, tente criá-lo
        const { data: novoCliente, error: novoClienteError } = await supabase
          .from("clientes")
          .insert({
            id: orcamento.cliente.id,
            nome: orcamento.cliente.nome,
            cnpj: orcamento.cliente.cnpj || null,
            endereco: orcamento.cliente.endereco || null,
            telefone: orcamento.cliente.telefone || null,
            email: orcamento.cliente.email || null,
            contato: orcamento.cliente.contato || null,
          })
          .select()

        if (novoClienteError) {
          throw new Error(`Cliente não encontrado no banco de dados: ${novoClienteError.message}`)
        }
      }

      // Criar um objeto com metadados adicionais para incluir no JSON
      const metadados = {
        valorFrete: orcamento.valorFrete || 0,
        nomeContato: orcamento.nomeContato || "",
        telefoneContato: orcamento.telefoneContato || "",
      }

      const { error } = await supabase
        .from("orcamentos")
        .update({
          numero: orcamento.numero,
          data: orcamento.data,
          cliente_id: orcamento.cliente.id,
          observacoes: orcamento.observacoes,
          condicoes_pagamento: orcamento.condicoesPagamento,
          prazo_entrega: orcamento.prazoEntrega,
          validade_orcamento: orcamento.validadeOrcamento,
          status: orcamento.status || "proposta", // Adicionar status
          // Incluir metadados junto com os itens no JSON
          itens: JSON.stringify({
            items: orcamento.itens || [],
            metadados: metadados,
          }),
          updated_at: new Date().toISOString(),
          // Remove these fields as they don't exist in the database
          // nome_contato: orcamento.nomeContato,
          // telefone_contato: orcamento.telefoneContato,
        })
        .eq("id", orcamentoSalvo)

      if (error) throw error

      // Mostrar feedback de sucesso
      setFeedbackSalvamento({
        visivel: true,
        sucesso: true,
        mensagem: "Orçamento atualizado com sucesso!",
      })
    } catch (error) {
      console.error("Erro ao atualizar orçamento:", error)
      setFeedbackSalvamento({
        visivel: true,
        sucesso: false,
        mensagem: `Erro ao atualizar orçamento: ${error instanceof Error ? error.message : "Tente novamente"}`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const atualizarOrcamento = async (novoOrcamento: Partial<Orcamento>) => {
    const orcamentoAtualizado = { ...orcamento, ...novoOrcamento }
    setOrcamento(orcamentoAtualizado)
  }

  const adicionarItem = async (item: ItemOrcamento) => {
    const itensAtualizados = [...orcamento.itens, item]

    // Atualizar o número do orçamento com o nome do primeiro item
    let novoNumero = orcamento.numero
    if (itensAtualizados.length === 1 && orcamento.cliente) {
      const numeroBase = orcamento.numero.split(" - ")[0]
      const itemDescricao = item.produto?.nome || "Item"
      novoNumero = `${numeroBase} - ${itemDescricao} ${orcamento.cliente.nome} ${orcamento.cliente.contato}`
    }

    setOrcamento({
      ...orcamento,
      itens: itensAtualizados,
      numero: novoNumero,
    })

    // Salvar no Supabase se houver orçamento salvo
    if (orcamentoSalvo) {
      try {
        setIsLoading(true)

        // Inserir o item no banco de dados
        const { data: itemInserido, error: itemError } = await supabase
          .from("itens_orcamento")
          .insert({
            id: item.id,
            orcamento_id: orcamentoSalvo,
            produto_id: item.produtoId,
            quantidade: item.quantidade,
            valor_unitario: item.valorUnitario,
            tecido_nome: item.tecidoSelecionado?.nome,
            tecido_composicao: item.tecidoSelecionado?.composicao,
            cor_selecionada: item.corSelecionada,
            tamanhos: item.tamanhos,
            imagem: item.imagem,
            // Remover o campo observacao que está causando o erro
          })
          .select()

        if (itemError) throw itemError

        // Inserir as estampas do item
        if (item.estampas && item.estampas.length > 0) {
          const estampasParaInserir = item.estampas.map((estampa) => ({
            id: estampa.id || generateUUID(),
            item_orcamento_id: item.id,
            posicao: estampa.posicao,
            tipo: estampa.tipo,
            largura: estampa.largura,
          }))

          const { error: estampasError } = await supabase.from("estampas").insert(estampasParaInserir)

          if (estampasError) throw estampasError
        }

        // Atualizar também o número do orçamento no banco de dados
        await supabase.from("orcamentos").update({ numero: novoNumero }).eq("id", orcamentoSalvo)
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

        // Primeiro, excluir todas as estampas associadas ao item
        const { error: estampasError } = await supabase.from("estampas").delete().eq("item_orcamento_id", id)

        if (estampasError) {
          console.error("Erro ao excluir estampas do item:", estampasError)
        }

        // Em seguida, excluir o item
        const { error } = await supabase.from("itens_orcamento").delete().eq("id", id)

        if (error) throw error
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
          // Atualizar o item
          const { error } = await supabase
            .from("itens_orcamento")
            .update({
              quantidade: itemAtualizado.quantidade,
              valor_unitario: itemAtualizado.valorUnitario,
              tecido_nome: itemAtualizado.tecidoSelecionado?.nome,
              tecido_composicao: itemAtualizado.tecidoSelecionado?.composicao,
              cor_selecionada: itemAtualizado.corSelecionada,
              tamanhos: itemAtualizado.tamanhos,
              imagem: itemAtualizado.imagem,
              // Remover o campo observacao que está causando o erro
            })
            .eq("id", id)

          if (error) throw error

          // Atualizar as estampas do item
          if (itemAtualizado.estampas && itemAtualizado.estampas.length > 0) {
            // Primeiro, excluir todas as estampas existentes
            await supabase.from("estampas").delete().eq("item_orcamento_id", id)

            // Em seguida, inserir as novas estampas
            const estampasParaInserir = itemAtualizado.estampas.map((estampa) => ({
              id: estampa.id || generateUUID(),
              item_orcamento_id: id,
              posicao: estampa.posicao,
              tipo: estampa.tipo,
              largura: estampa.largura,
            }))

            const { error: estampasError } = await supabase.from("estampas").insert(estampasParaInserir)

            if (estampasError) throw estampasError
          } else {
            // Se não houver estampas, excluir todas as existentes
            await supabase.from("estampas").delete().eq("item_orcamento_id", id)
          }
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

  // Adicionar a função para carregar um orçamento específico
  const carregarOrcamento = async (orcamentoId: string) => {
    try {
      setIsLoading(true)

      const { data, error } = await supabase
        .from("orcamentos")
        .select("*, cliente:cliente_id(*)")
        .eq("id", orcamentoId)
        .single()

      if (error) throw error

      // Verificar se o cliente existe
      if (!data.cliente) {
        throw new Error("Cliente não encontrado para este orçamento")
      }

      // Carregar itens do orçamento
      const { data: itensData, error: itensError } = await supabase
        .from("itens_orcamento")
        .select("*, produto:produto_id(*)")
        .eq("orcamento_id", orcamentoId)

      if (itensError) throw itensError

      // Converter para o formato da aplicação
      const itensFormatados: ItemOrcamento[] = await Promise.all(
        itensData
          ? itensData.map(async (item) => {
              // Buscar o produto completo com tecidos
              let produto: Produto | undefined = undefined
              if (item.produto) {
                const { data: tecidosData, error: tecidosError } = await supabase
                  .from("tecidos")
                  .select("*")
                  .eq("produto_id", item.produto.id)

                if (tecidosError) throw tecidosError

                produto = {
                  id: item.produto.id,
                  nome: item.produto.nome,
                  valorBase: Number(item.produto.valor_base),
                  tecidos: tecidosData
                    ? tecidosData.map((t) => ({
                        nome: t.nome,
                        composicao: t.composicao || "",
                      }))
                    : [],
                  cores: item.produto.cores || [],
                  tamanhosDisponiveis: item.produto.tamanhos_disponiveis || [],
                }

                // Adicionar o produto à lista de produtos se ainda não existir
                if (!produtos.some((p) => p.id === produto?.id)) {
                  setProdutos((prevProdutos) => [...prevProdutos, produto!])
                }
              }

              // Carregar estampas do item
              const { data: estampasData, error: estampasError } = await supabase
                .from("estampas")
                .select("*")
                .eq("item_orcamento_id", item.id)

              if (estampasError) {
                console.error("Erro ao listar estampas do item:", estampasError)
                throw estampasError
              }

              // Converter estampas para o formato da aplicação
              const estampas: Estampa[] = estampasData
                ? estampasData.map((estampa) => ({
                    id: estampa.id,
                    posicao: estampa.posicao || undefined,
                    tipo: estampa.tipo || undefined,
                    largura: estampa.largura || undefined,
                  }))
                : []

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
                estampas: estampas,
                tamanhos: (item.tamanhos as ItemOrcamento["tamanhos"]) || {},
                imagem: item.imagem || undefined,
                observacao: item.observacao || undefined,
              }
            })
          : [],
      )

      // Converter cliente
      const clienteFormatado = {
        id: data.cliente.id,
        nome: data.cliente.nome,
        cnpj: data.cliente.cnpj || "",
        endereco: data.cliente.endereco || "",
        telefone: data.cliente.telefone || "",
        email: data.cliente.email || "",
        contato: data.cliente.contato || "",
      }

      // Adicionar o cliente à lista de clientes se ainda não existir
      if (!clientes.some((c) => c.id === clienteFormatado.id)) {
        setClientes((prevClientes) => [...prevClientes, clienteFormatado])
      }

      // Extrair metadados do JSON de itens, se existirem
      let valorFrete = 0
      let nomeContato = ""
      let telefoneContato = ""

      try {
        if (data.itens && typeof data.itens === "object") {
          // Se itens já é um objeto (parseado automaticamente)
          if (data.itens.metadados) {
            if (data.itens.metadados.valorFrete !== undefined) {
              valorFrete = Number(data.itens.metadados.valorFrete)
            }
            if (data.itens.metadados.nomeContato !== undefined) {
              nomeContato = data.itens.metadados.nomeContato
            }
            if (data.itens.metadados.telefoneContato !== undefined) {
              telefoneContato = data.itens.metadados.telefoneContato
            }
          }
        } else if (data.itens && typeof data.itens === "string") {
          // Se itens é uma string JSON
          const itensObj = JSON.parse(data.itens)
          if (itensObj.metadados) {
            if (itensObj.metadados.valorFrete !== undefined) {
              valorFrete = Number(itensObj.metadados.valorFrete)
            }
            if (itensObj.metadados.nomeContato !== undefined) {
              nomeContato = itensObj.metadados.nomeContato
            }
            if (itensObj.metadados.telefoneContato !== undefined) {
              telefoneContato = itensObj.metadados.telefoneContato
            }
          }
        }
      } catch (e) {
        console.error("Erro ao extrair metadados do JSON:", e)
      }

      // Atualizar o estado do orçamento
      setOrcamento({
        id: data.id,
        numero: data.numero,
        data: data.data,
        cliente: clienteFormatado,
        itens: itensFormatados,
        observacoes: data.observacoes || "",
        condicoesPagamento: data.condicoes_pagamento || "À vista",
        prazoEntrega: data.prazo_entrega || "15 dias",
        validadeOrcamento: data.validade_orcamento || "15 dias",
        status: data.status || "proposta",
        valorFrete: valorFrete,
        nomeContato: nomeContato,
        telefoneContato: telefoneContato,
      })

      setOrcamentoSalvo(data.id)
      setCriandoNovoOrcamento(false)

      // Mudar para a aba de orçamento
      setAbaAtiva("orcamento")

      // Mostrar feedback
      setFeedbackSalvamento({
        visivel: true,
        sucesso: true,
        mensagem: "Orçamento carregado com sucesso!",
      })
    } catch (error) {
      console.error("Erro ao carregar orçamento:", error)
      setFeedbackSalvamento({
        visivel: true,
        sucesso: false,
        mensagem: `Erro ao carregar orçamento: ${error instanceof Error ? error.message : "Tente novamente"}`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClienteChange = (clienteId: string) => {
    const cliente = clientes.find((c) => c.id === clienteId) || null

    if (cliente) {
      // Verificar se o cliente existe no banco de dados
      supabase
        .from("clientes")
        .select("id")
        .eq("id", clienteId)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.warn("Cliente não encontrado no banco de dados, será criado ao salvar o orçamento")
          }
        })

      // Atualizar o número do orçamento com os dados do cliente
      const numeroBase = orcamento.numero.split(" - ")[0]
      const itemDescricao = orcamento.itens.length > 0 ? orcamento.itens[0].produto?.nome || "Item" : "Item"
      const novoNumero = `${numeroBase} - ${itemDescricao} ${cliente.nome} ${cliente.contato}`

      atualizarOrcamento({
        cliente,
        numero: novoNumero,
      })
    } else {
      atualizarOrcamento({ cliente })
    }
  }

  // Adicionar a função para excluir um orçamento
  const excluirOrcamento = async (orcamentoId: string) => {
    try {
      setIsLoading(true)

      // Primeiro, carregar todos os itens do orçamento
      const { data: itensData, error: itensError } = await supabase
        .from("itens_orcamento")
        .select("id")
        .eq("orcamento_id", orcamentoId)

      if (itensError) {
        console.error("Erro ao listar itens do orçamento:", itensError)
        throw itensError
      }

      // Para cada item, excluir suas estampas
      for (const item of itensData || []) {
        const { error: estampasError } = await supabase.from("estampas").delete().eq("item_orcamento_id", item.id)

        if (estampasError) {
          console.error("Erro ao excluir estampas do item:", estampasError)
          throw estampasError
        }
      }

      // Em seguida, excluir todos os itens do orçamento
      const { error: itensDeleteError } = await supabase
        .from("itens_orcamento")
        .delete()
        .eq("orcamento_id", orcamentoId)

      if (itensDeleteError) {
        console.error("Erro ao excluir itens do orçamento:", itensDeleteError)
        throw itensDeleteError
      }

      // Por fim, excluir o orçamento
      const { error } = await supabase.from("orcamentos").delete().eq("id", orcamentoId)

      if (error) {
        console.error("Erro ao excluir orçamento:", error)
        throw error
      }

      // Se o orçamento excluído for o atual, criar um novo
      if (orcamentoSalvo === orcamentoId) {
        criarNovoOrcamento()
      }

      // Mostrar feedback
      setFeedbackSalvamento({
        visivel: true,
        sucesso: true,
        mensagem: "Orçamento excluído com sucesso!",
      })

      // Recarregar a lista de orçamentos usando a função exposta pelo componente ListaOrcamentos
      if (recarregarOrcamentosRef.current) {
        await recarregarOrcamentosRef.current()
      }
    } catch (error) {
      console.error("Erro ao excluir orçamento:", error)
      setFeedbackSalvamento({
        visivel: true,
        sucesso: false,
        mensagem: `Erro ao excluir orçamento: ${error instanceof Error ? error.message : "Tente novamente"}`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Adicionar após a função excluirOrcamento
  const atualizarStatusOrcamento = async (orcamentoId: string, novoStatus: string) => {
    try {
      setIsLoading(true)

      const { error } = await supabase.from("orcamentos").update({ status: novoStatus }).eq("id", orcamentoId)

      if (error) {
        console.error("Erro ao atualizar status do orçamento:", error)
        setFeedbackSalvamento({
          visivel: true,
          sucesso: false,
          mensagem: `Erro ao atualizar status: ${error.message}`,
        })
        return
      }

      // Se o orçamento atual for o que está sendo atualizado, atualizar o estado
      if (orcamento.id === orcamentoId) {
        setOrcamento({
          ...orcamento,
          status: novoStatus,
        })
      }

      setFeedbackSalvamento({
        visivel: true,
        sucesso: true,
        mensagem: "Status atualizado com sucesso!",
      })

      // Recarregar a lista de orçamentos
      if (recarregarOrcamentosRef.current) {
        await recarregarOrcamentosRef.current()
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
      setFeedbackSalvamento({
        visivel: true,
        sucesso: false,
        mensagem: `Erro ao atualizar status: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Substituir o return do componente por:
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <AppSidebar
        abaAtiva={abaAtiva}
        setAbaAtiva={setAbaAtiva}
        criandoNovoOrcamento={criandoNovoOrcamento}
        criarNovoOrcamento={criarNovoOrcamento}
      />
      <SidebarInset className="bg-gray-100 overflow-auto">
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm">
            <div>
              <h1 className="text-2xl font-bold text-primary">
                {abaAtiva === "orcamento"
                  ? "Gerador de Orçamento"
                  : abaAtiva === "orcamentos"
                    ? "Orçamentos Salvos"
                    : abaAtiva === "clientes"
                      ? "Gerenciador de Clientes"
                      : abaAtiva === "produtos"
                        ? "Gerenciador de Produtos"
                        : abaAtiva === "categorias"
                          ? "Gerenciador de Categorias"
                          : abaAtiva === "materiais"
                            ? "Gerenciador de Materiais"
                            : "Gerenciador de Empresa"}
              </h1>
              <p className="text-gray-500 mt-1">
                {abaAtiva === "orcamento"
                  ? "Crie orçamentos profissionais para uniformes industriais"
                  : abaAtiva === "orcamentos"
                    ? "Visualize e gerencie seus orçamentos salvos"
                    : abaAtiva === "clientes"
                      ? "Gerencie seus clientes"
                      : abaAtiva === "produtos"
                        ? "Gerencie seus produtos"
                        : abaAtiva === "categorias"
                          ? "Gerencie as categorias de produtos"
                          : abaAtiva === "materiais"
                            ? "Gerencie os materiais disponíveis"
                            : "Gerencie os dados da sua empresa"}
              </p>
            </div>
            <div className="flex gap-2">
              {abaAtiva === "orcamento" && (
                <>
                  <Button
                    onClick={salvarNovoOrcamento}
                    disabled={isLoading || !orcamento.cliente}
                    className="flex items-center gap-2 bg-secondary hover:bg-secondary-dark text-white transition-all shadow-sm"
                  >
                    <Save className="h-4 w-4" />
                    {isLoading ? "Salvando..." : "Salvar"}
                  </Button>

                  {orcamentoSalvo && (
                    <Button
                      onClick={atualizarOrcamentoExistente}
                      disabled={isLoading || !orcamento.cliente}
                      className="flex items-center gap-2 bg-success hover:bg-success/80 text-white transition-all shadow-sm"
                    >
                      <Save className="h-4 w-4" />
                      {isLoading ? "Atualizando..." : "Atualizar Orçamento"}
                    </Button>
                  )}

                  <Button
                    onClick={handlePrint}
                    disabled={isPrinting || isLoading}
                    className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white transition-all shadow-sm"
                  >
                    <Printer className="h-4 w-4" />
                    {isPrinting ? "Imprimindo..." : "Imprimir"}
                  </Button>

                  <Button
                    onClick={handleGeneratePDF}
                    disabled={isLoading}
                    className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white transition-all shadow-sm"
                  >
                    <FileDown className="h-4 w-4" />
                    {isLoading ? "Gerando PDF..." : "Gerar PDF"}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Feedback de salvamento */}
          {feedbackSalvamento.visivel && (
            <div
              className={`p-4 rounded-md ${
                feedbackSalvamento.sucesso ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
              } flex items-center gap-2 animate-in fade-in slide-in-from-top-5 duration-300`}
            >
              {feedbackSalvamento.sucesso ? <Check className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              <p>{feedbackSalvamento.mensagem}</p>
            </div>
          )}

          {/* Conteúdo principal baseado na aba ativa */}
          {abaAtiva === "orcamento" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    handleClienteChange={handleClienteChange}
                  />
                </CardContent>
              </Card>
              <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="p-4 h-[calc(100vh-250px)] overflow-auto">
                  <div ref={documentoRef}>
                    <VisualizacaoDocumento
                      orcamento={orcamento}
                      calcularTotal={calcularTotal}
                      dadosEmpresa={dadosEmpresa || undefined}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {abaAtiva === "orcamentos" && (
            <Card className="shadow-sm border-0">
              <CardContent className="p-6">
                <ListaOrcamentos
                  onSelectOrcamento={carregarOrcamento}
                  onNovoOrcamento={() => {
                    criarNovoOrcamento()
                    setAbaAtiva("orcamento")
                  }}
                  onDeleteOrcamento={excluirOrcamento}
                  onUpdateStatus={atualizarStatusOrcamento}
                  reloadRef={recarregarOrcamentosRef}
                />
              </CardContent>
            </Card>
          )}

          {abaAtiva === "produtos-tabela" && (
            <Card className="shadow-sm border-0">
              <CardContent className="p-6">
                <TabelaProdutos />
              </CardContent>
            </Card>
          )}

          {abaAtiva === "clientes" && (
            <Card className="shadow-sm border-0">
              <CardContent className="p-6">
                <GerenciadorClientes
                  clientes={clientes}
                  adicionarCliente={adicionarCliente}
                  setClientes={setClientes}
                />
              </CardContent>
            </Card>
          )}

          {abaAtiva === "produtos" && (
            <Card className="shadow-sm border-0">
              <CardContent className="p-6">
                <GerenciadorProdutos
                  produtos={produtos}
                  adicionarProduto={adicionarProduto}
                  setProdutos={setProdutos}
                />
              </CardContent>
            </Card>
          )}

          {abaAtiva === "categorias" && (
            <Card className="shadow-sm border-0">
              <CardContent className="p-6">
                <GerenciadorCategorias />
              </CardContent>
            </Card>
          )}

          {abaAtiva === "materiais" && (
            <Card className="shadow-sm border-0">
              <CardContent className="p-6">
                <GerenciadorMateriais />
              </CardContent>
            </Card>
          )}

          {abaAtiva === "empresa" && (
            <Card className="shadow-sm border-0">
              <CardContent className="p-6">
                <GerenciadorEmpresa />
              </CardContent>
            </Card>
          )}
        </div>
        <AssistenteIA
          clientes={clientes}
          produtos={produtos}
          orcamento={orcamento}
          setClientes={setClientes}
          setProdutos={setProdutos}
          setOrcamento={setOrcamento}
          setAbaAtiva={setAbaAtiva}
        />
      </SidebarInset>
    </div>
  )
}
