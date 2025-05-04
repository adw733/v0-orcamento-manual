import type { Metadata } from "next"
import GeradorOrcamento from "@/components/gerador-orcamento"

export const metadata: Metadata = {
  title: "Gerador de Orçamento e Ficha Técnica",
  description: "Sistema para geração de orçamentos e fichas técnicas de uniformes industriais",
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-primary text-white py-4 shadow-md">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-md">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 2L4 5v14.5c0 .83.67 1.5 1.5 1.5h13c.83 0 1.5-.67 1.5-1.5V5l-8-3z"
                  fill="#0f4c81"
                  stroke="#0f4c81"
                  strokeWidth="1.5"
                />
                <path
                  d="M12 6.5c-1.93 0-3.5 1.57-3.5 3.5v1.5h7v-1.5c0-1.93-1.57-3.5-3.5-3.5z"
                  fill="white"
                  stroke="white"
                  strokeWidth="0.5"
                />
                <path
                  d="M12 14.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z"
                  fill="white"
                  stroke="white"
                  strokeWidth="0.5"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">ONEBASE</h1>
              <p className="text-xs opacity-80">Uniformes Industriais</p>
            </div>
          </div>
          <div className="text-sm">
            <p>Versão 1.0</p>
          </div>
        </div>
      </header>
      <GeradorOrcamento />
    </div>
  )
}
