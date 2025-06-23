// Objeto para armazenar os produtos por categoria
let produtosPorCategoria = {
    cimento: [],
    tijolos: [],
    ferragens: [],
    tintas: [],
    madeiras: [],
    hidraulica: [],
    eletrica: [],
    ferramentas: []
};

// Variáveis globais
let todosProdutos = [];
let produtoAtual = null;
let avaliacaoAtual = 0;
let comentarios = [];
let paginaAtual = 1;
const COMENTARIOS_POR_PAGINA = 5;

function obterUsuarioLogado() {
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    if (!usuario) {
        window.location.href = "/paginas/telaDeLogin.html";
        return null;
    }
    return usuario;
}

function generateAvatar(name, email) {
    if (name) {
        const names = name.split(' ');
        const initials = names[0].charAt(0) + (names[1] ? names[1].charAt(0) : '');
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random`;
    } else if (email) {
        const emailPrefix = email.split('@')[0];
        const initials = emailPrefix.charAt(0) + (emailPrefix.length > 1 ? emailPrefix.charAt(1) : '');
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random`;
    }
    return 'https://ui-avatars.com/api/?name=U&background=random';
}

function obterFotoUsuario() {
    const usuario = obterUsuarioLogado();
    if (!usuario) return '';

    if (usuario.foto) {
        return usuario.foto;
    } else {
        const fullName = usuario.nome ? `${usuario.nome} ${usuario.sobrenome || ''}`.trim() : '';
        return generateAvatar(fullName, usuario.email);
    }
}

function obterNomeUsuario() {
    const usuario = obterUsuarioLogado();
    if (!usuario) return 'Usuário';

    return usuario.nome ? `${usuario.nome} ${usuario.sobrenome || ''}`.trim() : 'Usuário';
}

function configurarScrollSuave() {
    document.querySelectorAll('.nav-bar a').forEach(link => {
        link.addEventListener('click', function (e) {
            const alvoId = this.getAttribute('href');

            if (alvoId.startsWith('#')) {
                e.preventDefault();

                const elementoAlvo = document.querySelector(alvoId);

                if (elementoAlvo) {
                    const header = document.querySelector('.header');
                    const alturaHeader = header ? header.offsetHeight : 0;
                    const posicaoY = elementoAlvo.getBoundingClientRect().top + window.pageYOffset - alturaHeader;

                    window.scrollTo({
                        top: posicaoY,
                        behavior: 'smooth'
                    });

                    history.pushState(null, null, alvoId);
                }
            }
        });
    });
}

function configurarNavegacaoResponsiva() {
    const header = document.querySelector('.header');

    if (header) {
        window.addEventListener('scroll', function () {
            const posicaoScroll = window.pageYOffset;

            if (posicaoScroll > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }
}

function criarCardProduto(produto) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.idProduto = produto.id;

    card.innerHTML = `
        <div class="product-image">
            <img src="${produto.url || 'https://via.placeholder.com/150'}" alt="${produto.nome}" loading="lazy">
        </div>
        <div class="product-info">
            <h3 class="product-name">${produto.nome}</h3>
            <div class="product-price">R$ ${produto.preco?.toFixed(2) || '0,00'}</div>
        </div>
    `;

    card.addEventListener('click', () => {
        abrirModalProduto(produto);
    });

    return card;
}

async function carregarProdutos() {
    try {
        for (const categoria in produtosPorCategoria) {
            produtosPorCategoria[categoria] = [];
        }

        const produtos = await ApiService.listarProdutos();
        todosProdutos = produtos;

        produtos.forEach(produto => {
            const categoriaNormalizada = produto.categoria
                .toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, "");

            if (produtosPorCategoria.hasOwnProperty(categoriaNormalizada)) {
                produtosPorCategoria[categoriaNormalizada].push({
                    id: produto.id,
                    nome: produto.nome,
                    preco: produto.preco,
                    categoria: produto.categoria,
                    descricao: produto.descricao,
                    url: produto.url || 'https://via.placeholder.com/150',
                    quantidadeEmEstoque: produto.quantidadeEmEstoque
                });
            }
        });

        verificarBusca();
        popularCarrosseis();
    } catch (erro) {
        console.error('Erro ao carregar produtos:', erro);
        mostrarMensagemErro('Não foi possível carregar os produtos. Tente novamente mais tarde.');
    }
}

function verificarBusca() {
    const urlParams = new URLSearchParams(window.location.search);
    const isBusca = urlParams.get('busca');

    if (isBusca) {
        const termoBusca = sessionStorage.getItem('termoBusca');
        if (termoBusca) {
            realizarBusca(termoBusca);
        }
    }
}

function realizarBusca(termo) {
    termo = termo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");

    const resultados = todosProdutos.filter(produto => {
        const nome = produto.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
        const descricao = produto.descricao?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "") || "";
        const categoria = produto.categoria.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");

        return nome.includes(termo) || descricao.includes(termo) || categoria.includes(termo);
    });

    exibirResultadosBusca(resultados, termo);
}

function exibirResultadosBusca(resultados, termoBusca) {
    const main = document.querySelector('main');
    if (!main) return;

    main.innerHTML = '';

    const section = document.createElement('section');
    section.className = 'search-results-section';
    section.innerHTML = `
        <div class="search-results-header">
            <h2>Resultados para: <span class="search-term">"${termoBusca}"</span></h2>
            <p class="results-count">${resultados.length} ${resultados.length === 1 ? 'produto encontrado' : 'produtos encontrados'}</p>
        </div>
        <div class="products-grid"></div>
        <div class="pagination"></div>
    `;

    main.appendChild(section);

    const grid = section.querySelector('.products-grid');
    const pagination = section.querySelector('.pagination');
    const produtosPorPagina = 25;
    let paginaAtual = 1;
    const totalPaginas = Math.ceil(resultados.length / produtosPorPagina);

    function exibirProdutos(pagina) {
        grid.innerHTML = '';
        const inicio = (pagina - 1) * produtosPorPagina;
        const fim = inicio + produtosPorPagina;
        const produtosPagina = resultados.slice(inicio, fim);

        produtosPagina.forEach(produto => {
            grid.appendChild(criarCardProduto(produto));
        });
    }

    function atualizarPaginacao() {
        pagination.innerHTML = '';

        const btnAnterior = document.createElement('button');
        btnAnterior.className = 'pagination-btn';
        btnAnterior.innerHTML = '<i class="fas fa-chevron-left"></i>';
        btnAnterior.disabled = paginaAtual === 1;
        btnAnterior.addEventListener('click', () => {
            if (paginaAtual > 1) {
                paginaAtual--;
                exibirProdutos(paginaAtual);
                atualizarPaginacao();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
        pagination.appendChild(btnAnterior);

        const maxBotoes = 5;
        let inicioPaginas = Math.max(1, paginaAtual - Math.floor(maxBotoes / 2));
        const fimPaginas = Math.min(totalPaginas, inicioPaginas + maxBotoes - 1);

        if (fimPaginas - inicioPaginas + 1 < maxBotoes) {
            inicioPaginas = Math.max(1, fimPaginas - maxBotoes + 1);
        }

        for (let i = inicioPaginas; i <= fimPaginas; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `pagination-btn ${i === paginaAtual ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => {
                paginaAtual = i;
                exibirProdutos(paginaAtual);
                atualizarPaginacao();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            pagination.appendChild(pageBtn);
        }

        const btnProximo = document.createElement('button');
        btnProximo.className = 'pagination-btn';
        btnProximo.innerHTML = '<i class="fas fa-chevron-right"></i>';
        btnProximo.disabled = paginaAtual === totalPaginas;
        btnProximo.addEventListener('click', () => {
            if (paginaAtual < totalPaginas) {
                paginaAtual++;
                exibirProdutos(paginaAtual);
                atualizarPaginacao();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
        pagination.appendChild(btnProximo);

        const pageInfo = document.createElement('span');
        pageInfo.className = 'page-info';
        pageInfo.textContent = `Página ${paginaAtual} de ${totalPaginas}`;
        pagination.appendChild(pageInfo);
    }

    if (resultados.length === 0) {
        grid.innerHTML = `
            <div class="no-results">
                <div class="no-results-icon">
                    <i class="fas fa-search"></i>
                </div>
                <h3>Nenhum produto encontrado</h3>
                <p>Não encontramos resultados para "${termoBusca}". Tente usar palavras-chave diferentes.</p>
                <button class="btn-voltar" onclick="window.location.href='index.html'">Voltar à página inicial</button>
            </div>
        `;
        pagination.style.display = 'none';
        return;
    }

    exibirProdutos(paginaAtual);
    atualizarPaginacao();
}

function mostrarMensagemErro(mensagem) {
    const mensagemErro = document.createElement('div');
    mensagemErro.className = 'erro-carregamento';
    mensagemErro.textContent = mensagem;
    document.querySelector('main').prepend(mensagemErro);
}

function popularCarrosseis() {
    for (const categoria in produtosPorCategoria) {
        const secao = document.getElementById(categoria);
        if (!secao) continue;

        const carrossel = secao.querySelector('.carousel');
        if (!carrossel) continue;

        carrossel.innerHTML = '';

        if (produtosPorCategoria[categoria].length === 0) {
            carrossel.innerHTML = '<p>Nenhum produto disponível nesta categoria.</p>';
            continue;
        }

        produtosPorCategoria[categoria].forEach(produto => {
            carrossel.appendChild(criarCardProduto(produto));
        });
    }
}

function configurarCarrosseis() {
    document.querySelectorAll('.carousel-container').forEach(container => {
        const carrossel = container.querySelector('.carousel');
        const btnAnterior = container.querySelector('.prev');
        const btnProximo = container.querySelector('.next');

        if (!carrossel || !btnAnterior || !btnProximo) return;

        function calcularDeslocamento() {
            const card = carrossel.querySelector('.product-card');
            return card ? card.offsetWidth + 16 : 0;
        }

        function rolar(direcao) {
            const deslocamento = calcularDeslocamento();
            carrossel.scrollBy({
                left: direcao === 'anterior' ? -deslocamento * 3 : deslocamento * 3,
                behavior: 'smooth'
            });
        }

        function atualizarBotoes() {
            btnAnterior.style.opacity = carrossel.scrollLeft <= 10 ? '0.5' : '1';
            btnAnterior.style.pointerEvents = carrossel.scrollLeft <= 10 ? 'none' : 'auto';

            btnProximo.style.opacity = carrossel.scrollLeft + carrossel.clientWidth >= carrossel.scrollWidth - 10 ? '0.5' : '1';
            btnProximo.style.pointerEvents = carrossel.scrollLeft + carrossel.clientWidth >= carrossel.scrollWidth - 10 ? 'none' : 'auto';
        }

        btnAnterior.addEventListener('click', () => rolar('anterior'));
        btnProximo.addEventListener('click', () => rolar('proximo'));

        carrossel.addEventListener('scroll', atualizarBotoes);
        window.addEventListener('resize', atualizarBotoes);

        setTimeout(atualizarBotoes, 100);
    });
}

async function abrirModalProduto(produto) {
    produtoAtual = produto;
    avaliacaoAtual = 0;
    paginaAtual = 1;

    const modal = document.getElementById('productModal');
    if (!modal) {
        console.error('Modal não encontrado no DOM');
        return;
    }

    // Configuração do usuário
    const currentUserAvatar = document.getElementById('currentUserAvatar');
    const currentUserName = document.getElementById('currentUserName');

    if (currentUserAvatar) {
        currentUserAvatar.src = obterFotoUsuario();
        currentUserAvatar.onerror = function () {
            this.src = 'https://via.placeholder.com/40';
        };
    }

    if (currentUserName) {
        currentUserName.textContent = obterNomeUsuario();
    }

    // Configuração da imagem do produto
    const modalImg = document.getElementById('modalProductImage');
    modalImg.src = produto.url || 'https://via.placeholder.com/150';
    modalImg.alt = produto.nome;
    modalImg.onerror = function () {
        this.src = 'https://via.placeholder.com/150';
    };

    // Atualiza o nome do produto
    document.getElementById('modalProductName').textContent = produto.nome;

    // Configuração do botão de favoritos
    const usuario = obterUsuarioLogado();
    let isFavorito = false;

    if (usuario) {
        try {
            // Verifica se o produto está nos favoritos do usuário
            const favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
            isFavorito = favoritos.some(fav => fav.id === produto.id);
        } catch (erro) {
            console.error('Erro ao verificar favoritos:', erro);
        }
    }

    const favoriteButton = document.querySelector('.favorite-button');
    if (favoriteButton) {
        favoriteButton.dataset.productId = produto.id;
        favoriteButton.title = isFavorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos';
        favoriteButton.innerHTML = isFavorito
            ? `<i class="fas fa-heart"></i>`
            : `<i class="far fa-heart"></i>`;

        // Remove listeners antigos e adiciona novo
        favoriteButton.replaceWith(favoriteButton.cloneNode(true));
        const newFavoriteButton = document.querySelector('.favorite-button');

        newFavoriteButton.addEventListener('click', async (event) => {
            event.stopPropagation();
            const button = event.currentTarget;
            const productId = button.dataset.productId;
            const produto = todosProdutos.find(p => p.id == productId);
            const usuario = obterUsuarioLogado();

            if (!produto || !usuario) return;

            let favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
            const index = favoritos.findIndex(fav => fav.id == productId);

            // Atualização visual imediata
            if (index === -1) {
                button.innerHTML = `<i class="fas fa-heart"></i>`;
                button.title = 'Remover dos favoritos';
            } else {
                button.innerHTML = `<i class="far fa-heart"></i>`;
                button.title = 'Adicionar aos favoritos';
            }

            try {
                if (index === -1) {
                    // Chama a API para favoritar
                    await ApiService.favoritarProduto(usuario.id, productId);
                    favoritos.push(produto);
                    mostrarToast('Produto adicionado aos favoritos!');
                } else {
                    // Chama a API para desfavoritar
                    await ApiService.desfavoritarProduto(usuario.id, productId);
                    favoritos.splice(index, 1);
                    mostrarToast('Produto removido dos favoritos');
                }

                localStorage.setItem('favoritos', JSON.stringify(favoritos));
            } catch (erro) {
                console.error('Erro ao atualizar favoritos:', erro);
                // Reverte a UI em caso de erro
                if (index === -1) {
                    button.innerHTML = `<i class="far fa-heart"></i>`;
                    button.title = 'Adicionar aos favoritos';
                } else {
                    button.innerHTML = `<i class="fas fa-heart"></i>`;
                    button.title = 'Remover dos favoritos';
                }
                mostrarToast('Não foi possível atualizar os favoritos. Tente novamente.', 'erro');
            }
        });
    }

    // Configuração das outras informações do produto
    document.getElementById('modalProductPrice').textContent = `R$ ${produto.preco?.toFixed(2) || '0,00'}`;
    document.getElementById('modalProductCategory').textContent = `Categoria: ${produto.categoria}`;
    document.getElementById('modalProductDescription').textContent = produto.descricao || 'Descrição não disponível';
    document.getElementById('estoqueDisponivel').textContent = `Estoque disponível: ${produto.quantidadeEmEstoque || 0}`;

    // Configuração da quantidade
    const inputQuantidade = document.getElementById('quantity');
    if (inputQuantidade) {
        inputQuantidade.value = 1;
        inputQuantidade.max = produto.quantidadeEmEstoque || 1;
    }

    // Carrega avaliações e comentários
    await carregarAvaliacoesEComentarios(produto.id);
    configurarAvaliacaoEstrelas();

    // Exibe o modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Adiciona listener para fechar com ESC
    document.addEventListener('keydown', fecharModalComESC);

    // Animação de abertura
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

function fecharModalComESC(event) {
    if (event.key === 'Escape') {
        fecharModalProduto();
    }
}

function fecharModalProduto() {
    const modal = document.getElementById('productModal');
    modal.classList.remove('show');

    // Remove o listener do ESC quando o modal é fechado
    document.removeEventListener('keydown', fecharModalComESC);

    setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }, 300);

    produtoAtual = null;
}

async function toggleFavorito(event) {
    event.stopPropagation();
    const button = event.currentTarget;
    const productId = button.dataset.productId;
    const produto = todosProdutos.find(p => p.id == productId);
    const usuario = obterUsuarioLogado();

    if (!produto || !usuario) {
        mostrarToast('Você precisa estar logado para favoritar produtos', 'erro');
        return;
    }

    let favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
    const index = favoritos.findIndex(fav => fav.id == productId);
    const isFavorito = index !== -1;

    // Atualização visual otimista
    button.innerHTML = isFavorito
        ? `<i class="far fa-heart"></i>`
        : `<i class="fas fa-heart"></i>`;
    button.title = isFavorito
        ? 'Adicionar aos favoritos'
        : 'Remover dos favoritos';

    try {
        let response;
        if (isFavorito) {
            response = await ApiService.desfavoritarProduto(usuario.id, productId);
        } else {
            response = await ApiService.favoritarProduto(usuario.id, productId);
        }

        if (response && response.success !== false) {
            // Atualiza localStorage apenas se a API confirmar
            if (isFavorito) {
                favoritos.splice(index, 1);
                mostrarToast('Produto removido dos favoritos');
            } else {
                favoritos.push(produto);
                mostrarToast('Produto adicionado aos favoritos!');
            }
            localStorage.setItem('favoritos', JSON.stringify(favoritos));
        } else {
            // Reverte se a API não confirmou
            throw new Error(response?.message || 'Operação não confirmada');
        }
    } catch (erro) {
        console.error('Erro ao atualizar favoritos:', erro);
        // Reverte a UI
        button.innerHTML = isFavorito
            ? `<i class="fas fa-heart"></i>`
            : `<i class="far fa-heart"></i>`;
        button.title = isFavorito
            ? 'Remover dos favoritos'
            : 'Adicionar aos favoritos';

        mostrarToast(erro.message || 'Não foi possível atualizar os favoritos. Tente novamente.', 'erro');
    }
}

async function carregarAvaliacoesEComentarios(produtoId) {
    try {
        // Simulação de dados - substitua por chamada real à API
        comentarios = [
            {
                id: 1,
                usuario: 'Cliente 1',
                usuarioId: 101,
                foto: 'https://via.placeholder.com/40',
                texto: 'Produto excelente!',
                data: '2023-05-15',
                rating: 5,
                likes: 3,
                dislikes: 0,
                respostas: [
                    {
                        id: 11,
                        usuario: 'Loja',
                        usuarioId: 1,
                        foto: 'https://via.placeholder.com/40',
                        texto: 'Obrigado pelo feedback!',
                        data: '2023-05-16'
                    }
                ]
            },
            {
                id: 2,
                usuario: 'Cliente 2',
                usuarioId: 102,
                foto: 'https://via.placeholder.com/40',
                texto: 'Bom custo-benefício',
                data: '2023-05-10',
                rating: 4,
                likes: 1,
                dislikes: 1
            }
        ];

        const avaliacaoMedia = calcularMediaAvaliacoes(comentarios);
        atualizarExibicaoAvaliacoes(avaliacaoMedia);
        exibirComentarios();
    } catch (erro) {
        console.error('Erro ao carregar avaliações:', erro);
    }
}

function calcularMediaAvaliacoes(comentarios) {
    if (!comentarios || comentarios.length === 0) return 0;
    const comentariosComAvaliacao = comentarios.filter(c => c.rating);
    if (comentariosComAvaliacao.length === 0) return 0;
    const soma = comentariosComAvaliacao.reduce((total, comentario) => total + comentario.rating, 0);
    return soma / comentariosComAvaliacao.length;
}

function atualizarExibicaoAvaliacoes(media) {
    const elementoMedia = document.getElementById('averageRating');
    const elementoTotal = document.getElementById('totalRatings');

    elementoMedia.textContent = media.toFixed(1);
    elementoTotal.textContent = comentarios.length;

    const estrelas = document.querySelectorAll('#productStarRating i');
    estrelas.forEach((estrela, index) => {
        if (index < Math.floor(media)) {
            estrela.classList.add('fas', 'active');
            estrela.classList.remove('far');
        } else if (index < media) {
            estrela.classList.add('fas', 'active', 'half');
            estrela.classList.remove('far');
        } else {
            estrela.classList.add('far');
            estrela.classList.remove('fas', 'active', 'half');
        }
    });
}

function configurarAvaliacaoEstrelas() {
    const estrelas = document.querySelectorAll('#productStarRating i');

    estrelas.forEach(estrela => {
        estrela.replaceWith(estrela.cloneNode(true));
    });

    const estrelasAtualizadas = document.querySelectorAll('#productStarRating i');

    estrelasAtualizadas.forEach(estrela => {
        estrela.addEventListener('mouseover', () => {
            const rating = parseInt(estrela.dataset.rating);
            destacarEstrelas(rating);
        });

        estrela.addEventListener('mouseout', () => {
            destacarEstrelas(avaliacaoAtual);
        });

        estrela.addEventListener('click', () => {
            avaliacaoAtual = parseInt(estrela.dataset.rating);
            destacarEstrelas(avaliacaoAtual);
            document.getElementById('submitRating').disabled = false;
        });
    });
}

function destacarEstrelas(rating) {
    const estrelas = document.querySelectorAll('#productStarRating i');

    estrelas.forEach((estrela, index) => {
        if (index < rating) {
            estrela.classList.add('fas', 'active');
            estrela.classList.remove('far');
        } else {
            estrela.classList.add('far');
            estrela.classList.remove('fas', 'active');
        }
    });
}

function exibirComentarios() {
    const inicio = (paginaAtual - 1) * COMENTARIOS_POR_PAGINA;
    const fim = inicio + COMENTARIOS_POR_PAGINA;
    const comentariosPaginados = comentarios.slice(inicio, fim);

    const listaComentarios = document.getElementById('reviewsList');
    listaComentarios.innerHTML = '';

    if (comentariosPaginados.length === 0) {
        listaComentarios.innerHTML = `
            <div class="no-reviews">
                <i class="far fa-comment-dots"></i>
                <p>Nenhum comentário ainda. Seja o primeiro a comentar!</p>
            </div>
        `;
        return;
    }

    comentariosPaginados.forEach(comentario => {
        const comentarioElemento = document.createElement('div');
        comentarioElemento.className = 'review-item';
        comentarioElemento.dataset.commentId = comentario.id;

        const usuario = obterUsuarioLogado();
        const isCurrentUser = usuario && (comentario.usuarioId === usuario.id ||
            (comentario.usuario === `${usuario.nome} ${usuario.sobrenome || ''}`.trim()));

        // Controles de edição para o próprio usuário
        const editControls = isCurrentUser ? `
            <div class="comment-actions">
                <button class="edit-comment-btn" data-comment-id="${comentario.id}">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="delete-comment-btn" data-comment-id="${comentario.id}">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        ` : '';

        // Área de respostas
        const replies = comentario.respostas || [];
        const repliesSection = replies.length > 0 ? `
            <div class="comment-replies">
                ${replies.map(resposta => `
                    <div class="reply-item">
                        <div class="reply-header">
                            <img src="${resposta.foto || 'https://via.placeholder.com/40'}" alt="${resposta.usuario}" class="reply-avatar">
                            <div class="reply-user-info">
                                <span class="reply-user">${resposta.usuario}</span>
                                <span class="reply-date">${formatarData(resposta.data)}</span>
                            </div>
                        </div>
                        <div class="reply-content">
                            <p>${resposta.texto}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        ` : '';

        comentarioElemento.innerHTML = `
            <div class="review-header">
                <img src="${comentario.foto || 'https://via.placeholder.com/40'}" alt="${comentario.usuario}" class="review-avatar">
                <div class="review-user-info">
                    <span class="review-name">${comentario.usuario}</span>
                    <span class="review-date">${formatarData(comentario.data)}</span>
                </div>
                ${comentario.rating ? `
                <div class="review-rating">
                    ${gerarEstrelasAvaliacao(comentario.rating)}
                </div>
                ` : ''}
            </div>
            <div class="review-content">
                <p class="review-text">${comentario.texto}</p>
            </div>
            ${editControls}
            <div class="review-interactions">
                <button class="action-like">
                    <i class="far fa-thumbs-up"></i>
                    <span class="like-count">${comentario.likes}</span>
                </button>
                <button class="action-dislike">
                    <i class="far fa-thumbs-down"></i>
                    <span class="dislike-count">${comentario.dislikes}</span>
                </button>
                <button class="reply-comment-btn" data-comment-id="${comentario.id}">
                    <i class="fas fa-reply"></i> Responder
                </button>
                <span class="review-helpful">${comentario.likes + comentario.dislikes} pessoas acharam útil</span>
            </div>
            ${repliesSection}
        `;

        listaComentarios.appendChild(comentarioElemento);
    });

    // Adicionar eventos para os novos botões
    document.querySelectorAll('.edit-comment-btn').forEach(btn => {
        btn.addEventListener('click', editarComentario);
    });

    document.querySelectorAll('.delete-comment-btn').forEach(btn => {
        btn.addEventListener('click', excluirComentario);
    });

    document.querySelectorAll('.reply-comment-btn').forEach(btn => {
        btn.addEventListener('click', mostrarFormularioResposta);
    });

    configurarPaginacao();
}

function editarComentario(event) {
    const commentId = event.currentTarget.dataset.commentId;
    const comentario = comentarios.find(c => c.id == commentId);

    const commentElement = event.currentTarget.closest('.review-item');
    const contentElement = commentElement.querySelector('.review-content');

    const textarea = document.createElement('textarea');
    textarea.className = 'edit-comment-textarea';
    textarea.value = comentario.texto;

    const saveButton = document.createElement('button');
    saveButton.className = 'save-edit-btn';
    saveButton.textContent = 'Salvar';
    saveButton.addEventListener('click', () => salvarEdicaoComentario(commentId, textarea.value));

    const cancelButton = document.createElement('button');
    cancelButton.className = 'cancel-edit-btn';
    cancelButton.textContent = 'Cancelar';
    cancelButton.addEventListener('click', () => exibirComentarios());

    contentElement.innerHTML = '';
    contentElement.appendChild(textarea);
    contentElement.appendChild(saveButton);
    contentElement.appendChild(cancelButton);
}

function salvarEdicaoComentario(commentId, novoTexto) {
    const comentario = comentarios.find(c => c.id == commentId);
    if (comentario) {
        comentario.texto = novoTexto;
        comentario.editado = true;
        exibirComentarios();
        mostrarToast('Comentário atualizado com sucesso!');
    }
}

function excluirComentario(event) {
    if (confirm('Tem certeza que deseja excluir este comentário?')) {
        const commentId = event.currentTarget.dataset.commentId;
        const index = comentarios.findIndex(c => c.id == commentId);

        if (index !== -1) {
            comentarios.splice(index, 1);
            exibirComentarios();
            mostrarToast('Comentário excluído com sucesso!');
        }
    }
}

function mostrarFormularioResposta(event) {
    const commentId = event.currentTarget.dataset.commentId;
    const commentElement = event.currentTarget.closest('.review-item');

    if (commentElement.querySelector('.reply-form')) {
        return;
    }

    const replyForm = document.createElement('div');
    replyForm.className = 'reply-form';
    replyForm.innerHTML = `
        <textarea class="reply-textarea" placeholder="Escreva sua resposta..."></textarea>
        <div class="reply-form-actions">
            <button class="submit-reply-btn" data-comment-id="${commentId}">Enviar Resposta</button>
            <button class="cancel-reply-btn">Cancelar</button>
        </div>
    `;

    // Inserir após o último elemento do comentário
    commentElement.appendChild(replyForm);

    // Adicionar eventos
    replyForm.querySelector('.submit-reply-btn').addEventListener('click', enviarResposta);
    replyForm.querySelector('.cancel-reply-btn').addEventListener('click', () => {
        replyForm.remove();
    });
}

function enviarResposta(event) {
    const commentId = event.currentTarget.dataset.commentId;
    const textarea = event.currentTarget.closest('.reply-form').querySelector('.reply-textarea');
    const textoResposta = textarea.value.trim();

    if (!textoResposta) {
        mostrarToast('Por favor, escreva uma resposta.', 'erro');
        return;
    }

    const usuario = obterUsuarioLogado();
    if (!usuario) return;

    const novaResposta = {
        id: Date.now(),
        usuarioId: usuario.id,
        usuario: usuario.nome ? `${usuario.nome} ${usuario.sobrenome || ''}`.trim() : 'Usuário',
        foto: obterFotoUsuario(),
        texto: textoResposta,
        data: new Date().toISOString()
    };

    const comentario = comentarios.find(c => c.id == commentId);
    if (comentario) {
        if (!comentario.respostas) {
            comentario.respostas = [];
        }
        comentario.respostas.unshift(novaResposta);
        exibirComentarios();
        mostrarToast('Resposta enviada com sucesso!');
    }
}

function formatarData(dataString) {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
}

function gerarEstrelasAvaliacao(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            html += '<i class="fas fa-star active"></i>';
        } else {
            html += '<i class="far fa-star"></i>';
        }
    }
    return html;
}

function configurarPaginacao() {
    const totalPaginas = Math.ceil(comentarios.length / COMENTARIOS_POR_PAGINA);
    const paginacao = document.getElementById('reviewsPagination');

    document.getElementById('currentPage').textContent = paginaAtual;
    document.getElementById('totalPages').textContent = totalPaginas;

    const btnAnterior = document.getElementById('prevPage');
    const btnProximo = document.getElementById('nextPage');

    btnAnterior.disabled = paginaAtual <= 1;
    btnProximo.disabled = paginaAtual >= totalPaginas;

    btnAnterior.onclick = () => {
        if (paginaAtual > 1) {
            paginaAtual--;
            exibirComentarios();
        }
    };

    btnProximo.onclick = () => {
        if (paginaAtual < totalPaginas) {
            paginaAtual++;
            exibirComentarios();
        }
    };
}

function fecharModalProduto() {
    const modal = document.getElementById('productModal');
    modal.classList.remove('show');

    setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }, 300);

    produtoAtual = null;
}

function alterarQuantidade(acao) {
    const inputQuantidade = document.getElementById('quantity');
    let quantidade = parseInt(inputQuantidade.value, 10);
    const max = parseInt(inputQuantidade.max, 10) || 1;

    if (acao === 'aumentar' && quantidade < max) {
        quantidade++;
    } else if (acao === 'diminuir' && quantidade > 1) {
        quantidade--;
    }

    inputQuantidade.value = quantidade;
}

async function adicionarAoCarrinho() {
    const inputQuantidade = document.getElementById('quantity');
    const quantidade = parseInt(inputQuantidade.value, 10);

    if (!produtoAtual) return;

    try {
        const iconeCarrinho = document.querySelector('.carrinho-icon');
        if (iconeCarrinho) {
            iconeCarrinho.classList.add('animate-bounce');
            setTimeout(() => iconeCarrinho.classList.remove('animate-bounce'), 1000);
        }
        const usuario = JSON.parse(localStorage.getItem('usuario'));
        
        ApiService.enviarParaCarrinho(produtoAtual.id, usuario.id, quantidade);

        alert(`${quantidade} unidade(s) de ${produtoAtual.nome} adicionado ao carrinho!`)

        mostrarToast(`${quantidade} unidade(s) de ${produtoAtual.nome} adicionado ao carrinho!`);
        fecharModalProduto();
    } catch (erro) {
        console.error('Erro ao adicionar ao carrinho:', erro);
        mostrarToast('Não foi possível adicionar o produto ao carrinho. Tente novamente.', 'erro');
    }
}

function mostrarToast(mensagem, tipo = 'sucesso') {
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.textContent = mensagem;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

async function enviarAvaliacao() {
    if (avaliacaoAtual === 0) {
        mostrarToast('Por favor, selecione uma avaliação.', 'erro');
        return;
    }

    try {
        const usuario = obterUsuarioLogado();
        if (!usuario) return;

        const novaAvaliacao = {
            id: Date.now(),
            usuarioId: usuario.id,
            usuario: usuario.nome ? `${usuario.nome} ${usuario.sobrenome || ''}`.trim() : 'Usuário',
            foto: obterFotoUsuario(),
            rating: avaliacaoAtual,
            data: new Date().toISOString()
        };

        comentarios.unshift(novaAvaliacao);
        paginaAtual = 1;
        exibirComentarios();

        mostrarToast('Sua avaliação foi enviada com sucesso!');

        avaliacaoAtual = 0;
        destacarEstrelas(0);
        document.getElementById('submitRating').disabled = true;
    } catch (erro) {
        console.error('Erro ao enviar avaliação:', erro);
        mostrarToast('Não foi possível enviar sua avaliação. Tente novamente.', 'erro');
    }
}

async function enviarComentario() {
    const textoComentario = document.getElementById('reviewComment').value.trim();

    if (!textoComentario) {
        mostrarToast('Por favor, escreva um comentário.', 'erro');
        return;
    }

    try {
        const usuario = obterUsuarioLogado();
        if (!usuario) return;

        const novoComentario = {
            id: Date.now(),
            usuarioId: usuario.id,
            usuario: usuario.nome ? `${usuario.nome} ${usuario.sobrenome || ''}`.trim() : 'Usuário',
            foto: obterFotoUsuario(),
            texto: textoComentario,
            data: new Date().toISOString(),
            likes: 0,
            dislikes: 0
        };

        comentarios.unshift(novoComentario);
        paginaAtual = 1;
        exibirComentarios();

        document.getElementById('reviewComment').value = '';
        document.getElementById('submitReview').disabled = true;

        mostrarToast('Seu comentário foi enviado com sucesso!');
    } catch (erro) {
        console.error('Erro ao enviar comentário:', erro);
        mostrarToast('Não foi possível enviar seu comentário. Tente novamente.', 'erro');
    }
}

function verificarScrollDepartamento() {
    if (window.location.hash) {
        const departamentoId = window.location.hash.substring(1);
        const secao = document.getElementById(departamentoId);

        if (secao) {
            setTimeout(() => {
                const header = document.querySelector('.header');
                const alturaHeader = header ? header.offsetHeight : 0;
                const posicaoY = secao.getBoundingClientRect().top + window.pageYOffset - alturaHeader;

                window.scrollTo({
                    top: posicaoY,
                    behavior: 'smooth'
                });
            }, 500);
        }
    }
}

document.addEventListener('DOMContentLoaded', function () {
    if (!obterUsuarioLogado()) return;

    configurarScrollSuave();
    configurarNavegacaoResponsiva();
    verificarScrollDepartamento();
    carregarProdutos().then(configurarCarrosseis);

    document.querySelector('.close-modal')?.addEventListener('click', fecharModalProduto);

    document.getElementById('productModal')?.addEventListener('click', function (e) {
        if (e.target === this) fecharModalProduto();
    });

    document.getElementById('decreaseQuantity')?.addEventListener('click', () => alterarQuantidade('diminuir'));
    document.getElementById('increaseQuantity')?.addEventListener('click', () => alterarQuantidade('aumentar'));

    document.getElementById('quantity')?.addEventListener('change', function () {
        let valor = parseInt(this.value, 10);
        const max = parseInt(this.max, 10) || 1;
        this.value = Math.min(Math.max(1, isNaN(valor) ? 1 : valor), max);
    });

    document.querySelector('.add-to-cart-btn')?.addEventListener('click', adicionarAoCarrinho);
    document.getElementById('submitRating')?.addEventListener('click', enviarAvaliacao);
    document.getElementById('submitReview')?.addEventListener('click', enviarComentario);

    document.getElementById('reviewComment')?.addEventListener('input', function () {
        document.getElementById('submitReview').disabled = this.value.trim() === '';
    });
});