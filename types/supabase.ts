export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      clientes: {
        Row: {
          id: string
          codigo: string | null
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
          codigo?: string | null
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
          codigo?: string | null
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
          codigo: string | null
          nome: string
          valor_base: number
          cores: string[] | null
          tamanhos_disponiveis: string[] | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          codigo?: string | null
          nome: string
          valor_base: number
          cores?: string[] | null
          tamanhos_disponiveis?: string[] | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          codigo?: string | null
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
      tecidos_base: {
        Row: {
          id: string
          nome: string
          composicao: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          nome: string
          composicao: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          nome?: string
          composicao?: string
          created_at?: string
          updated_at?: string | null
        }
      }
      cores: {
        Row: {
          id: string
          nome: string
          codigo_hex: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          nome: string
          codigo_hex?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          nome?: string
          codigo_hex?: string | null
          created_at?: string
          updated_at?: string | null
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
          status: string | null
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
          status?: string | null
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
          status?: string | null
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
      estampas: {
        Row: {
          id: string
          item_orcamento_id: string
          posicao: string | null
          tipo: string | null
          largura: number | null
          created_at: string
        }
        Insert: {
          id?: string
          item_orcamento_id: string
          posicao?: string | null
          tipo?: string | null
          largura?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          item_orcamento_id?: string
          posicao?: string | null
          tipo?: string | null
          largura?: number | null
          created_at?: string
        }
      }
      empresa: {
        Row: {
          id: string
          nome: string
          cnpj: string | null
          endereco: string | null
          telefone: string | null
          email: string | null
          website: string | null
          logo_url: string | null
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
          website?: string | null
          logo_url?: string | null
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
          website?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
      configuracoes: {
        Row: {
          id: string
          chave: string
          valor: Json
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          chave: string
          valor: Json
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          chave?: string
          valor?: Json
          created_at?: string
          updated_at?: string | null
        }
      }
    }
  }
}
