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

    // Criar uma cópia exata do elemento para preservar a formatação
    const container = document.createElement("div")
    container.style.position = "absolute"
    container.style.left = "-9999px"
    container.style.width = "210mm" // Largura A4
    container.style.backgroundColor = "#ffffff"
    container.style.padding = "0"
    container.style.margin = "0"
    container.style.boxSizing = "border-box"
    container.style.overflow = "hidden"

    // Clonar o conteúdo original
    const clone = element.cloneNode(true) as HTMLElement
    container.appendChild(clone)

    // Adicionar ao DOM temporariamente
    document.body.appendChild(container)

    // Encontrar as fichas técnicas e o orçamento principal no clone
    const orcamentoPrincipal = container.querySelector(".orcamento-principal") as HTMLElement
    const fichasTecnicas = Array.from(container.querySelectorAll(".ficha-tecnica")) as HTMLElement[]

    // Verificar se estamos gerando apenas fichas técnicas
    const apenasGerarFichasTecnicas = container.classList.contains("fichas-tecnicas-container") || !orcamentoPrincipal

    // Criar uma nova instância do jsPDF
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    })

    // Função para garantir que todas as imagens estejam carregadas
    const waitForImagesLoaded = (element: HTMLElement): Promise<void> => {
      return new Promise((resolve) => {
        const images = Array.from(element.querySelectorAll("img"))
        if (images.length === 0) {
          resolve()
          return
        }

        let loadedCount = 0
        const checkAllLoaded = () => {
          loadedCount++
          if (loadedCount === images.length) {
            resolve()
          }
        }

        images.forEach((img) => {
          if (img.complete) {
            checkAllLoaded()
          } else {
            img.onload = checkAllLoaded
            img.onerror = checkAllLoaded
          }
        })
      })
    }

    // Função para capturar um elemento e adicionar ao PDF com alta qualidade
    const capturarElemento = async (elemento: HTMLElement, primeiraPagina = false) => {
      try {
        // Garantir que todas as imagens estejam carregadas
        await waitForImagesLoaded(elemento)

        // Aplicar estilos específicos para melhorar a qualidade
        elemento.style.width = "210mm"
        elemento.style.margin = "0"
        elemento.style.padding = "10mm"
        elemento.style.boxSizing = "border-box"
        elemento.style.backgroundColor = "#ffffff"
        elemento.style.overflow = "visible"

        // Forçar renderização de cores e fundos
        const todosElementos = elemento.querySelectorAll("*")
        todosElementos.forEach((el) => {
          const htmlEl = el as HTMLElement
          if (htmlEl.style) {
            htmlEl.style.printColorAdjust = "exact"
            htmlEl.style.WebkitPrintColorAdjust = "exact"
          }
        })

        // Capturar o elemento como uma imagem com configurações de alta qualidade
        const canvas = await html2canvas(elemento, {
          scale: 4, // Aumentar a escala para qualidade muito superior
          useCORS: true,
          logging: false,
          backgroundColor: "#FFFFFF",
          allowTaint: true,
          imageTimeout: 15000, // Tempo maior para carregar imagens
          width: elemento.offsetWidth,
          height: elemento.offsetHeight,
          onclone: (clonedDoc, clonedElement) => {
            // Aplicar estilos adicionais ao clone para melhorar a qualidade
            const allElements = clonedElement.querySelectorAll("*")
            allElements.forEach((el) => {
              const htmlEl = el as HTMLElement
              if (htmlEl.style) {
                htmlEl.style.printColorAdjust = "exact"
                htmlEl.style.WebkitPrintColorAdjust = "exact"

                // Ensure text content is preserved
                if (
                  htmlEl.classList.contains("text-xs") ||
                  htmlEl.classList.contains("pdf-observacoes") ||
                  htmlEl.classList.contains("pdf-observacoes-comercial") ||
                  htmlEl.classList.contains("pdf-observacoes-tecnica")
                ) {
                  htmlEl.style.whiteSpace = "pre-wrap"
                  htmlEl.style.overflow = "visible"
                  htmlEl.style.maxHeight = "none"
                }
              }
            })
          },
        })

        // Converter o canvas para uma imagem com alta qualidade
        const imgData = canvas.toDataURL("image/jpeg", 1.0)

        // Calcular as dimensões para ajustar à página A4
        const imgWidth = 210 // A4 width in mm
        const pageHeight = 297 // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width

        // Se não for a primeira página, adicionar uma nova página
        if (!primeiraPagina) {
          pdf.addPage()
        }

        // Adicionar a imagem ao PDF com alta qualidade
        pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, Math.min(imgHeight, pageHeight))
      } catch (error) {
        console.error("Erro ao capturar elemento:", error)
      }
    }

    // Se estamos gerando apenas fichas técnicas, não incluir o orçamento principal
    if (apenasGerarFichasTecnicas) {
      // Capturar cada ficha técnica
      for (let i = 0; i < fichasTecnicas.length; i++) {
        // A primeira ficha não precisa de uma nova página
        await capturarElemento(fichasTecnicas[i], i === 0)
      }
    } else {
      // Capturar o orçamento principal como primeira página
      if (orcamentoPrincipal) {
        await capturarElemento(orcamentoPrincipal, true)
      }

      // Capturar cada ficha técnica como uma página separada
      for (const ficha of fichasTecnicas) {
        await capturarElemento(ficha)
      }
    }

    // Remover o elemento temporário
    document.body.removeChild(container)

    // Salvar o PDF com configurações otimizadas
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
  tipoDocumento: "orcamento" | "ficha-tecnica",
  nomeCliente?: string,
  nomeContato?: string,
): string {
  // Extrair apenas o número do orçamento (sem o nome do produto)
  const numeroLimpo = numeroOrcamento.split(" - ")[0]

  // Formatar o nome do cliente e contato
  const clienteFormatado = nomeCliente ? nomeCliente.replace(/\s+/g, "_").substring(0, 20) : "SEM_CLIENTE"
  const contatoFormatado = nomeContato ? nomeContato.replace(/\s+/g, "_").substring(0, 20) : "SEM_CONTATO"

  // Definir o prefixo correto com base no tipo de documento
  const prefixo = tipoDocumento === "orcamento" ? "01 - ORCAMENTO_" : "02 - FICHA_TECNICA_"

  // Retornar o nome do arquivo formatado
  return `${prefixo}${numeroLimpo}_${clienteFormatado.toUpperCase()}_${contatoFormatado.toUpperCase()}.pdf`
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
