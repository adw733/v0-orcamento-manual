import type { Cliente, Produto, Tecido } from "@/types/types"
import { clientesIniciais } from "@/data/clientes"
import { produtosIniciais } from "@/data/produtos"

// Mock data for when Supabase isn't available
export const mockClientes: Cliente[] = clientesIniciais

export const mockProdutos: Produto[] = produtosIniciais

export const mockTecidos: Tecido[] = [
  { nome: "Brim Leve", composicao: "100% Algodão" },
  { nome: "Sarja", composicao: "67% Algodão, 33% Poliéster" },
  { nome: "Jeans", composicao: "100% Algodão" },
  { nome: "Brim Pesado", composicao: "100% Algodão" },
  { nome: "Rip Stop", composicao: "70% Algodão, 30% Poliéster" },
  { nome: "Oxford", composicao: "100% Poliéster" },
  { nome: "Microfibra", composicao: "65% Poliéster, 35% Algodão" },
]
