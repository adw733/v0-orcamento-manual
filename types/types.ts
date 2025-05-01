export interface Cliente {
  id: string
  nome: string
  cnpj: string
  endereco: string
  telefone: string
  email: string
  contato: string
}

export interface Tecido {
  nome: string
  composicao: string
}

export interface Produto {
  id: string
  nome: string
  valorBase: number
  tecidos: Tecido[]
  cores: string[]
  tamanhosDisponiveis: string[]
}

export interface ItemOrcamento {
  id: string
  produtoId: string
  produto?: Produto
  quantidade: number
  valorUnitario: number
  tecidoSelecionado?: Tecido
  corSelecionada?: string
  descricaoEstampa?: string
  tamanhos: {
    PP: number
    P: number
    M: number
    G: number
    GG: number
    G1: number
    G2: number
    G3: number
    G4: number
    G5: number
    G6: number
    G7: number
  }
  imagem?: string // Campo para armazenar a imagem em base64
}

export interface Orcamento {
  id?: string
  numero: string
  data: string
  cliente: Cliente | null
  itens: ItemOrcamento[]
  observacoes: string
  condicoesPagamento: string
  prazoEntrega: string
  validadeOrcamento: string
}
