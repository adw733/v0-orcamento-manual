"use client"

import { useState, useRef, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Printer, FileText, Users, ShoppingBag, Save, Check, AlertCircle, Copy } from "lucide-react"
import FormularioOrcamento from "@/components/formulario-orcamento"
import VisualizacaoDocumento from "@/components/visualizacao-documento"
import GerenciadorClientes from "@/components/gerenciador-clientes"
import GerenciadorProdutos from "@/components/gerenciador-produtos"
import type { Cliente, Produto, Orcamento, ItemOrcamento } from "@/types/types"
import { supabase } from "@/lib/supabase"
import { mockClientes, mockProdutos } from "@/lib/mock-data"
// Adicionar o import para o novo componente
import ListaOrcamentos from "@/components/lista-orcamentos"

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

          // Verificar se o cliente existe
          if (!orcamentoData.cliente) {
            console.warn("Cliente não encontrado para este orçamento, criando novo orçamento")
            criarNovoOrcamento()
            return
          }

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
          const clienteFormatado = {
            id: orcamentoData.cliente.id,
            nome: orcamentoData.cliente.nome,
            cnpj: orcamentoData.cliente.cnpj || "",
            endereco: orcamentoData.cliente.endereco || "",
            telefone: orcamentoData.cliente.telefone || "",
            email: orcamentoData.cliente.email || "",
            contato: orcamentoData.cliente.contato || "",
          }

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
        // Em caso de erro, criar um novo orçamento
        criarNovoOrcamento()
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

  // Esconder feedback após 3 segundos
  useEffect(() => {
    if (feedbackSalvamento.visivel) {
      const timer = setTimeout(() => {
        setFeedbackSalvamento((prev) => ({ ...prev, visivel: false }))
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [feedbackSalvamento.visivel])

  // Modifique a função handlePrint para garantir que os estilos sejam preservados na impressão
  const handlePrint = () => {
    setIsPrinting(true)

    // Adicionar estilos de impressão dinamicamente
    const style = document.createElement("style")
    style.id = "print-styles"
    style.innerHTML = `
    @media print {
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
      }
      
      /* Preservar cores e fundos na impressão */
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      
      /* Garantir que os gradientes e cores de fundo sejam impressos */
      .bg-gradient-to-r, .bg-primary, .bg-accent, .bg-white, .bg-white\/10 {
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
    }
  `
    document.head.appendChild(style)

    // Criar um container temporário para impressão
    const printContainer = document.createElement("div")
    printContainer.id = "print-container"

    if (documentoRef.current) {
      // Clonar o conteúdo do documento
      const clonedContent = documentoRef.current.cloneNode(true)
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

      // Gerar um novo número de orçamento baseado na data atual
      const novoNumero =
        "ORC-" + new Date().getFullYear() + "-" + String(Math.floor(Math.random() * 1000)).padStart(3, "0")

      // Criar novo orçamento
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
          // Garantir que o JSON seja válido
          itens: JSON.stringify(orcamento.itens || []),
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
          await supabase.from("itens_orcamento").insert({
            id: novoItemId,
            orcamento_id: novoOrcamentoId,
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
        mensagem: `Erro ao salvar orçamento: ${error instanceof Error ? error.message : "Tente novamente"}`,
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

      // Atualizar orçamento existente
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
          // Garantir que o JSON seja válido
          itens: JSON.stringify(orcamento.itens || []),
          updated_at: new Date().toISOString(),
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
    setOrcamento({
      ...orcamento,
      itens: itensAtualizados,
    })

    // Salvar no Supabase se houver orçamento salvo
    if (orcamentoSalvo) {
      try {
        setIsLoading(true)

        const { error } = await supabase.from("itens_orcamento").insert({
          id: item.id,
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
      const itensFormatados: ItemOrcamento[] = itensData
        ? await Promise.all(
            itensData.map(async (item) => {
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
              }

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
            }),
          )
        : []

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

      // Atualizar o estado do orçamento
      setOrcamento({
        id: data.id,
        numero: data.numero,
        data: data.data,
        cliente: clienteFormatado,
        itens: itensFormatados,
        observacoes: data.observacoes || "",
        condicoesPagamento: data.condicoes_pagamento || "À vista",
        prazoEntrega: data.prazo_entrega || "30 dias",
        validadeOrcamento: data.validade_orcamento || "15 dias",
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

  // Adicionar a função para criar um novo orçamento
  const criarNovoOrcamento = () => {
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
    setOrcamentoSalvo(null)
    setCriandoNovoOrcamento(true)
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
    }

    atualizarOrcamento({ cliente })
  }

  // Adicionar a função para excluir um orçamento
  const excluirOrcamento = async (orcamentoId: string) => {
    // Confirmar antes de excluir
    if (!window.confirm("Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita.")) {
      return
    }

    try {
      setIsLoading(true)

      // Primeiro, excluir todos os itens do orçamento
      const { error: itensError } = await supabase.from("itens_orcamento").delete().eq("orcamento_id", orcamentoId)

      if (itensError) throw itensError

      // Em seguida, excluir o orçamento
      const { error } = await supabase.from("orcamentos").delete().eq("id", orcamentoId)

      if (error) throw error

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

  return (
    <div className="space-y-6 py-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-primary">Gerador de Orçamento e Ficha Técnica</h1>
          <p className="text-gray-500 mt-1">Crie orçamentos profissionais para uniformes industriais</p>
        </div>
        <div className="flex gap-2">
          {/* Botão para salvar como novo orçamento */}
          <Button
            onClick={salvarNovoOrcamento}
            disabled={isLoading || !orcamento.cliente}
            className="flex items-center gap-2 bg-secondary hover:bg-secondary-dark text-white transition-all shadow-sm"
          >
            <Copy className="h-4 w-4" />
            {isLoading ? "Salvando..." : "Salvar como Novo"}
          </Button>

          {/* Botão para atualizar orçamento existente */}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4 w-full overflow-hidden">
          <Tabs defaultValue="orcamento" value={abaAtiva} onValueChange={setAbaAtiva} className="w-full">
            <TabsList className="grid grid-cols-4 w-full mb-2 bg-accent">
              <TabsTrigger
                value="orcamento"
                className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                {criandoNovoOrcamento ? "Novo Orçamento" : "Orçamento"}
              </TabsTrigger>
              <TabsTrigger
                value="orcamentos"
                className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Orçamentos Salvos
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
                    handleClienteChange={handleClienteChange}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="orcamentos" className="space-y-4">
              <Card className="shadow-sm border-0">
                <CardContent className="p-6">
                  <ListaOrcamentos
                    onSelectOrcamento={carregarOrcamento}
                    onNovoOrcamento={() => {
                      criarNovoOrcamento()
                      setAbaAtiva("orcamento")
                    }}
                    onDeleteOrcamento={excluirOrcamento}
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
