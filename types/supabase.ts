export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      clientes: {
        Row: {
          id: string
          nome: string
          cnpj: string | null
          endereco: string | null
          telefone: string | null
          email: string | null
          contato: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          nome: string
          cnpj?: string | null
          endereco?: string | null
          telefone?: string | null
          email?: string | null
          contato?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          nome?: string
          cnpj?: string | null
          endereco?: string | null
          telefone?: string | null
          email?: string | null
          contato?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
      produtos: {
        Row: {
          id: string
          nome: string
          valor_base: number
          cores: string[] | null
          tamanhos_disponiveis: string[] | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          nome: string
          valor_base: number
          cores?: string[] | null
          tamanhos_disponiveis?: string[] | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          nome?: string
          valor_base?: number
          cores?: string[] | null
          tamanhos_disponiveis?: string[] | null
          created_at?: string
          updated_at?: string | null
        }
      }
      tecidos: {
        Row: {
          id: string
          nome: string
          composicao: string | null
          produto_id: string
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          composicao?: string | null
          produto_id: string
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          composicao?: string | null
          produto_id?: string
          created_at?: string
        }
      }
      orcamentos: {
        Row: {
          id: string
          numero: string
          data: string
          cliente_id: string | null
          observacoes: string | null
          condicoes_pagamento: string | null
          prazo_entrega: string | null
          validade_orcamento: string | null
          created_at: string
          updated_at: string | null
          itens: Json | null
        }
        Insert: {
          id?: string
          numero: string
          data: string
          cliente_id?: string | null
          observacoes?: string | null
          condicoes_pagamento?: string | null
          prazo_entrega?: string | null
          validade_orcamento?: string | null
          created_at?: string
          updated_at?: string | null
          itens?: Json | null
        }
        Update: {
          id?: string
          numero?: string
          data?: string
          cliente_id?: string | null
          observacoes?: string | null
          condicoes_pagamento?: string | null
          prazo_entrega?: string | null
          validade_orcamento?: string | null
          created_at?: string
          updated_at?: string | null
          itens?: Json | null
        }
      }
      itens_orcamento: {
        Row: {
          id: string
          orcamento_id: string | null
          produto_id: string | null
          quantidade: number
          valor_unitario: number
          tecido_nome: string | null
          tecido_composicao: string | null
          cor_selecionada: string | null
          descricao_estampa: string | null
          tamanhos: Json | null
          imagem: string | null
          observacao: string | null
          created_at: string
        }
        Insert: {
          id?: string
          orcamento_id?: string | null
          produto_id?: string | null
          quantidade: number
          valor_unitario: number
          tecido_nome?: string | null
          tecido_composicao?: string | null
          cor_selecionada?: string | null
          descricao_estampa?: string | null
          tamanhos?: Json | null
          imagem?: string | null
          observacao?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          orcamento_id?: string | null
          produto_id?: string | null
          quantidade?: number
          valor_unitario?: number
          tecido_nome?: string | null
          tecido_composicao?: string | null
          cor_selecionada?: string | null
          descricao_estampa?: string | null
          tamanhos?: Json | null
          imagem?: string | null
          observacao?: string | null
          created_at?: string
        }
      }
    }
  }
}
