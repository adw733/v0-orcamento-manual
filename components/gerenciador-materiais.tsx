"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import {
  Plus,
  Trash2,
  Pencil,
  Save,
  X,
  Palette,
  Shirt,
  AlertCircle,
  Search,
  ChevronUp,
  ChevronDown,
} from "lucide-react"
import { type Cor, type TecidoBase, corService, tecidoBaseService } from "@/lib/services-materiais"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function GerenciadorMateriais() {
  // Estados para cores
  const [cores, setCores] = useState<Cor[]>([])
  const [novaCor, setNovaCor] = useState<Partial<Cor>>({ nome: "", codigo_hex: "#000000" })
  const [editandoCorId, setEditandoCorId] = useState<string | null>(null)
  const [corEditando, setCorEditando] = useState<Cor | null>(null)
  const [mostrarFormCor, setMostrarFormCor] = useState(false)
  const [pesquisaCor, setPesquisaCor] = useState("")
  const [ordenacaoCor, setOrdenacaoCor] = useState<{ coluna: string; direcao: "asc" | "desc" }>({
    coluna: "nome",
    direcao: "asc",
  })

  // Estados para tecidos
  const [tecidos, setTecidos] = useState<TecidoBase[]>([])
  const [novoTecido, setNovoTecido] = useState<Partial<TecidoBase>>({ nome: "", composicao: "" })
  const [editandoTecidoId, setEditandoTecidoId] = useState<string | null>(null)
  const [tecidoEditando, setTecidoEditando] = useState<TecidoBase | null>(null)
  const [mostrarFormTecido, setMostrarFormTecido] = useState(false)
  const [pesquisaTecido, setPesquisaTecido] = useState("")
  const [ordenacaoTecido, setOrdenacaoTecido] = useState<{ coluna: string; direcao: "asc" | "desc" }>({
    coluna: "nome",
    direcao: "asc",
  })

  // Estados gerais
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("cores")

  // Carregar cores e tecidos ao montar o componente
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Carregar cores
        const coresData = await corService.listarTodas()
        setCores(coresData)

        // Carregar tecidos
        const tecidosData = await tecidoBaseService.listarTodos()
        setTecidos(tecidosData)
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
        setError(`Erro ao carregar dados: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
      } finally {
        setIsLoading(false)
      }
    }

    carregarDados()
  }, [])

  // Funções para ordenação
  const ordenarCores = (coluna: string) => {
    const novaOrdenacao = {
      coluna,
      direcao: ordenacaoCor.coluna === coluna && ordenacaoCor.direcao === "asc" ? "desc" : "asc",
    } as const

    setOrdenacaoCor(novaOrdenacao)
  }

  const ordenarTecidos = (coluna: string) => {
    const novaOrdenacao = {
      coluna,
      direcao: ordenacaoTecido.coluna === coluna && ordenacaoTecido.direcao === "asc" ? "desc" : "asc",
    } as const

    setOrdenacaoTecido(novaOrdenacao)
  }

  // Funções para filtrar dados
  const coresFiltradas = cores
    .filter(
      (cor) =>
        cor.nome.toLowerCase().includes(pesquisaCor.toLowerCase()) ||
        (cor.codigo_hex && cor.codigo_hex.toLowerCase().includes(pesquisaCor.toLowerCase())),
    )
    .sort((a, b) => {
      if (ordenacaoCor.coluna === "nome") {
        return ordenacaoCor.direcao === "asc" ? a.nome.localeCompare(b.nome) : b.nome.localeCompare(a.nome)
      } else if (ordenacaoCor.coluna === "codigo_hex") {
        const codA = a.codigo_hex || ""
        const codB = b.codigo_hex || ""
        return ordenacaoCor.direcao === "asc" ? codA.localeCompare(codB) : codB.localeCompare(codA)
      }
      return 0
    })

  const tecidosFiltrados = tecidos
    .filter(
      (tecido) =>
        tecido.nome.toLowerCase().includes(pesquisaTecido.toLowerCase()) ||
        tecido.composicao.toLowerCase().includes(pesquisaTecido.toLowerCase()),
    )
    .sort((a, b) => {
      if (ordenacaoTecido.coluna === "nome") {
        return ordenacaoTecido.direcao === "asc" ? a.nome.localeCompare(b.nome) : b.nome.localeCompare(a.nome)
      } else if (ordenacaoTecido.coluna === "composicao") {
        return ordenacaoTecido.direcao === "asc"
          ? a.composicao.localeCompare(b.composicao)
          : b.composicao.localeCompare(a.composicao)
      }
      return 0
    })

  // Funções para gerenciar cores
  const handleAdicionarCor = async () => {
    if (novaCor.nome) {
      try {
        setIsLoading(true)
        setError(null)

        const corAdicionada = await corService.adicionar({
          nome: novaCor.nome.toUpperCase(),
          codigo_hex: novaCor.codigo_hex,
        })

        setCores([...cores, corAdicionada])
        setNovaCor({ nome: "", codigo_hex: "#000000" })
        setMostrarFormCor(false)
      } catch (error) {
        console.error("Erro ao adicionar cor:", error)
        setError(`Erro ao adicionar cor: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const iniciarEdicaoCor = (cor: Cor) => {
    setEditandoCorId(cor.id)
    setCorEditando({ ...cor })
  }

  const cancelarEdicaoCor = () => {
    setEditandoCorId(null)
    setCorEditando(null)
  }

  const salvarEdicaoCor = async () => {
    if (corEditando) {
      try {
        setIsLoading(true)
        setError(null)

        // Garantir que o nome esteja em maiúsculas
        const corAtualizada = {
          ...corEditando,
          nome: corEditando.nome.toUpperCase(),
        }

        await corService.atualizar(corAtualizada)
        setCores(cores.map((cor) => (cor.id === corAtualizada.id ? corAtualizada : cor)))
        setEditandoCorId(null)
        setCorEditando(null)
      } catch (error) {
        console.error("Erro ao atualizar cor:", error)
        setError(`Erro ao atualizar cor: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleRemoverCor = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir esta cor? Esta ação não pode ser desfeita.")) {
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      await corService.remover(id)
      setCores(cores.filter((cor) => cor.id !== id))
    } catch (error) {
      console.error("Erro ao remover cor:", error)
      setError(`Erro ao remover cor: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Funções para gerenciar tecidos
  const handleAdicionarTecido = async () => {
    if (novoTecido.nome && novoTecido.composicao) {
      try {
        setIsLoading(true)
        setError(null)

        const tecidoAdicionado = await tecidoBaseService.adicionar({
          nome: novoTecido.nome.toUpperCase(),
          composicao: novoTecido.composicao.toUpperCase(),
        })

        setTecidos([...tecidos, tecidoAdicionado])
        setNovoTecido({ nome: "", composicao: "" })
        setMostrarFormTecido(false)
      } catch (error) {
        console.error("Erro ao adicionar tecido:", error)
        setError(`Erro ao adicionar tecido: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const iniciarEdicaoTecido = (tecido: TecidoBase) => {
    setEditandoTecidoId(tecido.id)
    setTecidoEditando({ ...tecido })
  }

  const cancelarEdicaoTecido = () => {
    setEditandoTecidoId(null)
    setTecidoEditando(null)
  }

  const salvarEdicaoTecido = async () => {
    if (tecidoEditando) {
      try {
        setIsLoading(true)
        setError(null)

        // Garantir que os dados estejam em maiúsculas
        const tecidoAtualizado = {
          ...tecidoEditando,
          nome: tecidoEditando.nome.toUpperCase(),
          composicao: tecidoEditando.composicao.toUpperCase(),
        }

        await tecidoBaseService.atualizar(tecidoAtualizado)
        setTecidos(tecidos.map((tecido) => (tecido.id === tecidoAtualizado.id ? tecidoAtualizado : tecido)))
        setEditandoTecidoId(null)
        setTecidoEditando(null)
      } catch (error) {
        console.error("Erro ao atualizar tecido:", error)
        setError(`Erro ao atualizar tecido: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleRemoverTecido = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este tecido? Esta ação não pode ser desfeita.")) {
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      await tecidoBaseService.remover(id)
      setTecidos(tecidos.filter((tecido) => tecido.id !== id))
    } catch (error) {
      console.error("Erro ao remover tecido:", error)
      setError(`Erro ao remover tecido: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-primary flex items-center gap-2">
          <span className="bg-primary text-white p-1 rounded-md text-xs">MATERIAIS</span>
          Gerenciar Cores e Tecidos
        </h3>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="cores" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Cores
          </TabsTrigger>
          <TabsTrigger value="tecidos" className="flex items-center gap-2">
            <Shirt className="h-4 w-4" />
            Tecidos
          </TabsTrigger>
        </TabsList>

        {/* Aba de Cores */}
        <TabsContent value="cores" className="space-y-4 pt-4">
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-center">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Pesquisar cores..."
                  value={pesquisaCor}
                  onChange={(e) => setPesquisaCor(e.target.value)}
                  className="pl-8 pr-4 py-2"
                />
              </div>
              <Button
                onClick={() => setMostrarFormCor(!mostrarFormCor)}
                className="bg-primary hover:bg-primary-dark text-white"
              >
                {mostrarFormCor ? (
                  <>
                    <X className="h-4 w-4 mr-2" /> Cancelar
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" /> Nova Cor
                  </>
                )}
              </Button>
            </div>

            {mostrarFormCor && (
              <Card className="overflow-hidden shadow-sm border-0 border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <h4 className="font-medium mb-4 text-primary flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Adicionar Nova Cor
                  </h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="nome-cor" className="text-primary flex items-center gap-2">
                          <Palette className="h-4 w-4" />
                          Nome da Cor
                        </Label>
                        <Input
                          id="nome-cor"
                          value={novaCor.nome}
                          onChange={(e) => setNovaCor({ ...novaCor, nome: e.target.value.toUpperCase() })}
                          className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                          placeholder="Ex: AZUL MARINHO"
                        />
                      </div>
                      <div>
                        <Label htmlFor="codigo-hex" className="text-primary flex items-center gap-2">
                          <Palette className="h-4 w-4" />
                          Código Hexadecimal
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id="codigo-hex"
                            type="color"
                            value={novaCor.codigo_hex || "#000000"}
                            onChange={(e) => setNovaCor({ ...novaCor, codigo_hex: e.target.value })}
                            className="w-12 p-1 h-10"
                          />
                          <Input
                            value={novaCor.codigo_hex || "#000000"}
                            onChange={(e) => setNovaCor({ ...novaCor, codigo_hex: e.target.value })}
                            className="flex-1"
                            maxLength={7}
                          />
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleAdicionarCor}
                      className="w-full bg-primary hover:bg-primary-dark text-white transition-colors"
                      disabled={isLoading || !novaCor.nome}
                    >
                      <Plus className="h-4 w-4 mr-2" /> {isLoading ? "Adicionando..." : "Adicionar Cor"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {isLoading && cores.length === 0 ? (
              <div className="text-center py-8">Carregando cores...</div>
            ) : coresFiltradas.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {pesquisaCor ? "Nenhuma cor encontrada para esta pesquisa." : "Nenhuma cor cadastrada."}
              </div>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => ordenarCores("nome")}
                      >
                        <div className="flex items-center gap-1">
                          Nome
                          {ordenacaoCor.coluna === "nome" &&
                            (ordenacaoCor.direcao === "asc" ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            ))}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => ordenarCores("codigo_hex")}
                      >
                        <div className="flex items-center gap-1">
                          Código Hex
                          {ordenacaoCor.coluna === "codigo_hex" &&
                            (ordenacaoCor.direcao === "asc" ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            ))}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Visualização
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {coresFiltradas.map((cor) => (
                      <tr key={cor.id} className="hover:bg-gray-50">
                        {editandoCorId === cor.id && corEditando ? (
                          <td colSpan={4} className="px-4 py-3">
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label
                                    htmlFor={`edit-nome-${cor.id}`}
                                    className="text-primary flex items-center gap-2"
                                  >
                                    <Palette className="h-4 w-4" />
                                    Nome da Cor
                                  </Label>
                                  <Input
                                    id={`edit-nome-${cor.id}`}
                                    value={corEditando.nome}
                                    onChange={(e) =>
                                      setCorEditando({
                                        ...corEditando,
                                        nome: e.target.value.toUpperCase(),
                                      })
                                    }
                                    className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                                  />
                                </div>
                                <div>
                                  <Label
                                    htmlFor={`edit-hex-${cor.id}`}
                                    className="text-primary flex items-center gap-2"
                                  >
                                    <Palette className="h-4 w-4" />
                                    Código Hexadecimal
                                  </Label>
                                  <div className="flex gap-2">
                                    <Input
                                      id={`edit-hex-${cor.id}`}
                                      type="color"
                                      value={corEditando.codigo_hex || "#000000"}
                                      onChange={(e) =>
                                        setCorEditando({
                                          ...corEditando,
                                          codigo_hex: e.target.value,
                                        })
                                      }
                                      className="w-12 p-1 h-10"
                                    />
                                    <Input
                                      value={corEditando.codigo_hex || "#000000"}
                                      onChange={(e) =>
                                        setCorEditando({
                                          ...corEditando,
                                          codigo_hex: e.target.value,
                                        })
                                      }
                                      className="flex-1"
                                      maxLength={7}
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  onClick={cancelarEdicaoCor}
                                  className="text-gray-500 hover:text-gray-700"
                                >
                                  <X className="h-4 w-4 mr-2" /> Cancelar
                                </Button>
                                <Button
                                  onClick={salvarEdicaoCor}
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
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{cor.nome}</div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{cor.codigo_hex || "—"}</div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div
                                className="w-8 h-8 rounded-full border border-gray-300"
                                style={{ backgroundColor: cor.codigo_hex || "#000000" }}
                                title={cor.nome}
                              ></div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => iniciarEdicaoCor(cor)}
                                  className="h-8 w-8 text-primary hover:text-primary-dark hover:bg-primary/10"
                                  disabled={isLoading}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoverCor(cor.id)}
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
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Aba de Tecidos */}
        <TabsContent value="tecidos" className="space-y-4 pt-4">
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-center">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Pesquisar tecidos..."
                  value={pesquisaTecido}
                  onChange={(e) => setPesquisaTecido(e.target.value)}
                  className="pl-8 pr-4 py-2"
                />
              </div>
              <Button
                onClick={() => setMostrarFormTecido(!mostrarFormTecido)}
                className="bg-primary hover:bg-primary-dark text-white"
              >
                {mostrarFormTecido ? (
                  <>
                    <X className="h-4 w-4 mr-2" /> Cancelar
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" /> Novo Tecido
                  </>
                )}
              </Button>
            </div>

            {mostrarFormTecido && (
              <Card className="overflow-hidden shadow-sm border-0 border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <h4 className="font-medium mb-4 text-primary flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Adicionar Novo Tecido
                  </h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="nome-tecido" className="text-primary flex items-center gap-2">
                          <Shirt className="h-4 w-4" />
                          Nome do Tecido
                        </Label>
                        <Input
                          id="nome-tecido"
                          value={novoTecido.nome}
                          onChange={(e) => setNovoTecido({ ...novoTecido, nome: e.target.value.toUpperCase() })}
                          className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                          placeholder="Ex: BRIM"
                        />
                      </div>
                      <div>
                        <Label htmlFor="composicao" className="text-primary flex items-center gap-2">
                          <Shirt className="h-4 w-4" />
                          Composição
                        </Label>
                        <Input
                          id="composicao"
                          value={novoTecido.composicao}
                          onChange={(e) => setNovoTecido({ ...novoTecido, composicao: e.target.value.toUpperCase() })}
                          className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                          placeholder="Ex: 100% ALGODÃO"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleAdicionarTecido}
                      className="w-full bg-primary hover:bg-primary-dark text-white transition-colors"
                      disabled={isLoading || !novoTecido.nome || !novoTecido.composicao}
                    >
                      <Plus className="h-4 w-4 mr-2" /> {isLoading ? "Adicionando..." : "Adicionar Tecido"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {isLoading && tecidos.length === 0 ? (
              <div className="text-center py-8">Carregando tecidos...</div>
            ) : tecidosFiltrados.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {pesquisaTecido ? "Nenhum tecido encontrado para esta pesquisa." : "Nenhum tecido cadastrado."}
              </div>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => ordenarTecidos("nome")}
                      >
                        <div className="flex items-center gap-1">
                          Nome
                          {ordenacaoTecido.coluna === "nome" &&
                            (ordenacaoTecido.direcao === "asc" ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            ))}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => ordenarTecidos("composicao")}
                      >
                        <div className="flex items-center gap-1">
                          Composição
                          {ordenacaoTecido.coluna === "composicao" &&
                            (ordenacaoTecido.direcao === "asc" ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            ))}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tecidosFiltrados.map((tecido) => (
                      <tr key={tecido.id} className="hover:bg-gray-50">
                        {editandoTecidoId === tecido.id && tecidoEditando ? (
                          <td colSpan={3} className="px-4 py-3">
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label
                                    htmlFor={`edit-nome-${tecido.id}`}
                                    className="text-primary flex items-center gap-2"
                                  >
                                    <Shirt className="h-4 w-4" />
                                    Nome do Tecido
                                  </Label>
                                  <Input
                                    id={`edit-nome-${tecido.id}`}
                                    value={tecidoEditando.nome}
                                    onChange={(e) =>
                                      setTecidoEditando({
                                        ...tecidoEditando,
                                        nome: e.target.value.toUpperCase(),
                                      })
                                    }
                                    className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                                  />
                                </div>
                                <div>
                                  <Label
                                    htmlFor={`edit-composicao-${tecido.id}`}
                                    className="text-primary flex items-center gap-2"
                                  >
                                    <Shirt className="h-4 w-4" />
                                    Composição
                                  </Label>
                                  <Input
                                    id={`edit-composicao-${tecido.id}`}
                                    value={tecidoEditando.composicao}
                                    onChange={(e) =>
                                      setTecidoEditando({
                                        ...tecidoEditando,
                                        composicao: e.target.value.toUpperCase(),
                                      })
                                    }
                                    className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                                  />
                                </div>
                              </div>

                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  onClick={cancelarEdicaoTecido}
                                  className="text-gray-500 hover:text-gray-700"
                                >
                                  <X className="h-4 w-4 mr-2" /> Cancelar
                                </Button>
                                <Button
                                  onClick={salvarEdicaoTecido}
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
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{tecido.nome}</div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{tecido.composicao}</div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => iniciarEdicaoTecido(tecido)}
                                  className="h-8 w-8 text-primary hover:text-primary-dark hover:bg-primary/10"
                                  disabled={isLoading}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoverTecido(tecido.id)}
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
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
