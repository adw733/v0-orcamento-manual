import ClientPage from "./client-page"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Gerador de Orçamento",
  description: "Aplicativo para geração de orçamentos de uniformes",
}

export default function Home() {
  return <ClientPage />
}
