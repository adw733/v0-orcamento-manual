"use client"

import type { Orcamento } from "@/types/types"

interface VisualizacaoDocumentoProps {
  orcamento: Orcamento
  calcularTotal: () => number
}

export default function VisualizacaoDocumento({ orcamento, calcularTotal }: VisualizacaoDocumentoProps) {
  const dataFormatada = orcamento.data ? new Date(orcamento.data).toLocaleDateString("pt-BR") : ""

  // Vamos melhorar os estilos para garantir que todos os elementos caibam corretamente na página A4

  // Substitua a constante pdfStyles por esta versão aprimorada:

  const pdfStyles = `
  @media print {
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
`

  return (
    <div className="flex flex-col gap-8 p-4 font-sans text-gray-800">
      <style>{pdfStyles}</style>
      {/* Orçamento */}
      <div className="border border-gray-300 rounded-md overflow-hidden shadow-sm page-break-inside-avoid pdf-section">
        {/* Vamos corrigir o cabeçalho para que ocupe toda a largura e ajustar o layout

        1. Substitua a div do cabeçalho (classe "bg-gradient-to-r from-primary to-primary-dark p-6 pdf-header") por: */}
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
                <h1 className="text-xl font-bold text-white font-sans tracking-tight">ORÇAMENTO</h1>
                <p className="text-white/80 text-sm">Nº {orcamento.numero}</p>
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
          {/* Também vamos modificar a seção de informações do cliente para ser mais compacta
          // Encontre a seção de dados do cliente e substitua por: */}
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
            {/* Vamos também modificar a seção de observações para ser mais compacta
            // Encontre a seção de observações e substitua por: */}
            <div>
              <h3 className="font-bold mb-2 text-primary">OBSERVAÇÕES</h3>
              <p className="text-sm bg-accent p-3 rounded-md pdf-observacoes">
                {orcamento.observacoes || "Nenhuma observação."}
              </p>
            </div>

            {/* Por fim, vamos modificar a seção de condições para ser mais compacta
            // Encontre a seção de condições e substitua por: */}
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
      {orcamento.itens.length > 0 && (
        <div className="border border-gray-300 rounded-md overflow-hidden shadow-sm page-break-before pdf-section">
          {/* 2. Substitua também o cabeçalho da ficha técnica pelo mesmo padrão: */}
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
                  <h1 className="text-xl font-bold text-white font-sans tracking-tight">FICHA TÉCNICA</h1>
                  <p className="text-white/80 text-sm">Uniformes Industriais</p>
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
            {orcamento.itens.map((item, index) => (
              <div
                key={`ficha-${item.id}`}
                id={`ficha-${item.id}`}
                className={`${index > 0 ? "page-break-before ficha-tecnica" : ""} pb-6 last:pb-0 page-break-inside-avoid`}
              >
                <h3 className="font-bold text-lg mb-4 text-primary border-b-2 border-primary pb-2">
                  {item.produto?.nome}
                </h3>

                <div className="space-y-4">
                  {/* Imagem do item */}
                  {/* 3. Modifique a classe CSS para a imagem do produto para garantir que ela seja exibida corretamente:

                  Substitua:
                  \`\`\`
                  <img
                    src={item.imagem || "/placeholder.svg"}
                    alt={item.produto?.nome || "Imagem do produto"}
                    className="max-h-96 object-contain border rounded-md shadow-sm pdf-image"
                  />
                  \`\`\`

                  Por:
                  \`\`\`
                  <img
                    src={item.imagem || "/placeholder.svg"}
                    alt={item.produto?.nome || "Imagem do produto"}
                    className="object-contain border rounded-md shadow-sm"
                    style={{ maxHeight: "350px", maxWidth: "100%", display: "block", margin: "0 auto" }}
                  />
                  \`\`\` */}
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

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pdf-grid">
                    <div className="bg-accent p-4 rounded-md">
                      <h4 className="font-bold mb-2 text-primary">Tecido</h4>
                      {item.tecidoSelecionado ? (
                        <div className="text-sm">
                          <p className="font-medium">{item.tecidoSelecionado.nome}</p>
                          <p className="text-gray-600">{item.tecidoSelecionado.composicao}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">Tecido não especificado</p>
                      )}
                    </div>

                    <div className="bg-accent p-4 rounded-md">
                      <h4 className="font-bold mb-2 text-primary">Cor</h4>
                      {item.corSelecionada ? (
                        <p className="text-sm font-medium">{item.corSelecionada}</p>
                      ) : (
                        <p className="text-sm text-gray-500 italic">Cor não especificada</p>
                      )}
                    </div>

                    <div className="bg-accent p-4 rounded-md">
                      <h4 className="font-bold mb-2 text-primary">Estampa</h4>
                      {item.descricaoEstampa ? (
                        <p className="text-sm">{item.descricaoEstampa}</p>
                      ) : (
                        <p className="text-sm text-gray-500 italic">Sem estampa</p>
                      )}
                    </div>
                  </div>

                  {/* Agora vamos modificar a tabela de tamanhos para ser mais compacta
                  // Encontre a seção da tabela de tamanhos e substitua por: */}
                  <div className="mt-4">
                    <h4 className="font-bold mb-2 text-primary">Quantidades por Tamanho</h4>
                    <div className="bg-accent p-3 rounded-md overflow-x-auto">
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
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
