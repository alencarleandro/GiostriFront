/*
 * Gerenciamento de Produtos - Interface e Lógica
 * 
 * Funcionalidades:
 * - Listagem de produtos
 * - Adição/Edição/Exclusão de produtos
 * - Busca e filtros
 * - Validação de formulários
 */

// ==================================================
// CONSTANTES E VARIÁVEIS GLOBAIS
// ==================================================

// Elementos DOM
const DOM = {
    formularioProduto: document.getElementById('productForm'),
    listaProdutos: document.getElementById('productsList'),
    campoBusca: document.getElementById('searchInput'),
    botaoLimparBusca: document.getElementById('clearSearch'),
    modal: document.getElementById('modal'),
    conteudoModal: document.querySelector('.modal-content'),
    botaoFecharModal: document.querySelector('.close-modal'),
    quantidadeProduto: document.getElementById('productQuantity'),
    botaoMenos: document.querySelector('.quantity-btn.minus'),
    botaoMais: document.querySelector('.quantity-btn.plus'),
    botaoFiltro: document.getElementById('filterBtn'),
    opcoesFiltro: document.getElementById('filterOptions'),
    botaoAplicarFiltro: document.getElementById('applyFilter'),
    botaoLimparFiltro: document.getElementById('clearFilter'),
    precoMinimo: document.getElementById('minPrice'),
    precoMaximo: document.getElementById('maxPrice'),
    urlImagemProduto: document.getElementById('productImageUrl')
  };
  
  // Estado da aplicação
  const estado = {
    produtos: [],
    produtoAtual: null,
    filtrosAtivos: {
      termoBusca: '',
      precoMinimo: 0,
      precoMaximo: Infinity
    }
  };
  
  // Constantes
  const LIMITES = {
    NOME: 100,
    DESCRICAO: 500,
    QUANTIDADE: {
      MIN: 1,
      MAX: 1000
    }
  };
  
  // ==================================================
  // INICIALIZAÇÃO
  // ==================================================
  
  document.addEventListener('DOMContentLoaded', inicializarAplicacao);
  
  async function inicializarAplicacao() {
    await carregarProdutos();
    configurarEventListeners();
  }
  
  // ==================================================
  // FUNÇÕES PRINCIPAIS
  // ==================================================
  
  /**
   * Carrega produtos da API
   */
  async function carregarProdutos() {
    try {
      estado.produtos = await ApiService.listarProdutos();
      atualizarListaProdutos();
    } catch (erro) {
      console.error('Erro ao carregar produtos:', erro);
      mostrarNotificacao('Erro ao carregar produtos', 'erro');
    }
  }
  
  /**
   * Configura todos os event listeners
   */
  function configurarEventListeners() {
    // Validação de formulário
    DOM.formularioProduto.classList.add('needs-validation');
    DOM.formularioProduto.addEventListener('submit', manipularSubmitFormulario);
  
    // Contadores de caracteres
    document.getElementById('productName').addEventListener('input', (e) => {
      atualizarContadorCaracteres(e.target, LIMITES.NOME);
    });
  
    document.getElementById('productDescription').addEventListener('input', (e) => {
      atualizarContadorCaracteres(e.target, LIMITES.DESCRICAO);
    });
  
    // Formatação de preço
    document.getElementById('productPrice').addEventListener('input', formatarPreco);
  
    // Busca
    DOM.campoBusca.addEventListener('input', alternarBotaoLimparBusca);
    DOM.campoBusca.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') executarBusca();
    });
    DOM.botaoLimparBusca.addEventListener('click', limparBusca);
  
    // Quantidade
    DOM.botaoMenos.addEventListener('click', diminuirQuantidade);
    DOM.botaoMais.addEventListener('click', aumentarQuantidade);
    DOM.quantidadeProduto.addEventListener('input', validarQuantidade);
  
    // Filtros
    DOM.botaoFiltro.addEventListener('click', alternarOpcoesFiltro);
    document.addEventListener('click', fecharOpcoesFiltro);
    DOM.opcoesFiltro.addEventListener('click', (e) => e.stopPropagation());
    DOM.botaoAplicarFiltro.addEventListener('click', aplicarFiltros);
    DOM.botaoLimparFiltro.addEventListener('click', limparFiltros);
  
    // Modal
    DOM.modal.addEventListener('click', (e) => {
      if (e.target === DOM.modal) fecharModal();
    });
    DOM.botaoFecharModal.addEventListener('click', fecharModal);
  }
  
  // ==================================================
  // FUNÇÕES DE INTERFACE
  // ==================================================
  
  /**
   * Atualiza a lista de produtos na tela
   */
  function atualizarListaProdutos() {
    const produtosFiltrados = filtrarProdutos();
    
    DOM.listaProdutos.innerHTML = produtosFiltrados.map(produto => `
      <div class="product-item" data-id="${produto.id}">
        <div class="product-info">
          <strong>${produto.nome}</strong>
          ${produto.URL ? 
            `<img src="${produto.URL}" style="max-width: 100px; max-height: 100px; object-fit: contain; display: block; margin: 0.5rem 0;">` : 
            ''}
          <p>Preço: R$ ${produto.preco.toFixed(2)}</p>
          <p>Quantidade: ${produto.quantidadeEmEstoque}</p>
        </div>
        <div class="product-actions">
          <button class="btn btn-view">Ver</button>
          <button class="btn btn-edit">Editar</button>
          <button class="btn btn-delete">Excluir</button>
        </div>
      </div>
    `).join('');
  
    configurarEventListenersProdutos();
  }
  
  /**
   * Configura event listeners para os botões de produtos
   */
  function configurarEventListenersProdutos() {
    document.querySelectorAll('.btn-view').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const productId = e.target.closest('.product-item').dataset.id;
        visualizarProduto(productId);
      });
    });
  
    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const productId = e.target.closest('.product-item').dataset.id;
        editarProduto(productId);
      });
    });
  
    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const productId = e.target.closest('.product-item').dataset.id;
        confirmarExclusaoProduto(productId);
      });
    });
  }
  
  /**
   * Formata o campo de preço para o formato monetário
   */
  function formatarPreco(e) {
    let valor = e.target.value.replace(/\D/g, '');
    valor = (parseInt(valor) / 100).toFixed(2);
    e.target.value = valor ? `R$ ${valor}` : '';
  }
  
  /**
   * Atualiza o contador de caracteres
   */
  function atualizarContadorCaracteres(elemento, maximo) {
    const contagem = elemento.value.length;
    elemento.nextElementSibling.textContent = `${contagem}/${maximo}`;
  }
  
  // ==================================================
  // FUNÇÕES DE QUANTIDADE
  // ==================================================
  
  function diminuirQuantidade() {
    if (DOM.botaoMenos.disabled) return;
    let valor = parseInt(DOM.quantidadeProduto.value);
    if (valor > LIMITES.QUANTIDADE.MIN) {
      DOM.quantidadeProduto.value = valor - 1;
    }
    alternarBotoesQuantidade();
  }
  
  function aumentarQuantidade() {
    let valor = parseInt(DOM.quantidadeProduto.value);
    if (valor < LIMITES.QUANTIDADE.MAX) {
      DOM.quantidadeProduto.value = valor + 1;
    }
    alternarBotoesQuantidade();
  }
  
  function validarQuantidade() {
    let valor = parseInt(DOM.quantidadeProduto.value);
    if (valor < LIMITES.QUANTIDADE.MIN) DOM.quantidadeProduto.value = LIMITES.QUANTIDADE.MIN;
    if (valor > LIMITES.QUANTIDADE.MAX) DOM.quantidadeProduto.value = LIMITES.QUANTIDADE.MAX;
    alternarBotoesQuantidade();
  }
  
  function alternarBotoesQuantidade() {
    const valor = parseInt(DOM.quantidadeProduto.value);
    DOM.botaoMais.disabled = valor >= LIMITES.QUANTIDADE.MAX;
    DOM.botaoMenos.disabled = valor <= LIMITES.QUANTIDADE.MIN;
  }
  
  // ==================================================
  // FUNÇÕES DE BUSCA E FILTRO
  // ==================================================
  
  function alternarBotaoLimparBusca() {
    DOM.botaoLimparBusca.classList.toggle('visible', DOM.campoBusca.value.length > 0);
  }
  
  function limparBusca() {
    DOM.campoBusca.value = '';
    estado.filtrosAtivos.termoBusca = '';
    atualizarListaProdutos();
    alternarBotaoLimparBusca();
  }
  
  function filtrarProdutos() {
    return estado.produtos.filter(produto => {
      const nomeProduto = produto.nome || ''; 
      return nomeProduto.toLowerCase().includes(estado.filtrosAtivos.termoBusca.toLowerCase()) &&
        produto.preco >= estado.filtrosAtivos.precoMinimo &&
        produto.preco <= estado.filtrosAtivos.precoMaximo;
    });
  }
  
  function executarBusca() {
    estado.filtrosAtivos.termoBusca = DOM.campoBusca.value;
    atualizarListaProdutos();
  }
  
  function alternarOpcoesFiltro(e) {
    e.stopPropagation();
    DOM.opcoesFiltro.classList.toggle('show');
  }
  
  function fecharOpcoesFiltro(e) {
    if (!DOM.opcoesFiltro.contains(e.target)) {
      DOM.opcoesFiltro.classList.remove('show');
    }
  }
  
  function aplicarFiltros(e) {
    e.preventDefault();
    estado.filtrosAtivos.precoMinimo = parseFloat(DOM.precoMinimo.value) || 0;
    estado.filtrosAtivos.precoMaximo = parseFloat(DOM.precoMaximo.value) || Infinity;
    atualizarListaProdutos();
    DOM.opcoesFiltro.classList.remove('show');
  }
  
  function limparFiltros(e) {
    e.preventDefault();
    DOM.precoMinimo.value = '';
    DOM.precoMaximo.value = '';
    estado.filtrosAtivos.precoMinimo = 0;
    estado.filtrosAtivos.precoMaximo = Infinity;
    atualizarListaProdutos();
    DOM.opcoesFiltro.classList.remove('show');
  }
  
  // ==================================================
  // FUNÇÕES DE MODAL
  // ==================================================
  
  function abrirModal(conteudo, className = '') {
    DOM.modal.style.display = 'flex';
    DOM.modal.querySelector('.modal-body').innerHTML = conteudo;
    document.body.style.overflow = 'hidden';
    
    const modalContent = DOM.modal.querySelector('.modal-content');
    modalContent.className = 'modal-content';
    if (className) {
      modalContent.classList.add(className);
    }
  }
  
  function fecharModal() {
    DOM.modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    estado.produtoAtual = null;
  }
  
  // ==================================================
  // FUNÇÕES DE PRODUTO (CRUD)
  // ==================================================
  
  /**
   * Manipula o envio do formulário de produto
   */
  async function manipularSubmitFormulario(e) {
    if (!DOM.formularioProduto.checkValidity()) {
      e.preventDefault();
      e.stopPropagation();
    } else {
      e.preventDefault();
      
      const produto = obterDadosFormulario();
      
      try {
        await ApiService.adicionarProduto(produto);
        await carregarProdutos();
        resetarFormulario();
        mostrarNotificacao('Produto adicionado com sucesso!', 'sucesso');
      } catch (erro) {
        console.error('Erro ao adicionar produto:', erro);
        mostrarNotificacao('Erro ao adicionar produto', 'erro');
      }
    }
  
    DOM.formularioProduto.classList.add('was-validated');
  }
  
  function obterDadosFormulario() {
    const valorPreco = document.getElementById('productPrice').value
      .replace('R$ ', '')
      .replace(',', '.');
  
    return {
      nome: document.getElementById('productName').value,
      preco: parseFloat(valorPreco),
      quantidadeEmEstoque: parseInt(DOM.quantidadeProduto.value),
      categoria: document.getElementById('productCategory').value,
      descricao: document.getElementById('productDescription').value,
      URL: DOM.urlImagemProduto.value || null
    };
  }
  
  function resetarFormulario() {
    DOM.formularioProduto.reset();
    DOM.formularioProduto.classList.remove('was-validated');
    document.querySelectorAll('.char-count').forEach(counter => counter.textContent = '0/100');
  }
  
  /**
   * Visualiza um produto no modal
   */
  function visualizarProduto(id) {
    const produto = estado.produtos.find(p => p.id === id.toString());
    console.log(produto)
    estado.produtoAtual = produto;
  
    if (!produto) {
      mostrarNotificacao('Produto não encontrado', 'erro');
      return;
    }
  
    const conteudo = `
      <div class="product-details view-mode">
        <div class="product-header">
          <h3>${produto.nome}</h3>
          <span class="product-category">${produto.categoria}</span>
        </div>
        
        <div class="product-content">
          <div class="product-image-container">
            ${produto.url ?
              `<img src="${produto.url}" alt="${produto.nome}" class="product-img">
               <button class="btn-img-zoom" onclick="zoomImage('${produto.url}')">
                 <i class="fas fa-search-plus"></i>
               </button>` :
              '<div class="no-image"><i class="fas fa-image"></i><span>Sem imagem</span></div>'
            }
          </div>
          
          <div class="product-info">
            <div class="info-item">
              <span class="info-label">Preço:</span>
              <span class="info-value price">R$ ${produto.preco.toFixed(2)}</span>
            </div>
            
            <div class="info-item">
              <span class="info-label">Estoque:</span>
              <span class="info-value quantity">${produto.quantidadeEmEstoque} unidades</span>
            </div>
            
            <div class="info-item full-width">
              <span class="info-label">Descrição:</span>
              <p class="info-value description">${produto.descricao || 'Nenhuma descrição fornecida'}</p>
            </div>
          </div>
        </div>
        
        <div class="product-footer">
          <button class="btn btn-close-modal">Fechar</button>
        </div>
      </div>
    `;
  
    abrirModal(conteudo, 'modal-lg');
    document.querySelector('.btn-close-modal').addEventListener('click', fecharModal);
  }
  
  /**
   * Prepara o modal para edição de produto
   */
  function editarProduto(id) {
    const produto = estado.produtos.find(p => p.id === id.toString());
    estado.produtoAtual = produto;
  
    if (!produto) {
      mostrarNotificacao('Produto não encontrado', 'erro');
      return;
    }
  
    const conteudo = `
      <div class="edit-product-form">
        <div class="form-header">
          <h3><i class="fas fa-edit"></i> Editar Produto</h3>
          <p>ID: ${produto.id}</p>
        </div>
        
        <form id="editProductForm" class="form-grid">
          <div class="form-group">
            <label for="editName">Nome do Produto</label>
            <input type="text" id="editName" value="${produto.nome}" required maxlength="${LIMITES.NOME}">
            <small class="char-count">${produto.nome.length}/${LIMITES.NOME}</small>
          </div>
          
          <div class="form-group">
            <label for="editPrice">Preço (R$)</label>
            <input type="text" id="editPrice" value="R$ ${produto.preco.toFixed(2)}" required>
          </div>
          
          <div class="form-group">
            <label for="editQuantity">Quantidade em Estoque</label>
            <div class="quantity-control">
              <button type="button" class="quantity-btn minus" data-target="editQuantity" data-change="-1">
                <i class="fas fa-minus"></i>
              </button>
              <input type="number" id="editQuantity" value="${produto.quantidadeEmEstoque}" 
                     min="${LIMITES.QUANTIDADE.MIN}" max="${LIMITES.QUANTIDADE.MAX}">
              <button type="button" class="quantity-btn plus" data-target="editQuantity" data-change="1">
                <i class="fas fa-plus"></i>
              </button>
            </div>
          </div>
          
          <div class="form-group">
            <label for="editCategory">Categoria</label>
            <select id="editCategory" required>
              <option value="Cimento" ${produto.categoria === 'Cimento' ? 'selected' : ''}>Cimento</option>
              <option value="Tijolos" ${produto.categoria === 'Tijolos' ? 'selected' : ''}>Tijolos</option>
              <option value="Ferragens" ${produto.categoria === 'Ferragens' ? 'selected' : ''}>Ferragens</option>
              <option value="Tintas" ${produto.categoria === 'Tintas' ? 'selected' : ''}>Tintas</option>
              <option value="Madeiras" ${produto.categoria === 'Madeiras' ? 'selected' : ''}>Madeiras</option>
              <option value="Hidráulica" ${produto.categoria === 'Hidráulica' ? 'selected' : ''}>Hidráulica</option>
              <option value="Elétrica" ${produto.categoria === 'Elétrica' ? 'selected' : ''}>Elétrica</option>
              <option value="Ferramentas" ${produto.categoria === 'Ferramentas' ? 'selected' : ''}>Ferramentas</option>
              <option value="Outros" ${produto.categoria === 'Outros' ? 'selected' : ''}>Outros</option>
            </select>
          </div>
          
          <div class="form-group full-width">
            <label for="editDescription">Descrição</label>
            <textarea id="editDescription" maxlength="${LIMITES.DESCRICAO}">${produto.descricao || ''}</textarea>
            <small class="char-count">${produto.descricao ? produto.descricao.length : 0}/${LIMITES.DESCRICAO}</small>
          </div>
          
          <div class="form-group full-width">
            <label for="editImageUrl">URL da Imagem</label>
            <div class="url-input-container">
              <input type="text" id="editImageUrl" value="${produto.url || ''}" placeholder="https://exemplo.com/imagem.jpg">
              <button type="button" class="btn-preview" id="previewImageBtn">
                <i class="fas fa-eye"></i> Visualizar
              </button>
            </div>
            <div class="image-preview" id="imagePreview"></div>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn-cancel" id="cancelEdit">
              <i class="fas fa-times"></i> Cancelar
            </button>
            <button type="submit" class="btn btn-save">
              <i class="fas fa-save"></i> Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    `;
  
    abrirModal(conteudo, 'modal-lg');
    configurarFormularioEdicao();
  }
  
  function configurarFormularioEdicao() {
    // Contadores de caracteres
    document.getElementById('editName').addEventListener('input', (e) => {
      atualizarContadorCaracteres(e.target, LIMITES.NOME);
    });
  
    document.getElementById('editDescription').addEventListener('input', (e) => {
      atualizarContadorCaracteres(e.target, LIMITES.DESCRICAO);
    });
  
    // Formatação de preço
    document.getElementById('editPrice').addEventListener('input', formatarPreco);
  
    // Configurar botões de quantidade
    document.querySelectorAll('[data-target][data-change]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target.closest('button').dataset.target;
        const change = parseInt(e.target.closest('button').dataset.change);
        ajustarQuantidade(target, change);
      });
    });
  
    // Configurar visualização de imagem
    document.getElementById('previewImageBtn')?.addEventListener('click', previewImage);
    document.getElementById('editImageUrl')?.addEventListener('change', previewImage);
  
    // Configurar formulário de edição
    document.getElementById('editProductForm').addEventListener('submit', (e) => {
      e.preventDefault();
      atualizarProduto(estado.produtoAtual.id);
    });
  
    // Configurar botão de cancelar
    document.getElementById('cancelEdit').addEventListener('click', fecharModal);
  }
  
  function ajustarQuantidade(targetId, change) {
    const input = document.getElementById(targetId);
    let valor = parseInt(input.value) + change;
    
    if (valor < LIMITES.QUANTIDADE.MIN) valor = LIMITES.QUANTIDADE.MIN;
    if (valor > LIMITES.QUANTIDADE.MAX) valor = LIMITES.QUANTIDADE.MAX;
    
    input.value = valor;
  }
  
  /**
   * Atualiza um produto existente
   */
  async function atualizarProduto(id) {
    try {
      const dadosAtualizados = obterDadosFormularioEdicao();
      await ApiService.atualizarProduto(id, dadosAtualizados);
      await carregarProdutos();
      fecharModal();
      mostrarNotificacao('Produto atualizado com sucesso!', 'sucesso');
    } catch (erro) {
      console.error('Erro ao atualizar produto:', erro);
      mostrarNotificacao('Erro ao atualizar produto', 'erro');
    }
  }
  
  function obterDadosFormularioEdicao() {
    const valorPreco = document.getElementById('editPrice').value
      .replace('R$ ', '')
      .replace(',', '.');
  
    return {
      nome: document.getElementById('editName').value,
      preco: parseFloat(valorPreco),
      quantidadeEmEstoque: parseInt(document.getElementById('editQuantity').value),
      categoria: document.getElementById('editCategory').value,
      descricao: document.getElementById('editDescription').value,
      URL: document.getElementById('editImageUrl').value || null
    };
  }
  
  /**
   * Confirma a exclusão de um produto
   */
  function confirmarExclusaoProduto(id) {
    estado.produtoAtual = estado.produtos.find(p => p.id === id.toString());
  
    const conteudo = `
      <div class="delete-confirmation">
        <h3>Confirmar Exclusão</h3>
        <p>Tem certeza que deseja excluir este produto?</p>
        <div class="confirmation-buttons">
          <button class="btn" id="cancelDelete">Cancelar</button>
          <button class="btn-primary" id="confirmDelete">Confirmar</button>
        </div>
      </div>
    `;
  
    abrirModal(conteudo);
  
    // Configurar eventos dos botões
    document.getElementById('cancelDelete').addEventListener('click', fecharModal);
    document.getElementById('confirmDelete').addEventListener('click', () => {
      excluirProduto(estado.produtoAtual.id);
    });
  }
  
  /**
   * Exclui um produto
   */
  async function excluirProduto(id) {
    try {
      await ApiService.deletarProduto(id);
      await carregarProdutos();
      fecharModal();
      mostrarNotificacao('Produto excluído com sucesso!', 'sucesso');
    } catch (erro) {
      console.error('Erro ao excluir produto:', erro);
      mostrarNotificacao('Erro ao excluir produto', 'erro');
    }
  }
  
  // ==================================================
  // FUNÇÕES AUXILIARES
  // ==================================================
  
  /**
   * Mostra uma notificação para o usuário
   */
  function mostrarNotificacao(mensagem, tipo) {
    // Implementação da notificação (pode usar Toast, SweetAlert, etc.)
    console.log(`${tipo}: ${mensagem}`);
    // Exemplo simples com alerta nativo
    alert(`${tipo.toUpperCase()}: ${mensagem}`);
  }
  
  /**
   * Pré-visualiza imagem do produto
   */
  function previewImage() {
    const urlInput = document.getElementById('editImageUrl');
    const previewContainer = document.getElementById('imagePreview');
    
    if (!urlInput || !previewContainer) return;
    
    const imageUrl = urlInput.value.trim();
    
    if (imageUrl) {
      previewContainer.innerHTML = `
        <img src="${imageUrl}" alt="Pré-visualização" 
             onerror="this.parentElement.innerHTML='<div class=\'preview-error\'><i class=\'fas fa-exclamation-triangle\'></i> Imagem não encontrada</div>'">
        <div class="preview-actions">
          <button class="btn-remove-preview" onclick="removerPreview()">
            <i class="fas fa-trash"></i> Remover
          </button>
        </div>
      `;
    } else {
      previewContainer.innerHTML = '<div class="no-preview"><i class="fas fa-image"></i> Nenhuma imagem para pré-visualizar</div>';
    }
  }
  
  function removerPreview() {
    const urlInput = document.getElementById('editImageUrl');
    const previewContainer = document.getElementById('imagePreview');
    
    if (urlInput && previewContainer) {
      urlInput.value = '';
      previewContainer.innerHTML = '<div class="no-preview"><i class="fas fa-image"></i> Nenhuma imagem para pré-visualizar</div>';
    }
  }
  
  /**
   * Amplia imagem no modal
   */
  function zoomImage(imageUrl) {
    const zoomedContent = `
      <div class="image-zoom-container">
        <img src="${imageUrl}" alt="Imagem ampliada" class="zoomed-image">
        <button class="btn-close-zoom" onclick="fecharModal()">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
    
    abrirModal(zoomedContent, 'modal-zoom');
  }
  