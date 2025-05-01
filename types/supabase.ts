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
          updated_at: string
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
          updated_at?: string
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
          updated_at?: string
        }
      }
      produtos: {
        Row: {
          id: string
          nome: string
          valor_base: number
          tecidos: Json
          cores: Json
          tamanhos_disponiveis: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          valor_base: number
          tecidos?: Json
          cores?: Json
          tamanhos_disponiveis?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          valor_base?: number
          tecidos?: Json
          cores?: Json
          tamanhos_disponiveis?: Json
          created_at?: string
          updated_at?: string
        }
      }
      orcamentos: {
        Row: {
          id: string
          numero: string
          data: string
          cliente_id: string | null
          itens: Json
          observacoes: string | null
          condicoes_pagamento: string | null
          prazo_entrega: string | null
          validade_orcamento: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          numero: string
          data: string
          cliente_id?: string | null
          itens?: Json
          observacoes?: string | null
          condicoes_pagamento?: string | null
          prazo_entrega?: string | null
          validade_orcamento?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          numero?: string
          data?: string
          cliente_id?: string | null
          itens?: Json
          observacoes?: string | null
          condicoes_pagamento?: string | null
          prazo_entrega?: string | null
          validade_orcamento?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
