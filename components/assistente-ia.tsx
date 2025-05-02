"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Loader2, Send, Settings, X, Bot, User, Check, AlertCircle, Upload, FileText, ImageIcon } from "lucide-react"
import {
  generateWithGemini,
  processGeminiAction,
  saveGeminiApiKey,
  processFileWithGemini,
  extractTextFromPDF,
} from "@/app/actions/gemini-actions"
import type { Cliente, Produto, Orcamento } from "@/types/types"

interface AssistenteIAProps {
  clientes: Cliente[]
  produtos: Produto[]
  orcamento: Orcamento
  setClientes: (clientes: Cliente[]) => void
  setProdutos: (produtos: Produto[]) => void
  setOrcamento: (orcamento: Orcamento) => void
  setAbaAtiva: (aba: string) => void
}

export default function AssistenteIA({
  clientes,
  produtos,
  orcamento,
  setClientes,
  setProdutos,
  setOrcamento,
  setAbaAtiva,
}: AssistenteIAProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [apiKey, setApiKey] = useState("AIzaSyCTqW48OFu3BPowgrc0xtBVmvGQAvUQX5I")
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([])
  const [feedback, setFeedback] = useState<{ visible: boolean; success: boolean; message: string }>({
    visible: false,
    success: false,
    message: "",
  })
  const [isFileUploadMode, setIsFileUploadMode] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Hide feedback after 5 seconds
  useEffect(() => {
    if (feedback.visible) {
      const timer = setTimeout(() => {
        setFeedback({ ...feedback, visible: false })
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [feedback])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isFileUploadMode) {
      if (!uploadedFile) {
        setFeedback({
          visible: true,
          success: false,
          message: "Por favor, selecione um arquivo para processar.",
        })
        return
      }

      await handleFileUpload()
    } else {
      if (!prompt.trim()) return

      // Add user message
      setMessages((prev) => [...prev, { role: "user", content: prompt }])

      // Clear input
      setPrompt("")

      setIsLoading(true)

      try {
        // Generate content with Gemini - passar clientes e produtos
        const result = await generateWithGemini(prompt, clientes, produtos)

        if (result.success && result.action && result.data) {
          // Process the action
          const actionResult = await processGeminiAction(
            result.action,
            result.data,
            clientes,
            produtos,
            orcamento,
            setClientes,
            setProdutos,
            setOrcamento,
          )

          // Add assistant message
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: actionResult.success ? `✅ ${actionResult.message}` : `❌ ${actionResult.message}`,
            },
          ])

          // Show feedback
          setFeedback({
            visible: true,
            success: actionResult.success,
            message: actionResult.message,
          })

          // If it's a new orçamento and it was successful, switch to the orçamento tab
          if (result.action === "createOrcamento" && actionResult.success) {
            setAbaAtiva("orcamento")
          }
        } else {
          // Add error message
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `❌ ${result.message}`,
            },
          ])

          // Show feedback
          setFeedback({
            visible: true,
            success: false,
            message: result.message,
          })
        }
      } catch (error) {
        console.error("Erro ao processar solicitação:", error)

        // Add error message
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `❌ Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.`,
          },
        ])

        // Show feedback
        setFeedback({
          visible: true,
          success: false,
          message: "Ocorreu um erro ao processar sua solicitação.",
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadedFile(e.target.files[0])
    }
  }

  const handleFileUpload = async () => {
    if (!uploadedFile) return

    setIsLoading(true)

    try {
      // Add user message about the file upload
      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          content: `Enviando arquivo: ${uploadedFile.name} (${uploadedFile.type})`,
        },
      ])

      let fileContent = ""
      const fileType = uploadedFile.type

      // Convert file to base64 or extract text based on file type
      if (fileType.startsWith("image/")) {
        // For images, convert to base64
        fileContent = await readFileAsBase64(uploadedFile)
      } else if (fileType === "application/pdf") {
        // For PDFs, extract text
        try {
          // First try to extract text
          fileContent = await extractTextFromPDF(uploadedFile)
        } catch (error) {
          console.error("Error extracting text from PDF, falling back to base64:", error)
          // If text extraction fails, fall back to base64
          fileContent = await readFileAsBase64(uploadedFile)
        }
      } else {
        // For other file types, try to read as text
        fileContent = await readFileAsText(uploadedFile)
      }

      // Process the file with Gemini
      const result = await processFileWithGemini(fileContent, fileType, clientes, produtos)

      if (result.success && result.action && result.data) {
        // Process the action
        const actionResult = await processGeminiAction(
          result.action,
          result.data,
          clientes,
          produtos,
          orcamento,
          setClientes,
          setProdutos,
          setOrcamento,
        )

        // Add assistant message
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: actionResult.success
              ? `✅ Arquivo processado com sucesso! ${actionResult.message}`
              : `❌ ${actionResult.message}`,
          },
        ])

        // Show feedback
        setFeedback({
          visible: true,
          success: actionResult.success,
          message: actionResult.message,
        })

        // If it's a new orçamento and it was successful, switch to the orçamento tab
        if (result.action === "extractOrcamento" && actionResult.success) {
          setAbaAtiva("orcamento")
        }
      } else {
        // Add error message
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `❌ ${result.message}`,
          },
        ])

        // Show feedback
        setFeedback({
          visible: true,
          success: false,
          message: result.message,
        })
      }
    } catch (error) {
      console.error("Erro ao processar arquivo:", error)

      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `❌ Ocorreu um erro ao processar o arquivo. Por favor, tente novamente.`,
        },
      ])

      // Show feedback
      setFeedback({
        visible: true,
        success: false,
        message: `Erro ao processar arquivo: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      })
    } finally {
      setIsLoading(false)
      setUploadedFile(null)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  // Helper function to read file as base64
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // Extract the base64 part (remove the data:image/png;base64, prefix)
        const base64 = result.split(",")[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // Helper function to read file as text
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        resolve(reader.result as string)
      }
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  const handleSaveApiKey = async () => {
    setIsLoading(true)

    try {
      const result = await saveGeminiApiKey(apiKey)

      setFeedback({
        visible: true,
        success: result.success,
        message: result.message,
      })

      if (result.success) {
        setIsSettingsOpen(false)
      }
    } catch (error) {
      setFeedback({
        visible: true,
        success: false,
        message: `Erro ao salvar API key: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleFileUploadMode = () => {
    setIsFileUploadMode(!isFileUploadMode)
    setUploadedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <>
      {/* Floating button to open chat */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 rounded-full w-12 h-12 p-0 bg-primary hover:bg-primary-dark shadow-lg z-50"
        >
          <Bot className="h-6 w-6" />
        </Button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 w-96 z-50">
          <Card className="shadow-lg border-primary/20">
            <CardHeader className="bg-primary text-white py-3 px-4 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Assistente IA
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className="h-8 w-8 text-white hover:bg-primary-dark rounded-full"
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 text-white hover:bg-primary-dark rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            {/* Settings panel */}
            {isSettingsOpen && (
              <div className="p-4 border-b">
                <h3 className="font-medium mb-2 text-sm">Configurações da API</h3>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="api-key" className="text-xs text-gray-500 mb-1 block">
                      Gemini API Key
                    </label>
                    <div className="flex gap-2">
                      <Input
                        id="api-key"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="text-sm"
                        placeholder="Insira sua API key do Gemini"
                      />
                      <Button
                        onClick={handleSaveApiKey}
                        disabled={isLoading}
                        className="bg-primary hover:bg-primary-dark text-white"
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">A API key será salva no banco de dados.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="p-4 h-80 overflow-y-auto bg-gray-50">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                  <Bot className="h-12 w-12 mb-2 text-primary/50" />
                  <p className="text-sm">
                    Olá! Sou seu assistente IA. Posso ajudar a criar clientes, produtos e orçamentos.
                  </p>
                  <p className="text-xs mt-2">
                    Exemplos: "Crie um cliente chamado Empresa ABC" ou "Faça um orçamento para 10 camisas para o cliente
                    XYZ"
                  </p>
                  <p className="text-xs mt-2">
                    Você também pode enviar imagens ou PDFs de orçamentos para que eu os converta para o formato do
                    sistema.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === "user" ? "bg-primary text-white" : "bg-white border border-gray-200"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {message.role === "assistant" && <Bot className="h-5 w-5 mt-0.5 flex-shrink-0" />}
                          <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                          {message.role === "user" && <User className="h-5 w-5 mt-0.5 flex-shrink-0" />}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input */}
            <CardFooter className="p-3 border-t">
              <form onSubmit={handleSubmit} className="flex w-full gap-2 flex-col">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={toggleFileUploadMode}
                    variant="outline"
                    size="icon"
                    className={`h-10 w-10 ${isFileUploadMode ? "bg-primary/10" : ""}`}
                    title={isFileUploadMode ? "Modo de texto" : "Modo de upload de arquivo"}
                  >
                    {isFileUploadMode ? <FileText className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                  </Button>

                  {isFileUploadMode ? (
                    <div className="flex-1 relative min-w-0">
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileChange}
                        accept="image/*,application/pdf"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={isLoading}
                      />
                      <div className="flex items-center border rounded-md px-3 py-2 h-10 w-full text-sm text-gray-500">
                        <div className="flex-1 min-w-0 mr-2">
                          {uploadedFile ? (
                            <span className="block truncate">{uploadedFile.name}</span>
                          ) : (
                            <span>Selecione um arquivo...</span>
                          )}
                        </div>
                        <ImageIcon className="h-4 w-4 flex-shrink-0" />
                      </div>
                    </div>
                  ) : (
                    <Input
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Digite sua solicitação..."
                      disabled={isLoading}
                      className="flex-1"
                    />
                  )}

                  <Button
                    type="submit"
                    disabled={isLoading || (!prompt.trim() && !uploadedFile)}
                    className="bg-primary hover:bg-primary-dark text-white"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>

                {isFileUploadMode && (
                  <p className="text-xs text-gray-500 mt-1">
                    Envie uma imagem ou PDF de um orçamento para extrair as informações automaticamente.
                  </p>
                )}
              </form>
            </CardFooter>
          </Card>

          {/* Feedback toast */}
          {feedback.visible && (
            <div
              className={`mt-2 p-3 rounded-md flex items-center gap-2 text-sm animate-in fade-in slide-in-from-bottom-5 ${
                feedback.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}
            >
              {feedback.success ? (
                <Check className="h-4 w-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}
        </div>
      )}
    </>
  )
}
