document.addEventListener('DOMContentLoaded', async () => {
  const usuario = verificarAutenticacao();
  if (!usuario) return;
  
  await carregarFavoritos(usuario.id);
});

function verificarAutenticacao() {
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  if (!usuario) {
      window.location.href = '/paginas/telaDeLogin.html';
      return null;
  }
  return usuario;
}

async function carregarFavoritos(usuarioId) {
  try {
      mostrarCarregamento();
      
      const favoritos = await ApiService.buscarProdutosFavoritados(usuarioId);
      localStorage.setItem('favoritos', JSON.stringify(favoritos));
      
      exibirFavoritos(favoritos);
  } catch (erro) {
      console.error('Erro ao carregar favoritos:', erro);
      mostrarMensagemErro('Não foi possível carregar seus favoritos. Tente novamente.');
      
      const favoritosLocais = JSON.parse(localStorage.getItem('favoritos')) || [];
      exibirFavoritos(favoritosLocais);
  } finally {
      esconderCarregamento();
  }
}

function exibirFavoritos(produtos) {
  const grid = document.querySelector('.favorites-grid');
  const emptyState = document.querySelector('.favorites-empty');
  
  grid.innerHTML = '';

  if (produtos.length === 0) {
      emptyState.style.display = 'flex';
      return;
  }

  emptyState.style.display = 'none';

  produtos.forEach(produto => {
      const card = criarCardFavorito(produto);
      grid.appendChild(card);
  });
}

function criarCardFavorito(produto) {
  const card = document.createElement('div');
  card.className = 'favorite-item';
  card.dataset.id = produto.id;

  card.innerHTML = `
      <div class="favorite-image">
          <img src="${produto.url || '/assets/img/sem-imagem.jpg'}" alt="${produto.nome}">
      </div>
      <div class="favorite-details">
          <h3 class="favorite-name">${produto.nome}</h3>
          <div class="favorite-price">R$ ${produto.preco?.toFixed(2) || '0,00'}</div>
      </div>
      <div class="favorite-actions">
          <button class="add-to-cart-btn" data-id="${produto.id}">
              <i class="fas fa-cart-plus"></i> Adicionar ao Carrinho
          </button>
          <button class="remove-favorite-btn" data-id="${produto.id}">
              <i class="fas fa-heart-broken"></i> Remover
          </button>
      </div>
  `;

  card.querySelector('.favorite-image, .favorite-details').addEventListener('click', () => {
      window.location.href = `detalhesProduto.html?id=${produto.id}`;
  });

  const addToCartBtn = card.querySelector('.add-to-cart-btn');
  const removeFavoriteBtn = card.querySelector('.remove-favorite-btn');
  
  addToCartBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await adicionarAoCarrinho(produto.id);
  });
  
  removeFavoriteBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await desfavoritarProduto(produto.id, card);
  });

  return card;
}

async function adicionarAoCarrinho(produtoId) {
  try {
      const usuario = verificarAutenticacao();
      if (!usuario) return;

      mostrarCarregamento();
      
      const response = await ApiService.enviarParaCarrinho(produtoId, usuario.id, 1);
      
      if (response && response.success !== false) {
          mostrarMensagemSucesso('Produto adicionado ao carrinho com sucesso!');
      } else {
          throw new Error(response?.message || 'Erro ao adicionar ao carrinho');
      }
  } catch (erro) {
      console.error('Erro ao adicionar ao carrinho:', erro);
      mostrarMensagemErro('Não foi possível adicionar o produto ao carrinho.');
  } finally {
      esconderCarregamento();
  }
}

async function desfavoritarProduto(produtoId, cardElement) {
  try {
      const usuario = verificarAutenticacao();
      if (!usuario) return;

      mostrarCarregamento();
      
      await ApiService.desfavoritarProduto(usuario.id, produtoId);
      
      cardElement.remove();
      
      const favoritosAtualizados = JSON.parse(localStorage.getItem('favoritos'))
          .filter(p => p.id !== produtoId);
      localStorage.setItem('favoritos', JSON.stringify(favoritosAtualizados));
      
      const grid = document.querySelector('.favorites-grid');
      if (grid.children.length === 0) {
          document.querySelector('.favorites-empty').style.display = 'flex';
      }
      
      mostrarMensagemSucesso('Produto removido dos favoritos!');
  } catch (erro) {
      console.error('Erro ao desfavoritar produto:', erro);
      mostrarMensagemErro('Não foi possível remover o produto dos favoritos.');
  } finally {
      esconderCarregamento();
  }
}

function mostrarCarregamento() {
  const loadingElement = document.createElement('div');
  loadingElement.className = 'loading-overlay';
  loadingElement.innerHTML = '<div class="spinner"></div>';
  document.body.appendChild(loadingElement);
}

function esconderCarregamento() {
  const loadingElement = document.querySelector('.loading-overlay');
  if (loadingElement) {
      loadingElement.remove();
  }
}

function mostrarMensagemErro(mensagem) {
  const container = document.querySelector('.favorites-container');
  const erroElement = document.createElement('div');
  erroElement.className = 'error-message';
  erroElement.innerHTML = `
      <i class="fas fa-exclamation-triangle"></i>
      <span>${mensagem}</span>
  `;
  container.prepend(erroElement);
    setTimeout(() => {
      erroElement.remove();
  }, 5000);
}

function mostrarMensagemSucesso(mensagem) {
  const container = document.querySelector('.favorites-container');
  const sucessoElement = document.createElement('div');
  sucessoElement.className = 'success-message';
  sucessoElement.innerHTML = `
      <i class="fas fa-check-circle"></i>
      <span>${mensagem}</span>
  `;
  container.prepend(sucessoElement);
  
  setTimeout(() => {
      sucessoElement.remove();
  }, 3000);
}