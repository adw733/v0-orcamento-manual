/**
 * Função para gerar um PDF a partir de um elemento HTML
 * Esta função será importada dinamicamente para evitar problemas de SSR
 */
export async function generatePDF(element: HTMLElement, filename: string): Promise<void> {
  try {
    // Importar dinamicamente as bibliotecas necessárias
    const [jspdfModule, html2canvasModule] = await Promise.all([import("jspdf"), import("html2canvas")])

    const jsPDF = jspdfModule.default
    const html2canvas = html2canvasModule.default

    // Criar uma cópia do elemento para manipulação
    const elementoParaCapturar = element.cloneNode(true) as HTMLElement

    // Aplicar estilos específicos para a captura
    elementoParaCapturar.style.width = "210mm" // Largura A4
    elementoParaCapturar.style.margin = "0"
    elementoParaCapturar.style.padding = "10mm" // Margem interna
    elementoParaCapturar.style.boxSizing = "border-box"
    elementoParaCapturar.style.backgroundColor = "#ffffff"

    // Adicionar o elemento ao DOM temporariamente para captura
    elementoParaCapturar.style.position = "absolute"
    elementoParaCapturar.style.left = "-9999px"
    document.body.appendChild(elementoParaCapturar)

    // Capturar o orçamento principal e as fichas técnicas separadamente
    const orcamentoElement = elementoParaCapturar.querySelector(".orcamento-principal") as HTMLElement
    const fichasTecnicas = Array.from(elementoParaCapturar.querySelectorAll(".ficha-tecnica")) as HTMLElement[]

    // Criar uma nova instância do jsPDF
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    })

    // Função para adicionar uma página ao PDF
    const adicionarPagina = async (elemento: HTMLElement, primeiraPagina = false) => {
      // Aplicar estilos específicos para a captura
      elemento.style.width = "210mm" // Largura A4
      elemento.style.margin = "0"
      elemento.style.padding = "10mm" // Margem interna
      elemento.style.boxSizing = "border-box"
      elemento.style.backgroundColor = "#ffffff"

      // Capturar o elemento como uma imagem
      const canvas = await html2canvas(elemento, {
        scale: 2, // Aumentar a escala para melhor qualidade
        useCORS: true,
        logging: false,
        backgroundColor: "#FFFFFF",
        width: elemento.offsetWidth,
        height: elemento.offsetHeight,
      })

      // Converter o canvas para uma imagem
      const imgData = canvas.toDataURL("image/jpeg", 1.0)

      // Calcular as dimensões para ajustar à página A4
      const imgWidth = 210 // A4 width in mm
      const pageHeight = 297 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      // Se não for a primeira página, adicionar uma nova página
      if (!primeiraPagina) {
        pdf.addPage()
      }

      // Adicionar a imagem ao PDF
      pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, Math.min(imgHeight, pageHeight))
    }

    // Adicionar o orçamento principal como primeira página
    if (orcamentoElement) {
      await adicionarPagina(orcamentoElement, true)
    }

    // Adicionar cada ficha técnica como uma página separada
    for (const ficha of fichasTecnicas) {
      await adicionarPagina(ficha)
    }

    // Remover o elemento temporário
    document.body.removeChild(elementoParaCapturar)

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
export function formatPDFFilename(numeroOrcamento: string, nomeCliente?: string): string {
  const dataFormatada = new Date().toISOString().split("T")[0].replace(/-/g, "")
  const clienteFormatado = nomeCliente ? nomeCliente.replace(/\s+/g, "_").substring(0, 20) : "sem_cliente"

  return `Orcamento_${numeroOrcamento}_${clienteFormatado}_${dataFormatada}.pdf`
}

/**
 * Função para preparar o conteúdo HTML para impressão/PDF
 */
export function prepareHTMLContent(element: HTMLElement): HTMLElement {
  // Clonar o elemento para não modificar o original
  const container = document.createElement("div")
  container.style.width = "210mm" // Largura A4
  container.style.margin = "0"
  container.style.padding = "10mm" // Margem interna
  container.style.boxSizing = "border-box"
  container.style.backgroundColor = "#ffffff"

  // Adicionar estilos específicos para o PDF
  const styleElement = document.createElement("style")
  styleElement.textContent = `
    @page {
      margin: 0;
      size: A4;
    }
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
    }
    table {
      page-break-inside: avoid;
      width: 100%;
    }
    .ficha-tecnica {
      page-break-before: always;
    }
    .ficha-tecnica:first-child {
      page-break-before: auto;
    }
    img {
      max-width: 100%;
      height: auto;
    }
  `
  container.appendChild(styleElement)

  // Clonar o conteúdo do documento
  const clonedContent = element.cloneNode(true)
  container.appendChild(clonedContent)

  return container
}
