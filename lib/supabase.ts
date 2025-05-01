import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Create a singleton Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if environment variables are available
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase credentials not found. Using mock client. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.",
  )
}

// Create the client with fallback values for development
export const supabase = createClient<Database>(
  supabaseUrl || "https://your-project.supabase.co",
  supabaseAnonKey || "your-anon-key",
)
