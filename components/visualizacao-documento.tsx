"use client"

import type { Orcamento } from "@/types/types"

interface VisualizacaoDocumentoProps {
  orcamento: Orcamento
  calcularTotal: () => number
}

export default function VisualizacaoDocumento({ orcamento, calcularTotal }: VisualizacaoDocumentoProps) {
  const dataFormatada = orcamento.data ? new Date(orcamento.data).toLocaleDateString("pt-BR") : ""

  return (
    <div className="flex flex-col gap-8 p-4 font-sans text-gray-800">
      {/* Orçamento */}
      <div className="border border-gray-300 rounded-md overflow-hidden shadow-sm">
        <div className="bg-primary p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">ORÇAMENTO</h1>
              <p className="text-sm opacity-90">Nº {orcamento.numero}</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold">EMPRESA UNIFORMES</h2>
              <p className="text-sm opacity-90">CNPJ: 00.000.000/0001-00</p>
              <p className="text-sm opacity-90">contato@empresa.com.br</p>
              <p className="text-sm opacity-90">(00) 0000-0000</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="border-b pb-4">
            <h3 className="font-bold mb-3 text-primary text-lg">DADOS DO CLIENTE</h3>
            {orcamento.cliente ? (
              <div className="grid grid-cols-2 gap-3 text-sm bg-accent p-4 rounded-md border-l-4 border-primary">
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

          <div>
            <div className="flex justify-between mb-3">
              <h3 className="font-bold text-lg text-primary">ITENS DO ORÇAMENTO</h3>
              <p className="text-sm bg-accent px-3 py-1 rounded-full font-medium">Data: {dataFormatada}</p>
            </div>

            <table className="w-full text-sm">
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
                          {item.tecidoSelecionado && (
                            <p className="text-xs mt-1">
                              <span className="bg-primary text-white px-1.5 py-0.5 rounded text-[10px] mr-1">
                                TECIDO
                              </span>
                              {item.tecidoSelecionado.nome}
                            </p>
                          )}
                          {item.corSelecionada && (
                            <p className="text-xs mt-1">
                              <span className="bg-primary text-white px-1.5 py-0.5 rounded text-[10px] mr-1">COR</span>
                              {item.corSelecionada}
                            </p>
                          )}
                          {item.descricaoEstampa && (
                            <p className="text-xs mt-1">
                              <span className="bg-primary text-white px-1.5 py-0.5 rounded text-[10px] mr-1">
                                ESTAMPA
                              </span>
                              {item.descricaoEstampa.length > 30
                                ? `${item.descricaoEstampa.substring(0, 30)}...`
                                : item.descricaoEstampa}
                            </p>
                          )}
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

          <div className="space-y-4">
            <div>
              <h3 className="font-bold mb-2 text-primary">OBSERVAÇÕES</h3>
              <p className="text-sm bg-accent p-3 rounded-md min-h-[60px]">
                {orcamento.observacoes || "Nenhuma observação."}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm mt-4">
              <div className="bg-accent p-3 rounded-md">
                <h4 className="font-bold text-primary mb-1">Condições de Pagamento</h4>
                <p>{orcamento.condicoesPagamento}</p>
              </div>
              <div className="bg-accent p-3 rounded-md">
                <h4 className="font-bold text-primary mb-1">Prazo de Entrega</h4>
                <p>{orcamento.prazoEntrega}</p>
              </div>
              <div className="bg-accent p-3 rounded-md">
                <h4 className="font-bold text-primary mb-1">Validade do Orçamento</h4>
                <p>{orcamento.validadeOrcamento}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ficha Técnica */}
      {orcamento.itens.length > 0 && (
        <div className="border border-gray-300 rounded-md overflow-hidden shadow-sm">
          <div className="bg-primary p-6 text-white">
            <h1 className="text-2xl font-bold">FICHA TÉCNICA</h1>
          </div>

          <div className="p-6 space-y-6">
            {orcamento.itens.map((item) => (
              <div key={`ficha-${item.id}`} className="border-b pb-6 last:border-b-0 last:pb-0">
                <h3 className="font-bold text-lg mb-4 text-primary border-b-2 border-primary pb-2 flex items-center">
                  <span className="bg-primary text-white px-2 py-1 rounded-md mr-2 text-sm">ITEM</span>
                  {item.produto?.nome}
                </h3>

                <div className="space-y-4">
                  {/* Imagem do item */}
                  {item.imagem && (
                    <div className="flex justify-center mb-4">
                      <img
                        src={item.imagem || "/placeholder.svg"}
                        alt={item.produto?.nome || "Imagem do produto"}
                        className="max-h-64 object-contain border rounded-md shadow-sm"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                  <div className="mt-4">
                    <h4 className="font-bold mb-3 text-primary">Quantidades por Tamanho</h4>
                    <div className="bg-accent p-4 rounded-md">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr>
                            <th className="border border-gray-300 p-1 text-center bg-primary text-white w-[5%] rounded-tl-md">
                              TAM.
                            </th>
                            {Object.entries(item.tamanhos)
                              .filter(([_, valor]) => valor > 0)
                              .map(([tamanho, _], index) => (
                                <th
                                  key={`header-${item.id}-${tamanho}`}
                                  className={`border border-gray-300 p-1 text-center bg-primary text-white w-[7%]`}
                                >
                                  {tamanho}
                                </th>
                              ))}
                            <th className="border border-gray-300 p-1 text-center bg-primary text-white w-[5%] rounded-tr-md">
                              TOT.
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-300 p-1 text-center font-medium bg-white">QTD.</td>
                            {Object.entries(item.tamanhos)
                              .filter(([_, valor]) => valor > 0)
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
