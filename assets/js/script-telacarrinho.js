// 1. Variáveis globais
const usuario = JSON.parse(localStorage.getItem('usuario'));
let produtosNoCarrinho = [];
let enderecoEntrega = JSON.parse(localStorage.getItem('enderecoEntrega')) || null;
let valorFrete = 0;

// 2. Funções auxiliares
const formatarPreco = (valor) => {
  const valorNumerico = typeof valor === 'string' ? parseFloat(valor) : Number(valor);

  if (isNaN(valorNumerico)) {
    console.warn("Valor inválido para formatação:", valor);
    return "R$ 0,00";
  }

  return valorNumerico.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const formatarCEP = (cep) => {
  return cep.replace(/(\d{5})(\d{3})/, '$1-$2');
};

const calcularPesoTotal = () => {
  return produtosNoCarrinho.reduce((total, produto) => total + (produto.quantidade * 1), 0);
};

const calcularDimensoes = () => {
  const itens = produtosNoCarrinho.length;
  return {
    comprimento: Math.min(100, 20 + (itens * 5)),
    largura: Math.min(100, 15 + (itens * 3)),
    altura: Math.min(100, 10 + (itens * 2))
  };
};

// 3. Funções para endereços e frete
const buscarEnderecoPorCEP = async (cep) => {
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    if (!response.ok) throw new Error('CEP não encontrado');
    const data = await response.json();
    if (data.erro) throw new Error('CEP não encontrado');
    return {
      cep: data.cep,
      logradouro: data.logradouro,
      complemento: data.complemento,
      bairro: data.bairro,
      localidade: data.localidade,
      uf: data.uf
    };
  } catch (error) {
    console.error("Erro ao buscar CEP:", error);
    throw error;
  }
};

const calcularFreteCorreios = async (cepDestino) => {
  try {
    const pesoTotal = calcularPesoTotal();
    const dimensoes = calcularDimensoes();
    const { uf } = await buscarEnderecoPorCEP(cepDestino);

    const baseUFs = {
      'SP': 15.00, 'RJ': 20.00, 'MG': 18.00, 'ES': 19.00,
      'RS': 25.00, 'SC': 24.00, 'PR': 22.00, 'DF': 30.00, 'GO': 28.00
    };

    let valorBase = baseUFs[uf] || 35.00;
    const adicionalPeso = Math.max(0, pesoTotal - 5) * 2;
    const adicionalItens = produtosNoCarrinho.length > 3 ? (produtosNoCarrinho.length - 3) * 3 : 0;

    const freteCalculado = valorBase + adicionalPeso + adicionalItens;

    return [
      {
        nome: "PAC",
        prazo: "7 a 10 dias úteis",
        valor: freteCalculado
      },
      {
        nome: "SEDEX",
        prazo: "3 a 5 dias úteis",
        valor: freteCalculado * 1.5
      },
      {
        nome: "SEDEX 10",
        prazo: "1 dia útil",
        valor: freteCalculado * 2
      }
    ];
  } catch (error) {
    console.error("Erro ao calcular frete:", error);
    throw error;
  }
};

const atualizarFrete = async (cep) => {
  try {
    const cepNumerico = cep.replace(/\D/g, '');
    if (cepNumerico.length !== 8) throw new Error('CEP inválido');

    const freteOptions = await calcularFreteCorreios(cepNumerico);
    const freteSelecionado = freteOptions[0];

    valorFrete = freteSelecionado.valor;
    document.getElementById('frete').innerHTML = `
      Frete: ${formatarPreco(valorFrete)} (${freteSelecionado.nome} - ${freteSelecionado.prazo})
    `;

    atualizarResumo();
    return freteOptions;
  } catch (error) {
    console.error("Erro ao atualizar frete:", error);
    document.getElementById('frete').textContent = 'Frete: CEP inválido ou serviço indisponível';
    valorFrete = 0;
    atualizarResumo();
    return [];
  }
};

const renderizarSelecaoEndereco = (enderecos) => {
  const container = document.getElementById('endereco-selecao');
  
  if (enderecos.length === 0) {
    container.innerHTML = `
      <div class="no-address">
        <p>Nenhum endereço cadastrado</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="address-options">
      ${enderecos.map((endereco, index) => `
        <div class="address-option ${endereco.isDefault ? 'default' : ''}">
          <input 
            type="radio" 
            id="endereco-${index}" 
            name="endereco-entrega" 
            value="${index}" 
            ${endereco.isDefault ? 'checked' : ''}
          >
          <label for="endereco-${index}">
            <div class="address-info">
              <p><strong>${endereco.logradouro}, ${endereco.numero}</strong></p>
              <p>${endereco.bairro} - ${endereco.cidade}/${endereco.uf}</p>
              <p>CEP: ${formatarCEP(endereco.cep)}</p>
              ${endereco.complemento ? `<p>Complemento: ${endereco.complemento}</p>` : ''}
            </div>
          </label>
        </div>
      `).join('')}
    </div>
  `;

  container.querySelectorAll('input[name="endereco-entrega"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const index = e.target.value;
      selecionarEndereco(enderecos[index]);
    });
  });

  const defaultAddress = enderecos.find(e => e.isDefault) || enderecos[0];
  if (defaultAddress) {
    selecionarEndereco(defaultAddress);
  }
};

const selecionarEndereco = (endereco) => {
  enderecoEntrega = {
    cep: endereco.cep.replace(/\D/g, ''),
    logradouro: endereco.logradouro,
    numero: endereco.numero,
    complemento: endereco.complemento,
    bairro: endereco.bairro,
    localidade: endereco.cidade,
    uf: endereco.uf,
    referencia: endereco.referencia || ''
  };

  localStorage.setItem('enderecoEntrega', JSON.stringify(enderecoEntrega));
  atualizarEnderecoDisplay();
  atualizarFrete(endereco.cep);
};

const atualizarEnderecoDisplay = () => {
  const display = document.getElementById('endereco-selecionado-display');
  if (enderecoEntrega && enderecoEntrega.cep) { // Verifica se há endereço e CEP
    display.innerHTML = `
      <div class="selected-address">
        <h4>Endereço selecionado:</h4>
        <p><strong>${enderecoEntrega.logradouro}, ${enderecoEntrega.numero}</strong></p>
        ${enderecoEntrega.complemento ? `<p>${enderecoEntrega.complemento}</p>` : ''}
        <p>${enderecoEntrega.bairro}</p>
        <p>${enderecoEntrega.localidade} - ${enderecoEntrega.uf}</p>
        <p>CEP: ${formatarCEP(enderecoEntrega.cep)}</p>
        ${enderecoEntrega.referencia ? `<p>Referência: ${enderecoEntrega.referencia}</p>` : ''}
      </div>
    `;
  } else {
    display.innerHTML = ''; // Deixa vazio se não houver endereço selecionado
  }
};

// 4. Funções para produtos
const criarCardProduto = (produto, index) => {
  const card = document.createElement('div');
  card.classList.add('cart-item');
  card.setAttribute('data-index', index);

  card.innerHTML = `
    <img src="${produto.imagem}" alt="${produto.nome}" class="product-image">
    <div class="item-info">
      <h3>${produto.nome}</h3>
      <p>Unidade: ${formatarPreco(produto.preco)}</p>
      <p>Estoque disponível: ${produto.estoque}</p>
      <p id="valor-total-${index}">Total: ${formatarPreco(produto.preco * produto.quantidade)}</p>
    </div>
    <div class="item-actions">
      <input type="number" value="${produto.quantidade}" min="1" max="${produto.estoque}"
             data-index="${index}" data-produto-id="${produto.id}" class="quantity-input">
      <br><br>
      <button class="btn-remover" data-index="${index}" data-produto-id="${produto.id}">Remover</button>
    </div>
  `;
  return card;
};

const atualizarQuantidadeNoBanco = async (produtoId, novaQuantidade) => {
  try {
    const response = await ApiService.atualizarItemCarrinho({
      id: produtoId,
      quantidade: novaQuantidade.toString()
    });
    if (!response.ok) throw new Error('Falha ao atualizar quantidade');
    const contentType = response.headers.get("content-type");
    return contentType.includes("application/json") ? await response.json() : await response.text();
  } catch (error) {
    console.error("Erro ao atualizar quantidade:", error);
    throw error;
  }
};

const atualizarResumo = async () => {
  let subtotal = 0;
  try {
    const inputs = document.querySelectorAll('input[type="number"]');
    for (const input of inputs) {
      const produtoId = input.getAttribute('data-produto-id');
      const novaQuantidade = parseInt(input.value);
      const produto = produtosNoCarrinho.find(p => p.id === produtoId);
      if (novaQuantidade > produto.estoque) {
        alert(`A quantidade para "${produto.nome}" não pode exceder o estoque (${produto.estoque}).`);
        input.value = produto.estoque;
        await atualizarQuantidadeNoBanco(produtoId, produto.estoque);
        produto.quantidade = produto.estoque;
      } else {
        await atualizarQuantidadeNoBanco(produtoId, novaQuantidade);
        produto.quantidade = novaQuantidade;
      }
    }
  } catch (error) {
    console.error("Erro ao sincronizar com o servidor:", error);
  } finally {
    produtosNoCarrinho.forEach((produto, index) => {
      const totalProduto = produto.preco * produto.quantidade;
      const totalEl = document.getElementById(`valor-total-${index}`);
      if (totalEl) totalEl.innerText = `Total: ${formatarPreco(totalProduto)}`;
      subtotal += totalProduto;
    });
    const total = subtotal + valorFrete;
    document.getElementById('subtotal').innerText = `Subtotal: ${formatarPreco(subtotal)}`;
    document.getElementById('total').innerText = `Total: ${formatarPreco(total)}`;
  }
};

const removerProduto = async (index, produtoId) => {
  try {
    await ApiService.removerItemCarrinho(produtoId);
    produtosNoCarrinho.splice(index, 1);
    renderizarCarrinho();
    if (enderecoEntrega?.cep) {
      await atualizarFrete(enderecoEntrega.cep);
    }
  } catch (error) {
    console.error("Erro ao remover produto:", error);
    alert("Não foi possível remover o produto. Tente novamente.");
  }
};

const renderizarCarrinho = () => {
  const container = document.getElementById('cart-items');
  if (!container) return;
  container.innerHTML = produtosNoCarrinho.length === 0
    ? '<div class="empty-cart"><i class="fas fa-shopping-cart"></i><p>Seu carrinho está vazio</p></div>'
    : '';

  produtosNoCarrinho.forEach((produto, index) => {
    const card = criarCardProduto(produto, index);
    container.appendChild(card);
  });

  document.querySelectorAll('input[type="number"]').forEach(input => {
    input.addEventListener('input', () => {
      const index = input.getAttribute('data-index');
      const produto = produtosNoCarrinho[index];
      let valor = parseInt(input.value);
      if (valor > produto.estoque) input.value = produto.estoque;
      else if (valor < 1) input.value = 1;
    });
    input.addEventListener('change', atualizarResumo);
  });

  document.querySelectorAll('.btn-remover').forEach(botao => {
    botao.addEventListener('click', () => {
      const index = parseInt(botao.getAttribute('data-index'));
      const produtoId = botao.getAttribute('data-produto-id');
      removerProduto(index, produtoId);
    });
  });

  atualizarResumo();
};

// 5. Eventos e Inicialização
document.addEventListener("DOMContentLoaded", async () => {
  // Inicialização do carrinho
  try {
    if (!usuario?.id) {
      window.location.href = '/login.html';
      return;
    }

    document.getElementById('cart-items').innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Carregando carrinho...</div>';

    produtosNoCarrinho = await ApiService.buscarCarrinho(usuario.id);
    renderizarCarrinho();

    // Carrega os endereços do usuário
    if (usuario?.enderecos) {
      renderizarSelecaoEndereco(usuario.enderecos);
    }


  } catch (error) {
    console.error("Erro ao carregar carrinho:", error);
    document.getElementById('cart-items').innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Erro ao carregar o carrinho. Por favor, tente novamente.</p>
      </div>
    `;
  }

  // Botão Finalizar Compra
  const btnFinalizar = document.getElementById("btnFinalizar");
  if (btnFinalizar) {
    btnFinalizar.addEventListener("click", async () => {
      const observacoes = document.getElementById('observacoes')?.value || "";

      // Validações
      if (!enderecoEntrega) {
        alert("Por favor, selecione um endereço de entrega.");
        return;
      }

      btnFinalizar.disabled = true;
      btnFinalizar.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Processando...';

      const pagamentoSelecionado = document.querySelector('input[name="pagamento"]:checked');
      if (!pagamentoSelecionado) {
        alert("Selecione uma forma de pagamento.");
        btnFinalizar.disabled = false;
        btnFinalizar.innerHTML = 'Finalizar Compra';
        return;
      }

      if (pagamentoSelecionado.value === 'pix') {
        try {
          await iniciarPagamentoPix();
        } catch (error) {
          alert("Erro ao processar o pagamento via PIX. Tente novamente.");
          console.error(error);
        } finally {
          btnFinalizar.disabled = false;
          btnFinalizar.innerHTML = 'Finalizar Compra';
        }
      } else if (pagamentoSelecionado.value === 'cartao' || pagamentoSelecionado.value === 'debito') {
        modalCartao.classList.remove('hidden');
        inicializarCheckoutBricks();
      } else {
        alert("Forma de pagamento não reconhecida.");
        btnFinalizar.disabled = false;
        btnFinalizar.innerHTML = 'Finalizar Compra';
      }
    });
  }

  async function iniciarPagamentoPix() {
    try {
      const usuario = JSON.parse(localStorage.getItem('usuario'));
      const observacoes = document.getElementById('observacoes')?.value || "";

      const finalizarResponse = await ApiService.finalizarCarrinho(observacoes, valorFrete);
      const pedidoData = await finalizarResponse.json();
      const pedidoId = pedidoData.id;

      const pixResponse = await ApiService.pagarComPix({
        pedidoId: pedidoId,
        usuarioId: usuario.id
      });

      console.log("Resposta do PIX:", pixResponse);

      if (!pixResponse || (!pixResponse.qrCodeBase64 && !pixResponse.qrcode)) {
        throw new Error("Dados do PIX não recebidos do servidor");
      }

      const valor = pixResponse.transactionAmount ||
        pixResponse.valor ||
        (produtosNoCarrinho.reduce((total, p) => total + (p.preco * p.quantidade), 0) + valorFrete);

      exibirModalPix(
        pixResponse.qrCodeBase64,
        pixResponse.qrcode,
        valor
      );

      if (pixResponse.id) {
        monitorarStatusPagamento(pixResponse.id, pedidoId);
      }

    } catch (error) {
      console.error("Erro ao iniciar pagamento via PIX:", error);
      alert("Erro ao processar o pagamento via PIX: " + error.message);

      const btnFinalizar = document.getElementById("btnFinalizar");
      if (btnFinalizar) {
        btnFinalizar.disabled = false;
        btnFinalizar.innerHTML = 'Finalizar Compra';
      }

      throw error;
    }
  }

  function exibirModalPix(qrCodeBase64, qrCodeCopel, valor) {
    const modal = document.getElementById("modalPix");
    const img = document.getElementById("qrCodePixImg");
    const textoPix = modal.querySelector(".codigo-pix");
    const valorSpan = modal.querySelector(".valor-pix");

    if (qrCodeBase64) {
      img.src = `data:image/png;base64,${qrCodeBase64}`;
    } else {
      img.style.display = "none";
    }

    if (qrCodeCopel) {
      textoPix.value = qrCodeCopel;
    } else {
      textoPix.style.display = "none";
    }

    if (valor !== undefined && valor !== null) {
      valorSpan.textContent = `Valor: ${formatarPreco(valor)}`;
    } else {
      valorSpan.textContent = "Valor não disponível";
    }

    modal.classList.remove("hidden");
  }

  function copiarCodigoPix() {
    const textarea = document.querySelector(".codigo-pix");
    const codigoPix = textarea.value;

    if (!codigoPix.trim()) {
      alert("Nenhum código PIX disponível para copiar!");
      return;
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(codigoPix)
        .then(() => {
          const btn = document.querySelector("button[onclick='copiarCodigoPix()']");
          if (btn) {
            btn.textContent = "Copiado!";
            setTimeout(() => { btn.textContent = "Copiar"; }, 2000);
          }
        })
        .catch(err => {
          console.error("Erro ao copiar usando Clipboard API:", err);
          fallbackCopy(textarea);
        });
    } else {
      fallbackCopy(textarea);
    }
  }

  function fallbackCopy(textarea) {
    textarea.style.display = 'block';
    textarea.focus();
    textarea.select();

    try {
      const successful = document.execCommand('copy');
      if (successful) {
        alert("Código PIX copiado!");
      } else {
        throw new Error('Falha ao copiar');
      }
    } catch (err) {
      console.error("Erro ao copiar:", err);
      alert("Não foi possível copiar automaticamente. Selecione e copie manualmente.");
    } finally {
      textarea.style.display = 'none';
    }
  }

  async function monitorarStatusPagamento(paymentId, pedidoId) {
    try {
      const interval = setInterval(async () => {
        const response = await fetch(`http://localhost:8080/giostri/pagamento/status/${paymentId}`, {
          headers: {
            'Authorization': `Bearer ${pegarToken()}`
          }
        });

        const status = await response.json();

        if (status === 'approved') {
          clearInterval(interval);
          window.location.href = `/pedido-concluido.html?id=${pedidoId}`;
        }
      }, 5000);

      setTimeout(() => {
        clearInterval(interval);
        alert("Pagamento não confirmado. Por favor, verifique e tente novamente.");
      }, 1800000);
    } catch (error) {
      console.error("Erro ao monitorar pagamento:", error);
    }
  }

  // Configuração do Payment Brick
  const pagamentoRadios = document.querySelectorAll('input[name="pagamento"]');
  const modalCartao = document.getElementById('modal-pagamento');
  const modalTitle = document.getElementById('modal-title');
  const closeModal = document.querySelector('.close-modal-pagamento');
  const wrapperParcelas = document.getElementById("parcelas-wrapper");

  pagamentoRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.value === 'cartao' || radio.value === 'debito') {
        modalTitle.textContent = radio.value === 'cartao'
          ? 'Pagamento com Cartão de Crédito'
          : 'Pagamento com Cartão de Débito';
      } else {
        modalCartao.classList.add('hidden');
      }
    });
  });

  closeModal.addEventListener('click', () => {
    modalCartao.classList.add('hidden');
    const btnFinalizar = document.getElementById("btnFinalizar");
    if (btnFinalizar) {
      btnFinalizar.disabled = false;
      btnFinalizar.innerHTML = 'Finalizar Compra';
    }
  });

  window.addEventListener('click', (e) => {
    if (e.target === modalCartao) {
      modalCartao.classList.add('hidden');
      const btnFinalizar = document.getElementById("btnFinalizar");
      if (btnFinalizar) {
        btnFinalizar.disabled = false;
        btnFinalizar.innerHTML = 'Finalizar Compra';
      }
    }
  });

  // Função para inicializar o Payment Brick
  const inicializarCheckoutBricks = async () => {
    try {
      if (typeof MercadoPago === 'undefined') {
        throw new Error('SDK do MercadoPago não carregado');
      }

      console.log('MercadoPago SDK carregado?', typeof MercadoPago !== 'undefined');

      const mp = new MercadoPago("APP_USR-02f345b3-ecb7-4528-8d0d-72aff35417c2", {
        locale: 'pt-BR'
      });

      const totalPedido = produtosNoCarrinho.reduce((soma, p) => soma + (p.preco * p.quantidade), 0) + 1;
      const isCredito = document.querySelector('input[name="pagamento"]:checked').value === 'cartao';
      const parcelas = isCredito ? parseInt(document.getElementById('parcelas')?.value || "1") : 1;

      const debito = {
        debitCard: "all",
        mercadoPago: "none"
      };

      const credito = {
        creditCard: "all",
        mercadoPago: "none"
      };

      if (window.paymentBrickController) {
        try {
          await window.paymentBrickController.unmount();
        } catch (e) {
          console.warn("Erro ao desmontar Brick:", e);
        }
      }

      window.paymentBrickController = await mp.bricks().create("payment", "paymentBrick_container", {
        initialization: {
          amount: totalPedido,
          ...(isCredito && { installments: parcelas })
        },
        customization: {
          paymentMethods: isCredito ? credito : debito,
          visual: {
            style: {
              theme: 'bootstrap',
              customVariables: {
                formBackgroundColor: '#ffffff',
                baseColor: '#007ea7'
              }
            }
          }
        },
        callbacks: {
          onReady: () => {
            console.log('Brick pronto');
          },
          onSubmit: async ({ formData, selectedPaymentMethod }) => {
            try {
              const submitButton = document.querySelector('#paymentBrick_container .mercadopago-button');
              if (submitButton) {
                submitButton.disabled = true;
                submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Processando...';
              }

              console.log('formData:', formData);
              const pedidoResponse = await ApiService.finalizarCarrinho(observacoes, valorFrete);
              if (!pedidoResponse.ok) throw new Error("Falha ao criar pedido");

              const pedidoData = await pedidoResponse.json();
              const pedidoId = pedidoData.id;

              const bandeira = formData.payment_method_id;
              if (!bandeira) throw new Error("Bandeira do cartão não informada");

              const dadosPagamento = {
                pedidoId: pedidoId,
                usuarioId: usuario.id,
                tokenCartao: formData.token,
                metodoPagamento: selectedPaymentMethod,
                bandeira: formData.payment_method_id,
                issuerId: formData.issuer_id,
                parcelas: isCredito ? parcelas : 1,
                valorTotal: totalPedido,
                payerEmail: formData.payer?.email || usuario.email
              };

              console.log('Dados do pagamento:', dadosPagamento);

              const pagamentoResponse = await ApiService.processarPagamentoCartao(dadosPagamento);

              if (pagamentoResponse.status === 'approved') {
                localStorage.removeItem('dadosPagamento');
                window.location.href = `/pedido-concluido.html?id=${pedidoId}`;
                return;
              } else {
                throw new Error(pagamentoResponse.statusDetail || 'Pagamento não aprovado');
              }

            } catch (error) {
              console.error('Erro no processamento do pagamento:', error);
              alert(`Erro: ${error.message}`);
            } finally {
              btnFinalizar.disabled = false;
              btnFinalizar.textContent = "Finalizar Compra";

              const submitButton = document.querySelector('#paymentBrick_container .mercadopago-button');
              if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Pagar';
              }
            }
          },
          onError: (error) => {
            console.error("Erro no Brick:", error);
            alert(`Erro no formulário de pagamento: ${error.message}`);
          }
        }
      });
    } catch (error) {
      console.error("Erro ao inicializar o Brick:", error);
      alert("Erro ao carregar o formulário de pagamento");
    }
  };
});

// CSS para a seleção de endereços
const styleElement = document.createElement('style');
styleElement.innerHTML = `
  .address-options {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin: 1rem 0;
  }
  
  .address-option {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 1rem;
    transition: all 0.3s;
  }
  
  .address-option:hover {
    border-color: #007ea7;
  }
  
  .address-option.default {
    border-left: 4px solid #007ea7;
  }
  
  .address-option input[type="radio"] {
    margin-right: 1rem;
  }
  
  .address-option label {
    display: flex;
    align-items: center;
    cursor: pointer;
    width: 100%;
  }
  
  .address-info {
    flex: 1;
  }
  
  .address-info p {
    margin: 0.2rem 0;
    font-size: 0.9rem;
  }
  
  .address-info p:first-child {
    font-weight: 500;
    font-size: 1rem;
  }
  
  .selected-address {
    background-color: #f8f9fa;
    padding: 1rem;
    border-radius: 8px;
    margin-top: 1rem;
  }
  
  .selected-address h4 {
    margin-top: 0;
    color: #007ea7;
  }
  
  .selected-address p {
    margin: 0.3rem 0;
  }
  
  .no-address {
    text-align: center;
    padding: 1rem;
    color: #666;
  }
  
  .loading-address {
    text-align: center;
    padding: 1rem;
    color: #666;
  }
  
  #btn-novo-endereco {
    width: 100%;
    padding: 0.8rem;
    background-color: #007ea7;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
    margin-top: 1rem;
  }
  
  #btn-novo-endereco:hover {
    background-color: #006288;
  }
`;
document.head.appendChild(styleElement);