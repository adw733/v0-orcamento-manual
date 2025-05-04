"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Save, Upload, AlertCircle, Check } from "lucide-react"
import { supabase } from "@/lib/supabase"

// Definir a interface para os dados da empresa
export interface DadosEmpresa {
  id?: string
  nome: string
  cnpj: string
  email: string
  telefone: string
  endereco: string
  logo_url?: string
  site?: string
  slogan?: string
}

export default function GerenciadorEmpresa() {
  const [dadosEmpresa, setDadosEmpresa] = useState<DadosEmpresa>({
    nome: "",
    cnpj: "",
    email: "",
    telefone: "",
    endereco: "",
    logo_url: "",
    site: "",
    slogan: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ visivel: boolean; sucesso: boolean; mensagem: string }>({
    visivel: false,
    sucesso: false,
    mensagem: "",
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  // Carregar dados da empresa ao montar o componente
  useEffect(() => {
    carregarDadosEmpresa()
  }, [])

  // Esconder feedback após 3 segundos
  useEffect(() => {
    if (feedback.visivel) {
      const timer = setTimeout(() => {
        setFeedback((prev) => ({ ...prev, visivel: false }))
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [feedback.visivel])

  const carregarDadosEmpresa = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase.from("empresa").select("*").single()

      if (error) {
        if (error.code === "PGRST116") {
          // Não encontrou registros, provavelmente é a primeira vez
          console.log("Nenhum dado de empresa encontrado. Criando novo registro.")
          return
        }
        throw error
      }

      if (data) {
        setDadosEmpresa(data)
        if (data.logo_url) {
          setLogoPreview(data.logo_url)
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados da empresa:", error)
      setFeedback({
        visivel: true,
        sucesso: false,
        mensagem: "Erro ao carregar dados da empresa. Tente novamente.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setDadosEmpresa((prev) => ({ ...prev, [name]: value }))
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setLogoFile(file)

      // Criar preview da imagem
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogoPreview(event.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile) return dadosEmpresa.logo_url || null

    try {
      // Criar um nome de arquivo único baseado no timestamp
      const fileExt = logoFile.name.split(".").pop()
      const fileName = `logo-${Date.now()}.${fileExt}`
      const filePath = `logos/${fileName}`

      // Upload do arquivo para o bucket 'logos'
      const { error: uploadError } = await supabase.storage.from("logos").upload(filePath, logoFile)

      if (uploadError) {
        throw uploadError
      }

      // Obter a URL pública do arquivo
      const { data } = supabase.storage.from("logos").getPublicUrl(filePath)
      return data.publicUrl
    } catch (error) {
      console.error("Erro ao fazer upload do logo:", error)
      setFeedback({
        visivel: true,
        sucesso: false,
        mensagem: "Erro ao fazer upload do logo. Tente novamente.",
      })
      return null
    }
  }

  const salvarDadosEmpresa = async () => {
    try {
      setIsLoading(true)

      // Fazer upload do logo se houver um novo arquivo
      let logoUrl = dadosEmpresa.logo_url
      if (logoFile) {
        const novaLogoUrl = await uploadLogo()
        if (novaLogoUrl) {
          logoUrl = novaLogoUrl
        }
      }

      const dadosAtualizados = {
        ...dadosEmpresa,
        logo_url: logoUrl,
      }

      // Verificar se já existe um registro
      const { data: existingData, error: checkError } = await supabase.from("empresa").select("id").single()

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError
      }

      let result
      if (existingData) {
        // Atualizar registro existente
        result = await supabase.from("empresa").update(dadosAtualizados).eq("id", existingData.id)
      } else {
        // Inserir novo registro
        result = await supabase.from("empresa").insert(dadosAtualizados)
      }

      if (result.error) {
        throw result.error
      }

      setFeedback({
        visivel: true,
        sucesso: true,
        mensagem: "Dados da empresa salvos com sucesso!",
      })

      // Recarregar dados para garantir que temos as informações mais atualizadas
      carregarDadosEmpresa()
    } catch (error) {
      console.error("Erro ao salvar dados da empresa:", error)
      setFeedback({
        visivel: true,
        sucesso: false,
        mensagem: "Erro ao salvar dados da empresa. Tente novamente.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-primary">Dados da Empresa</h2>
          <p className="text-gray-500">Configure as informações da sua empresa que aparecerão nos orçamentos</p>
        </div>
      </div>

      {/* Feedback de salvamento */}
      {feedback.visivel && (
        <div
          className={`p-4 rounded-md ${
            feedback.sucesso ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
          } flex items-center gap-2 animate-in fade-in slide-in-from-top-5 duration-300`}
        >
          {feedback.sucesso ? <Check className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <p>{feedback.mensagem}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
            <CardDescription>Dados principais da empresa que aparecerão nos documentos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Empresa</Label>
              <Input
                id="nome"
                name="nome"
                value={dadosEmpresa.nome}
                onChange={handleInputChange}
                placeholder="Ex: OneBase Uniformes"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                name="cnpj"
                value={dadosEmpresa.cnpj}
                onChange={handleInputChange}
                placeholder="Ex: 12.345.678/0001-90"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={dadosEmpresa.email}
                onChange={handleInputChange}
                placeholder="Ex: contato@onebase.com.br"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                name="telefone"
                value={dadosEmpresa.telefone}
                onChange={handleInputChange}
                placeholder="Ex: (11) 4321-1234"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="site">Site</Label>
              <Input
                id="site"
                name="site"
                value={dadosEmpresa.site || ""}
                onChange={handleInputChange}
                placeholder="Ex: www.onebase.com.br"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slogan">Slogan</Label>
              <Input
                id="slogan"
                name="slogan"
                value={dadosEmpresa.slogan || ""}
                onChange={handleInputChange}
                placeholder="Ex: Uniformes Industriais"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Endereço e Logo</CardTitle>
            <CardDescription>Endereço completo e logotipo da empresa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço Completo</Label>
              <Textarea
                id="endereco"
                name="endereco"
                value={dadosEmpresa.endereco}
                onChange={handleInputChange}
                placeholder="Ex: Rua Exemplo, 123 - Bairro - Cidade/UF - CEP 12345-678"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo">Logo da Empresa</Label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full flex items-center gap-2 h-10"
                      onClick={() => document.getElementById("logo")?.click()}
                    >
                      <Upload className="h-4 w-4" />
                      Selecionar Logo
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Recomendado: formato PNG ou SVG com fundo transparente</p>
                </div>

                {logoPreview && (
                  <div className="w-20 h-20 border rounded-md flex items-center justify-center p-2 bg-white">
                    <img
                      src={logoPreview || "/placeholder.svg"}
                      alt="Logo Preview"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={salvarDadosEmpresa}
              disabled={isLoading}
              className="w-full flex items-center gap-2 bg-primary hover:bg-primary-dark text-white"
            >
              <Save className="h-4 w-4" />
              {isLoading ? "Salvando..." : "Salvar Dados da Empresa"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
