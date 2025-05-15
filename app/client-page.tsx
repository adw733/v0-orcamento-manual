"use client"

import { useState, useEffect } from "react"
import { GeradorOrcamento } from "@/components/gerador-orcamento"

export default function ClientPage() {
  const [abaAtiva, setAbaAtiva] = useState("orcamentos")
  const [criandoNovoOrcamento, setCriandoNovoOrcamento] = useState(false)

  // Check for hash in URL on initial load and set it to "orcamentos" if not present
  useEffect(() => {
    const hash = window.location.hash.replace("#", "")
    if (!hash) {
      // Se não houver hash, definir como "orcamentos"
      window.location.hash = "orcamentos"
    } else {
      setAbaAtiva(hash)
    }
  }, [])

  const criarNovoOrcamento = () => {
    setCriandoNovoOrcamento(true)
    setAbaAtiva("orcamento")
  }

  return (
    <GeradorOrcamento
      abaAtiva={abaAtiva}
      setAbaAtiva={setAbaAtiva}
      criandoNovoOrcamento={criandoNovoOrcamento}
      setCriandoNovoOrcamento={setCriandoNovoOrcamento}
      criarNovoOrcamento={criarNovoOrcamento}
    />
  )
}
