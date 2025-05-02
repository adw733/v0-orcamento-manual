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
    // Padrão (PP ao G7)
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
    // Numérico (36 ao 62)
    "36": number
    "37": number
    "38": number
    "39": number
    "40": number
    "41": number
    "42": number
    "43": number
    "44": number
    "45": number
    "46": number
    "47": number
    "48": number
    "49": number
    "50": number
    "51": number
    "52": number
    "53": number
    "54": number
    "55": number
    "56": number
    "57": number
    "58": number
    "59": number
    "60": number
    "61": number
    "62": number
    // Infantil (0 ao 13)
    "0": number
    "1": number
    "2": number
    "3": number
    "4": number
    "5": number
    "6": number
    "7": number
    "8": number
    "9": number
    "10": number
    "11": number
    "12": number
    "13": number
  }
  imagem?: string // Campo para armazenar a imagem em base64
  observacao?: string
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
