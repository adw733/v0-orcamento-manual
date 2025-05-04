"use server"

import { GoogleGenerativeAI } from "@google/generative-ai"
import { supabase } from "@/lib/supabase"
import type { Cliente, Produto, ItemOrcamento, Orcamento } from "@/types/types"

// Function to get the API key from Supabase
async function getGeminiApiKey(): Promise<string> {
  try {
    const { data, error } = await supabase.from("configuracoes").select("valor").eq("chave", "gemini_api_key").single()

    if (error) {
      console.error("Erro ao buscar API key:", error)
      // Default API key as fallback
      return "AIzaSyCTqW48OFu3BPowgrc0xtBVmvGQAvUQX5I"
    }

    return data?.valor || "AIzaSyCTqW48OFu3BPowgrc0xtBVmvGQAvUQX5I"
  } catch (error) {
    console.error("Erro ao buscar API key:", error)
    return "AIzaSyCTqW48OFu3BPowgrc0xtBVmvGQAvUQX5I"
  }
}

// Function to save the API key to Supabase
export async function saveGeminiApiKey(apiKey: string): Promise<{ success: boolean; message: string }> {
  try {
    // Check if the key already exists
    const { data, error: checkError } = await supabase
      .from("configuracoes")
      .select("*")
      .eq("chave", "gemini_api_key")
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      // Error other than "not found"
      return { success: false, message: `Erro ao verificar API key: ${checkError.message}` }
    }

    if (data) {
      // Update existing key
      const { error } = await supabase.from("configuracoes").update({ valor: apiKey }).eq("chave", "gemini_api_key")

      if (error) {
        return { success: false, message: `Erro ao atualizar API key: ${error.message}` }
      }
    } else {
      // Insert new key
      const { error } = await supabase.from("configuracoes").insert({ chave: "gemini_api_key", valor: apiKey })

      if (error) {
        return { success: false, message: `Erro ao salvar API key: ${error.message}` }
      }
    }

    return { success: true, message: "API key salva com sucesso!" }
  } catch (error) {
    return {
      success: false,
      message: `Erro ao salvar API key: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
    }
  }
}

// Helper function to extract JSON from markdown code blocks
function extractJsonFromMarkdown(text: string): string {
  // Check if the text contains a markdown code block
  const jsonRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/
  const match = text.match(jsonRegex)

  if (match && match[1]) {
    return match[1]
  }

  // If no code block is found, return the original text
  // (it might be raw JSON already)
  return text
}

// Function to get the next orçamento number
async function obterProximoNumeroOrcamento(): Promise<string> {
  try {
    // Buscar o último orçamento para obter o número mais recente
    const { data, error } = await supabase
      .from("orcamentos")
      .select("numero")
      .order("created_at", { ascending: false })
      .limit(1)

    if (error) {
      console.error("Erro ao buscar último número de orçamento:", error)
      // Se houver erro, começar do 0140
      return "0140"
    }

    if (data && data.length > 0) {
      // Extrair o número do formato "XXXX - ..."
      const ultimoNumero = data[0].numero.split(" - ")[0]
      // Verificar se é um número válido
      const numeroAtual = Number.parseInt(ultimoNumero, 10)

      if (!isNaN(numeroAtual)) {
        // Incrementar e formatar com zeros à esquerda
        const proximoNumero = (numeroAtual + 1).toString().padStart(4, "0")
        return proximoNumero
      }
    }

    // Se não houver orçamentos ou o formato for inválido, começar do 0140
    return "0140"
  } catch (error) {
    console.error("Erro ao obter próximo número de orçamento:", error)
    return "0140"
  }
}

// Function to get the next cliente code
async function obterProximoCodigoCliente(): Promise<string> {
  try {
    // Buscar o último cliente para obter o código mais recente
    const { data, error } = await supabase
      .from("clientes")
      .select("codigo")
      .order("created_at", { ascending: false })
      .limit(1)

    if (error) {
      console.error("Erro ao buscar último código de cliente:", error)
      // Se houver erro, começar do 0001
      return "0001"
    }

    if (data && data.length > 0) {
      // Extrair o código
      const ultimoCodigo = data[0].codigo
      // Verificar se é um número válido
      const codigoAtual = Number.parseInt(ultimoCodigo, 10)

      if (!isNaN(codigoAtual)) {
        // Incrementar e formatar com zeros à esquerda
        const proximoCodigo = (codigoAtual + 1).toString().padStart(4, "0")
        return proximoCodigo
      }
    }

    // Se não houver clientes ou o formato for inválido, começar do 0001
    return "0001"
  } catch (error) {
    console.error("Erro ao obter próximo código de cliente:", error)
    return "0001"
  }
}

// Function to get the next produto code
async function obterProximoCodigoProduto(): Promise<string> {
  try {
    // Buscar o último produto para obter o código mais recente
    const { data, error } = await supabase
      .from("produtos")
      .select("codigo")
      .order("created_at", { ascending: false })
      .limit(1)

    if (error) {
      console.error("Erro ao buscar último código de produto:", error)
      // Se houver erro, começar do 0001
      return "0001"
    }

    if (data && data.length > 0) {
      // Extrair o código
      const ultimoCodigo = data[0].codigo
      // Verificar se é um número válido
      const codigoAtual = Number.parseInt(ultimoCodigo, 10)

      if (!isNaN(codigoAtual)) {
        // Incrementar e formatar com zeros à esquerda
        const proximoCodigo = (codigoAtual + 1).toString().padStart(4, "0")
        return proximoCodigo
      }
    }

    // Se não houver produtos ou o formato for inválido, começar do 0001
    return "0001"
  } catch (error) {
    console.error("Erro ao obter próximo código de produto:", error)
    return "0001"
  }
}

// Modificar o systemPrompt para incluir instruções sobre cores e tecidos
const systemPrompt = `
Você é um assistente especializado em criar e editar dados para um sistema de orçamentos de uniformes industriais.

Analise o pedido do usuário e identifique se ele quer:
1. Criar uma nova cor
2. Criar um novo tecido
3. Criar um novo cliente
4. Criar um novo produto
5. Criar um novo orçamento
6. Editar uma cor existente
7. Editar um tecido existente
8. Editar um cliente existente
9. Editar um produto existente
10. Editar um orçamento existente
11. Extrair informações de um orçamento em formato de texto ou imagem

IMPORTANTE: Sempre verifique se o item já existe antes de criar um novo. Use o item existente quando encontrar.

IMPORTANTE: Quando faltarem informações obrigatórias, INVENTE dados plausíveis para preencher automaticamente. Não pergunte ao usuário por cada campo faltante, apenas pergunte se pode prosseguir com os dados que você inventou.

Campos obrigatórios para Cor:
- nome (obrigatório)
- codigo_hex (opcional, mas recomendado - invente um código de cor apropriado)

Campos obrigatórios para Tecido:
- nome (obrigatório)
- composicao (obrigatório - invente uma composição plausível)

Campos obrigatórios para Cliente:
- nome (obrigatório)
- cnpj (obrigatório - invente um CNPJ válido no formato XX.XXX.XXX/XXXX-XX)
- contato (obrigatório - invente um nome de contato)
- endereco (opcional - invente um endereço plausível)
- telefone (opcional - invente um telefone no formato (XX) XXXXX-XXXX)
- email (opcional - invente um email corporativo)

Campos obrigatórios para Produto:
- nome (obrigatório)
- valorBase (obrigatório - invente um valor plausível)
- pelo menos um tecido (obrigatório - use um tecido existente ou invente um novo)
- pelo menos uma cor (obrigatório - use uma cor existente ou invente uma nova)
- pelo menos um tamanho disponível (obrigatório - use tamanhos padrão como P, M, G, GG)

Campos obrigatórios para Orçamento:
- cliente (obrigatório - use um cliente existente)
- pelo menos um item (obrigatório)
- para cada item: produto, quantidade, valorUnitario (obrigatórios)
- para cada estampa: posicao, tipo, largura (obrigatórios - invente posições como "PEITO ESQUERDO", tipos como "BORDADO" e larguras plausíveis)
- condicoesPagamento (opcional - invente condições como "À vista", "30 dias", etc.)
- prazoEntrega (opcional - invente prazos como "15 dias", "30 dias", etc.)
- validadeOrcamento (opcional - invente validades como "15 dias", "30 dias", etc.)

Responda APENAS com um JSON no seguinte formato, SEM usar blocos de código markdown:

Para criar cor:
{
  "action": "createCor",
  "data": {
    "nome": "Azul Marinho",
    "codigo_hex": "#000080"
  },
  "dadosInventados": true,
  "mensagemInventado": "Inventei o código de cor #000080 para Azul Marinho. Posso prosseguir?"
}

Para criar tecido:
{
  "action": "createTecido",
  "data": {
    "nome": "Malha Piquet",
    "composicao": "50% Algodão, 50% Poliéster"
  },
  "dadosInventados": true,
  "mensagemInventado": "Inventei a composição '50% Algodão, 50% Poliéster' para o tecido Malha Piquet. Posso prosseguir?"
}

Para criar cliente:
{
  "action": "createCliente",
  "data": {
    "nome": "Nome da Empresa",
    "cnpj": "12.345.678/0001-90",
    "endereco": "Endereço completo",
    "telefone": "(11) 1234-5678",
    "email": "contato@empresa.com",
    "contato": "Nome do Contato"
  },
  "dadosInventados": true,
  "mensagemInventado": "Inventei o CNPJ, endereço, telefone e email para o cliente. Posso prosseguir?"
}

Para criar produto:
{
  "action": "createProduto",
  "data": {
    "nome": "Nome do Produto",
    "valorBase": 45.90,
    "tecidos": [
      { "nome": "Nome do Tecido", "composicao": "Composição do Tecido" }
    ],
    "cores": ["Cor 1", "Cor 2"],
    "tamanhosDisponiveis": ["P", "M", "G"]
  },
  "dadosInventados": true,
  "mensagemInventado": "Inventei o valor base, tecidos, cores e tamanhos disponíveis para o produto. Posso prosseguir?"
}

Para criar orçamento:
{
  "action": "createOrcamento",
  "data": {
    "cliente": "Nome do Cliente",
    "itens": [
      {
        "produto": "Nome do Produto",
        "quantidade": 10,
        "valorUnitario": 45.90,
        "tecidoSelecionado": "Nome do Tecido",
        "corSelecionada": "Cor",
        "tamanhos": { "P": 2, "M": 5, "G": 3 },
        "estampas": [
          {
            "posicao": "PEITO ESQUERDO",
            "tipo": "BORDADO",
            "largura": 8.0
          }
        ]
      }
    ],
    "observacoes": "Observações",
    "condicoesPagamento": "À vista",
    "prazoEntrega": "30 dias",
    "validadeOrcamento": "15 dias"
  },
  "dadosInventados": true,
  "mensagemInventado": "Inventei detalhes para os itens, estampas, condições de pagamento e prazos. Posso prosseguir?"
}

Para editar, use os mesmos formatos acima, mas com a action "updateCor", "updateTecido", "updateCliente", "updateProduto" ou "updateOrcamento", e inclua o ID do item a ser editado.

Para extrair informações de um orçamento:
{
  "action": "extractOrcamento",
  "data": {
    "numero": "0138",
    "cliente": {
      "nome": "POLIMIX CONCRETO",
      "contato": "ANDRÉ"
    },
    "itens": [
      {
        "produto": "CAMISA POLO",
        "tecidoSelecionado": "MALHA PIQUET",
        "corSelecionada": "BRANCO",
        "estampas": [
          {
            "posicao": "PEITO ESQUERDO",
            "tipo": "BORDADO",
            "largura": 8.0
          }
        ],
        "quantidade": 2,
        "valorUnitario": 44.90,
        "tamanhos": { "M": 2 }
      }
    ],
    "condicoesPagamento": "45 DIAS APÓS ENTREGA COM NF",
    "prazoEntrega": "45 DIAS APÓS CONFIRMAÇÃO",
    "observacoes": ""
  },
  "dadosInventados": true,
  "mensagemInventado": "Extraí as informações do orçamento e completei alguns detalhes. Posso prosseguir?"
}

Se o usuário pedir para preencher automaticamente as informações faltantes, responda com:
{
  "action": "autoComplete",
  "message": "Vou preencher as informações faltantes automaticamente.",
  "data": {
    // Dados completos com valores fictícios para os campos faltantes
  }
}

Se não conseguir entender o pedido, responda com:
{
  "action": "unknown",
  "message": "Não entendi o que você quer fazer. Por favor, seja mais específico."
}

IMPORTANTE: Não use blocos de código markdown (\`\`\`). Retorne apenas o JSON puro.

Preencha todos os campos necessários automaticamente com dados plausíveis quando faltarem informações no pedido do usuário.
`

// Modificar a função generateWithGemini para incluir cores e tecidos
export async function generateWithGemini(
  prompt: string,
  clientes: Cliente[] = [],
  produtos: Produto[] = [],
  cores: any[] = [],
  tecidos: any[] = [],
): Promise<{
  success: boolean
  message: string
  data?: any
  action?: string
  camposFaltantes?: string[]
}> {
  try {
    const apiKey = await getGeminiApiKey()

    // Initialize the Gemini API with the correct class name
    const genAI = new GoogleGenerativeAI(apiKey)

    // Get the model using the correct model name with free quota
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro-exp-03-25" })

    // Criar listas de clientes, produtos, cores e tecidos para incluir no prompt
    const clientesLista =
      clientes.length > 0
        ? `Clientes existentes: ${clientes.map((c) => `${c.codigo} - ${c.nome}`).join(", ")}`
        : "Não há clientes cadastrados."

    const produtosLista =
      produtos.length > 0
        ? `Produtos existentes: ${produtos.map((p) => `${p.codigo} - ${p.nome}`).join(", ")}`
        : "Não há produtos cadastrados."

    const coresLista =
      cores.length > 0
        ? `Cores existentes: ${cores.map((c) => `${c.nome} (${c.codigo_hex || "sem código"})`).join(", ")}`
        : "Não há cores cadastradas."

    const tecidosLista =
      tecidos.length > 0
        ? `Tecidos existentes: ${tecidos.map((t) => `${t.nome} (${t.composicao || "sem composição"})`).join(", ")}`
        : "Não há tecidos cadastrados."

    // Adicionar as listas ao prompt do sistema
    const systemPromptCompleto = `${systemPrompt}

${clientesLista}
${produtosLista}
${coresLista}
${tecidosLista}

Lembre-se de verificar se o item já existe antes de sugerir criar um novo.
Lembre-se de verificar se todas as informações obrigatórias estão presentes.
`

    // Generate content using the correct format for Gemini API
    const result = await model.generateContent({
      contents: [
        {
          parts: [
            { text: systemPromptCompleto },
            {
              text: "Entendido. Vou analisar os pedidos e responder apenas com o JSON no formato especificado, sem usar blocos de código markdown.",
            },
            { text: prompt },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    })

    const response = result.response
    const text = response.text()

    console.log("Resposta original da IA:", text)

    // Extract JSON from markdown if needed
    const jsonText = extractJsonFromMarkdown(text)
    console.log("JSON extraído:", jsonText)

    try {
      // Parse the JSON response
      const jsonResponse = JSON.parse(jsonText)
      return {
        success: true,
        message: "Conteúdo gerado com sucesso!",
        data: jsonResponse.data,
        action: jsonResponse.action,
        camposFaltantes: jsonResponse.camposFaltantes || [],
      }
    } catch (parseError) {
      console.error("Erro ao parsear resposta JSON:", parseError)
      return {
        success: false,
        message: "A resposta da IA não está no formato esperado. Tente novamente com uma solicitação mais clara.",
      }
    }
  } catch (error) {
    console.error("Erro ao gerar conteúdo com Gemini:", error)
    return {
      success: false,
      message: `Erro ao gerar conteúdo: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
    }
  }
}

// Modificar a função processFileWithGemini para incluir cores e tecidos
export async function processFileWithGemini(
  fileContent: string,
  fileType: string,
  clientes: Cliente[] = [],
  produtos: Produto[] = [],
  cores: any[] = [],
  tecidos: any[] = [],
): Promise<{
  success: boolean
  message: string
  data?: any
  action?: string
}> {
  try {
    const apiKey = await getGeminiApiKey()

    // Initialize the Gemini API
    const genAI = new GoogleGenerativeAI(apiKey)

    // Get the vision model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro-exp-03-25" })

    // Criar listas de clientes, produtos, cores e tecidos para incluir no prompt
    const clientesLista =
      clientes.length > 0
        ? `Clientes existentes: ${clientes.map((c) => c.nome).join(", ")}`
        : "Não há clientes cadastrados."

    const produtosLista =
      produtos.length > 0
        ? `Produtos existentes: ${produtos.map((p) => p.nome).join(", ")}`
        : "Não há produtos cadastrados."

    const coresLista =
      cores.length > 0 ? `Cores existentes: ${cores.map((c) => c.nome).join(", ")}` : "Não há cores cadastradas."

    const tecidosLista =
      tecidos.length > 0
        ? `Tecidos existentes: ${tecidos.map((t) => t.nome).join(", ")}`
        : "Não há tecidos cadastrados."

    // Prompt específico para extração de orçamentos
    const extractionPrompt = `
Você é um assistente especializado em extrair informações de orçamentos de uniformes industriais.

Analise cuidadosamente o conteúdo do arquivo que estou enviando. É um orçamento de uniformes industriais.
Extraia todas as informações relevantes como:
- Número do orçamento
- Cliente (nome da empresa e contato)
- Itens (produtos, tecidos, cores, estampas, quantidades, valores)
- Condições de pagamento
- Prazo de entrega
- Observações

${clientesLista}
${produtosLista}
${coresLista}
${tecidosLista}

Responda APENAS com um JSON no seguinte formato, SEM usar blocos de código markdown:

{
  "action": "extractOrcamento",
  "data": {
    "numero": "0138",
    "cliente": {
      "nome": "POLIMIX CONCRETO",
      "contato": "ANDRÉ"
    },
    "itens": [
      {
        "produto": "CAMISA POLO",
        "tecidoSelecionado": "MALHA PIQUET",
        "corSelecionada": "BRANCO",
        "estampas": [
          {
            "posicao": "PEITO ESQUERDO",
            "tipo": "BORDADO",
            "largura": 8.0
          }
        ],
        "quantidade": 2,
        "valorUnitario": 44.90,
        "tamanhos": { "M": 2 }
      }
    ],
    "condicoesPagamento": "45 DIAS APÓS ENTREGA COM NF",
    "prazoEntrega": "45 DIAS APÓS CONFIRMAÇÃO",
    "observacoes": ""
  }
}

IMPORTANTE: Não use blocos de código markdown (\`\`\`). Retorne apenas o JSON puro.
`

    // Prepare the content parts based on file type
    let parts = []

    if (fileType.startsWith("image/")) {
      // For images, we need to send the base64 content as an image part
      parts = [{ text: extractionPrompt }, { inlineData: { data: fileContent, mimeType: fileType } }]
    } else {
      // For text-based files (like PDFs that have been converted to text)
      parts = [{ text: extractionPrompt }, { text: fileContent }]
    }

    // Generate content using the vision model
    const result = await model.generateContent({
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.2,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    })

    const response = result.response
    const text = response.text()

    console.log("Resposta original da IA (extração):", text)

    // Extract JSON from markdown if needed
    const jsonText = extractJsonFromMarkdown(text)
    console.log("JSON extraído (extração):", jsonText)

    try {
      // Parse the JSON response
      const jsonResponse = JSON.parse(jsonText)
      return {
        success: true,
        message: "Extração concluída com sucesso!",
        data: jsonResponse.data,
        action: jsonResponse.action,
      }
    } catch (parseError) {
      console.error("Erro ao parsear resposta JSON (extração):", parseError)
      return {
        success: false,
        message: "A resposta da IA não está no formato esperado. Tente novamente com um arquivo diferente.",
      }
    }
  } catch (error) {
    console.error("Erro ao processar arquivo com Gemini:", error)
    return {
      success: false,
      message: `Erro ao processar arquivo: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
    }
  }
}

// Adicionar funções para obter próximos códigos de cores e tecidos
async function obterProximoCodigoCor(): Promise<string> {
  try {
    // Buscar a última cor para obter o código mais recente
    const { data, error } = await supabase.from("cores").select("id").order("created_at", { ascending: false }).limit(1)

    if (error) {
      console.error("Erro ao buscar último código de cor:", error)
      // Se houver erro, começar do 0001
      return "COR0001"
    }

    if (data && data.length > 0) {
      // Incrementar e formatar com zeros à esquerda
      const proximoCodigo = `COR${(Number(data.length) + 1).toString().padStart(4, "0")}`
      return proximoCodigo
    }

    // Se não houver cores, começar do COR0001
    return "COR0001"
  } catch (error) {
    console.error("Erro ao obter próximo código de cor:", error)
    return "COR0001"
  }
}

async function obterProximoCodigoTecido(): Promise<string> {
  try {
    // Buscar o último tecido para obter o código mais recente
    const { data, error } = await supabase
      .from("tecidos_base")
      .select("id")
      .order("created_at", { ascending: false })
      .limit(1)

    if (error) {
      console.error("Erro ao buscar último código de tecido:", error)
      // Se houver erro, começar do 0001
      return "TEC0001"
    }

    if (data && data.length > 0) {
      // Incrementar e formatar com zeros à esquerda
      const proximoCodigo = `TEC${(Number(data.length) + 1).toString().padStart(4, "0")}`
      return proximoCodigo
    }

    // Se não houver tecidos, começar do TEC0001
    return "TEC0001"
  } catch (error) {
    console.error("Erro ao obter próximo código de tecido:", error)
    return "TEC0001"
  }
}

// Modificar a função processGeminiAction para incluir cores e tecidos
export async function processGeminiAction(
  action: string,
  data: any,
  clientes: Cliente[],
  produtos: Produto[],
  orcamento: Orcamento,
  setClientes: (clientes: Cliente[]) => void,
  setProdutos: (produtos: Produto[]) => void,
  setOrcamento: (orcamento: Orcamento) => void,
  cores: any[] = [],
  tecidos: any[] = [],
  setCores: (cores: any[]) => void = () => {},
  setTecidos: (tecidos: any[]) => void = () => {},
  dadosInventados = false,
  mensagemInventado = "",
): Promise<{ success: boolean; message: string; abaParaMostrar?: string }> {
  try {
    // Generate a UUID for new items
    const generateUUID = () => {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0,
          v = c === "x" ? r : (r & 0x3) | 0x8
        return v.toString(16)
      })
    }

    // Se temos dados inventados e o usuário não confirmou, retornar a mensagem
    if (dadosInventados && mensagemInventado) {
      return {
        success: true,
        message: mensagemInventado,
      }
    }

    // Adicionar a variável abaParaMostrar para cada ação
    let abaParaMostrar = ""

    switch (action) {
      case "createCor": {
        // Verificar campos obrigatórios
        const camposFaltantes = []
        if (!data.nome) camposFaltantes.push("nome")

        if (camposFaltantes.length > 0) {
          return {
            success: false,
            message: `Por favor, forneça as seguintes informações obrigatórias: ${camposFaltantes.join(", ")}`,
          }
        }

        // Verificar se a cor já existe pelo nome
        const corExistente = cores.find((c) => c.nome.toLowerCase() === data.nome.toLowerCase())

        if (corExistente) {
          return {
            success: true,
            message: `Cor "${data.nome}" já existe no sistema. Usando a cor existente.`,
            abaParaMostrar: "materiais",
          }
        }

        // Obter o próximo código sequencial
        const codigo = await obterProximoCodigoCor()

        // Create a new color
        const novaCor = {
          id: generateUUID(),
          nome: data.nome,
          codigo_hex: data.codigo_hex || "#000000",
        }

        // Insert into Supabase
        const { error } = await supabase.from("cores").insert({
          id: novaCor.id,
          nome: novaCor.nome,
          codigo_hex: novaCor.codigo_hex,
        })

        if (error) throw error

        // Update local state
        setCores([...cores, novaCor])

        // Definir a aba para mostrar
        abaParaMostrar = "materiais"

        return {
          success: true,
          message: `Cor "${novaCor.nome}" criada com sucesso!`,
          abaParaMostrar,
        }
      }

      case "createTecido": {
        // Verificar campos obrigatórios
        const camposFaltantes = []
        if (!data.nome) camposFaltantes.push("nome")
        if (!data.composicao) camposFaltantes.push("composicao")

        if (camposFaltantes.length > 0) {
          return {
            success: false,
            message: `Por favor, forneça as seguintes informações obrigatórias: ${camposFaltantes.join(", ")}`,
          }
        }

        // Verificar se o tecido já existe pelo nome
        const tecidoExistente = tecidos.find((t) => t.nome.toLowerCase() === data.nome.toLowerCase())

        if (tecidoExistente) {
          return {
            success: true,
            message: `Tecido "${data.nome}" já existe no sistema. Usando o tecido existente.`,
            abaParaMostrar: "materiais",
          }
        }

        // Obter o próximo código sequencial
        const codigo = await obterProximoCodigoTecido()

        // Create a new tecido
        const novoTecido = {
          id: generateUUID(),
          nome: data.nome,
          composicao: data.composicao,
        }

        // Insert into Supabase
        const { error } = await supabase.from("tecidos_base").insert({
          id: novoTecido.id,
          nome: novoTecido.nome,
          composicao: novoTecido.composicao,
        })

        if (error) throw error

        // Update local state
        setTecidos([...tecidos, novoTecido])

        // Definir a aba para mostrar
        abaParaMostrar = "materiais"

        return {
          success: true,
          message: `Tecido "${novoTecido.nome}" criado com sucesso!`,
          abaParaMostrar,
        }
      }

      case "updateCor": {
        // Verificar campos obrigatórios
        const camposFaltantes = []
        if (!data.id) camposFaltantes.push("id")
        if (!data.nome) camposFaltantes.push("nome")

        if (camposFaltantes.length > 0) {
          return {
            success: false,
            message: `Por favor, forneça as seguintes informações obrigatórias: ${camposFaltantes.join(", ")}`,
          }
        }

        // Verificar se a cor existe
        const corExistente = cores.find((c) => c.id === data.id)

        if (!corExistente) {
          return {
            success: false,
            message: `Cor com ID "${data.id}" não encontrada.`,
          }
        }

        // Update the color
        const corAtualizada = {
          ...corExistente,
          nome: data.nome,
          codigo_hex: data.codigo_hex || corExistente.codigo_hex,
        }

        // Update in Supabase
        const { error } = await supabase
          .from("cores")
          .update({
            nome: corAtualizada.nome,
            codigo_hex: corAtualizada.codigo_hex,
            updated_at: new Date().toISOString(),
          })
          .eq("id", corAtualizada.id)

        if (error) throw error

        // Update local state
        setCores(cores.map((c) => (c.id === corAtualizada.id ? corAtualizada : c)))

        // Definir a aba para mostrar
        abaParaMostrar = "materiais"

        return {
          success: true,
          message: `Cor "${corAtualizada.nome}" atualizada com sucesso!`,
          abaParaMostrar,
        }
      }

      case "updateTecido": {
        // Verificar campos obrigatórios
        const camposFaltantes = []
        if (!data.id) camposFaltantes.push("id")
        if (!data.nome) camposFaltantes.push("nome")
        if (!data.composicao) camposFaltantes.push("composicao")

        if (camposFaltantes.length > 0) {
          return {
            success: false,
            message: `Por favor, forneça as seguintes informações obrigatórias: ${camposFaltantes.join(", ")}`,
          }
        }

        // Verificar se o tecido existe
        const tecidoExistente = tecidos.find((t) => t.id === data.id)

        if (!tecidoExistente) {
          return {
            success: false,
            message: `Tecido com ID "${data.id}" não encontrado.`,
          }
        }

        // Update the tecido
        const tecidoAtualizado = {
          ...tecidoExistente,
          nome: data.nome,
          composicao: data.composicao,
        }

        // Update in Supabase
        const { error } = await supabase
          .from("tecidos_base")
          .update({
            nome: tecidoAtualizado.nome,
            composicao: tecidoAtualizado.composicao,
            updated_at: new Date().toISOString(),
          })
          .eq("id", tecidoAtualizado.id)

        if (error) throw error

        // Update local state
        setTecidos(tecidos.map((t) => (t.id === tecidoAtualizado.id ? tecidoAtualizado : t)))

        // Definir a aba para mostrar
        abaParaMostrar = "materiais"

        return {
          success: true,
          message: `Tecido "${tecidoAtualizado.nome}" atualizado com sucesso!`,
          abaParaMostrar,
        }
      }

      case "createCliente": {
        // Verificar campos obrigatórios
        const camposFaltantes = []
        if (!data.nome) camposFaltantes.push("nome")
        if (!data.cnpj) camposFaltantes.push("cnpj")
        if (!data.contato) camposFaltantes.push("contato")

        if (camposFaltantes.length > 0) {
          return {
            success: false,
            message: `Por favor, forneça as seguintes informações obrigatórias: ${camposFaltantes.join(", ")}`,
          }
        }

        // Verificar se o cliente já existe pelo nome
        const clienteExistente = clientes.find((c) => c.nome.toLowerCase() === data.nome.toLowerCase())

        if (clienteExistente) {
          return {
            success: true,
            message: `Cliente "${data.nome}" já existe no sistema. Usando o cliente existente.`,
            abaParaMostrar: "clientes",
          }
        }

        // Obter o próximo código sequencial
        const codigo = await obterProximoCodigoCliente()

        // Create a new client
        const novoCliente: Cliente = {
          id: generateUUID(),
          codigo,
          nome: data.nome,
          cnpj: data.cnpj || "",
          endereco: data.endereco || "",
          telefone: data.telefone || "",
          email: data.email || "",
          contato: data.contato || "",
        }

        // Insert into Supabase
        const { error } = await supabase.from("clientes").insert({
          id: novoCliente.id,
          codigo: novoCliente.codigo,
          nome: novoCliente.nome,
          cnpj: novoCliente.cnpj || null,
          endereco: novoCliente.endereco || null,
          telefone: novoCliente.telefone || null,
          email: novoCliente.email || null,
          contato: novoCliente.contato || null,
        })

        if (error) throw error

        // Update local state
        setClientes([...clientes, novoCliente])

        // Definir a aba para mostrar
        abaParaMostrar = "clientes"

        return {
          success: true,
          message: `Cliente "${novoCliente.nome}" (${novoCliente.codigo}) criado com sucesso!`,
          abaParaMostrar,
        }
      }

      case "updateCliente": {
        // Verificar campos obrigatórios
        const camposFaltantes = []
        if (!data.id) camposFaltantes.push("id")
        if (!data.nome) camposFaltantes.push("nome")
        if (!data.cnpj) camposFaltantes.push("cnpj")
        if (!data.contato) camposFaltantes.push("contato")

        if (camposFaltantes.length > 0) {
          return {
            success: false,
            message: `Por favor, forneça as seguintes informações obrigatórias: ${camposFaltantes.join(", ")}`,
          }
        }

        // Verificar se o cliente existe
        const clienteExistente = clientes.find((c) => c.id === data.id)

        if (!clienteExistente) {
          return {
            success: false,
            message: `Cliente com ID "${data.id}" não encontrado.`,
          }
        }

        // Update the client
        const clienteAtualizado: Cliente = {
          ...clienteExistente,
          nome: data.nome,
          cnpj: data.cnpj || clienteExistente.cnpj,
          endereco: data.endereco || clienteExistente.endereco,
          telefone: data.telefone || clienteExistente.telefone,
          email: data.email || clienteExistente.email,
          contato: data.contato || clienteExistente.contato,
        }

        // Update in Supabase
        const { error } = await supabase
          .from("clientes")
          .update({
            nome: clienteAtualizado.nome,
            cnpj: clienteAtualizado.cnpj || null,
            endereco: clienteAtualizado.endereco || null,
            telefone: clienteAtualizado.telefone || null,
            email: clienteAtualizado.email || null,
            contato: clienteAtualizado.contato || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", clienteAtualizado.id)

        if (error) throw error

        // Update local state
        setClientes(clientes.map((c) => (c.id === clienteAtualizado.id ? clienteAtualizado : c)))

        // Definir a aba para mostrar
        abaParaMostrar = "clientes"

        return {
          success: true,
          message: `Cliente "${clienteAtualizado.nome}" atualizado com sucesso!`,
          abaParaMostrar,
        }
      }

      case "createProduto": {
        // Verificar campos obrigatórios
        const camposFaltantes = []
        if (!data.nome) camposFaltantes.push("nome")
        if (!data.valorBase) camposFaltantes.push("valorBase")
        if (!data.tecidos || data.tecidos.length === 0) camposFaltantes.push("tecidos")
        if (!data.cores || data.cores.length === 0) camposFaltantes.push("cores")
        if (!data.tamanhosDisponiveis || data.tamanhosDisponiveis.length === 0)
          camposFaltantes.push("tamanhosDisponiveis")

        if (camposFaltantes.length > 0) {
          return {
            success: false,
            message: `Por favor, forneça as seguintes informações obrigatórias: ${camposFaltantes.join(", ")}`,
          }
        }

        // Verificar se o produto já existe pelo nome
        const produtoExistente = produtos.find((p) => p.nome.toLowerCase() === data.nome.toLowerCase())

        if (produtoExistente) {
          return {
            success: true,
            message: `Produto "${data.nome}" já existe no sistema. Usando o produto existente.`,
            abaParaMostrar: "produtos",
          }
        }

        // Verificar se os tecidos existem - se não existirem, criar automaticamente
        for (let i = 0; i < data.tecidos.length; i++) {
          const tecido = data.tecidos[i]
          const tecidoExistente = tecidos.find((t) => t.nome.toLowerCase() === tecido.nome.toLowerCase())
          if (!tecidoExistente) {
            // Criar o tecido automaticamente
            const novoTecido = {
              id: generateUUID(),
              nome: tecido.nome,
              composicao: tecido.composicao || "Composição não especificada",
            }

            // Insert into Supabase
            const { error } = await supabase.from("tecidos_base").insert({
              id: novoTecido.id,
              nome: novoTecido.nome,
              composicao: novoTecido.composicao,
            })

            if (error) throw error

            // Update local state
            tecidos.push(novoTecido)
            setTecidos([...tecidos])
          }
        }

        // Verificar se as cores existem - se não existirem, criar automaticamente
        for (let i = 0; i < data.cores.length; i++) {
          const cor = data.cores[i]
          const corExistente = cores.find((c) => c.nome.toLowerCase() === cor.toLowerCase())
          if (!corExistente) {
            // Criar a cor automaticamente
            const novaCor = {
              id: generateUUID(),
              nome: cor,
              codigo_hex: "#000000", // Cor padrão
            }

            // Insert into Supabase
            const { error } = await supabase.from("cores").insert({
              id: novaCor.id,
              nome: novaCor.nome,
              codigo_hex: novaCor.codigo_hex,
            })

            if (error) throw error

            // Update local state
            cores.push(novaCor)
            setCores([...cores])
          }
        }

        // Obter o próximo código sequencial
        const codigo = await obterProximoCodigoProduto()

        // Create a new product
        const novoProduto: Produto = {
          id: generateUUID(),
          codigo,
          nome: data.nome,
          valorBase: data.valorBase || 0,
          tecidos: data.tecidos || [],
          cores: data.cores || [],
          tamanhosDisponiveis: data.tamanhosDisponiveis || [],
        }

        // Insert into Supabase
        const { error: produtoError } = await supabase.from("produtos").insert({
          id: novoProduto.id,
          codigo: novoProduto.codigo,
          nome: novoProduto.nome,
          valor_base: novoProduto.valorBase,
          cores: novoProduto.cores,
          tamanhos_disponiveis: novoProduto.tamanhosDisponiveis,
        })

        if (produtoError) throw produtoError

        // Insert tecidos
        if (novoProduto.tecidos && novoProduto.tecidos.length > 0) {
          const tecidosParaInserir = novoProduto.tecidos.map((tecido) => ({
            nome: tecido.nome,
            composicao: tecido.composicao,
            produto_id: novoProduto.id,
          }))

          const { error: tecidosError } = await supabase.from("tecidos").insert(tecidosParaInserir)

          if (tecidosError) throw tecidosError
        }

        // Update local state
        setProdutos([...produtos, novoProduto])

        // Definir a aba para mostrar
        abaParaMostrar = "produtos"

        return {
          success: true,
          message: `Produto "${novoProduto.nome}" (${novoProduto.codigo}) criado com sucesso!`,
          abaParaMostrar,
        }
      }

      case "updateProduto": {
        // Verificar campos obrigatórios
        const camposFaltantes = []
        if (!data.id) camposFaltantes.push("id")
        if (!data.nome) camposFaltantes.push("nome")
        if (!data.valorBase) camposFaltantes.push("valorBase")
        if (!data.tecidos || data.tecidos.length === 0) camposFaltantes.push("tecidos")
        if (!data.cores || data.cores.length === 0) camposFaltantes.push("cores")
        if (!data.tamanhosDisponiveis || data.tamanhosDisponiveis.length === 0)
          camposFaltantes.push("tamanhosDisponiveis")

        if (camposFaltantes.length > 0) {
          return {
            success: false,
            message: `Por favor, forneça as seguintes informações obrigatórias: ${camposFaltantes.join(", ")}`,
          }
        }

        // Verificar se o produto existe
        const produtoExistente = produtos.find((p) => p.id === data.id)

        if (!produtoExistente) {
          return {
            success: false,
            message: `Produto com ID "${data.id}" não encontrado.`,
          }
        }

        // Verificar se os tecidos existem - se não existirem, criar automaticamente
        for (let i = 0; i < data.tecidos.length; i++) {
          const tecido = data.tecidos[i]
          const tecidoExistente = tecidos.find((t) => t.nome.toLowerCase() === tecido.nome.toLowerCase())
          if (!tecidoExistente) {
            // Criar o tecido automaticamente
            const novoTecido = {
              id: generateUUID(),
              nome: tecido.nome,
              composicao: tecido.composicao || "Composição não especificada",
            }

            // Insert into Supabase
            const { error } = await supabase.from("tecidos_base").insert({
              id: novoTecido.id,
              nome: novoTecido.nome,
              composicao: novoTecido.composicao,
            })

            if (error) throw error

            // Update local state
            tecidos.push(novoTecido)
            setTecidos([...tecidos])
          }
        }

        // Verificar se as cores existem - se não existirem, criar automaticamente
        for (let i = 0; i < data.cores.length; i++) {
          const cor = data.cores[i]
          const corExistente = cores.find((c) => c.nome.toLowerCase() === cor.toLowerCase())
          if (!corExistente) {
            // Criar a cor automaticamente
            const novaCor = {
              id: generateUUID(),
              nome: cor,
              codigo_hex: "#000000", // Cor padrão
            }

            // Insert into Supabase
            const { error } = await supabase.from("cores").insert({
              id: novaCor.id,
              nome: novaCor.nome,
              codigo_hex: novaCor.codigo_hex,
            })

            if (error) throw error

            // Update local state
            cores.push(novaCor)
            setCores([...cores])
          }
        }

        // Update the product
        const produtoAtualizado: Produto = {
          ...produtoExistente,
          nome: data.nome,
          valorBase: data.valorBase || produtoExistente.valorBase,
          tecidos: data.tecidos || produtoExistente.tecidos,
          cores: data.cores || produtoExistente.cores,
          tamanhosDisponiveis: data.tamanhosDisponiveis || produtoExistente.tamanhosDisponiveis,
        }

        // Update in Supabase
        const { error: produtoError } = await supabase
          .from("produtos")
          .update({
            nome: produtoAtualizado.nome,
            valor_base: produtoAtualizado.valorBase,
            cores: produtoAtualizado.cores,
            tamanhos_disponiveis: produtoAtualizado.tamanhosDisponiveis,
            updated_at: new Date().toISOString(),
          })
          .eq("id", produtoAtualizado.id)

        if (produtoError) throw produtoError

        // Remove old tecidos
        const { error: deleteTecidosError } = await supabase
          .from("tecidos")
          .delete()
          .eq("produto_id", produtoAtualizado.id)

        if (deleteTecidosError) throw deleteTecidosError

        // Insert new tecidos
        if (produtoAtualizado.tecidos && produtoAtualizado.tecidos.length > 0) {
          const tecidosParaInserir = produtoAtualizado.tecidos.map((tecido) => ({
            nome: tecido.nome,
            composicao: tecido.composicao,
            produto_id: produtoAtualizado.id,
          }))

          const { error: tecidosError } = await supabase.from("tecidos").insert(tecidosParaInserir)

          if (tecidosError) throw tecidosError
        }

        // Update local state
        setProdutos(produtos.map((p) => (p.id === produtoAtualizado.id ? produtoAtualizado : p)))

        // Definir a aba para mostrar
        abaParaMostrar = "produtos"

        return {
          success: true,
          message: `Produto "${produtoAtualizado.nome}" atualizado com sucesso!`,
          abaParaMostrar,
        }
      }

      case "createOrcamento": {
        // Verificar campos obrigatórios
        const camposFaltantes = []
        if (!data.cliente) camposFaltantes.push("cliente")
        if (!data.itens || data.itens.length === 0) camposFaltantes.push("itens")

        if (data.itens && data.itens.length > 0) {
          data.itens.forEach((item: any, index: number) => {
            if (!item.produto) camposFaltantes.push(`itens[${index}].produto`)
            if (!item.quantidade) camposFaltantes.push(`itens[${index}].quantidade`)
            if (!item.valorUnitario) camposFaltantes.push(`itens[${index}].valorUnitario`)

            // Verificar estampas
            if (item.estampas && item.estampas.length > 0) {
              item.estampas.forEach((estampa: any, estampaIndex: number) => {
                if (!estampa.posicao) camposFaltantes.push(`itens[${index}].estampas[${estampaIndex}].posicao`)
                if (!estampa.tipo) camposFaltantes.push(`itens[${index}].estampas[${estampaIndex}].tipo`)
                if (!estampa.largura) camposFaltantes.push(`itens[${index}].estampas[${estampaIndex}].largura`)
              })
            }
          })
        }

        if (camposFaltantes.length > 0) {
          return {
            success: false,
            message: `Por favor, forneça as seguintes informações obrigatórias: ${camposFaltantes.join(", ")}`,
          }
        }

        // Find the client by name
        let clienteId = ""
        const cliente = clientes.find((c) => c.nome.toLowerCase() === data.cliente.toLowerCase())

        if (!cliente) {
          // Criar um novo cliente automaticamente
          const novoCliente: Cliente = {
            id: generateUUID(),
            codigo: await obterProximoCodigoCliente(),
            nome: data.cliente,
            cnpj: "00.000.000/0000-00", // CNPJ fictício
            endereco: "Endereço não especificado",
            telefone: "(00) 0000-0000",
            email: `contato@${data.cliente.toLowerCase().replace(/\s+/g, "")}.com.br`,
            contato: "Contato não especificado",
          }

          // Insert into Supabase
          const { error } = await supabase.from("clientes").insert({
            id: novoCliente.id,
            codigo: novoCliente.codigo,
            nome: novoCliente.nome,
            cnpj: novoCliente.cnpj || null,
            endereco: novoCliente.endereco || null,
            telefone: novoCliente.telefone || null,
            email: novoCliente.email || null,
            contato: novoCliente.contato || null,
          })

          if (error) throw error

          // Update local state
          setClientes([...clientes, novoCliente])

          clienteId = novoCliente.id
        } else {
          clienteId = cliente.id
        }

        // Process items
        const itens: ItemOrcamento[] = []

        for (const itemData of data.itens) {
          // Find the product by name
          const produto = produtos.find((p) => p.nome.toLowerCase() === itemData.produto.toLowerCase())

          if (!produto) {
            // Criar um novo produto automaticamente
            const novoProduto: Produto = {
              id: generateUUID(),
              codigo: await obterProximoCodigoProduto(),
              nome: itemData.produto,
              valorBase: itemData.valorUnitario || 50.0, // Valor base padrão
              tecidos: [
                { nome: itemData.tecidoSelecionado || "Tecido padrão", composicao: "Composição não especificada" },
              ],
              cores: [itemData.corSelecionada || "Cor padrão"],
              tamanhosDisponiveis: Object.keys(itemData.tamanhos || { P: 0, M: 0, G: 0 }),
            }

            // Insert into Supabase
            const { error: produtoError } = await supabase.from("produtos").insert({
              id: novoProduto.id,
              codigo: novoProduto.codigo,
              nome: novoProduto.nome,
              valor_base: novoProduto.valorBase,
              cores: novoProduto.cores,
              tamanhos_disponiveis: novoProduto.tamanhosDisponiveis,
            })

            if (produtoError) throw produtoError

            // Insert tecidos
            if (novoProduto.tecidos && novoProduto.tecidos.length > 0) {
              const tecidosParaInserir = novoProduto.tecidos.map((tecido) => ({
                nome: tecido.nome,
                composicao: tecido.composicao,
                produto_id: novoProduto.id,
              }))

              const { error: tecidosError } = await supabase.from("tecidos").insert(tecidosParaInserir)

              if (tecidosError) throw tecidosError
            }

            // Update local state
            setProdutos([...produtos, novoProduto])

            // Create the item
            const item: ItemOrcamento = {
              id: generateUUID(),
              produtoId: novoProduto.id,
              produto: novoProduto,
              quantidade: itemData.quantidade || 1,
              valorUnitario: itemData.valorUnitario || novoProduto.valorBase,
              tecidoSelecionado: itemData.tecidoSelecionado
                ? { nome: itemData.tecidoSelecionado, composicao: "Composição não especificada" }
                : { nome: novoProduto.tecidos[0].nome, composicao: novoProduto.tecidos[0].composicao },
              corSelecionada: itemData.corSelecionada || novoProduto.cores[0],
              tamanhos: itemData.tamanhos || { P: 0, M: 0, G: 0 },
              estampas: itemData.estampas || [], // Incluir estampas
            }

            itens.push(item)
          } else {
            // Verificar se o tecido existe para o produto
            let tecidoSelecionado = undefined
            if (itemData.tecidoSelecionado) {
              const tecidoExiste = produto.tecidos.some(
                (t) => t.nome.toLowerCase() === itemData.tecidoSelecionado.toLowerCase(),
              )

              if (!tecidoExiste) {
                // Usar o primeiro tecido disponível
                tecidoSelecionado =
                  produto.tecidos.length > 0
                    ? { nome: produto.tecidos[0].nome, composicao: produto.tecidos[0].composicao }
                    : undefined
              } else {
                tecidoSelecionado = {
                  nome: itemData.tecidoSelecionado,
                  composicao:
                    produto.tecidos.find((t) => t.nome.toLowerCase() === itemData.tecidoSelecionado.toLowerCase())
                      ?.composicao || "",
                }
              }
            } else if (produto.tecidos.length > 0) {
              // Se não foi especificado, usar o primeiro tecido disponível
              tecidoSelecionado = {
                nome: produto.tecidos[0].nome,
                composicao: produto.tecidos[0].composicao,
              }
            }

            // Verificar se a cor existe para o produto
            let corSelecionada = itemData.corSelecionada
            if (itemData.corSelecionada) {
              const corExiste = produto.cores.some((c) => c.toLowerCase() === itemData.corSelecionada.toLowerCase())

              if (!corExiste && produto.cores.length > 0) {
                // Usar a primeira cor disponível
                corSelecionada = produto.cores[0]
              }
            } else if (produto.cores.length > 0) {
              // Se não foi especificado, usar a primeira cor disponível
              corSelecionada = produto.cores[0]
            }

            // Verificar se os tamanhos existem para o produto
            let tamanhos = itemData.tamanhos || {}
            if (Object.keys(tamanhos).length === 0 && produto.tamanhosDisponiveis.length > 0) {
              // Se não foram especificados tamanhos, criar um objeto com todos os tamanhos disponíveis
              tamanhos = produto.tamanhosDisponiveis.reduce(
                (acc, tamanho) => {
                  acc[tamanho] = 0
                  return acc
                },
                {} as Record<string, number>,
              )

              // Distribuir a quantidade total entre os tamanhos
              const quantidadeTotal = itemData.quantidade || 1
              const quantidadePorTamanho = Math.floor(quantidadeTotal / produto.tamanhosDisponiveis.length)
              const resto = quantidadeTotal % produto.tamanhosDisponiveis.length

              produto.tamanhosDisponiveis.forEach((tamanho, index) => {
                tamanhos[tamanho] = quantidadePorTamanho + (index < resto ? 1 : 0)
              })
            } else {
              // Verificar se os tamanhos especificados existem
              for (const tamanho in tamanhos) {
                const tamanhoExiste = produto.tamanhosDisponiveis.some((t) => t.toLowerCase() === tamanho.toLowerCase())

                if (!tamanhoExiste) {
                  // Remover o tamanho que não existe
                  delete tamanhos[tamanho]
                }
              }

              // Se todos os tamanhos foram removidos, usar os tamanhos disponíveis
              if (Object.keys(tamanhos).length === 0 && produto.tamanhosDisponiveis.length > 0) {
                const quantidadeTotal = itemData.quantidade || 1
                const quantidadePorTamanho = Math.floor(quantidadeTotal / produto.tamanhosDisponiveis.length)
                const resto = quantidadeTotal % produto.tamanhosDisponiveis.length

                produto.tamanhosDisponiveis.forEach((tamanho, index) => {
                  tamanhos[tamanho] = quantidadePorTamanho + (index < resto ? 1 : 0)
                })
              }
            }

            // Create the item
            const item: ItemOrcamento = {
              id: generateUUID(),
              produtoId: produto.id,
              produto: produto,
              quantidade: itemData.quantidade || 1,
              valorUnitario: itemData.valorUnitario || produto.valorBase,
              tecidoSelecionado: tecidoSelecionado,
              corSelecionada: corSelecionada,
              tamanhos: tamanhos,
              estampas: itemData.estampas || [], // Incluir estampas
            }

            itens.push(item)
          }
        }

        // Obter o próximo número de orçamento usando a mesma função do processo manual
        const proximoNumero = await obterProximoNumeroOrcamento()

        // Formatar o número do orçamento com os dados do cliente e do primeiro item
        const clienteObj = cliente || clientes.find((c) => c.id === clienteId)
        const itemDescricao = itens.length > 0 ? itens[0].produto?.nome || "Item" : "Item"
        const novoNumero = `${proximoNumero} - ${itemDescricao} - ${clienteObj?.nome} - ${clienteObj?.contato}`

        // Create the new orçamento with the correct sequential number
        const novoOrcamento: Orcamento = {
          id: generateUUID(),
          numero: novoNumero,
          data: new Date().toISOString().split("T")[0],
          cliente: clienteObj!,
          itens: itens,
          observacoes: data.observacoes || "",
          condicoesPagamento: data.condicoesPagamento || "À vista",
          prazoEntrega: data.prazoEntrega || "30 dias",
          validadeOrcamento: data.validadeOrcamento || "15 dias",
        }

        // Insert into Supabase
        const { error, data: orcamentoData } = await supabase
          .from("orcamentos")
          .insert({
            id: novoOrcamento.id,
            numero: novoOrcamento.numero,
            data: novoOrcamento.data,
            cliente_id: clienteId,
            observacoes: novoOrcamento.observacoes,
            condicoes_pagamento: novoOrcamento.condicoesPagamento,
            prazo_entrega: novoOrcamento.prazoEntrega,
            validade_orcamento: novoOrcamento.validadeOrcamento,
            itens: JSON.stringify(novoOrcamento.itens),
          })
          .select()

        if (error) throw error

        // Insert items
        for (const item of itens) {
          const { error: itemError } = await supabase.from("itens_orcamento").insert({
            id: item.id,
            orcamento_id: novoOrcamento.id,
            produto_id: item.produtoId,
            quantidade: item.quantidade,
            valor_unitario: item.valorUnitario,
            tecido_nome: item.tecidoSelecionado?.nome,
            tecido_composicao: item.tecidoSelecionado?.composicao,
            cor_selecionada: item.corSelecionada,
            tamanhos: item.tamanhos,
          })

          if (itemError) throw itemError

          // Inserir estampas
          if (item.estampas && item.estampas.length > 0) {
            const estampasParaInserir = item.estampas.map((estampa) => ({
              id: estampa.id || generateUUID(),
              item_orcamento_id: item.id,
              posicao: estampa.posicao,
              tipo: estampa.tipo,
              largura: estampa.largura,
            }))

            const { error: estampasError } = await supabase.from("estampas").insert(estampasParaInserir)

            if (estampasError) throw estampasError
          }
        }

        // Update local state
        setOrcamento(novoOrcamento)

        // Definir a aba para mostrar
        abaParaMostrar = "orcamento"

        return {
          success: true,
          message: `Orçamento "${novoOrcamento.numero}" criado com sucesso!`,
          abaParaMostrar,
        }
      }

      // Adicionar os outros casos (updateOrcamento, extractOrcamento, etc.) com a mesma lógica de abaParaMostrar

      case "extractOrcamento": {
        // Check if we need to create a new client
        let cliente: Cliente | undefined

        if (data.cliente && data.cliente.nome) {
          // Try to find an existing client
          cliente = clientes.find(
            (c) =>
              c.nome.toLowerCase().includes(data.cliente.nome.toLowerCase()) ||
              data.cliente.nome.toLowerCase().includes(c.nome.toLowerCase()),
          )

          if (!cliente) {
            // Create a new client
            cliente = {
              id: generateUUID(),
              codigo: await obterProximoCodigoCliente(),
              nome: data.cliente.nome,
              cnpj: "00.000.000/0000-00", // CNPJ fictício
              endereco: "Endereço não especificado",
              telefone: "(00) 0000-0000",
              email: `contato@${data.cliente.nome.toLowerCase().replace(/\s+/g, "")}.com.br`,
              contato: data.cliente.contato || "Contato não especificado",
            }

            // Insert into Supabase
            const { error } = await supabase.from("clientes").insert({
              id: cliente.id,
              codigo: cliente.codigo,
              nome: cliente.nome,
              cnpj: cliente.cnpj || null,
              endereco: cliente.endereco || null,
              telefone: cliente.telefone || null,
              email: cliente.email || null,
              contato: cliente.contato || null,
            })

            if (error) throw error

            // Update local state
            setClientes([...clientes, cliente])
          }
        } else {
          return {
            success: false,
            message: "Não foi possível identificar o cliente no orçamento. Por favor, forneça o nome do cliente.",
          }
        }

        // Process items
        const itens: ItemOrcamento[] = []

        if (data.itens && Array.isArray(data.itens)) {
          for (const itemData of data.itens) {
            // Try to find an existing product or create a new one
            let produto: Produto | undefined

            if (itemData.produto) {
              produto = produtos.find(
                (p) =>
                  p.nome.toLowerCase().includes(itemData.produto.toLowerCase()) ||
                  itemData.produto.toLowerCase().includes(p.nome.toLowerCase()),
              )

              if (!produto) {
                // Criar um novo produto automaticamente
                produto = {
                  id: generateUUID(),
                  codigo: await obterProximoCodigoProduto(),
                  nome: itemData.produto,
                  valorBase: itemData.valorUnitario || 50.0, // Valor base padrão
                  tecidos: itemData.tecidoSelecionado
                    ? [{ nome: itemData.tecidoSelecionado, composicao: "Composição não especificada" }]
                    : [{ nome: "Tecido padrão", composicao: "Composição não especificada" }],
                  cores: itemData.corSelecionada ? [itemData.corSelecionada] : ["Cor padrão"],
                  tamanhosDisponiveis: itemData.tamanhos ? Object.keys(itemData.tamanhos) : ["P", "M", "G"],
                }

                // Insert into Supabase
                const { error: produtoError } = await supabase.from("produtos").insert({
                  id: produto.id,
                  codigo: produto.codigo,
                  nome: produto.nome,
                  valor_base: produto.valorBase,
                  cores: produto.cores,
                  tamanhos_disponiveis: produto.tamanhosDisponiveis,
                })

                if (produtoError) throw produtoError

                // Insert tecidos
                if (produto.tecidos && produto.tecidos.length > 0) {
                  const tecidosParaInserir = produto.tecidos.map((tecido) => ({
                    nome: tecido.nome,
                    composicao: tecido.composicao,
                    produto_id: produto.id,
                  }))

                  const { error: tecidosError } = await supabase.from("tecidos").insert(tecidosParaInserir)

                  if (tecidosError) throw tecidosError
                }

                // Update local state
                setProdutos([...produtos, produto])
              }

              // Create the item
              const item: ItemOrcamento = {
                id: generateUUID(),
                produtoId: produto.id,
                produto: produto,
                quantidade: itemData.quantidade || 1,
                valorUnitario: itemData.valorUnitario || produto.valorBase,
                tecidoSelecionado: itemData.tecidoSelecionado
                  ? { nome: itemData.tecidoSelecionado, composicao: "Composição não especificada" }
                  : produto.tecidos.length > 0
                    ? { nome: produto.tecidos[0].nome, composicao: produto.tecidos[0].composicao }
                    : undefined,
                corSelecionada: itemData.corSelecionada || (produto.cores.length > 0 ? produto.cores[0] : undefined),
                tamanhos: itemData.tamanhos || {},
                estampas: itemData.estampas || [],
              }

              itens.push(item)
            }
          }
        }

        // Obter o próximo número de orçamento
        const proximoNumero = await obterProximoNumeroOrcamento()

        // Formatar o número do orçamento
        const itemDescricao = itens.length > 0 ? itens[0].produto?.nome || "Item" : "Item"
        const novoNumero = data.numero
          ? data.numero
          : `${proximoNumero} - ${itemDescricao} - ${cliente.nome} - ${cliente.contato}`

        // Create the new orçamento
        const novoOrcamento: Orcamento = {
          id: generateUUID(),
          numero: novoNumero,
          data: new Date().toISOString().split("T")[0],
          cliente: cliente,
          itens: itens,
          observacoes: data.observacoes || "",
          condicoesPagamento: data.condicoesPagamento || "À vista",
          prazoEntrega: data.prazoEntrega || "30 dias",
          validadeOrcamento: data.validadeOrcamento || "15 dias",
        }

        // Insert into Supabase
        const { error, data: orcamentoData } = await supabase
          .from("orcamentos")
          .insert({
            id: novoOrcamento.id,
            numero: novoOrcamento.numero,
            data: novoOrcamento.data,
            cliente_id: cliente.id,
            observacoes: novoOrcamento.observacoes,
            condicoes_pagamento: novoOrcamento.condicoesPagamento,
            prazo_entrega: novoOrcamento.prazoEntrega,
            validade_orcamento: novoOrcamento.validadeOrcamento,
            itens: JSON.stringify(novoOrcamento.itens),
          })
          .select()

        if (error) throw error

        // Insert items
        for (const item of itens) {
          const { error: itemError } = await supabase.from("itens_orcamento").insert({
            id: item.id,
            orcamento_id: novoOrcamento.id,
            produto_id: item.produtoId,
            quantidade: item.quantidade,
            valor_unitario: item.valorUnitario,
            tecido_nome: item.tecidoSelecionado?.nome,
            tecido_composicao: item.tecidoSelecionado?.composicao,
            cor_selecionada: item.corSelecionada,
            tamanhos: item.tamanhos,
          })

          if (itemError) throw itemError

          // Insert estampas if any
          if (item.estampas && item.estampas.length > 0) {
            const estampasParaInserir = item.estampas.map((estampa) => ({
              id: estampa.id || generateUUID(),
              item_orcamento_id: item.id,
              posicao: estampa.posicao,
              tipo: estampa.tipo,
              largura: estampa.largura,
            }))

            const { error: estampasError } = await supabase.from("estampas").insert(estampasParaInserir)

            if (estampasError) throw estampasError
          }
        }

        // Update local state
        setOrcamento(novoOrcamento)

        // Definir a aba para mostrar
        abaParaMostrar = "orcamento"

        return {
          success: true,
          message: `Orçamento extraído e criado com sucesso! Número: ${novoOrcamento.numero}`,
          abaParaMostrar,
        }
      }

      case "autoComplete": {
        // Preencher automaticamente as informações faltantes
        return processGeminiAction(
          data.action,
          data.data,
          clientes,
          produtos,
          orcamento,
          setClientes,
          setProdutos,
          setOrcamento,
          cores,
          tecidos,
          setCores,
          setTecidos,
          false,
        )
      }

      default:
        return { success: false, message: "Ação não reconhecida." }
    }
  } catch (error) {
    console.error("Erro ao processar ação:", error)
    return {
      success: false,
      message: `Erro ao processar ação: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
    }
  }
}

// New function to extract text from PDF
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // For now, we'll just return a placeholder
    // In a real implementation, you would use a PDF parsing library
    // or a server-side function to extract text from the PDF

    // Return the file content as text (this is a simplified approach)
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        // This is a simplified approach - in reality, you'd need to parse the PDF
        // and extract the text properly
        resolve(reader.result as string)
      }
      reader.onerror = reject
      reader.readAsText(file)
    })
  } catch (error) {
    console.error("Erro ao extrair texto do PDF:", error)
    throw error
  }
}
