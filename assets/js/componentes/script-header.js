document.addEventListener("DOMContentLoaded", function () {
    fetch('../componentes/header.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('header').innerHTML = data;
            inicializarHeaderModal();
            inicializarLogout();
            configurarLinksHeaderModal();
            configurarLinksDepartamentos();
            carregarDadosUsuario();
            configurarBarraDeBusca();
        })
        .catch(error => console.error("Erro ao carregar o header:", error));
});

document.addEventListener("DOMContentLoaded", function () {
    // Como o header já está no HTML, não precisamos do fetch
    inicializarHeaderModal();
    inicializarLogout();
    configurarLinksHeaderModal();
    configurarLinksDepartamentos();
    carregarDadosUsuario();
    configurarBarraDeBusca();
});

function inicializarHeaderModal() {
    const userProfile = document.querySelector('#userProfile');
    const headerProfileModal = document.querySelector('#headerProfileModal');
    const closeHeaderModal = document.querySelector('.close-header-modal');

    if (!userProfile || !headerProfileModal || !closeHeaderModal) {
        console.error("Elementos do header modal não encontrados!");
        return;
    }

    userProfile.addEventListener('click', (e) => {
        e.stopPropagation();
        headerProfileModal.style.display = 'flex';
        setTimeout(() => headerProfileModal.style.opacity = '1', 10);
        //document.body.style.overflow = 'hidden';
    });

    function fecharHeaderModal() {
        headerProfileModal.style.opacity = '0';
        setTimeout(() => {
            headerProfileModal.style.display = 'none';
            //document.body.style.overflow = 'auto';
        }, 200);
    }

    closeHeaderModal.addEventListener('click', fecharHeaderModal);
    headerProfileModal.addEventListener('click', (e) => {
        if (e.target === headerProfileModal) fecharHeaderModal();
    });
}

function configurarLinksHeaderModal() {
    const opcoesModal = {
        'headerMeuPerfil': 'telaViewUsuario.html',
        'headerMeusPedidos': ApiService.isAdmin() ? "telaGerenciarPedido.html" : "telaMeusPedidos.html",
        'headerFavoritos': 'telaFavoritos.html',
        'headerConfiguracoes': 'telaDeEdicao.html'
    };

    document.querySelectorAll('.header-modal-option').forEach(link => {
        const id = link.getAttribute('id');
        
        if (id === 'headerLogoutBtn') return;

        if (id && opcoesModal[id]) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                const usuario = JSON.parse(localStorage.getItem('usuario'));
                if (!usuario) {
                    alert('Por favor, faça login para acessar esta página');
                    window.location.href = '/paginas/telaDeLogin.html';
                    return;
                }
                
                if (id === 'headerMeuPerfil') {
                    window.location.href = `${opcoesModal[id]}?id=${usuario.id}`;
                } else {
                    window.location.href = opcoesModal[id];
                }
            });
        }
    });
}

function inicializarLogout() {
    const logoutBtn = document.querySelector('#headerLogoutBtn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = "/paginas/telaDeLogin.html";
        });
    }
}

function carregarDadosUsuario() {
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    
    if (!usuario || typeof usuario !== 'object') {
        setGuestMode();
        return;
    }

    const elements = {
        cidadeHeader: document.querySelector('#cidadeHeader'),
        imagemHeader: document.querySelector('#imagemHeader'),
        nomeHeader: document.querySelector('#nomeHeader'),
        headerModalUserImage: document.querySelector('#headerModalUserImage'),
        headerModalUserName: document.querySelector('#headerModalUserName'),
        headerModalUserEmail: document.querySelector('#headerModalUserEmail')
    };

    function generateAvatar(name, email) {
        const initials = name?.split(' ').map(n => n[0]).slice(0, 2).join('') || email?.[0] || 'U';
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random`;
    }

    function setGuestMode() {
        if (elements.nomeHeader) elements.nomeHeader.textContent = 'Entrar';
        if (elements.imagemHeader) elements.imagemHeader.src = generateAvatar('', '');
        if (elements.cidadeHeader) elements.cidadeHeader.textContent = 'Localização não definida';
    }

    function updateUserData() {
        const nomeCompleto = `${usuario.nome || ''} ${usuario.sobrenome || ''}`.trim();
        const primeiroNome = usuario.nome || 'Usuário';
        const avatarUrl = usuario.foto || generateAvatar(nomeCompleto, usuario.email);

        if (elements.nomeHeader) elements.nomeHeader.textContent = usuario.nome ? `Olá, ${primeiroNome}` : 'Entrar';
        if (elements.imagemHeader) elements.imagemHeader.src = avatarUrl;
        if (elements.headerModalUserName) elements.headerModalUserName.textContent = nomeCompleto || 'Usuário';
        if (elements.headerModalUserEmail) elements.headerModalUserEmail.textContent = usuario.email || 'E-mail não cadastrado';
        if (elements.headerModalUserImage) elements.headerModalUserImage.src = avatarUrl;
        
        if (elements.cidadeHeader) {
            if (usuario.enderecos?.length > 0) {
                const endereco = usuario.enderecos[0];
                elements.cidadeHeader.textContent = `${endereco.cidade}, ${endereco.uf}`;
            } else {
                elements.cidadeHeader.textContent = 'Localização não definida';
            }
        }
    }

    updateUserData();
}

function configurarLinksDepartamentos() {
    document.querySelectorAll('.nav-bar a').forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                const departamentoId = this.getAttribute('href').substring(1);
                window.location.href = `telaListagemProdutos.html#${departamentoId}`;
            }
        });
    });
}

function configurarBarraDeBusca() {
    const searchForm = document.querySelector('.search-bar');
    const searchInput = document.querySelector('#searchInput');
    const searchButton = document.querySelector('#searchButton');
    
    if (!searchForm || !searchInput || !searchButton) return;
    
    function realizarBusca() {
        const termoBusca = searchInput.value.trim();
        
        if (termoBusca) {
            sessionStorage.setItem('termoBusca', termoBusca);
            window.location.href = 'telaListagemProdutos.html?busca=true';
        }
    }
    
    searchButton.addEventListener('click', realizarBusca);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            realizarBusca();
        }
    });
}