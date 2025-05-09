import type { Cliente, Produto, Tecido } from "@/types/types"

// Mock data for when Supabase isn't available
export const mockClientes: Cliente[] = [
  {
    id: "123e4567-e89b-12d3-a456-426614174000",
    nome: "Indústria Modelo Ltda",
    cnpj: "12.345.678/0001-90",
    endereco: "Av. Industrial, 1000 - São Paulo/SP",
    telefone: "(11) 3456-7890",
    email: "contato@industriamodelo.com.br",
    contato: "João Silva",
  },
  {
    id: "223e4567-e89b-12d3-a456-426614174001",
    nome: "Construtora Progresso S/A",
    cnpj: "98.765.432/0001-21",
    endereco: "Rua das Obras, 500 - Rio de Janeiro/RJ",
    telefone: "(21) 2345-6789",
    email: "contato@construtoraprogresso.com.br",
    contato: "Maria Oliveira",
  },
]

export const mockProdutos: Produto[] = [
  {
    id: "1",
    codigo: "P0001",
    nome: "Camisa Polo",
    valorBase: 45.9,
    tecidos: [
      { nome: "Malha Piquet", composicao: "50% Algodão, 50% Poliéster" },
      { nome: "Malha PV", composicao: "67% Poliéster, 33% Viscose" },
    ],
    cores: ["Azul Marinho", "Branco", "Preto", "Vermelho"],
    tamanhosDisponiveis: ["P", "M", "G", "GG"],
    categoria: "Camisas",
  },
  {
    id: "2",
    codigo: "P0002",
    nome: "Calça Operacional",
    valorBase: 65.5,
    tecidos: [
      { nome: "Brim Leve", composicao: "100% Algodão" },
      { nome: "Sarja", composicao: "100% Algodão" },
    ],
    cores: ["Azul Marinho", "Cinza", "Preto", "Caqui"],
    tamanhosDisponiveis: ["38", "40", "42", "44", "46", "48", "50", "52", "54", "56"],
    categoria: "Calças",
  },
  {
    id: "3",
    codigo: "P0003",
    nome: "Jaleco",
    valorBase: 55.0,
    tecidos: [
      { nome: "Oxford", composicao: "100% Poliéster" },
      { nome: "Microfibra", composicao: "100% Poliéster" },
    ],
    cores: ["Branco", "Azul Claro"],
    tamanhosDisponiveis: ["P", "M", "G", "GG"],
    categoria: "Jalecos",
  },
  {
    id: "4",
    codigo: "P0004",
    nome: "Camiseta",
    valorBase: 35.0,
    tecidos: [
      { nome: "Malha PV", composicao: "67% Poliéster, 33% Viscose" },
      { nome: "Malha 100% Algodão", composicao: "100% Algodão" },
    ],
    cores: ["Branco", "Preto", "Azul Marinho", "Vermelho", "Cinza", "Verde"],
    tamanhosDisponiveis: ["P", "M", "G", "GG"],
    categoria: "Camisetas",
  },
  {
    id: "5",
    codigo: "P0005",
    nome: "Boné",
    valorBase: 25.0,
    tecidos: [
      { nome: "Brim", composicao: "100% Algodão" },
      { nome: "Microfibra", composicao: "100% Poliéster" },
    ],
    cores: ["Azul Marinho", "Preto", "Vermelho", "Branco"],
    tamanhosDisponiveis: ["Único"],
    categoria: "Acessórios",
  },
]

export const mockTecidos: Tecido[] = [
  { nome: "Brim Leve", composicao: "100% Algodão" },
  { nome: "Sarja", composicao: "67% Algodão, 33% Poliéster" },
  { nome: "Jeans", composicao: "100% Algodão" },
  { nome: "Brim Pesado", composicao: "100% Algodão" },
  { nome: "Rip Stop", composicao: "70% Algodão, 30% Poliéster" },
  { nome: "Oxford", composicao: "100% Poliéster" },
  { nome: "Microfibra", composicao: "65% Poliéster, 35% Algodão" },
]
