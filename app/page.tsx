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
                  d="M20.38 3.46L16 2L8 4L3.62 2.54C3.26 2.42 2.87 2.44 2.53 2.57C2.18 2.7 1.91 2.95 1.74 3.27C1.58 3.58 1.53 3.95 1.61 4.3C1.69 4.66 1.89 4.97 2.17 5.18L2.57 5.48V15.58C2.57 15.78 2.65 15.97 2.8 16.11C2.94 16.25 3.13 16.33 3.33 16.33C3.53 16.33 3.72 16.25 3.86 16.11C4 15.97 4.08 15.78 4.08 15.58V7.3L8 8.54V19.42C8 19.67 8.1 19.91 8.27 20.08C8.44 20.25 8.68 20.35 8.93 20.35C9.01 20.35 9.09 20.34 9.17 20.32L16.83 18.32C17.09 18.25 17.32 18.1 17.48 17.88C17.64 17.67 17.72 17.41 17.72 17.14V6.3L20.14 7.16C20.22 7.19 20.3 7.2 20.38 7.2C20.64 7.2 20.89 7.1 21.08 6.92C21.26 6.74 21.36 6.49 21.36 6.23V4.43C21.36 4.17 21.26 3.92 21.08 3.74C20.9 3.56 20.65 3.46 20.38 3.46Z"
                  fill="#0f4c81"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold">Gerador de Orçamentos</h1>
              <p className="text-xs opacity-80">Uniformes Industriais</p>
            </div>
          </div>
          <div className="text-sm">
            <p>Versão 1.0</p>
          </div>
        </div>
      </header>
      <div className="container mx-auto px-4">
        <GeradorOrcamento />
      </div>
    </div>
  )
}
