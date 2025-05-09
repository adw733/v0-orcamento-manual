// Adicionar a interface DadosEmpresa
export interface DadosEmpresa {
  id?: string
  nome: string
  cnpj: string
  email: string
  telefone: string
  endereco: string
  logo_url?: string
  site?: string
  slogan?: string
}

export type Tecido = {
  nome: string
  composicao: string
}

export type Estampa = {
  id?: string
  posicao?: string
  tipo?: string
  largura?: number
}

// Remover o campo contato da interface Cliente
export type Cliente = {
  id: string
  codigo: string // Novo campo para código sequencial
  nome: string
  cnpj: string
  endereco: string
  telefone: string
  email: string
}

// Modificar a interface Produto para incluir categoria
export type Produto = {
  id: string
  codigo: string // Novo campo para código sequencial
  nome: string
  valorBase: number
  tecidos: Tecido[]
  cores: string[]
  tamanhosDisponiveis: string[]
  categoria: string // Nova propriedade para categorização
}

export type ItemOrcamento = {
  id: string
  produtoId: string
  produto?: Produto
  quantidade: number
  valorUnitario: number
  tecidoSelecionado?: Tecido
  corSelecionada?: string
  estampas?: Estampa[] // Alterado para array de estampas
  tamanhos: {
    [tamanho: string]: number
  }
  imagem?: string
  observacao?: string
}

// Atualizar o tipo Orcamento para incluir os campos de contato
export type Orcamento = {
  id?: string
  numero: string
  data: string
  cliente: Cliente | null
  itens: ItemOrcamento[]
  observacoes: string
  condicoesPagamento: string
  prazoEntrega: string
  validadeOrcamento: string
  status?: string // Adicionar campo de status
  valorFrete?: number // Adicionar campo de valor do frete
  nomeContato?: string // Novo campo para nome do contato
  telefoneContato?: string // Novo campo para telefone do contato
}
