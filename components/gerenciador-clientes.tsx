"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Trash2, Pencil, Save, X, Building, Phone, Mail, User } from "lucide-react"
import type { Cliente } from "@/types/types"
import { clienteService } from "@/services/cliente-service"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

interface GerenciadorClientesProps {
  clientes: Cliente[]
  adicionarCliente: (cliente: Cliente) => void
  setClientes: (clientes: Cliente[]) => void
}

export default function GerenciadorClientes({ clientes, adicionarCliente, setClientes }: GerenciadorClientesProps) {
  const [novoCliente, setNovoCliente] = useState<Partial<Cliente>>({
    nome: "",
    cnpj: "",
    endereco: "",
    telefone: "",
    email: "",
    contato: "",
  })

  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const { toast } = useToast()

  useEffect(() => {
    carregarClientes()
  }, [])

  const carregarClientes = async () => {
    setIsLoading(true)
    try {
      const clientesCarregados = await clienteService.getAll()
      setClientes(clientesCarregados)
    } catch (error) {
      console.error("Erro ao carregar clientes:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os clientes.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdicionarCliente = async () => {
    if (novoCliente.nome) {
      setIsSaving(true)
      try {
        const clienteCriado = await clienteService.create(novoCliente as Omit<Cliente, "id">)
        adicionarCliente(clienteCriado)
        setNovoCliente({
          nome: "",
          cnpj: "",
          endereco: "",
          telefone: "",
          email: "",
          contato: "",
        })
        toast({
          title: "Sucesso",
          description: "Cliente adicionado com sucesso!",
        })
      } catch (error) {
        console.error("Erro ao adicionar cliente:", error)
        toast({
          title: "Erro",
          description: "Não foi possível adicionar o cliente.",
          variant: "destructive",
        })
      } finally {
        setIsSaving(false)
      }
    }
  }

  const handleRemoverCliente = async (id: string) => {
    if (confirm("Tem certeza que deseja remover este cliente?")) {
      try {
        await clienteService.delete(id)
        setClientes(clientes.filter((cliente) => cliente.id !== id))
        toast({
          title: "Sucesso",
          description: "Cliente removido com sucesso!",
        })
      } catch (error) {
        console.error("Erro ao remover cliente:", error)
        toast({
          title: "Erro",
          description: "Não foi possível remover o cliente.",
          variant: "destructive",
        })
      }
    }
  }

  const iniciarEdicao = (cliente: Cliente) => {
    setEditandoId(cliente.id)
    setClienteEditando({ ...cliente })
  }

  const cancelarEdicao = () => {
    setEditandoId(null)
    setClienteEditando(null)
  }

  const salvarEdicao = async () => {
    if (clienteEditando) {
      setIsSaving(true)
      try {
        const clienteAtualizado = await clienteService.update(clienteEditando)
        setClientes(clientes.map((cliente) => (cliente.id === clienteAtualizado.id ? clienteAtualizado : cliente)))
        setEditandoId(null)
        setClienteEditando(null)
        toast({
          title: "Sucesso",
          description: "Cliente atualizado com sucesso!",
        })
      } catch (error) {
        console.error("Erro ao atualizar cliente:", error)
        toast({
          title: "Erro",
          description: "Não foi possível atualizar o cliente.",
          variant: "destructive",
        })
      } finally {
        setIsSaving(false)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-primary flex items-center gap-2">
            <span className="bg-primary text-white p-1 rounded-md text-xs">CLIENTES</span>
            Gerenciar Clientes
          </h3>
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden shadow-sm border-0">
              <CardContent className="p-0">
                <div className="p-4">
                  <Skeleton className="h-24 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-primary flex items-center gap-2">
          <span className="bg-primary text-white p-1 rounded-md text-xs">CLIENTES</span>
          Gerenciar Clientes
        </h3>
        <span className="text-sm text-gray-500">{clientes.length} clientes cadastrados</span>
      </div>

      <div className="space-y-4">
        {clientes.map((cliente) => (
          <Card key={cliente.id} className="overflow-hidden shadow-sm border-0 hover:shadow-md transition-shadow">
            <CardContent className="p-0">
              {editandoId === cliente.id && clienteEditando ? (
                <div className="p-4 space-y-4 bg-accent/50">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`edit-nome-${cliente.id}`} className="text-primary flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Nome
                      </Label>
                      <Input
                        id={`edit-nome-${cliente.id}`}
                        value={clienteEditando.nome}
                        onChange={(e) =>
                          setClienteEditando({
                            ...clienteEditando,
                            nome: e.target.value,
                          })
                        }
                        className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`edit-cnpj-${cliente.id}`} className="text-primary flex items-center gap-2">
                        <span className="bg-primary text-white p-1 rounded-md text-xs">CNPJ</span>
                      </Label>
                      <Input
                        id={`edit-cnpj-${cliente.id}`}
                        value={clienteEditando.cnpj}
                        onChange={(e) =>
                          setClienteEditando({
                            ...clienteEditando,
                            cnpj: e.target.value,
                          })
                        }
                        className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor={`edit-endereco-${cliente.id}`} className="text-primary">
                      Endereço
                    </Label>
                    <Input
                      id={`edit-endereco-${cliente.id}`}
                      value={clienteEditando.endereco}
                      onChange={(e) =>
                        setClienteEditando({
                          ...clienteEditando,
                          endereco: e.target.value,
                        })
                      }
                      className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`edit-telefone-${cliente.id}`} className="text-primary flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Telefone
                      </Label>
                      <Input
                        id={`edit-telefone-${cliente.id}`}
                        value={clienteEditando.telefone}
                        onChange={(e) =>
                          setClienteEditando({
                            ...clienteEditando,
                            telefone: e.target.value,
                          })
                        }
                        className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`edit-email-${cliente.id}`} className="text-primary flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </Label>
                      <Input
                        id={`edit-email-${cliente.id}`}
                        value={clienteEditando.email}
                        onChange={(e) =>
                          setClienteEditando({
                            ...clienteEditando,
                            email: e.target.value,
                          })
                        }
                        className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor={`edit-contato-${cliente.id}`} className="text-primary flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Contato
                    </Label>
                    <Input
                      id={`edit-contato-${cliente.id}`}
                      value={clienteEditando.contato}
                      onChange={(e) =>
                        setClienteEditando({
                          ...clienteEditando,
                          contato: e.target.value,
                        })
                      }
                      className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={cancelarEdicao} className="text-gray-500 hover:text-gray-700">
                      <X className="h-4 w-4 mr-2" /> Cancelar
                    </Button>
                    <Button
                      onClick={salvarEdicao}
                      className="bg-primary hover:bg-primary-dark text-white"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>Salvando...</>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" /> Salvar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary text-white p-2 rounded-full">
                        <Building className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{cliente.nome}</h4>
                        <p className="text-sm text-gray-500">{cliente.cnpj}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => iniciarEdicao(cliente)}
                        className="h-8 w-8 text-primary hover:text-primary-dark hover:bg-primary/10"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoverCliente(cliente.id)}
                        className="h-8 w-8 text-gray-500 hover:text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 text-sm grid grid-cols-1 md:grid-cols-2 gap-2 bg-accent/50 p-3 rounded-md">
                    <p className="flex items-center gap-2">
                      <span className="text-gray-500">Endereço:</span> {cliente.endereco}
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-gray-500" /> {cliente.telefone}
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="h-3 w-3 text-gray-500" /> {cliente.email}
                    </p>
                    <p className="flex items-center gap-2">
                      <User className="h-3 w-3 text-gray-500" /> {cliente.contato}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden shadow-sm border-0 border-t-4 border-t-secondary">
        <CardContent className="p-4">
          <h4 className="font-medium mb-4 text-secondary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Novo Cliente
          </h4>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome" className="text-primary flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Nome
                </Label>
                <Input
                  id="nome"
                  value={novoCliente.nome}
                  onChange={(e) => setNovoCliente({ ...novoCliente, nome: e.target.value })}
                  className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <Label htmlFor="cnpj" className="text-primary flex items-center gap-2">
                  <span className="bg-primary text-white p-1 rounded-md text-xs">CNPJ</span>
                </Label>
                <Input
                  id="cnpj"
                  value={novoCliente.cnpj}
                  onChange={(e) => setNovoCliente({ ...novoCliente, cnpj: e.target.value })}
                  className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="endereco" className="text-primary">
                Endereço
              </Label>
              <Input
                id="endereco"
                value={novoCliente.endereco}
                onChange={(e) => setNovoCliente({ ...novoCliente, endereco: e.target.value })}
                className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="telefone" className="text-primary flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Telefone
                </Label>
                <Input
                  id="telefone"
                  value={novoCliente.telefone}
                  onChange={(e) => setNovoCliente({ ...novoCliente, telefone: e.target.value })}
                  className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-primary flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  value={novoCliente.email}
                  onChange={(e) => setNovoCliente({ ...novoCliente, email: e.target.value })}
                  className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="contato" className="text-primary flex items-center gap-2">
                <User className="h-4 w-4" />
                Contato
              </Label>
              <Input
                id="contato"
                value={novoCliente.contato}
                onChange={(e) => setNovoCliente({ ...novoCliente, contato: e.target.value })}
                className="border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <Button
              onClick={handleAdicionarCliente}
              className="w-full bg-secondary hover:bg-secondary-dark text-white transition-colors"
              disabled={isSaving || !novoCliente.nome}
            >
              {isSaving ? (
                <>Adicionando...</>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" /> Adicionar Cliente
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
