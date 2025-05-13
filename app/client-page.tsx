"use client"

import { useState, useEffect } from "react"
import { GeradorOrcamento } from "@/components/gerador-orcamento"

export default function ClientPage() {
  const [abaAtiva, setAbaAtiva] = useState("orcamento")
  const [criandoNovoOrcamento, setCriandoNovoOrcamento] = useState(false)

  // Check for hash in URL on initial load
  useEffect(() => {
    const hash = window.location.hash.replace("#", "")
    if (hash) {
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
