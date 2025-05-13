"use client"

import type { Orcamento, DadosEmpresa } from "@/types/types"

interface VisualizacaoDocumentoProps {
  orcamento: Orcamento
  calcularTotal: () => number
  dadosEmpresa?: DadosEmpresa
}

export default function VisualizacaoDocumento({ orcamento, calcularTotal, dadosEmpresa }: VisualizacaoDocumentoProps) {
  const dataFormatada = orcamento.data ? new Date(orcamento.data).toLocaleDateString("pt-BR") : ""

  // Definição da ordem padrão dos tamanhos
  const tamanhosPadrao = {
    // Padrão (PP ao G7)
    PP: 0,
    P: 0,
    M: 0,
    G: 0,
    GG: 0,
    G1: 0,
    G2: 0,
    G3: 0,
    G4: 0,
    G5: 0,
    G6: 0,
    G7: 0,
    // Numérico (36 ao 62) - apenas tamanhos pares
    "36": 0,
    "38": 0,
    "40": 0,
    "42": 0,
    "44": 0,
    "46": 0,
    "48": 0,
    "50": 0,
    "52": 0,
    "54": 0,
    "56": 0,
    "58": 0,
    "60": 0,
    "62": 0,
    // Infantil (0 ao 13)
    "0": 0,
    "1": 0,
    "2": 0,
    "3": 0,
    "4": 0,
    "5": 0,
    "6": 0,
    "7": 0,
    "8": 0,
    "9": 0,
    "10": 0,
    "11": 0,
    "12": 0,
    "13": 0,
  }

  // Função para ordenar os tamanhos
  const ordenarTamanhos = (tamanhos: Record<string, number>) => {
    // Separar os tamanhos por categoria
    const tamanhosLetras: [string, number][] = []
    const tamanhosNumericos: [string, number][] = []
    const tamanhosInfantis: [string, number][] = []

    // Ordem específica para tamanhos de letras
    const ordemLetras = ["PP", "P", "M", "G", "GG", "G1", "G2", "G3", "G4", "G5", "G6", "G7"]

    Object.entries(tamanhos)
      .filter(([_, quantidade]) => quantidade > 0)
      .forEach(([tamanho, quantidade]) => {
        // Verificar se é um tamanho de letra (PP, P, M, G, GG, G1-G7)
        if (ordemLetras.includes(tamanho)) {
          tamanhosLetras.push([tamanho, quantidade])
        }
        // Verificar se é um tamanho numérico adulto (36-62)
        else if (/^(3[6-9]|[4-5][0-9]|6[0-2])$/.test(tamanho)) {
          tamanhosNumericos.push([tamanho, quantidade])
        }
        // Verificar se é um tamanho infantil (0-13)
        else if (/^([0-9]|1[0-3])$/.test(tamanho)) {
          tamanhosInfantis.push([tamanho, quantidade])
        }
        // Outros tamanhos não categorizados
        else {
          tamanhosLetras.push([tamanho, quantidade])
        }
      })

    // Ordenar cada categoria
    tamanhosLetras.sort((a, b) => ordemLetras.indexOf(a[0]) - ordemLetras.indexOf(b[0]))
    tamanhosNumericos.sort((a, b) => Number.parseInt(a[0]) - Number.parseInt(b[0]))
    tamanhosInfantis.sort((a, b) => Number.parseInt(a[0]) - Number.parseInt(b[0]))

    // Retornar todos os tamanhos ordenados
    return [...tamanhosLetras, ...tamanhosNumericos, ...tamanhosInfantis]
  }

  // Usar os dados da empresa ou valores padrão
  const nomeEmpresa = dadosEmpresa?.nome || "ONEBASE"
  const cnpjEmpresa = dadosEmpresa?.cnpj || "12.345.678/0001-90"
  const emailEmpresa = dadosEmpresa?.email || "contato@onebase.com.br"
  const telefoneEmpresa = dadosEmpresa?.telefone || "(11) 4321-1234"
  const sloganEmpresa = dadosEmpresa?.slogan || "UNIFORMES INDUSTRIAIS"

  // Adicione estas propriedades CSS para garantir que as cores sejam preservadas na impressão
  const pdfStyles = `
  @media print {
    /* Configurações gerais de impressão */
    @page {
      size: A4;
      margin: 10mm; /* Adicionar margem de 10mm em todos os lados */
    }
    
    body {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    
    /* Garantir que os gradientes e cores de fundo sejam impressos */
    .bg-gradient-to-r, .bg-primary, .bg-accent, .bg-white, .bg-white\\/10 {
      print-color-adjust: exact !important;
      -webkit-print-color-adjust: exact !important;
    }
    
    /* Garantir que o texto branco permaneça branco */
    .text-white {
      color: white !important;
    }
    
    /* Garantir que as bordas sejam impressas */
    .border, .border-t, .border-b, .border-l, .border-r {
      border-color: inherit !important;
    }
    
    /* Controle de quebra de página */
    .page-break-inside-avoid {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    
    .page-break-before {
      page-break-before: always !important;
      break-before: always !important;
    }
    
    table {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    
    h3, h4 {
      page-break-after: avoid !important;
      break-after: avoid !important;
    }
    
    /* Controle de tamanho de imagens */
    img {
      max-height: 350px;
      max-width: 100%;
      object-fit: contain;
    }
    
    /* Configurações para fichas técnicas */
    .ficha-tecnica {
      page-break-before: always !important;
      break-before: always !important;
    }
    
    /* Garantir que cada ficha técnica comece em uma nova página */
    .ficha-tecnica:not(:first-child) {
      margin-top: 20px;
    }

    /* Configurações para garantir que a ficha técnica caiba em uma folha A4 */
    .ficha-tecnica, .orcamento-principal {
      width: 210mm;
      box-sizing: border-box;
      padding: 0;
      margin: 0;
    }
    
    /* Remover bordas arredondadas na impressão */
    .rounded-md, .rounded-lg, .rounded-tl-md, .rounded-tr-md {
      border-radius: 0 !important;
    }
    
    /* Ajustar espaçamentos para impressão */
    .p-6 {
      padding: 1rem !important;
    }
    
    .space-y-6 > * + * {
      margin-top: 1rem !important;
    }
    
    /* Ajustar tamanho da fonte para impressão */
    .text-sm {
      font-size: 0.75rem !important;
    }
    
    /* Ajustar layout da tabela de tamanhos */
    .tamanhos-container {
      max-height: none !important;
      overflow: visible !important;
      display: flex !important;
      flex-wrap: wrap !important;
    }
    
    .tamanho-texto {
      margin-right: 8px !important;
      white-space: nowrap !important;
      font-size: 0.8rem !important;
    }
  }
  
  /* Estilos para garantir que os elementos caibam na página A4 */
  .pdf-section {
    max-width: 100%;
    box-sizing: border-box;
    width: 100%;
    margin: 0;
    padding: 0;
  }
  
  .pdf-content {
    padding: 1rem;
    width: 100%;
  }
  
  .pdf-header {
    width: 100%;
    box-sizing: border-box;
    padding: 1rem;
    background: linear-gradient(to right, #0f4c81, #00305a);
    color: white;
  }
  
  .pdf-table {
    width: 100%;
    table-layout: fixed;
    font-size: 0.85em;
  }
  
  .pdf-table th, .pdf-table td {
    padding: 0.5rem;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .pdf-image {
    max-height: 350px;
    max-width: 100%;
    object-fit: contain;
  }
  
  .pdf-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
  }
  
  @media (max-width: 768px) {
    .pdf-grid {
      grid-template-columns: 1fr;
    }
  }
  
  .pdf-cliente-info {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
    font-size: 0.85em;
  }
  
  .pdf-cliente-info p {
    margin: 0.25rem 0;
  }
  
  .pdf-observacoes {
    min-height: 40px;
    max-height: 80px;
    overflow: hidden;
  }

  .tamanhos-container {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    line-height: 1.5;
    max-height: none;
    overflow: visible;
    padding: 0.2rem;
  }
  
  .tamanho-texto {
    font-size: 0.8rem;
    color: #0369a1;
    margin-right: 8px;
    white-space: nowrap;
    padding: 1px 0;
  }
`

  return (
    <div className="flex flex-col gap-8 p-4 font-sans text-gray-800 pdf-container" style={{ margin: "10mm" }}>
      <style>{pdfStyles}</style>
      {/* Orçamento */}
      <div className="border border-gray-300 rounded-md overflow-hidden shadow-sm page-break-inside-avoid pdf-section orcamento-principal">
        <div className="bg-gradient-to-r from-primary to-primary-dark p-4 pdf-header w-full">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              {dadosEmpresa?.logo_url ? (
                <div
                  className="bg-white p-2 rounded-md shadow-md flex items-center justify-center"
                  style={{ width: "50px", height: "50px" }}
                >
                  <img
                    src={dadosEmpresa.logo_url || "/placeholder.svg"}
                    alt={nomeEmpresa}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ) : (
                <div
                  className="bg-white p-2 rounded-md shadow-md flex items-center justify-center"
                  style={{ width: "50px", height: "50px" }}
                >
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M12 2L4 5v14.5c0 .83.67 1.5 1.5 1.5h13c.83 0 1.5-.67 1.5-1.5V5l-8-3z"
                      fill="#0f4c81"
                      stroke="#0f4c81"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M12 6.5c-1.93 0-3.5 1.57-3.5 3.5v1.5h7v-1.5c0-1.93-1.57-3.5-3.5-3.5z"
                      fill="white"
                      stroke="white"
                      strokeWidth="0.5"
                    />
                    <path
                      d="M12 14.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z"
                      fill="white"
                      stroke="white"
                      strokeWidth="0.5"
                    />
                  </svg>
                </div>
              )}
              <div>
                <div>
                  <h1 className="text-xl font-bold text-white font-sans tracking-tight uppercase">
                    ORÇAMENTO - {orcamento.numero.split(" - ")[0]}
                  </h1>
                  <p className="text-white/90 text-sm uppercase">
                    {orcamento.cliente?.nome || "EMPRESA"} -{" "}
                    {orcamento.nomeContato || orcamento.cliente?.contato || "CONTATO"}
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right bg-white/10 p-2 rounded-md backdrop-blur-sm">
              <h2 className="text-lg font-bold text-white font-sans tracking-tight">{nomeEmpresa}</h2>
              <p className="text-white/80 text-xs">CNPJ: {cnpjEmpresa}</p>
              <p className="text-white/80 text-xs">{emailEmpresa}</p>
              <p className="text-white/80 text-xs">{telefoneEmpresa}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6 pdf-content">
          <div className="border-b pb-4 page-break-inside-avoid">
            <h3 className="font-bold mb-2 text-primary text-lg">DADOS DO CLIENTE</h3>
            {orcamento.cliente ? (
              <div className="pdf-cliente-info bg-accent p-3 rounded-md">
                <p>
                  <span className="font-medium">Nome:</span> {orcamento.cliente.nome}
                </p>
                <p>
                  <span className="font-medium">CNPJ:</span> {orcamento.cliente.cnpj}
                </p>
                <p>
                  <span className="font-medium">Endereço:</span> {orcamento.cliente.endereco}
                </p>
                <p>
                  <span className="font-medium">Email:</span> {orcamento.cliente.email}
                </p>
                {orcamento.nomeContato && (
                  <p>
                    <span className="font-medium">Contato:</span> {orcamento.nomeContato}
                  </p>
                )}
                {orcamento.telefoneContato && (
                  <p>
                    <span className="font-medium">Telefone Contato:</span> {orcamento.telefoneContato}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">Nenhum cliente selecionado</p>
            )}
          </div>

          <div className="page-break-inside-avoid">
            <div className="flex justify-between mb-3">
              <h3 className="font-bold text-lg text-primary">ITENS DO ORÇAMENTO</h3>
              <p className="text-sm bg-accent px-3 py-1 rounded-full font-medium">Data: {dataFormatada}</p>
            </div>

            <table className="w-full text-sm pdf-table">
              <colgroup>
                <col style={{ width: "30%" }} />
                <col style={{ width: "35%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "15%" }} />
              </colgroup>
              <thead className="bg-primary text-white">
                <tr>
                  <th className="p-3 text-left rounded-tl-md">Item</th>
                  <th className="p-3 text-left">Tamanhos</th>
                  <th className="p-3 text-center">Qtd.</th>
                  <th className="p-3 text-right">Valor Unit.</th>
                  <th className="p-3 text-right rounded-tr-md">Total</th>
                </tr>
              </thead>
              <tbody>
                {orcamento.itens.length > 0 ? (
                  orcamento.itens.map((item, index) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{item.produto?.nome}</p>
                          {item.observacao && <p className="text-xs mt-1 text-gray-600 italic">{item.observacao}</p>}
                        </div>
                      </td>
                      <td className="p-1">
                        <div className="tamanhos-container">
                          {ordenarTamanhos(item.tamanhos || {}).map(([tamanho, quantidade]) => (
                            <span key={tamanho} className="tamanho-texto" title={`${tamanho}: ${quantidade} unidades`}>
                              {tamanho}-{quantidade}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 text-center">{item.quantidade}</td>
                      <td className="p-3 text-right">R$ {item.valorUnitario.toFixed(2)}</td>
                      <td className="p-3 text-right font-medium">
                        R$ {(item.quantidade * item.valorUnitario).toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-3 text-center text-gray-500 italic">
                      Nenhum item adicionado
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-accent font-medium">
                <tr>
                  <td colSpan={4} className="p-3 text-right border-t-2 border-primary">
                    Valor dos Produtos:
                  </td>
                  <td className="p-3 text-right border-t-2 border-primary">R$ {calcularTotal().toFixed(2)}</td>
                </tr>
                {orcamento.valorFrete !== undefined && orcamento.valorFrete > 0 && (
                  <tr>
                    <td colSpan={4} className="p-3 text-right">
                      Valor do Frete:
                    </td>
                    <td className="p-3 text-right">R$ {orcamento.valorFrete.toFixed(2)}</td>
                  </tr>
                )}
                <tr>
                  <td colSpan={4} className="p-3 text-right border-t-2 border-primary">
                    TOTAL:
                  </td>
                  <td className="p-3 text-right border-t-2 border-primary whitespace-nowrap">
                    R$ {(calcularTotal() + (orcamento.valorFrete || 0)).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="space-y-4 page-break-inside-avoid">
            <div>
              <h3 className="font-bold mb-2 text-primary">OBSERVAÇÕES</h3>
              <p className="text-sm bg-accent p-3 rounded-md pdf-observacoes">
                {orcamento.observacoes || "Nenhuma observação."}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-sm mt-3 pdf-grid">
              <div className="bg-accent p-2 rounded-md">
                <h4 className="font-bold text-primary mb-1 text-sm">Condições de Pagamento</h4>
                <p className="text-sm">{orcamento.condicoesPagamento}</p>
              </div>
              <div className="bg-accent p-2 rounded-md">
                <h4 className="font-bold text-primary mb-1 text-sm">Prazo de Entrega</h4>
                <p className="text-sm">{orcamento.prazoEntrega}</p>
              </div>
              <div className="bg-accent p-2 rounded-md">
                <h4 className="font-bold text-primary mb-1 text-sm">Validade do Orçamento</h4>
                <p className="text-sm">{orcamento.validadeOrcamento}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ficha Técnica */}
      {orcamento.itens.map((item, index) => (
        <div
          key={`ficha-${item.id}`}
          id={`ficha-${item.id}`}
          className={`border border-gray-300 rounded-md overflow-hidden shadow-sm ${
            index > 0 ? "mt-8" : ""
          } page-break-before ficha-tecnica pdf-section`}
        >
          <div className="bg-gradient-to-r from-primary to-primary-dark p-4 pdf-header w-full">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                {dadosEmpresa?.logo_url ? (
                  <div
                    className="bg-white p-2 rounded-md shadow-md flex items-center justify-center"
                    style={{ width: "50px", height: "50px" }}
                  >
                    <img
                      src={dadosEmpresa.logo_url || "/placeholder.svg"}
                      alt={nomeEmpresa}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                ) : (
                  <div
                    className="bg-white p-2 rounded-md shadow-md flex items-center justify-center"
                    style={{ width: "50px", height: "50px" }}
                  >
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M12 2L4 5v14.5c0 .83.67 1.5 1.5 1.5h13c.83 0 1.5-.67 1.5-1.5V5l-8-3z"
                        fill="#0f4c81"
                        stroke="#0f4c81"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M12 6.5c-1.93 0-3.5 1.57-3.5 3.5v1.5h7v-1.5c0-1.93-1.57-3.5-3.5-3.5z"
                        fill="white"
                        stroke="white"
                        strokeWidth="0.5"
                      />
                      <path
                        d="M12 14.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z"
                        fill="white"
                        stroke="white"
                        strokeWidth="0.5"
                      />
                    </svg>
                  </div>
                )}
                <div>
                  <h1 className="text-xl font-bold text-white font-sans tracking-tight uppercase">
                    FICHA TÉCNICA - {orcamento.numero.split(" - ")[0]}
                  </h1>
                  <p className="text-white/90 text-sm uppercase">
                    {orcamento.cliente?.nome || "EMPRESA"} -{" "}
                    {orcamento.nomeContato || orcamento.cliente?.contato || "CONTATO"}
                  </p>
                </div>
              </div>
              <div className="text-right bg-white/10 p-2 rounded-md backdrop-blur-sm">
                <h2 className="text-lg font-bold text-white font-sans tracking-tight">{nomeEmpresa}</h2>
                <p className="text-white/80 text-xs">CNPJ: {cnpjEmpresa}</p>
                <p className="text-white/80 text-xs">{emailEmpresa}</p>
                <p className="text-white/80 text-xs">{telefoneEmpresa}</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6 pdf-content">
            <h3 className="font-bold text-lg mb-4 text-primary border-b-2 border-primary pb-2">{item.produto?.nome}</h3>

            <div className="space-y-4">
              {item.imagem && (
                <div className="flex justify-center mb-4">
                  <img
                    src={item.imagem || "/placeholder.svg"}
                    alt={item.produto?.nome || "Imagem do produto"}
                    className="object-contain border rounded-md shadow-sm pdf-image"
                    style={{ maxHeight: "350px", maxWidth: "100%", display: "block", margin: "0 auto" }}
                  />
                </div>
              )}

              <div>
                <h4 className="font-bold mb-2 text-primary">Especificações do Produto</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Card para Tecido */}
                  <div className="bg-accent/30 rounded-lg overflow-hidden border border-primary/10 shadow-sm spec-card">
                    <div className="bg-primary/10 p-2 border-b border-primary/10">
                      <h5 className="font-medium text-primary flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mr-2"
                        >
                          <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16v-3"></path>
                          <path d="m7.5 4.27 9 5.15"></path>
                          <polyline points="3.29 7 12 12 20.71 7"></polyline>
                          <line x1="12" y1="22" x2="12" y2="12"></line>
                        </svg>
                        Tecido
                      </h5>
                    </div>
                    <div className="p-3 bg-white">
                      {item.tecidoSelecionado ? (
                        <div>
                          <p className="font-medium text-gray-800">{item.tecidoSelecionado.nome}</p>
                          <p className="text-sm text-gray-600">{item.tecidoSelecionado.composicao}</p>
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">Não especificado</p>
                      )}
                    </div>
                  </div>

                  {/* Card para Cor */}
                  <div className="bg-accent/30 rounded-lg overflow-hidden border border-primary/10 shadow-sm spec-card">
                    <div className="bg-primary/10 p-2 border-b border-primary/10">
                      <h5 className="font-medium text-primary flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mr-2"
                        >
                          <circle cx="13.5" cy="6.5" r="2.5"></circle>
                          <circle cx="19" cy="17" r="2"></circle>
                          <circle cx="9" cy="17" r="2.5"></circle>
                          <circle cx="4.5" cy="12" r="1.5"></circle>
                          <path d="M8 7c0-2.21 1.79-4 4-4"></path>
                          <path d="M13.5 19c1.38 0 2.5-1.12 2.5-2.5S14.88 14 13.5 14 11 15.12 11 16.5s1.12 2.5 2.5 2.5Z"></path>
                          <path d="M4.5 16.5c0-3.15 2.85-5.5 6-5.5"></path>
                        </svg>
                        Cor
                      </h5>
                    </div>
                    <div className="p-3 bg-white">
                      {item.corSelecionada ? (
                        <div className="flex items-center">
                          <div
                            className="w-6 h-6 rounded-full mr-2 border border-gray-300"
                            style={{
                              backgroundColor: item.corSelecionada.toLowerCase().includes("azul")
                                ? "#1e40af"
                                : item.corSelecionada.toLowerCase().includes("verde")
                                  ? "#15803d"
                                  : item.corSelecionada.toLowerCase().includes("vermelho")
                                    ? "#b91c1c"
                                    : item.corSelecionada.toLowerCase().includes("amarelo")
                                      ? "#eab308"
                                      : item.corSelecionada.toLowerCase().includes("preto")
                                        ? "#171717"
                                        : item.corSelecionada.toLowerCase().includes("branco")
                                          ? "#ffffff"
                                          : item.corSelecionada.toLowerCase().includes("cinza")
                                            ? "#6b7280"
                                            : item.corSelecionada.toLowerCase().includes("marrom")
                                              ? "#78350f"
                                              : item.corSelecionada.toLowerCase().includes("laranja")
                                                ? "#ea580c"
                                                : item.corSelecionada.toLowerCase().includes("roxo")
                                                  ? "#7e22ce"
                                                  : item.corSelecionada.toLowerCase().includes("rosa")
                                                    ? "#be185d"
                                                    : "#9ca3af",
                            }}
                          ></div>
                          <span className="font-medium text-gray-800">{item.corSelecionada}</span>
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">Não especificada</p>
                      )}
                    </div>
                  </div>

                  {/* Card para Artes */}
                  <div className="bg-accent/30 rounded-lg overflow-hidden border border-primary/10 shadow-sm spec-card">
                    <div className="bg-primary/10 p-2 border-b border-primary/10">
                      <h5 className="font-medium text-primary flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mr-2"
                        >
                          <path d="M12 19c.5 0 1-.1 1.4-.4l5.3-5.3c.4-.4.4-1 0-1.4l-5.3-5.3c-.4-.3-.9-.4-1.4-.4s-1 .1-1.4.4L5.3 11.9c-.4.4-.4 1 0 1.4l5.3 5.3c.4.3.9.4 1.4.4Z"></path>
                          <path d="M7.5 10.5 12 6l4.5 4.5"></path>
                          <path d="M7.5 13.5 12 18l4.5-4.5"></path>
                        </svg>
                        Artes
                      </h5>
                    </div>
                    <div className="p-3 bg-white">
                      {item.estampas && item.estampas.length > 0 ? (
                        <div className="space-y-2">
                          {item.estampas.map((estampa, index) => (
                            <div key={estampa.id} className="border-b border-gray-100 pb-1 last:border-0 last:pb-0">
                              <div className="flex items-center">
                                <span className="bg-primary/10 text-primary text-xs font-medium rounded-full w-5 h-5 flex items-center justify-center mr-2">
                                  {index + 1}
                                </span>
                                <span className="font-medium text-gray-800 text-sm">
                                  {estampa.posicao || "Posição não especificada"}
                                </span>
                              </div>
                              <div className="text-xs ml-7 text-gray-600">
                                {estampa.tipo}
                                {estampa.largura ? `, ${estampa.largura} cm` : ""}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">Sem artes aplicadas</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-bold mb-2 text-primary">Quantidades por Tamanho</h4>
                <div className="bg-accent/30 rounded-lg overflow-hidden border border-primary/10 shadow-sm">
                  <div className="p-3 bg-white overflow-x-auto">
                    <table className="w-full border-collapse text-sm pdf-table">
                      <thead>
                        <tr>
                          <th className="border border-gray-300 p-1 text-center bg-primary text-white">TAM.</th>
                          {ordenarTamanhos(item.tamanhos || {}).map(([tamanho, _]) => (
                            <th
                              key={`header-${item.id}-${tamanho}`}
                              className="border border-gray-300 p-1 text-center bg-primary text-white"
                            >
                              {tamanho}
                            </th>
                          ))}
                          <th className="border border-gray-300 p-1 text-center bg-primary text-white">TOTAL</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 p-1 text-center font-medium bg-white">QTD.</td>
                          {ordenarTamanhos(item.tamanhos || {}).map(([tamanho, quantidade]) => (
                            <td
                              key={`${item.id}-${tamanho}`}
                              className="border border-gray-300 p-1 text-center bg-white"
                            >
                              {quantidade}
                            </td>
                          ))}
                          <td className="border border-gray-300 p-1 text-center font-medium bg-white">
                            {item.quantidade}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
