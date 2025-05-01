import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Cria um cliente Supabase para o lado do servidor
export const createServerSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error("Variáveis de ambiente do Supabase não configuradas")
    throw new Error("Variáveis de ambiente do Supabase não configuradas")
  }

  return createClient<Database>(supabaseUrl, supabaseKey)
}

// Cria um cliente Supabase para o lado do cliente
let clientSupabaseInstance: ReturnType<typeof createClientSupabaseClient> | null = null

export const createClientSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error("Variáveis de ambiente do Supabase não configuradas")
    throw new Error("Variáveis de ambiente do Supabase não configuradas")
  }

  return createClient<Database>(supabaseUrl, supabaseKey)
}

// Singleton para o cliente Supabase no lado do cliente
export const getClientSupabaseInstance = () => {
  if (!clientSupabaseInstance) {
    clientSupabaseInstance = createClientSupabaseClient()
  }
  return clientSupabaseInstance
}
