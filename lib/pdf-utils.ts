/**
 * Função para gerar um PDF a partir de um elemento HTML
 * Esta função será importada dinamicamente para evitar problemas de SSR
 */
export async function generatePDF(
  element: HTMLElement,
  filename: string,
  tipoExportacao: "completo" | "ficha" | "orcamento" = "completo",
): Promise<void> {
  try {
    // Importar dinamicamente as bibliotecas necessárias
    const [jspdfModule, html2canvasModule] = await Promise.all([import("jspdf"), import("html2canvas")])

    const jsPDF = jspdfModule.default
    const html2canvas = html2canvasModule.default

    // Criar uma nova instância do jsPDF
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    })

    // Configurações de página A4
    const pageWidth = 210 // largura A4 em mm
    const pageHeight = 297 // altura A4 em mm
    const margin = 10 // Mantendo 10mm para garantir margens adequadas
    const contentWidth = pageWidth - margin * 2 // 194mm
    const contentHeight = pageHeight - margin * 2 // 281mm

    // Encontrar as páginas apropriadas com base no tipo de exportação
    const pages: HTMLElement[] = []

    if (tipoExportacao === "orcamento") {
      // Apenas o orçamento principal
      const orcamentoPrincipal = element.querySelector(".orcamento-principal") as HTMLElement
      if (orcamentoPrincipal) {
        pages.push(orcamentoPrincipal)
      }
    } else if (tipoExportacao === "ficha") {
      // Apenas as fichas técnicas
      const fichasTecnicas = element.querySelectorAll(".ficha-tecnica")
      fichasTecnicas.forEach((ficha) => {
        pages.push(ficha as HTMLElement)
      })
    } else {
      // Documento completo (orçamento + fichas técnicas)
      const orcamentoPrincipal = element.querySelector(".orcamento-principal") as HTMLElement
      if (orcamentoPrincipal) {
        pages.push(orcamentoPrincipal)
      }

      const fichasTecnicas = element.querySelectorAll(".ficha-tecnica")
      fichasTecnicas.forEach((ficha) => {
        pages.push(ficha as HTMLElement)
      })
    }

    // Se não encontrou nenhuma página, retornar erro
    if (pages.length === 0) {
      throw new Error(`Não foi possível encontrar o conteúdo para exportar (${tipoExportacao})`)
    }

    // Processar cada página
    for (let i = 0; i < pages.length; i++) {
      const pagina = pages[i]

      // Clonar a página para aplicar estilos temporários
      const paginaClone = pagina.cloneNode(true) as HTMLElement

      // Aplicar estilos para garantir que caiba em uma página A4
      paginaClone.style.width = `${contentWidth}mm`
      paginaClone.style.maxWidth = `${contentWidth}mm`
      paginaClone.style.padding = "0"
      paginaClone.style.margin = "0"
      paginaClone.style.boxSizing = "border-box"
      paginaClone.style.overflow = "hidden"
      paginaClone.style.position = "absolute"
      paginaClone.style.left = "-9999px"
      paginaClone.style.backgroundColor = "#ffffff"

      // Ajustar imagens dentro da página
      const imagens = paginaClone.querySelectorAll("img")
      imagens.forEach((img) => {
        img.style.maxWidth = "70%" // Reduzido para 70%
        img.style.maxHeight = "420px" // Reduzido em 30% (de 600px para 420px)
        img.style.width = "auto"
        img.style.height = "auto"
        img.style.objectFit = "contain"
        img.style.display = "block"
        img.style.margin = "0 auto"
        img.style.padding = "15px" // Reduzido de 20px
      })

      // Ajustar observações para não ultrapassar o espaço
      const observacoes = paginaClone.querySelectorAll(
        ".pdf-observacoes, .pdf-observacoes-comercial, .pdf-observacoes-tecnica",
      )
      observacoes.forEach((obs) => {
        obs.style.maxHeight = "60px"
        obs.style.overflow = "hidden"
        obs.style.fontSize = "0.8rem"
        obs.style.lineHeight = "1.3"
      })

      // Ajustar tabelas de tamanhos
      const tabelasTamanhos = paginaClone.querySelectorAll(".tamanhos-table")
      tabelasTamanhos.forEach((table) => {
        table.style.fontSize = "0.85rem"
        table.style.width = "100%"
      })

      // Ajustar espaçamentos gerais
      paginaClone.style.fontSize = "0.85rem"
      const espacamentos = paginaClone.querySelectorAll(".space-y-6 > *, .space-y-4 > *")
      espacamentos.forEach((el) => {
        el.style.marginTop = "8px"
      })

      // Ajustar tabelas para não quebrar
      const tabelas = paginaClone.querySelectorAll("table")
      tabelas.forEach((table) => {
        table.style.width = "100%"
        table.style.tableLayout = "fixed"
        table.style.fontSize = "0.8rem"
      })

      // Adicionar ao DOM temporariamente
      document.body.appendChild(paginaClone)

      // Aguardar renderização
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Capturar a página
      const canvas = await html2canvas(paginaClone, {
        scale: 2.5, // Aumentado de 2 para 2.5 para melhor qualidade
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: paginaClone.scrollWidth,
        windowHeight: paginaClone.scrollHeight,
        allowTaint: true, // Adicionar para permitir imagens externas
      })

      // Remover o clone
      document.body.removeChild(paginaClone)

      // Adicionar nova página se não for a primeira
      if (i > 0) {
        pdf.addPage()
      }

      // Calcular dimensões para manter proporção
      const imgWidth = contentWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      // Se a imagem for maior que a página, redimensionar
      let finalWidth = imgWidth
      let finalHeight = imgHeight

      if (imgHeight > contentHeight) {
        const ratio = contentHeight / imgHeight
        finalWidth = imgWidth * ratio
        finalHeight = contentHeight
      }

      // Centralizar a imagem na página se for menor
      const xOffset = margin + (contentWidth - finalWidth) / 2
      const yOffset = margin

      // Adicionar a imagem ao PDF
      const imgData = canvas.toDataURL("image/jpeg", 0.95)
      pdf.addImage(imgData, "JPEG", xOffset, yOffset, finalWidth, finalHeight)
    }

    // Salvar o PDF
    pdf.save(filename)
  } catch (error) {
    console.error("Erro ao gerar PDF:", error)
    throw error
  }
}

/**
 * Função para formatar o nome do arquivo PDF
 */
export function formatPDFFilename(
  numeroOrcamento: string,
  tipoDocumento: "orcamento" | "ficha-tecnica" | "completo",
  nomeCliente?: string,
  nomeContato?: string,
): string {
  // Extrair apenas o número do orçamento (sem o nome do produto)
  const numeroLimpo = numeroOrcamento.split(" - ")[0]

  // Formatar o nome do cliente e contato
  const clienteFormatado = nomeCliente ? nomeCliente.replace(/\s+/g, "_").substring(0, 20) : "SEM_CLIENTE"
  const contatoFormatado = nomeContato ? nomeContato.replace(/\s+/g, "_").substring(0, 20) : "SEM_CONTATO"

  // Definir o prefixo correto com base no tipo de documento
  let prefixo = ""
  switch (tipoDocumento) {
    case "orcamento":
      prefixo = "01 - ORCAMENTO_"
      break
    case "ficha-tecnica":
      prefixo = "02 - FICHA_TECNICA_"
      break
    case "completo":
      prefixo = "00 - COMPLETO_"
      break
  }

  // Retornar o nome do arquivo formatado
  return `${prefixo}${numeroLimpo}_${clienteFormatado.toUpperCase()}_${contatoFormatado.toUpperCase()}.pdf`
}
