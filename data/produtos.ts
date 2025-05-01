import type { Produto } from "@/types/types"

export const produtosIniciais: Produto[] = [
  {
    id: "323e4567-e89b-12d3-a456-426614174002",
    nome: "Camisa Operacional",
    valorBase: 45.9,
    tecidos: [
      { nome: "Brim Leve", composicao: "100% Algodão" },
      { nome: "Sarja", composicao: "67% Algodão, 33% Poliéster" },
      { nome: "Jeans", composicao: "100% Algodão" },
    ],
    cores: ["Azul marinho", "Cinza", "Bege", "Preto"],
    tamanhosDisponiveis: ["PP", "P", "M", "G", "GG", "G1", "G2"],
  },
  {
    id: "423e4567-e89b-12d3-a456-426614174003",
    nome: "Calça Cargo Industrial",
    valorBase: 69.9,
    tecidos: [
      { nome: "Brim Pesado", composicao: "100% Algodão" },
      { nome: "Rip Stop", composicao: "70% Algodão, 30% Poliéster" },
    ],
    cores: ["Preto", "Caqui", "Verde oliva", "Azul marinho"],
    tamanhosDisponiveis: ["PP", "P", "M", "G", "GG", "G1", "G2", "G3", "G4"],
  },
  {
    id: "523e4567-e89b-12d3-a456-426614174004",
    nome: "Jaleco Técnico",
    valorBase: 55.5,
    tecidos: [
      { nome: "Oxford", composicao: "100% Poliéster" },
      { nome: "Microfibra", composicao: "65% Poliéster, 35% Algodão" },
    ],
    cores: ["Branco", "Azul claro"],
    tamanhosDisponiveis: ["PP", "P", "M", "G", "GG"],
  },
]
