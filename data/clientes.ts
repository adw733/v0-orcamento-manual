import type { Cliente } from "@/types/types"

export const clientesIniciais: Cliente[] = [
  {
    id: "1",
    nome: "Indústria Modelo Ltda",
    cnpj: "12.345.678/0001-90",
    endereco: "Av. Industrial, 1000 - São Paulo/SP",
    telefone: "(11) 3456-7890",
    email: "contato@industriamodelo.com.br",
    contato: "João Silva",
  },
  {
    id: "2",
    nome: "Construtora Progresso S/A",
    cnpj: "98.765.432/0001-21",
    endereco: "Rua das Obras, 500 - Rio de Janeiro/RJ",
    telefone: "(21) 2345-6789",
    email: "contato@construtoraprogresso.com.br",
    contato: "Maria Oliveira",
  },
]
