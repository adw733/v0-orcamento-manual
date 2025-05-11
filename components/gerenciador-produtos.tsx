"use client"

import React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import {
  Plus,
  Package,
  DollarSign,
  Shirt,
  AlertCircle,
  FileText,
  Search,
  ChevronUp,
  ChevronDown,
  FolderOpen,
  FolderClosed,
  Tag,
  Pencil,
  Trash2,
  X,
  Save,
  Palette,
  Ruler,
} from "lucide-react"
import type { Produto } from "@/types/types"
import { supabase } from "@/lib/supabase"

// Importar os serviços de materiais
import { type Cor, type TecidoBase, corService, tecidoBaseService } from "@/lib/services-materiais"

// Importar o gerenciador de categorias
import { type Categoria, CORES_CATEGORIAS } from "./gerenciador-categorias"
import GerenciadorCategorias from "./gerenciador-categorias"

// Helper function to generate UUID
const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// Function to fetch the next sequential product code from Supabase
const obterProximoCodigoProduto = async (): Promise<string> => {
  try {
    // Now that we know the column exists, we can directly query it
    const { data, error } = await supabase
      .from("produtos")
      .select("codigo")
      .order("codigo", { ascending: false })
      .limit(1)

    if (error) {
      console.error("Erro ao obter o último código do produto:", error)
      return "P0001" // Default code if there's an error
    }

    if (data && data.length > 0 && data[0].codigo) {
      // Extract the numeric part from the code (remove the 'P' prefix)
      const ultimoCodigo = data[0].codigo
      const numeroMatch = ultimoCodigo.match(/^P?(\d+)$/)

      if (numeroMatch && numeroMatch[1]) {
        const numero = Number.parseInt(numeroMatch[1], 10) + 1
        return "P" + String(numero).padStart(4, "0") // Format the new code
      }
    }

    // If no valid code was found, start with P0001
    return "P0001"
  } catch (error) {
    console.error("Erro ao obter o próximo código do produto:", error)
    return "P0001" // Return a default code in case of any error
  }
}

interface GerenciadorProdutosProps {
  produtos: Produto[]
  adicionarProduto: (produto: Produto) => void
  setProdutos: (produtos: Produto[]) => void
}

// Modificar as categorias padrão para estarem em maiúsculas
const CATEGORIAS_PADRAO: Categoria[] = [
  { id: generateUUID(), nome: "CAMISETAS", descricao: "CAMISETAS EM GERAL", cor: CORES_CATEGORIAS[0] },
  { id: generateUUID(), nome: "CAMISAS", descricao: "CAMISAS SOCIAIS E POLOS", cor: CORES_CATEGORIAS[1] },
  { id: generateUUID(), nome: "UNIFORMES BRIM", descricao: "CALÇAS E JAQUETAS DE BRIM", cor: CORES_CATEGORIAS[2] },
  { id: generateUUID(), nome: "JALECOS", descricao: "JALECOS E AVENTAIS", cor: CORES_CATEGORIAS[3] },
  { id: generateUUID(), nome: "OUTROS", descricao: "OUTROS TIPOS DE PRODUTOS", cor: CORES_CATEGORIAS[7] },
]

export default function GerenciadorProdutos({ produtos, adicionarProduto, setProdutos }: GerenciadorProdutosProps) {
  // Modificar o estado do novo produto para incluir o código e categoria
  const [novoProduto, setNovoProduto] = useState<Partial<Produto>>({
    codigo: "",
    nome: "",
    valorBase: 0,
    tecidos: [],
    cores: [],
    tamanhosDisponiveis: [],
    categoria: "", // Inicializar categoria vazia
  })

  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Estados para gerenciar tecidos
  const [novoTamanho, setNovoTamanho] = useState("")

  // Estados para cores e tecidos pré-cadastrados
  const [coresCadastradas, setCoresCadastradas] = useState<Cor[]>([])
  const [tecidosCadastrados, setTecidosCadastrados] = useState<TecidoBase[]>([])

  // Adicione um estado para controlar a visibilidade do formulário de novo produto:
  const [mostrarFormulario, setMostrarFormulario] = useState(false)

  // Estado para pesquisa e ordenação
  const [termoPesquisa, setTermoPesquisa] = useState("")
  const [ordenacao, setOrdenacao] = useState<{ campo: string; direcao: "asc" | "desc" }>({
    campo: "codigo",
    direcao: "asc",
  })

  // Estado para controlar categorias expandidas
  const [categoriasExpandidas, setCategoriasExpandidas] = useState<Record<string, boolean>>({})

  // Estado para controlar o modal de gerenciamento de categorias
  const [mostrarGerenciadorCategorias, setMostrarGerenciadorCategorias] = useState(false)

  // Estado para armazenar as categorias disponíveis - inicializar com categorias padrão
  const [categorias, setCategorias] = useState<Categoria[]>(CATEGORIAS_PADRAO)

  // Carregar produtos e categorias do Supabase ao montar o componente
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setIsLoading(true)

        // Buscar categorias - versão simplificada que não depende do banco de dados
        setCategorias(CATEGORIAS_PADRAO)

        // Inicializar todas as categorias como compactadas
        const categorias = [...new Set(produtos.map((p) => p.categoria || "Outros"))]
        const estadoInicial = categorias.reduce(
          (acc, cat) => {
            acc[cat] = false // Inicialmente compactadas
            return acc
          },
          {} as Record<string, boolean>,
        )
        setCategoriasExpandidas(estadoInicial)

        // Carregar cores e tecidos pré-cadastrados
        try {
          const coresData = await corService.listarTodas()
          setCoresCadastradas(coresData)

          const tecidosData = await tecidoBaseService.listarTodos()
          setTecidosCadastrados(tecidosData)
        } catch (error) {
          console.error("Erro ao carregar cores e tecidos:", error)
        }
      } catch (error) {
        console.error("Erro ao carregar produtos:", error)
      } finally {
        setIsLoading(false)
      }
    }

    carregarDados()
  }, [produtos])

  // Modificar o método handleAdicionarProduto para converter para maiúsculas
  const handleAdicionarProduto = async () => {
    if (novoProduto.nome && novoProduto.valorBase) {
      try {
        setIsLoading(true)
        setError(null)

        // Gerar um UUID para o novo produto
        const produtoId = generateUUID()

        // Obter o próximo código sequencial
        const codigo = novoProduto.codigo || (await obterProximoCodigoProduto())

        // Verificar se a coluna 'categoria' existe
        let colunaExiste = false
        try {
          // Tentar obter informações sobre a tabela
          const { data: tableInfo, error: tableError } = await supabase.from("produtos").select("categoria").limit(1)

          // Se não houver erro, a coluna existe
          if (!tableError) {
            colunaExiste = true
          }
        } catch (error) {
          console.log("A coluna 'categoria' não existe na tabela 'produtos'")
          colunaExiste = false
        }

        // Preparar dados para inserção com valores em maiúsculas
        const insertData = {
          id: produtoId,
          codigo,
          nome: novoProduto.nome.toUpperCase(),
          valor_base: novoProduto.valorBase,
          cores: novoProduto.cores ? novoProduto.cores.map((cor) => cor.toUpperCase()) : [],
          tamanhos_disponiveis: novoProduto.tamanhosDisponiveis
            ? novoProduto.tamanhosDisponiveis.map((tamanho) => tamanho.toUpperCase())
            : [],
        }

        // Adicionar categoria apenas se a coluna existir
        if (colunaExiste) {
          insertData.categoria = novoProduto.categoria ? novoProduto.categoria.toUpperCase() : "OUTROS"
        }

        // Inserir produto no Supabase
        const { data: insertedData, error: produtoError } = await supabase.from("produtos").insert(insertData).select()

        if (produtoError) throw produtoError

        if (insertedData && insertedData[0]) {
          // Inserir tecidos do produto com valores em maiúsculas
          if (novoProduto.tecidos && novoProduto.tecidos.length > 0) {
            const tecidosParaInserir = novoProduto.tecidos.map((tecido) => ({
              nome: tecido.nome.toUpperCase(),
              composicao: tecido.composicao.toUpperCase(),
              produto_id: insertedData[0].id,
            }))

            const { error: tecidosError } = await supabase.from("tecidos").insert(tecidosParaInserir)

            if (tecidosError) throw tecidosError
          }

          // Converter para o formato da aplicação
          const novoProdutoFormatado: Produto = {
            id: insertedData[0].id,
            codigo: insertedData[0].codigo || codigo,
            nome: insertedData[0].nome,
            valorBase: Number(insertedData[0].valor_base),
            tecidos: novoProduto.tecidos
              ? novoProduto.tecidos.map((tecido) => ({
                  nome: tecido.nome.toUpperCase(),
                  composicao: tecido.composicao.toUpperCase(),
                }))
              : [],
            cores: insertedData[0].cores || [],
            tamanhosDisponiveis: insertedData[0].tamanhos_disponiveis || [],
            categoria: insertedData[0].categoria || novoProduto.categoria?.toUpperCase() || "OUTROS",
          }

          // Adicionar à lista local
          adicionarProduto(novoProdutoFormatado)

          // Limpar formulário
          setNovoProduto({
            codigo: "",
            nome: "",
            valorBase: 0,
            tecidos: [],
            cores: [],
            tamanhosDisponiveis: [],
            categoria: "",
          })
          setNovoTamanho("")
          setMostrarFormulario(false)
        }
      } catch (error) {
        console.error("Erro ao adicionar produto:", error)
        setError(`Erro ao adicionar produto: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleRemoverProduto = async (id: string) => {
    // Confirmar antes de excluir
    if (!window.confirm("Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.")) {
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Verificar se o produto está sendo usado em algum item de orçamento
      const { data: itensRelacionados, error: itensError } = await supabase
        .from("itens_orcamento")
        .select("id, orcamento_id")
        .eq("produto_id", id)

      if (itensError) throw itensError

      // Se existirem itens relacionados, perguntar ao usuário se deseja excluí-los também
      if (itensRelacionados && itensRelacionados.length > 0) {
        const confirmarExclusao = window.confirm(
          `Este produto está sendo usado em ${itensRelacionados.length} item(ns) de orçamento. Todos esses itens serão excluídos também. Deseja continuar?`,
        )

        if (!confirmarExclusao) {
          setIsLoading(false)
          return
        }

        // Excluir os itens de orçamento relacionados
        const { error: deleteItensError } = await supabase.from("itens_orcamento").delete().eq("produto_id", id)

        if (deleteItensError) throw deleteItensError
      }

      // Remover tecidos do produto
      const { error: tecidosError } = await supabase.from("tecidos").delete().eq("produto_id", id)

      if (tecidosError) throw tecidosError

      // Remover produto
      const { error: produtoError } = await supabase.from("produtos").delete().eq("id", id)

      if (produtoError) throw produtoError

      // Remover da lista local
      setProdutos(produtos.filter((produto) => produto.id !== id))
    } catch (error) {
      console.error("Erro ao remover produto:", error)
      setError(`Erro ao remover produto: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
    } finally {
      setIsLoading(false)
    }
  }

  const iniciarEdicao = (produto: Produto) => {
    setEditandoId(produto.id)
    setProdutoEditando({ ...produto })
  }

  const cancelarEdicao = () => {
    setEditandoId(null)
    setProdutoEditando(null)
  }

  // Modificar o método salvarEdicao para converter para maiúsculas
  const salvarEdicao = async () => {
    if (produtoEditando) {
      try {
        setIsLoading(true)
        setError(null)

        // Primeiro, verificar se a coluna 'categoria' existe
        let colunaExiste = false
        try {
          // Tentar obter informações sobre a tabela
          const { data: tableInfo, error: tableError } = await supabase.from("produtos").select("categoria").limit(1)

          // Se não houver erro, a coluna existe
          if (!tableError) {
            colunaExiste = true
          }
        } catch (error) {
          console.log("A coluna 'categoria' não existe na tabela 'produtos'")
          colunaExiste = false
        }

        // Atualizar o produto com ou sem o campo categoria, com valores em maiúsculas
        const updateData = {
          codigo: produtoEditando.codigo,
          nome: produtoEditando.nome.toUpperCase(),
          valor_base: produtoEditando.valorBase,
          cores: produtoEditando.cores.map((cor) => cor.toUpperCase()),
          tamanhos_disponiveis: produtoEditando.tamanhosDisponiveis.map((tamanho) => tamanho.toUpperCase()),
          updated_at: new Date().toISOString(),
        }

        // Adicionar categoria apenas se a coluna existir
        if (colunaExiste) {
          updateData.categoria = produtoEditando.categoria ? produtoEditando.categoria.toUpperCase() : "OUTROS"
        }

        const { error: produtoError } = await supabase.from("produtos").update(updateData).eq("id", produtoEditando.id)

        if (produtoError) throw produtoError

        // Remover tecidos antigos
        const { error: deleteTecidosError } = await supabase
          .from("tecidos")
          .delete()
          .eq("produto_id", produtoEditando.id)

        if (deleteTecidosError) throw deleteTecidosError

        // Inserir novos tecidos com valores em maiúsculas
        if (produtoEditando.tecidos && produtoEditando.tecidos.length > 0) {
          const tecidosParaInserir = produtoEditando.tecidos.map((tecido) => ({
            nome: tecido.nome.toUpperCase(),
            composicao: tecido.composicao.toUpperCase(),
            produto_id: produtoEditando.id,
          }))

          const { error: tecidosError } = await supabase.from("tecidos").insert(tecidosParaInserir)

          if (tecidosError) throw tecidosError
        }

        // Atualizar na lista local
        setProdutos(produtos.map((produto) => (produto.id === produtoEditando.id ? produtoEditando : produto)))
        setEditandoId(null)
        setProdutoEditando(null)
      } catch (error) {
        console.error("Erro ao atualizar produto:", error)
        setError(`Erro ao atualizar produto: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const removerTecido = (index: number) => {
    if (editandoId && produtoEditando) {
      setProdutoEditando({
        ...produtoEditando,
        tecidos: produtoEditando.tecidos.filter((_, i) => i !== index),
      })
    } else {
      setNovoProduto({
        ...novoProduto,
        tecidos: (novoProduto.tecidos || []).filter((_, i) => i !== index),
      })
    }
  }

  const removerCor = (index: number) => {
    if (editandoId && produtoEditando) {
      setProdutoEditando({
        ...produtoEditando,
        cores: produtoEditando.cores.filter((_, i) => i !== index),
      })
    } else {
      setNovoProduto({
        ...novoProduto,
        cores: (novoProduto.cores || []).filter((c, i) => i !== index),
      })
    }
  }

  const adicionarTamanho = () => {
    if (novoTamanho) {
      if (editandoId && produtoEditando) {
        setProdutoEditando({
          ...produtoEditando,
          tamanhosDisponiveis: [...produtoEditando.tamanhosDisponiveis, novoTamanho],
        })
      } else {
        setNovoProduto({
          ...novoProduto,
          tamanhosDisponiveis: [...(novoProduto.tamanhosDisponiveis || []), novoTamanho],
        })
      }
      setNovoTamanho("")
    }
  }

  const removerTamanho = (index: number) => {
    if (editandoId && produtoEditando) {
      setProdutoEditando({
        ...produtoEditando,
        tamanhosDisponiveis: produtoEditando.tamanhosDisponiveis.filter((_, i) => i !== index),
      })
    } else {
      setNovoProduto({
        ...novoProduto,
        tamanhosDisponiveis: (novoProduto.tamanhosDisponiveis || []).filter((_, i) => i !== index),
      })
    }
  }

  // Função para alternar a ordenação
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

  // Função para alternar a expansão de uma categoria
  const alternarCategoria = (categoria: string) => {
    setCategoriasExpandidas((prev) => ({
      ...prev,
      [categoria]: !prev[categoria],
    }))
  }

  // Função para filtrar e ordenar produtos
  const produtosFiltradosEOrdenados = () => {
    // Primeiro filtra os produtos
    const produtosFiltrados = produtos.filter((produto) => {
      if (!termoPesquisa) return true

      const termoLowerCase = termoPesquisa.toLowerCase()
      return (
        produto.codigo.toLowerCase().includes(termoLowerCase) ||
        produto.nome.toLowerCase().includes(termoLowerCase) ||
        produto.categoria?.toLowerCase().includes(termoLowerCase) ||
        produto.tecidos.some((t) => t.nome.toLowerCase().includes(termoPesquisa)) ||
        produto.cores.some((c) => c.toLowerCase().includes(termoPesquisa))
      )
    })

    // Depois ordena os produtos filtrados
    return produtosFiltrados.sort((a, b) => {
      let valorA, valorB

      switch (ordenacao.campo) {
        case "codigo":
          valorA = a.codigo
          valorB = b.codigo
          break
        case "nome":
          valorA = a.nome
          valorB = b.nome
          break
        case "valorBase":
          valorA = a.valorBase
          valorB = b.valorBase
          break
        case "categoria":
          valorA = a.categoria || "Outros"
          valorB = b.categoria || "Outros"
          break
        default:
          valorA = a.codigo
          valorB = b.codigo
      }

      if (typeof valorA === "string" && typeof valorB === "string") {
        return ordenacao.direcao === "asc" ? valorA.localeCompare(valorB) : valorB.localeCompare(valorA)
      } else {
        return ordenacao.direcao === "asc"
          ? (valorA as number) - (valorB as number)
          : (valorB as number) - (valorA as number)
      }
    })
  }

  // Agrupar produtos por categoria
  const agruparPorCategoria = (produtos: Produto[]) => {
    const grupos: Record<string, Produto[]> = {}

    produtos.forEach((produto) => {
      const categoria = produto.categoria || "Outros"
      if (!grupos[categoria]) {
        grupos[categoria] = []
      }
      grupos[categoria].push(produto)
    })

    return grupos
  }

  // Obter produtos filtrados e ordenados
  const produtosExibidos = produtosFiltradosEOrdenados()
  const produtosAgrupados = agruparPorCategoria(produtosExibidos)

  // Variável para armazenar os tecidos cadastrados

  // Funções para gerenciar categorias
  const handleCategoriaAdded = (categoria: Categoria) => {
    setCategorias([...categorias, categoria])
  }

  const handleCategoriaUpdated = (categoriaAtualizada: Categoria) => {
    setCategorias(categorias.map((cat) => (cat.id === categoriaAtualizada.id ? categoriaAtualizada : cat)))

    // Atualizar produtos com a categoria antiga para a nova
    const categoriaAntiga = categorias.find((cat) => cat.id === categoriaAtualizada.id)
    if (categoriaAntiga && categoriaAntiga.nome !== categoriaAtualizada.nome) {
      setProdutos(
        produtos.map((produto) =>
          produto.categoria === categoriaAntiga.nome ? { ...produto, categoria: categoriaAtualizada.nome } : produto,
        ),
      )
    }
  }

  const handleCategoriaDeleted = (id: string) => {
    const categoriaRemovida = categorias.find((cat) => cat.id === id)
    setCategorias(categorias.filter((cat) => cat.id !== id))

    // Mover produtos da categoria removida para "Outros"
    if (categoriaRemovida) {
      setProdutos(
        produtos.map((produto) =>
          produto.categoria === categoriaRemovida.nome ? { ...produto, categoria: "Outros" } : produto,
        ),
      )
    }
  }

  // Obter a cor da categoria para exibição
  const getCorCategoria = (nomeCategoria: string): string => {
    const categoria = categorias.find((cat) => cat.nome === nomeCategoria)
    return categoria?.cor || "#4f46e5" // Cor padrão se não encontrar
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-primary flex items-center gap-2">
          <span className="bg-primary text-white p-1 rounded-md text-xs">PRODUTOS</span>
          Gerenciar Produtos
        </h3>
        <span className="text-sm text-gray-500">{produtos.length} produtos cadastrados</span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="flex justify-between items-center gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Pesquisar produtos por código, nome, categoria, tecido ou cor..."
            value={termoPesquisa}
            onChange={(e) => setTermoPesquisa(e.target.value)}
            className="pl-10 pr-4 py-2 w-full"
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setMostrarGerenciadorCategorias(true)}
            variant="outline"
            className="border-primary text-primary hover:bg-primary/10"
          >
            <Tag className="h-4 w-4 mr-2" /> Gerenciar Categorias
          </Button>
          <Button
            onClick={() => setMostrarFormulario(true)}
            className="bg-primary hover:bg-primary-dark text-white transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" /> Novo Produto
          </Button>
        </div>
      </div>

      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th
                  className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer hover:bg-muted"
                  onClick={() => alternarOrdenacao("codigo")}
                >
                  <div className="flex items-center">
                    Código
                    {ordenacao.campo === "codigo" &&
                      (ordenacao.direcao === "asc" ? (
                        <ChevronUp className="ml-1 h-4 w-4" />
                      ) : (
                        <ChevronDown className="ml-1 h-4 w-4" />
                      ))}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer hover:bg-muted"
                  onClick={() => alternarOrdenacao("categoria")}
                >
                  <div className="flex items-center">
                    Categoria
                    {ordenacao.campo === "categoria" &&
                      (ordenacao.direcao === "asc" ? (
                        <ChevronUp className="ml-1 h-4 w-4" />
                      ) : (
                        <ChevronDown className="ml-1 h-4 w-4" />
                      ))}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer hover:bg-muted"
                  onClick={() => alternarOrdenacao("nome")}
                >
                  <div className="flex items-center">
                    Descrição
                    {ordenacao.campo === "nome" &&
                      (ordenacao.direcao === "asc" ? (
                        <ChevronUp className="ml-1 h-4 w-4" />
                      ) : (
                        <ChevronDown className="ml-1 h-4 w-4" />
                      ))}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer hover:bg-muted"
                  onClick={() => alternarOrdenacao("valorBase")}
                >
                  <div className="flex items-center">
                    Valor Base
                    {ordenacao.campo === "valorBase" &&
                      (ordenacao.direcao === "asc" ? (
                        <ChevronUp className="ml-1 h-4 w-4" />
                      ) : (
                        <ChevronDown className="ml-1 h-4 w-4" />
                      ))}
                  </div>
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tecidos</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tamanhos</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && produtos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-4 text-center text-muted-foreground">
                    Carregando produtos...
                  </td>
                </tr>
              ) : produtosExibidos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-4 text-center text-muted-foreground">
                    {termoPesquisa ? "Nenhum produto encontrado para esta pesquisa." : "Nenhum produto cadastrado."}
                  </td>
                </tr>
              ) : (
                // Renderizar produtos agrupados por categoria
                Object.entries(produtosAgrupados).map(([categoria, produtosCategoria]) => (
                  <React.Fragment key={categoria}>
                    {/* Linha de cabeçalho da categoria */}
                    <tr className="border-t border-b" style={{ backgroundColor: `${getCorCategoria(categoria)}20` }}>
                      <td colSpan={8} className="px-4 py-2">
                        <button
                          className="flex items-center gap-2 w-full text-left font-medium"
                          style={{ color: getCorCategoria(categoria) }}
                          onClick={() => alternarCategoria(categoria)}
                        >
                          {categoriasExpandidas[categoria] ? (
                            <FolderOpen className="h-4 w-4" />
                          ) : (
                            <FolderClosed className="h-4 w-4" />
                          )}
                          {categoria}{" "}
                          <span className="text-xs text-gray-500">({produtosCategoria.length} produtos)</span>
                        </button>
                      </td>
                    </tr>

                    {/* Produtos da categoria (mostrar apenas se expandido) */}
                    {categoriasExpandidas[categoria] &&
                      produtosCategoria.map((produto) => (
                        <tr key={produto.id} className="border-t hover:bg-muted/50">
                          {editandoId === produto.id && produtoEditando ? (
                            <td colSpan={8} className="p-4">
                              <div className="space-y-4 bg-accent/50 p-4 rounded-md">
                                {/* Formulário de edição */}
                                <div className="grid grid-cols-4 gap-4">
                                  <div>
                                    <Label
                                      htmlFor={`edit-codigo-${produto.id}`}
                                      className="text-primary flex items-center gap-2"
                                    >
                                      <FileText className="h-4 w-4" />
                                      Código
                                    </Label>
                                    <Input
                                      id={`edit-codigo-${produto.id}`}
                                      value={produtoEditando.codigo}
                                      onChange={(e) =>
                                        setProdutoEditando({
                                          ...produtoEditando,
                                          codigo: e.target.value,
                                        })
                                      }
                                      className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                                      disabled={true} // Código não deve ser editável manualmente
                                    />
                                  </div>
                                  <div>
                                    <Label
                                      htmlFor={`edit-categoria-${produto.id}`}
                                      className="text-primary flex items-center gap-2"
                                    >
                                      <Tag className="h-4 w-4" />
                                      Categoria
                                    </Label>
                                    <select
                                      id={`edit-categoria-${produto.id}`}
                                      value={produtoEditando.categoria || "Outros"}
                                      onChange={(e) =>
                                        setProdutoEditando({
                                          ...produtoEditando,
                                          categoria: e.target.value,
                                        })
                                      }
                                      className="w-full rounded-md border border-gray-300 p-2 focus:border-primary focus:ring-1 focus:ring-primary"
                                    >
                                      {categorias.map((cat) => (
                                        <option key={cat.id} value={cat.nome}>
                                          {cat.nome}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <Label
                                      htmlFor={`edit-nome-${produto.id}`}
                                      className="text-primary flex items-center gap-2"
                                    >
                                      <Package className="h-4 w-4" />
                                      Nome
                                    </Label>
                                    <Input
                                      id={`edit-nome-${produto.id}`}
                                      value={produtoEditando.nome}
                                      onChange={(e) =>
                                        setProdutoEditando({
                                          ...produtoEditando,
                                          nome: e.target.value.toUpperCase(),
                                        })
                                      }
                                      className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                                    />
                                  </div>
                                  <div>
                                    <Label
                                      htmlFor={`edit-valor-${produto.id}`}
                                      className="text-primary flex items-center gap-2"
                                    >
                                      <DollarSign className="h-4 w-4" />
                                      Valor Base
                                    </Label>
                                    <Input
                                      id={`edit-valor-${produto.id}`}
                                      type="number"
                                      value={produtoEditando.valorBase}
                                      onChange={(e) =>
                                        setProdutoEditando({
                                          ...produtoEditando,
                                          valorBase: Number.parseFloat(e.target.value),
                                        })
                                      }
                                      className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                                    />
                                  </div>
                                </div>

                                {/* Tecidos */}
                                <div>
                                  <Label className="text-primary flex items-center gap-2">
                                    <Shirt className="h-4 w-4" />
                                    Tecidos Disponíveis
                                  </Label>
                                  <div className="mt-2 space-y-2">
                                    {tecidosCadastrados.length > 0 ? (
                                      <div className="grid grid-cols-2 gap-2">
                                        {tecidosCadastrados.map((tecido) => (
                                          <div key={tecido.id} className="flex items-center">
                                            <input
                                              type="checkbox"
                                              id={`edit-tecido-${tecido.id}`}
                                              className="mr-2"
                                              checked={produtoEditando.tecidos.some((t) => t.nome === tecido.nome)}
                                              onChange={(e) => {
                                                if (e.target.checked) {
                                                  setProdutoEditando({
                                                    ...produtoEditando,
                                                    tecidos: [
                                                      ...produtoEditando.tecidos,
                                                      { nome: tecido.nome, composicao: tecido.composicao },
                                                    ],
                                                  })
                                                } else {
                                                  setProdutoEditando({
                                                    ...produtoEditando,
                                                    tecidos: produtoEditando.tecidos.filter(
                                                      (t) => t.nome !== tecido.nome,
                                                    ),
                                                  })
                                                }
                                              }}
                                            />
                                            <Label
                                              htmlFor={`edit-tecido-${tecido.id}`}
                                              className="text-sm cursor-pointer"
                                            >
                                              {tecido.nome}{" "}
                                              <span className="text-xs text-gray-500">({tecido.composicao})</span>
                                            </Label>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-sm text-gray-500 italic p-2">
                                        Nenhum tecido cadastrado. Adicione tecidos na aba Materiais.
                                      </div>
                                    )}
                                    <div className="space-y-1 max-h-32 overflow-y-auto p-2 bg-white rounded-md">
                                      {produtoEditando.tecidos.length === 0 && (
                                        <p className="text-sm text-gray-500 italic p-2">Nenhum tecido selecionado</p>
                                      )}
                                      {produtoEditando.tecidos.map((tecido, index) => (
                                        <div
                                          key={index}
                                          className="flex justify-between items-center p-2 bg-accent rounded-md"
                                        >
                                          <div>
                                            <span className="font-medium">{tecido.nome}</span>
                                            <span className="text-xs text-gray-500 ml-2">({tecido.composicao})</span>
                                          </div>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removerTecido(index)}
                                            className="h-6 w-6 text-gray-500 hover:text-red-500 hover:bg-red-50"
                                          >
                                            <X className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                {/* Cores */}
                                <div>
                                  <Label className="text-primary flex items-center gap-2">
                                    <Palette className="h-4 w-4" />
                                    Cores Disponíveis
                                  </Label>
                                  <div className="mt-2 space-y-2">
                                    {coresCadastradas.length > 0 ? (
                                      <div className="grid grid-cols-3 gap-2">
                                        {coresCadastradas.map((cor) => (
                                          <div key={cor.id} className="flex items-center">
                                            <input
                                              type="checkbox"
                                              id={`edit-cor-${cor.id}`}
                                              className="mr-2"
                                              checked={produtoEditando.cores.includes(cor.nome)}
                                              onChange={(e) => {
                                                if (e.target.checked) {
                                                  setProdutoEditando({
                                                    ...produtoEditando,
                                                    cores: [...produtoEditando.cores, cor.nome],
                                                  })
                                                } else {
                                                  setProdutoEditando({
                                                    ...produtoEditando,
                                                    cores: produtoEditando.cores.filter((c) => c !== cor.nome),
                                                  })
                                                }
                                              }}
                                            />
                                            <Label
                                              htmlFor={`edit-cor-${cor.id}`}
                                              className="text-sm cursor-pointer flex items-center gap-1"
                                            >
                                              <div
                                                className="w-4 h-4 rounded-full border border-gray-300"
                                                style={{ backgroundColor: cor.codigo_hex || "#000000" }}
                                              ></div>
                                              {cor.nome}
                                            </Label>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-sm text-gray-500 italic p-2">
                                        Nenhuma cor cadastrada. Adicione cores na aba Materiais.
                                      </div>
                                    )}
                                    <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 bg-white rounded-md">
                                      {produtoEditando.cores.length === 0 && (
                                        <p className="text-sm text-gray-500 italic p-2">Nenhuma cor selecionada</p>
                                      )}
                                      {produtoEditando.cores.map((cor, index) => (
                                        <div
                                          key={index}
                                          className="flex items-center gap-1 bg-accent px-2 py-1 rounded-full"
                                        >
                                          <div
                                            className="w-3 h-3 rounded-full border border-gray-300"
                                            style={{
                                              backgroundColor:
                                                coresCadastradas.find((c) => c.nome === cor)?.codigo_hex || "#000000",
                                            }}
                                          ></div>
                                          <span className="text-sm">{cor}</span>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removerCor(index)}
                                            className="h-5 w-5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full p-0"
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                {/* Tamanhos */}
                                <div>
                                  <Label className="text-primary flex items-center gap-2">
                                    <Ruler className="h-4 w-4" />
                                    Tamanhos Disponíveis
                                  </Label>
                                  <div className="mt-2 space-y-4">
                                    <div className="grid grid-cols-1 gap-4">
                                      <div className="border rounded-md p-3 bg-white">
                                        <div className="flex items-center mb-2">
                                          <input
                                            type="radio"
                                            id={`tamanho-tipo-1-edit`}
                                            name={`tamanho-tipo-edit`}
                                            className="mr-2"
                                            checked={produtoEditando.tamanhosDisponiveis.some((t) =>
                                              [
                                                "PP",
                                                "P",
                                                "M",
                                                "G",
                                                "GG",
                                                "G1",
                                                "G2",
                                                "G3",
                                                "G4",
                                                "G5",
                                                "G6",
                                                "G7",
                                              ].includes(t),
                                            )}
                                            onChange={() => {
                                              setProdutoEditando({
                                                ...produtoEditando,
                                                tamanhosDisponiveis: [
                                                  "PP",
                                                  "P",
                                                  "M",
                                                  "G",
                                                  "GG",
                                                  "G1",
                                                  "G2",
                                                  "G3",
                                                  "G4",
                                                  "G5",
                                                  "G6",
                                                  "G7",
                                                ],
                                              })
                                            }}
                                          />
                                          <Label htmlFor={`tamanho-tipo-1-edit`} className="font-medium">
                                            Padrão (PP ao G7)
                                          </Label>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                          {["PP", "P", "M", "G", "GG", "G1", "G2", "G3", "G4", "G5", "G6", "G7"].map(
                                            (tamanho) => (
                                              <div
                                                key={tamanho}
                                                className="flex items-center gap-1 bg-accent px-2 py-1 rounded-full"
                                              >
                                                <span className="text-sm font-medium">{tamanho}</span>
                                              </div>
                                            ),
                                          )}
                                        </div>
                                      </div>

                                      <div className="border rounded-md p-3 bg-white">
                                        <div className="flex items-center mb-2">
                                          <input
                                            type="radio"
                                            id={`tamanho-tipo-2-edit`}
                                            name={`tamanho-tipo-edit`}
                                            className="mr-2"
                                            checked={produtoEditando.tamanhosDisponiveis.some((t) =>
                                              t.match(/^(3[68]|[4-5][02468])$/),
                                            )}
                                            onChange={() => {
                                              const numericos = Array.from({ length: 12 }, (_, i) =>
                                                (36 + i * 2).toString(),
                                              )
                                              setProdutoEditando({
                                                ...produtoEditando,
                                                tamanhosDisponiveis: numericos,
                                              })
                                            }}
                                          />
                                          <Label htmlFor={`tamanho-tipo-2-edit`} className="font-medium">
                                            Numérico (36 ao 58 - pares)
                                          </Label>
                                        </div>
                                        <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                                          {Array.from({ length: 12 }, (_, i) => (36 + i * 2).toString()).map(
                                            (tamanho) => (
                                              <div
                                                key={tamanho}
                                                className="flex items-center gap-1 bg-accent px-2 py-1 rounded-full"
                                              >
                                                <span className="text-sm font-medium">{tamanho}</span>
                                              </div>
                                            ),
                                          )}
                                        </div>
                                      </div>

                                      <div className="border rounded-md p-3 bg-white">
                                        <div className="flex items-center mb-2">
                                          <input
                                            type="radio"
                                            id={`tamanho-tipo-3-edit`}
                                            name={`tamanho-tipo-edit`}
                                            className="mr-2"
                                            checked={produtoEditando.tamanhosDisponiveis.some((t) =>
                                              t.match(/^([0-9]|1[0-3])$/),
                                            )}
                                            onChange={() => {
                                              const infantis = Array.from({ length: 14 }, (_, i) => i.toString())
                                              setProdutoEditando({
                                                ...produtoEditando,
                                                tamanhosDisponiveis: infantis,
                                              })
                                            }}
                                          />
                                          <Label htmlFor={`tamanho-tipo-3-edit`} className="font-medium">
                                            Infantil (0 ao 13)
                                          </Label>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                          {Array.from({ length: 14 }, (_, i) => i.toString()).map((tamanho) => (
                                            <div
                                              key={tamanho}
                                              className="flex items-center gap-1 bg-accent px-2 py-1 rounded-full"
                                            >
                                              <span className="text-sm font-medium">{tamanho}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    onClick={cancelarEdicao}
                                    className="text-gray-500 hover:text-gray-700"
                                  >
                                    <X className="h-4 w-4 mr-2" /> Cancelar
                                  </Button>
                                  <Button
                                    onClick={salvarEdicao}
                                    className="bg-primary hover:bg-primary-dark text-white"
                                    disabled={isLoading}
                                  >
                                    <Save className="h-4 w-4 mr-2" /> {isLoading ? "Salvando..." : "Salvar"}
                                  </Button>
                                </div>
                              </div>
                            </td>
                          ) : (
                            <>
                              <td className="px-4 py-3 align-middle">
                                <span className="font-medium text-primary">{produto.codigo}</span>
                              </td>
                              <td className="px-4 py-3 align-middle">
                                <span
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                  style={{
                                    backgroundColor: `${getCorCategoria(produto.categoria)}20`,
                                    color: getCorCategoria(produto.categoria),
                                  }}
                                >
                                  {produto.categoria || "Outros"}
                                </span>
                              </td>
                              <td className="px-4 py-3 align-middle">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{produto.nome}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 align-middle">
                                <span className="font-medium">R$ {produto.valorBase.toFixed(2)}</span>
                              </td>
                              <td className="px-4 py-3 align-middle">
                                <div className="max-w-[200px] truncate">
                                  {produto.tecidos.length > 0 ? (
                                    produto.tecidos.map((t) => t.nome).join(", ")
                                  ) : (
                                    <span className="text-gray-400 italic">Nenhum</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 align-middle">
                                <div className="max-w-[200px] truncate">
                                  {produto.tamanhosDisponiveis.length > 0 ? (
                                    produto.tamanhosDisponiveis.length > 5 ? (
                                      `${produto.tamanhosDisponiveis.slice(0, 5).join(", ")}... +${produto.tamanhosDisponiveis.length - 5}`
                                    ) : (
                                      produto.tamanhosDisponiveis.join(", ")
                                    )
                                  ) : (
                                    <span className="text-gray-400 italic">Nenhum</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 align-middle">
                                <div className="flex justify-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => iniciarEdicao(produto)}
                                    className="h-8 w-8 text-primary hover:text-primary-dark hover:bg-primary/10"
                                    disabled={isLoading}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoverProduto(produto.id)}
                                    className="h-8 w-8 text-gray-500 hover:text-red-500 hover:bg-red-50"
                                    disabled={isLoading}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Formulário de adição de produto */}
      {mostrarFormulario && (
        <Card className="overflow-hidden shadow-sm border-0 border-t-4 border-t-primary">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium text-primary flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Novo Produto
              </h4>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMostrarFormulario(false)}
                className="h-8 w-8 text-gray-500"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              {/* Adicionar campo de código e categoria no formulário de novo produto */}
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="codigo-produto" className="text-primary flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Código
                  </Label>
                  <Input
                    id="codigo-produto"
                    value={novoProduto.codigo}
                    className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                    disabled={true} // Código será gerado automaticamente
                    placeholder="Gerado automaticamente"
                  />
                </div>
                <div>
                  <Label htmlFor="categoria-produto" className="text-primary flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Categoria
                  </Label>
                  <select
                    id="categoria-produto"
                    value={novoProduto.categoria || ""}
                    onChange={(e) => setNovoProduto({ ...novoProduto, categoria: e.target.value })}
                    className="w-full rounded-md border border-gray-300 p-2 focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="" disabled>
                      Selecione uma categoria
                    </option>
                    {categorias.map((cat) => (
                      <option key={cat.id} value={cat.nome}>
                        {cat.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="nome-produto" className="text-primary flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Nome
                  </Label>
                  <Input
                    id="nome-produto"
                    value={novoProduto.nome}
                    onChange={(e) => setNovoProduto({ ...novoProduto, nome: e.target.value.toUpperCase() })}
                    className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <Label htmlFor="valor-base" className="text-primary flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Valor Base
                  </Label>
                  <Input
                    id="valor-base"
                    type="number"
                    value={novoProduto.valorBase || ""}
                    onChange={(e) =>
                      setNovoProduto({
                        ...novoProduto,
                        valorBase: Number.parseFloat(e.target.value),
                      })
                    }
                    className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Tecidos */}
              <div>
                <Label className="text-primary flex items-center gap-2">
                  <Shirt className="h-4 w-4" />
                  Tecidos Disponíveis
                </Label>
                <div className="mt-2 space-y-2">
                  {tecidosCadastrados.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {tecidosCadastrados.map((tecido) => (
                        <div key={tecido.id} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`tecido-${tecido.id}`}
                            className="mr-2"
                            checked={(novoProduto.tecidos || []).some((t) => t.nome === tecido.nome)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNovoProduto({
                                  ...novoProduto,
                                  tecidos: [
                                    ...(novoProduto.tecidos || []),
                                    { nome: tecido.nome, composicao: tecido.composicao },
                                  ],
                                })
                              } else {
                                setNovoProduto({
                                  ...novoProduto,
                                  tecidos: (novoProduto.tecidos || []).filter((t) => t.nome !== tecido.nome),
                                })
                              }
                            }}
                          />
                          <Label htmlFor={`tecido-${tecido.id}`} className="text-sm cursor-pointer">
                            {tecido.nome} <span className="text-xs text-gray-500">({tecido.composicao})</span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 italic p-2">
                      Nenhum tecido cadastrado. Adicione tecidos na aba Materiais.
                    </div>
                  )}
                  <div className="space-y-1 max-h-32 overflow-y-auto p-2 bg-white rounded-md">
                    {(novoProduto.tecidos || []).length === 0 && (
                      <p className="text-sm text-gray-500 italic p-2">Nenhum tecido selecionado</p>
                    )}
                    {(novoProduto.tecidos || []).map((tecido, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-accent rounded-md">
                        <div>
                          <span className="font-medium">{tecido.nome}</span>
                          <span className="text-xs text-gray-500 ml-2">({tecido.composicao})</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removerTecido(index)}
                          className="h-6 w-6 text-gray-500 hover:text-red-500 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cores */}
              <div>
                <Label className="text-primary flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Cores Disponíveis
                </Label>
                <div className="mt-2 space-y-2">
                  {coresCadastradas.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {coresCadastradas.map((cor) => (
                        <div key={cor.id} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`cor-${cor.id}`}
                            className="mr-2"
                            checked={(novoProduto.cores || []).includes(cor.nome)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNovoProduto({
                                  ...novoProduto,
                                  cores: [...(novoProduto.cores || []), cor.nome],
                                })
                              } else {
                                setNovoProduto({
                                  ...novoProduto,
                                  cores: (novoProduto.cores || []).filter((c) => c !== cor.nome),
                                })
                              }
                            }}
                          />
                          <Label htmlFor={`cor-${cor.id}`} className="text-sm cursor-pointer flex items-center gap-1">
                            <div
                              className="w-4 h-4 rounded-full border border-gray-300"
                              style={{ backgroundColor: cor.codigo_hex || "#000000" }}
                            ></div>
                            {cor.nome}
                          </Label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 italic p-2">
                      Nenhuma cor cadastrada. Adicione cores na aba Materiais.
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 bg-white rounded-md">
                    {(novoProduto.cores || []).length === 0 && (
                      <p className="text-sm text-gray-500 italic p-2">Nenhuma cor selecionada</p>
                    )}
                    {(novoProduto.cores || []).map((cor, index) => (
                      <div key={index} className="flex items-center gap-1 bg-accent px-2 py-1 rounded-full">
                        <div
                          className="w-3 h-3 rounded-full border border-gray-300"
                          style={{
                            backgroundColor: coresCadastradas.find((c) => c.nome === cor)?.codigo_hex || "#000000",
                          }}
                        ></div>
                        <span className="text-sm">{cor}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removerCor(index)}
                          className="h-5 w-5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tamanhos */}
              <div>
                <Label className="text-primary flex items-center gap-2">
                  <Ruler className="h-4 w-4" />
                  Tamanhos Disponíveis
                </Label>
                <div className="mt-2 space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="border rounded-md p-3 bg-white">
                      <div className="flex items-center mb-2">
                        <input
                          type="radio"
                          id={`tamanho-tipo-1-novo`}
                          name={`tamanho-tipo-novo`}
                          className="mr-2"
                          checked={(novoProduto.tamanhosDisponiveis || []).some((t) =>
                            ["PP", "P", "M", "G", "GG", "G1", "G2", "G3", "G4", "G5", "G6", "G7"].includes(t),
                          )}
                          onChange={() => {
                            setNovoProduto({
                              ...novoProduto,
                              tamanhosDisponiveis: [
                                "PP",
                                "P",
                                "M",
                                "G",
                                "GG",
                                "G1",
                                "G2",
                                "G3",
                                "G4",
                                "G5",
                                "G6",
                                "G7",
                              ],
                            })
                          }}
                        />
                        <Label htmlFor={`tamanho-tipo-1-novo`} className="font-medium">
                          Padrão (PP ao G7)
                        </Label>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {["PP", "P", "M", "G", "GG", "G1", "G2", "G3", "G4", "G5", "G6", "G7"].map((tamanho) => (
                          <div key={tamanho} className="flex items-center gap-1 bg-accent px-2 py-1 rounded-full">
                            <span className="text-sm font-medium">{tamanho}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border rounded-md p-3 bg-white">
                      <div className="flex items-center mb-2">
                        <input
                          type="radio"
                          id={`tamanho-tipo-2-novo`}
                          name={`tamanho-tipo-novo`}
                          className="mr-2"
                          checked={(novoProduto.tamanhosDisponiveis || []).some((t) =>
                            t.match(/^(3[68]|[4-5][02468])$/),
                          )}
                          onChange={() => {
                            const numericos = Array.from({ length: 12 }, (_, i) => (36 + i * 2).toString())
                            setNovoProduto({
                              ...novoProduto,
                              tamanhosDisponiveis: numericos,
                            })
                          }}
                        />
                        <Label htmlFor={`tamanho-tipo-2-novo`} className="font-medium">
                          Numérico (36 ao 58 - pares)
                        </Label>
                      </div>
                      <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                        {Array.from({ length: 12 }, (_, i) => (36 + i * 2).toString()).map((tamanho) => (
                          <div key={tamanho} className="flex items-center gap-1 bg-accent px-2 py-1 rounded-full">
                            <span className="text-sm font-medium">{tamanho}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border rounded-md p-3 bg-white">
                      <div className="flex items-center mb-2">
                        <input
                          type="radio"
                          id={`tamanho-tipo-3-novo`}
                          name={`tamanho-tipo-novo`}
                          className="mr-2"
                          checked={(novoProduto.tamanhosDisponiveis || []).some((t) => t.match(/^([0-9]|1[0-3])$/))}
                          onChange={() => {
                            const infantis = Array.from({ length: 14 }, (_, i) => i.toString())
                            setNovoProduto({
                              ...novoProduto,
                              tamanhosDisponiveis: infantis,
                            })
                          }}
                        />
                        <Label htmlFor={`tamanho-tipo-3-novo`} className="font-medium">
                          Infantil (0 ao 13)
                        </Label>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Array.from({ length: 14 }, (_, i) => i.toString()).map((tamanho) => (
                          <div key={tamanho} className="flex items-center gap-1 bg-accent px-2 py-1 rounded-full">
                            <span className="text-sm font-medium">{tamanho}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleAdicionarProduto}
                className="w-full bg-primary hover:bg-primary-dark text-white transition-colors"
                disabled={isLoading || !novoProduto.nome || !novoProduto.valorBase || !novoProduto.categoria}
              >
                <Plus className="h-4 w-4 mr-2" /> {isLoading ? "Adicionando..." : "Adicionar Produto"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de gerenciamento de categorias */}
      {mostrarGerenciadorCategorias && (
        <GerenciadorCategorias
          onClose={() => setMostrarGerenciadorCategorias(false)}
          onCategoriaAdded={handleCategoriaAdded}
          onCategoriaUpdated={handleCategoriaUpdated}
          onCategoriaDeleted={handleCategoriaDeleted}
        />
      )}
    </div>
  )
}
