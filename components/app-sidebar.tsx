"use client"

import { useEffect, useState } from "react"
import { FileText, Users, ShoppingBag, Save, Trash2, Table, Plus, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AppSidebarProps {
  abaAtiva: string
  setAbaAtiva: (aba: string) => void
  criandoNovoOrcamento: boolean
  criarNovoOrcamento: () => void
}

export function AppSidebar({ abaAtiva, setAbaAtiva, criandoNovoOrcamento, criarNovoOrcamento }: AppSidebarProps) {
  const [expandido, setExpandido] = useState(true)

  useEffect(() => {
    window.history.pushState({}, "", `#${abaAtiva}`)
  }, [abaAtiva])

  return (
    <div
      className={`h-full ${expandido ? "w-64" : "w-20"} bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out relative`}
    >
      <button
        onClick={() => setExpandido(!expandido)}
        className="absolute -right-4 top-20 bg-white border border-gray-200 rounded-full p-2 shadow-md z-10 hover:bg-gray-50"
        aria-label={expandido ? "Recolher menu" : "Expandir menu"}
      >
        {expandido ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>

      <div className="h-16 border-b border-gray-200 flex items-center px-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-md">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 2L4 5v14.5c0 .83.67 1.5 1.5 1.5h13c.83 0 1.5-.67 1.5-1.5V5l-8-3z"
                fill="white"
                stroke="white"
                strokeWidth="1.5"
              />
              <path
                d="M12 6.5c-1.93 0-3.5 1.57-3.5 3.5v1.5h7v-1.5c0-1.93-1.57-3.5-3.5-3.5z"
                fill="#0f4c81"
                stroke="#0f4c81"
                strokeWidth="0.5"
              />
              <path
                d="M12 14.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z"
                fill="#0f4c81"
                stroke="#0f4c81"
                strokeWidth="0.5"
              />
            </svg>
          </div>
          {expandido && (
            <div>
              <h1 className="text-lg font-bold text-primary tracking-tight">ONEBASE</h1>
              <p className="text-xs text-gray-500">Uniformes Industriais</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-6">
          {expandido ? (
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Orçamentos</h2>
          ) : (
            <div className="flex justify-center mb-3">
              <FileText className="h-5 w-5 text-gray-500" />
            </div>
          )}
          <div className="space-y-2">
            <Button
              variant="ghost"
              className={`w-full ${expandido ? "justify-start" : "justify-center"}`}
              onClick={() => {
                criarNovoOrcamento()
                setAbaAtiva("orcamento")
              }}
            >
              <Plus className={`${expandido ? "mr-2" : ""} h-4 w-4`} />
              {expandido && <span>Novo Orçamento</span>}
            </Button>

            <button
              onClick={() => setAbaAtiva("orcamento")}
              className={`w-full flex items-center ${expandido ? "px-3" : "justify-center px-2"} py-2.5 text-sm rounded-md transition-colors ${
                abaAtiva === "orcamento" ? "bg-primary text-white font-medium" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <FileText className={`h-5 w-5 ${expandido ? "mr-3" : ""}`} />
              {expandido && <span>Edição Orçamento</span>}
            </button>

            <button
              onClick={() => setAbaAtiva("orcamentos")}
              className={`w-full flex items-center ${expandido ? "px-3" : "justify-center px-2"} py-2.5 text-sm rounded-md transition-colors ${
                abaAtiva === "orcamentos" ? "bg-primary text-white font-medium" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Save className={`h-5 w-5 ${expandido ? "mr-3" : ""}`} />
              {expandido && <span>Orçamentos Salvos</span>}
            </button>

            <button
              onClick={() => setAbaAtiva("produtos-tabela")}
              className={`w-full flex items-center ${expandido ? "px-3" : "justify-center px-2"} py-2.5 text-sm rounded-md transition-colors ${
                abaAtiva === "produtos-tabela" ? "bg-primary text-white font-medium" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Table className={`h-5 w-5 ${expandido ? "mr-3" : ""}`} />
              {expandido && <span>Tabela de Produtos</span>}
            </button>
          </div>
        </div>

        <div>
          {expandido ? (
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Cadastros</h2>
          ) : (
            <div className="flex justify-center mb-3">
              <Users className="h-5 w-5 text-gray-500" />
            </div>
          )}
          <div className="space-y-2">
            <button
              onClick={() => setAbaAtiva("clientes")}
              className={`w-full flex items-center ${expandido ? "px-3" : "justify-center px-2"} py-2.5 text-sm rounded-md transition-colors ${
                abaAtiva === "clientes" ? "bg-primary text-white font-medium" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Users className={`h-5 w-5 ${expandido ? "mr-3" : ""}`} />
              {expandido && <span>Clientes</span>}
            </button>

            <button
              onClick={() => setAbaAtiva("produtos")}
              className={`w-full flex items-center ${expandido ? "px-3" : "justify-center px-2"} py-2.5 text-sm rounded-md transition-colors ${
                abaAtiva === "produtos" ? "bg-primary text-white font-medium" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <ShoppingBag className={`h-5 w-5 ${expandido ? "mr-3" : ""}`} />
              {expandido && <span>Produtos</span>}
            </button>

            <button
              onClick={() => setAbaAtiva("lixeira")}
              className={`w-full flex items-center ${expandido ? "px-3" : "justify-center px-2"} py-2.5 text-sm rounded-md transition-colors ${
                abaAtiva === "lixeira" ? "bg-red-500 text-white font-medium" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Trash2 className={`h-5 w-5 ${expandido ? "mr-3" : ""}`} />
              {expandido && <span>Lixeira</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
