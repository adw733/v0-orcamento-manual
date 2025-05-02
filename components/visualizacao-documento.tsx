"use client"

import type { Orcamento } from "@/types/types"

interface VisualizacaoDocumentoProps {
  orcamento: Orcamento
  calcularTotal: () => number
}

export default function VisualizacaoDocumento({ orcamento, calcularTotal }: VisualizacaoDocumentoProps) {
  const dataFormatada = orcamento.data ? new Date(orcamento.data).toLocaleDateString("pt-BR") : ""

  // Adicione estas propriedades CSS para garantir que as cores sejam preservadas na impressão
  const pdfStyles = `
  @media print {
    /* Preservar cores e fundos na impressão */
    * {
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
    
    img {
      max-height: 350px;
      max-width: 100%;
      object-fit: contain;
    }
    
    .ficha-tecnica {
      page-break-before: always !important;
      break-before: always !important;
    }
    
    /* Garantir que cada ficha técnica comece em uma nova página */
    .ficha-tecnica:not(:first-child) {
      margin-top: 20px;
    }

    /* Configurações para garantir que a ficha técnica caiba em uma folha A4 */
    .ficha-tecnica {
      max-height: 297mm; /* Altura de uma folha A4 */
      width: 210mm; /* Largura de uma folha A4 */
      padding: 10mm; /* Margem interna */
      box-sizing: border-box;
      page-break-before: always !important;
      break-before: always !important;
    }
    
    /* Reduzir o tamanho da fonte para caber mais conteúdo */
    .ficha-tecnica .pdf-content {
      font-size: 0.9em;
    }
    
    /* Ajustar o espaçamento vertical */
    .ficha-tecnica .space-y-6 {
      margin-top: 0.5rem;
      margin-bottom: 0.5rem;
    }
    
    /* Garantir que a imagem não seja muito grande */
    .ficha-tecnica .pdf-image {
      max-height: 120mm; /* Limitar altura da imagem */
    }
  }
  
  /* Estilos para garantir que os elementos caibam na página A4 */
  .pdf-section {
    max-width: 100%;
    box-sizing: border-box;
    width: 100%;
    margin: 0;
    padding: 10px;
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
    white-space: nowrap;
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
  
  .pdf-header {
    padding: 1rem;
    min-height: 80px;
  }
  
  .pdf-content {
    padding: 1rem;
  }
  
  .pdf-text-sm {
    font-size: 0.85em;
  }
  
  .pdf-compact {
    margin: 0;
    padding: 0.5rem;
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

  .pdf-table-compact {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.8em;
  }

  .pdf-table-compact th,
  .pdf-table-compact td {
    padding: 4px;
    text-align: left;
    border-bottom: 1px solid #eee;
  }

  .pdf-table-compact tr:nth-child(even) {
    background-color: #f9f9f9;
  }

  @media print {
    .pdf-table-compact {
      page-break-inside: avoid;
    }
  }

  /* Tabela unificada para especificações */
  .specs-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85em;
  }

  .specs-table th,
  .specs-table td {
    padding: 6px;
    text-align: left;
    border: 1px solid #e5e7eb;
  }

  .specs-table th {
    background-color: #f3f4f6;
    font-weight: 600;
    color: #0f4c81;
  }

  .specs-table tr:nth-child(even) {
    background-color: #f9fafb;
  }

  /* Estilos para os novos cards de especificações */
  .spec-card {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  .tamanho-card {
    display: inline-block;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  @media print {
    .grid-cols-2 {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1rem;
    }
    
    .grid-cols-3 {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 1rem;
    }
    
    .flex-wrap {
      display: flex;
      flex-wrap: wrap;
    }
  }
`

  return (
    <div className="flex flex-col gap-8 p-4 font-sans text-gray-800">
      <style>{pdfStyles}</style>
      {/* Orçamento */}
      <div className="border border-gray-300 rounded-md overflow-hidden shadow-sm page-break-inside-avoid pdf-section">
        <div className="bg-gradient-to-r from-primary to-primary-dark p-4 pdf-header w-full">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
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
              <div>
                <div>
                  <h1 className="text-xl font-bold text-white font-sans tracking-tight uppercase">
                    ORÇAMENTO - {orcamento.numero.split(" - ")[0]}
                  </h1>
                  <p className="text-white/90 text-sm uppercase">
                    {orcamento.cliente?.nome || "EMPRESA"} - {orcamento.cliente?.contato || "CONTATO"}
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right bg-white/10 p-2 rounded-md backdrop-blur-sm">
              <h2 className="text-lg font-bold text-white font-sans tracking-tight">ONEBASE</h2>
              <p className="text-white/80 text-xs">CNPJ: 12.345.678/0001-90</p>
              <p className="text-white/80 text-xs">contato@onebase.com.br</p>
              <p className="text-white/80 text-xs">(11) 4321-1234</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6 pdf-content">
          <div className="border-b pb-4 page-break-inside-avoid">
            <h3 className="font-bold mb-2 text-primary text-lg">DADOS DO CLIENTE</h3>
            {orcamento.cliente ? (
              <div className="pdf-cliente-info bg-accent p-3 rounded-md border-l-4 border-primary">
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
                  <span className="font-medium">Contato:</span> {orcamento.cliente.contato}
                </p>
                <p>
                  <span className="font-medium">Telefone:</span> {orcamento.cliente.telefone}
                </p>
                <p>
                  <span className="font-medium">Email:</span> {orcamento.cliente.email}
                </p>
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
              <thead className="bg-primary text-white">
                <tr>
                  <th className="p-3 text-left rounded-tl-md">Item</th>
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
                      <td className="p-3 text-center">{item.quantidade}</td>
                      <td className="p-3 text-right">R$ {item.valorUnitario.toFixed(2)}</td>
                      <td className="p-3 text-right font-medium">
                        R$ {(item.quantidade * item.valorUnitario).toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-3 text-center text-gray-500 italic">
                      Nenhum item adicionado
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-accent font-medium">
                <tr>
                  <td colSpan={3} className="p-3 text-right border-t-2 border-primary">
                    TOTAL:
                  </td>
                  <td className="p-3 text-right border-t-2 border-primary text-lg">R$ {calcularTotal().toFixed(2)}</td>
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
                <div>
                  <h1 className="text-xl font-bold text-white font-sans tracking-tight uppercase">
                    FICHA TÉCNICA - {orcamento.numero.split(" - ")[0]}
                  </h1>
                  <p className="text-white/90 text-sm uppercase">
                    {orcamento.cliente?.nome || "EMPRESA"} - {orcamento.cliente?.contato || "CONTATO"}
                  </p>
                </div>
              </div>
              <div className="text-right bg-white/10 p-2 rounded-md backdrop-blur-sm">
                <h2 className="text-lg font-bold text-white font-sans tracking-tight">ONEBASE</h2>
                <p className="text-white/80 text-xs">CNPJ: 12.345.678/0001-90</p>
                <p className="text-white/80 text-xs">contato@onebase.com.br</p>
                <p className="text-white/80 text-xs">(11) 4321-1234</p>
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
                          <th className="border border-gray-300 p-1 text-center bg-primary text-white rounded-tl-md">
                            TAM.
                          </th>
                          {Object.entries(item.tamanhos)
                            .filter(([_, valor]) => valor > 0) // Mostrar apenas tamanhos com quantidade > 0
                            .map(([tamanho]) => (
                              <th
                                key={`header-${item.id}-${tamanho}`}
                                className="border border-gray-300 p-1 text-center bg-primary text-white"
                              >
                                {tamanho}
                              </th>
                            ))}
                          <th className="border border-gray-300 p-1 text-center bg-primary text-white rounded-tr-md">
                            TOTAL
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 p-1 text-center font-medium bg-white">QTD.</td>
                          {Object.entries(item.tamanhos)
                            .filter(([_, valor]) => valor > 0) // Mostrar apenas tamanhos com quantidade > 0
                            .map(([tamanho, valor]) => (
                              <td
                                key={`${item.id}-${tamanho}`}
                                className="border border-gray-300 p-1 text-center bg-white"
                              >
                                {valor}
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
