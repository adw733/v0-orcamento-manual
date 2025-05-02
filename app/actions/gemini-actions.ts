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

// Modificar a função generateWithGemini para incluir instruções sobre verificar clientes e produtos existentes
const systemPrompt = `
Você é um assistente especializado em criar e editar dados para um sistema de orçamentos de uniformes industriais.

Analise o pedido do usuário e identifique se ele quer:
1. Criar um novo cliente
2. Criar um novo produto
3. Criar um novo orçamento
4. Editar um cliente existente
5. Editar um produto existente
6. Editar um orçamento existente
7. Extrair informações de um orçamento em formato de texto ou imagem

IMPORTANTE: Sempre verifique se o cliente ou produto já existe antes de criar um novo. Pergunte ao usuário se deseja criar um novo quando não encontrar o solicitado.

Responda APENAS com um JSON no seguinte formato, SEM usar blocos de código markdown:

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
  "verificar": true
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
  "verificar": true
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
        "tamanhos": { "P": 2, "M": 5, "G": 3 }
      }
    ],
    "observacoes": "Observações",
    "condicoesPagamento": "À vista",
    "prazoEntrega": "30 dias",
    "validadeOrcamento": "15 dias"
  },
  "verificar": true
}

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
  }
}

Para editar, use os mesmos formatos acima, mas com a action "updateCliente", "updateProduto" ou "updateOrcamento", e inclua o ID do item a ser editado.

Se não conseguir entender o pedido, responda com:
{
  "action": "unknown",
  "message": "Não entendi o que você quer fazer. Por favor, seja mais específico."
}

IMPORTANTE: Não use blocos de código markdown (\`\`\`). Retorne apenas o JSON puro.

Preencha todos os campos necessários. Se alguma informação estiver faltando no pedido do usuário, crie dados fictícios plausíveis baseados no contexto.
`

export async function generateWithGemini(
  prompt: string,
  clientes: Cliente[] = [],
  produtos: Produto[] = [],
): Promise<{
  success: boolean
  message: string
  data?: any
  action?: string
}> {
  try {
    const apiKey = await getGeminiApiKey()

    // Initialize the Gemini API with the correct class name
    const genAI = new GoogleGenerativeAI(apiKey)

    // Get the model using the correct model name with free quota
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro-exp-03-25" })

    // Criar listas de clientes e produtos para incluir no prompt
    const clientesLista =
      clientes.length > 0
        ? `Clientes existentes: ${clientes.map((c) => c.nome).join(", ")}`
        : "Não há clientes cadastrados."

    const produtosLista =
      produtos.length > 0
        ? `Produtos existentes: ${produtos.map((p) => p.nome).join(", ")}`
        : "Não há produtos cadastrados."

    // Adicionar as listas ao prompt do sistema
    const systemPromptCompleto = `${systemPrompt}

${clientesLista}
${produtosLista}

Lembre-se de verificar se o cliente ou produto já existe antes de sugerir criar um novo.
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

// New function to process file uploads and extract text using Gemini Vision
export async function processFileWithGemini(
  fileContent: string,
  fileType: string,
  clientes: Cliente[] = [],
  produtos: Produto[] = [],
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

    // Criar listas de clientes e produtos para incluir no prompt
    const clientesLista =
      clientes.length > 0
        ? `Clientes existentes: ${clientes.map((c) => c.nome).join(", ")}`
        : "Não há clientes cadastrados."

    const produtosLista =
      produtos.length > 0
        ? `Produtos existentes: ${produtos.map((p) => p.nome).join(", ")}`
        : "Não há produtos cadastrados."

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

// Modificar a função processGeminiAction para verificar a existência de clientes e produtos
export async function processGeminiAction(
  action: string,
  data: any,
  clientes: Cliente[],
  produtos: Produto[],
  orcamento: Orcamento,
  setClientes: (clientes: Cliente[]) => void,
  setProdutos: (produtos: Produto[]) => void,
  setOrcamento: (orcamento: Orcamento) => void,
): Promise<{ success: boolean; message: string }> {
  try {
    // Generate a UUID for new items
    const generateUUID = () => {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0,
          v = c === "x" ? r : (r & 0x3) | 0x8
        return v.toString(16)
      })
    }

    switch (action) {
      case "createCliente": {
        // Verificar se o cliente já existe pelo nome
        const clienteExistente = clientes.find((c) => c.nome.toLowerCase() === data.nome.toLowerCase())

        if (clienteExistente) {
          return {
            success: true,
            message: `Cliente "${data.nome}" já existe no sistema. Usando o cliente existente.`,
          }
        }

        // Create a new client
        const novoCliente: Cliente = {
          id: generateUUID(),
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

        return { success: true, message: `Cliente "${novoCliente.nome}" criado com sucesso!` }
      }

      case "createProduto": {
        // Verificar se o produto já existe pelo nome
        const produtoExistente = produtos.find((p) => p.nome.toLowerCase() === data.nome.toLowerCase())

        if (produtoExistente) {
          return {
            success: true,
            message: `Produto "${data.nome}" já existe no sistema. Usando o produto existente.`,
          }
        }

        // Create a new product
        const novoProduto: Produto = {
          id: generateUUID(),
          nome: data.nome,
          valorBase: data.valorBase || 0,
          tecidos: data.tecidos || [],
          cores: data.cores || [],
          tamanhosDisponiveis: data.tamanhosDisponiveis || [],
        }

        // Insert into Supabase
        const { error: produtoError } = await supabase.from("produtos").insert({
          id: novoProduto.id,
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

        return { success: true, message: `Produto "${novoProduto.nome}" criado com sucesso!` }
      }

      case "createOrcamento": {
        // Find the client by name
        let clienteId = ""
        const cliente = clientes.find((c) => c.nome.toLowerCase() === data.cliente.toLowerCase())

        if (!cliente) {
          // Perguntar se deseja criar um novo cliente
          return {
            success: false,
            message: `Cliente "${data.cliente}" não encontrado. Deseja criar um novo cliente com este nome? Responda com "Sim, criar cliente" ou forneça o nome de um cliente existente.`,
          }
        }

        clienteId = cliente.id

        // Process items
        const itens: ItemOrcamento[] = []

        for (const itemData of data.itens) {
          // Find the product by name
          const produto = produtos.find((p) => p.nome.toLowerCase() === itemData.produto.toLowerCase())

          if (!produto) {
            // Perguntar se deseja criar um novo produto
            return {
              success: false,
              message: `Produto "${itemData.produto}" não encontrado. Deseja criar um novo produto com este nome? Responda com "Sim, criar produto" ou forneça o nome de um produto existente.`,
            }
          }

          // Create the item
          const item: ItemOrcamento = {
            id: generateUUID(),
            produtoId: produto.id,
            produto: produto,
            quantidade: itemData.quantidade || 0,
            valorUnitario: itemData.valorUnitario || produto.valorBase,
            tecidoSelecionado: itemData.tecidoSelecionado
              ? { nome: itemData.tecidoSelecionado, composicao: "" }
              : undefined,
            corSelecionada: itemData.corSelecionada,
            tamanhos: itemData.tamanhos || {},
            estampas: [], // Inicializar com array vazio
          }

          itens.push(item)
        }

        // Obter o próximo número de orçamento usando a mesma função do processo manual
        const proximoNumero = await obterProximoNumeroOrcamento()

        // Formatar o número do orçamento com os dados do cliente e do primeiro item
        const itemDescricao = itens.length > 0 ? itens[0].produto?.nome || "Item" : "Item"
        const novoNumero = `${proximoNumero} - ${itemDescricao} - ${cliente.nome} - ${cliente.contato}`

        // Create the new orçamento with the correct sequential number
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
        }

        // Update local state
        setOrcamento(novoOrcamento)

        return { success: true, message: `Orçamento "${novoOrcamento.numero}" criado com sucesso!` }
      }

      // Add case for extractOrcamento
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
              nome: data.cliente.nome,
              cnpj: "",
              endereco: "",
              telefone: "",
              email: "",
              contato: data.cliente.contato || "",
            }

            // Insert into Supabase
            const { error } = await supabase.from("clientes").insert({
              id: cliente.id,
              nome: cliente.nome,
              cnpj: null,
              endereco: null,
              telefone: null,
              email: null,
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
                // Create a new product
                produto = {
                  id: generateUUID(),
                  nome: itemData.produto,
                  valorBase: itemData.valorUnitario || 0,
                  tecidos: itemData.tecidoSelecionado ? [{ nome: itemData.tecidoSelecionado, composicao: "" }] : [],
                  cores: itemData.corSelecionada ? [itemData.corSelecionada] : [],
                  tamanhosDisponiveis: itemData.tamanhos ? Object.keys(itemData.tamanhos) : [],
                }

                // Insert into Supabase
                const { error: produtoError } = await supabase.from("produtos").insert({
                  id: produto.id,
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
                quantidade: itemData.quantidade || 0,
                valorUnitario: itemData.valorUnitario || produto.valorBase,
                tecidoSelecionado: itemData.tecidoSelecionado
                  ? { nome: itemData.tecidoSelecionado, composicao: "" }
                  : undefined,
                corSelecionada: itemData.corSelecionada,
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

        return {
          success: true,
          message: `Orçamento extraído e criado com sucesso! Número: ${novoOrcamento.numero}`,
        }
      }

      // Add other cases for updating as needed

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
