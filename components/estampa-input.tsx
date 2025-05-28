"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, X } from "lucide-react"
import type { Estampa } from "@/types/types"

// Helper function to generate UUID
const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

interface EstampaInputProps {
  estampas?: Estampa[]
  onChange: (estampas: Estampa[]) => void
}

export const EstampaInput = ({ estampas = [], onChange }: EstampaInputProps) => {
  // Função para gerar um UUID válido em vez de um ID personalizado
  const generateId = () => {
    return generateUUID()
  }

  // Adicionar uma nova estampa
  const adicionarEstampa = () => {
    const novaEstampa: Estampa = {
      id: generateId(),
      posicao: undefined,
      tipo: undefined,
      largura: undefined,
    }
    onChange([...estampas, novaEstampa])
  }

  // Remover uma estampa
  const removerEstampa = (id: string) => {
    onChange(estampas.filter((estampa) => estampa.id !== id))
  }

  // Atualizar uma estampa específica
  const atualizarEstampa = (id: string, campo: string, valor: string | number) => {
    onChange(estampas.map((estampa) => (estampa.id === id ? { ...estampa, [campo]: valor } : estampa)))
  }

  const posicoes = [
    "Peito esquerdo",
    "Peito direito",
    "Costas",
    "Bolso esquerdo",
    "Bolso direito",
    "Manga esquerda",
    "Manga direita",
  ]
  const tipos = ["Bordado", "Silk", "DTF", "Sublimação"]

  return (
    <div className="space-y-2">
      {estampas.map((estampa, index) => (
        <div key={estampa.id} className="border rounded p-2 bg-white relative text-xs">
          <button
            type="button"
            onClick={() => removerEstampa(estampa.id!)}
            className="absolute top-1 right-1 text-gray-500 hover:text-red-500 bg-white rounded-full p-0.5 shadow-sm"
          >
            <X className="h-3 w-3" />
          </button>

          <h5 className="font-medium mb-2 text-primary text-xs">Arte {index + 1}</h5>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <Select
                value={estampa.posicao || ""}
                onValueChange={(value) => atualizarEstampa(estampa.id!, "posicao", value)}
              >
                <SelectTrigger className="h-6 text-xs border-gray-300 focus:border-primary">
                  <SelectValue placeholder="Posição" />
                </SelectTrigger>
                <SelectContent>
                  {posicoes.map((posicao) => (
                    <SelectItem key={posicao} value={posicao} className="text-xs">
                      {posicao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select
                value={estampa.tipo || ""}
                onValueChange={(value) => atualizarEstampa(estampa.id!, "tipo", value)}
              >
                <SelectTrigger className="h-6 text-xs border-gray-300 focus:border-primary">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tipos.map((tipo) => (
                    <SelectItem key={tipo} value={tipo} className="text-xs">
                      {tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Input
                type="number"
                value={estampa.largura || ""}
                onChange={(e) => atualizarEstampa(estampa.id!, "largura", Number(e.target.value))}
                className="h-6 text-xs border-gray-300 focus:border-primary"
                placeholder="Largura (cm)"
                min="0"
                step="0.5"
              />
            </div>
          </div>
        </div>
      ))}

      <Button
        type="button"
        onClick={adicionarEstampa}
        variant="outline"
        size="sm"
        className="w-full h-6 text-xs border-dashed border-2 hover:bg-accent/20"
      >
        <Plus className="h-3 w-3 mr-1" /> Adicionar Arte
      </Button>
    </div>
  )
}
