import { getClientSupabaseInstance } from "@/lib/supabase"
import { v4 as uuidv4 } from "uuid"

export const storageService = {
  /**
   * Faz upload de uma imagem base64 para o Supabase Storage
   * @param base64Image Imagem em formato base64
   * @returns URL pública da imagem
   */
  async uploadImage(base64Image: string): Promise<string> {
    try {
      const supabase = getClientSupabaseInstance()

      // Extrair o tipo de mídia e os dados da imagem base64
      const matches = base64Image.match(/^data:([A-Za-z-+/]+);base64,(.+)$/)

      if (!matches || matches.length !== 3) {
        throw new Error("Formato de imagem base64 inválido")
      }

      const contentType = matches[1]
      const base64Data = matches[2]
      const extension = contentType.split("/")[1]
      const fileName = `${uuidv4()}.${extension}`

      // Converter base64 para Blob
      const byteCharacters = atob(base64Data)
      const byteArrays = []

      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512)

        const byteNumbers = new Array(slice.length)
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i)
        }

        const byteArray = new Uint8Array(byteNumbers)
        byteArrays.push(byteArray)
      }

      const blob = new Blob(byteArrays, { type: contentType })

      // Fazer upload para o Supabase Storage
      const { data, error } = await supabase.storage.from("orcamentos-imagens").upload(`imagens/${fileName}`, blob, {
        contentType,
        cacheControl: "3600",
        upsert: false,
      })

      if (error) {
        console.error("Erro ao fazer upload da imagem:", error)
        throw new Error("Erro ao fazer upload da imagem")
      }

      // Obter a URL pública da imagem
      const { data: urlData } = supabase.storage.from("orcamentos-imagens").getPublicUrl(`imagens/${fileName}`)

      return urlData.publicUrl
    } catch (error) {
      console.error("Erro ao processar upload da imagem:", error)
      throw new Error("Erro ao processar upload da imagem")
    }
  },

  /**
   * Exclui uma imagem do Supabase Storage
   * @param url URL da imagem a ser excluída
   */
  async deleteImage(url: string): Promise<void> {
    try {
      const supabase = getClientSupabaseInstance()

      // Extrair o caminho do arquivo da URL
      const urlObj = new URL(url)
      const pathParts = urlObj.pathname.split("/")
      const bucketName = pathParts[1]
      const filePath = pathParts.slice(2).join("/")

      // Excluir a imagem
      const { error } = await supabase.storage.from(bucketName).remove([filePath])

      if (error) {
        console.error("Erro ao excluir imagem:", error)
        throw new Error("Erro ao excluir imagem")
      }
    } catch (error) {
      console.error("Erro ao processar exclusão da imagem:", error)
      throw new Error("Erro ao processar exclusão da imagem")
    }
  },
}
