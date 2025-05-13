"use client"

import { useEffect } from "react"
import { FileText, Users, ShoppingBag, Save, PlusCircle, Trash2, Table } from "lucide-react"

interface AppSidebarProps {
  abaAtiva: string
  setAbaAtiva: (aba: string) => void
  criandoNovoOrcamento: boolean
  criarNovoOrcamento: () => void
}

export function AppSidebar({ abaAtiva, setAbaAtiva, criandoNovoOrcamento, criarNovoOrcamento }: AppSidebarProps) {
  useEffect(() => {
    window.history.pushState({}, "", `#${abaAtiva}`)
  }, [abaAtiva])

  return (
    <div className="h-full w-64 bg-white border-r border-gray-200 flex flex-col">
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
          <div>
            <h1 className="text-lg font-bold text-primary tracking-tight">ONEBASE</h1>
            <p className="text-xs text-gray-500">Uniformes Industriais</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Orçamentos</h2>
          <div className="space-y-2">
            <button
              onClick={criarNovoOrcamento}
              className="w-full flex items-center px-3 py-2.5 text-sm rounded-md text-secondary hover:bg-gray-100 transition-colors"
            >
              <PlusCircle className="h-5 w-5 mr-3" />
              <span>Criar Orçamento</span>
            </button>

            <button
              onClick={() => setAbaAtiva("orcamento")}
              className={`w-full flex items-center px-3 py-2.5 text-sm rounded-md transition-colors ${
                abaAtiva === "orcamento" ? "bg-primary text-white font-medium" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <FileText className="h-5 w-5 mr-3" />
              <span>Edição Orçamento</span>
            </button>

            <button
              onClick={() => setAbaAtiva("orcamentos")}
              className={`w-full flex items-center px-3 py-2.5 text-sm rounded-md transition-colors ${
                abaAtiva === "orcamentos" ? "bg-primary text-white font-medium" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Save className="h-5 w-5 mr-3" />
              <span>Orçamentos Salvos</span>
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Cadastros</h2>
          <div className="space-y-2">
            <button
              onClick={() => setAbaAtiva("clientes")}
              className={`w-full flex items-center px-3 py-2.5 text-sm rounded-md transition-colors ${
                abaAtiva === "clientes" ? "bg-primary text-white font-medium" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Users className="h-5 w-5 mr-3" />
              <span>Clientes</span>
            </button>

            <button
              onClick={() => setAbaAtiva("produtos")}
              className={`w-full flex items-center px-3 py-2.5 text-sm rounded-md transition-colors ${
                abaAtiva === "produtos" ? "bg-primary text-white font-medium" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <ShoppingBag className="h-5 w-5 mr-3" />
              <span>Produtos</span>
            </button>

            <button
              onClick={() => setAbaAtiva("produtos-tabela")}
              className={`w-full flex items-center px-3 py-2.5 text-sm rounded-md transition-colors ${
                abaAtiva === "produtos-tabela" ? "bg-primary text-white font-medium" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Table className="h-5 w-5 mr-3" />
              <span>Tabela de Produtos</span>
            </button>

            <button
              onClick={() => setAbaAtiva("lixeira")}
              className={`w-full flex items-center px-3 py-2.5 text-sm rounded-md transition-colors ${
                abaAtiva === "lixeira" ? "bg-red-500 text-white font-medium" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Trash2 className="h-5 w-5 mr-3" />
              <span>Lixeira</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
