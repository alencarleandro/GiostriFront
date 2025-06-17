document.addEventListener('DOMContentLoaded', function () {
    const usuario = JSON.parse(localStorage.getItem('usuario'));

    if (!usuario) {
        window.location.href = "telaDeLogin.html";
        return;
    }

    const userAvatar = document.getElementById('user-avatar');
    const welcomeTitle = document.getElementById('welcome-title');
    const userEmail = document.getElementById('user-email');
    const editBtn = document.querySelector('.edit-btn');
    const editEmailIcon = document.querySelector('.edit-icon');
    const allCards = document.querySelectorAll('.shortcut-card');

    const userRedirects = {
        'Meus Pedidos': 'telaMeusPedidos.html',
        'Meus Dados': 'telaDeEdicao.html',
        'Avaliações': 'telaAvaliacoes.html',
        'Favoritos': 'telaFavoritos.html'
    };

    const adminRedirects = {
        'Gerenciar Estoque': 'telaGerenciarProdutos.html',
        'Gerenciar Relatórios': 'telaRelatorios.html',
    };

    function checkAdminStatus() {
        const isAdmin = usuario.admin === true || usuario.admin === "true";

        console.log('Status de admin:', isAdmin); 

        if (isAdmin) {
            setupCardRedirects(adminRedirects);
            document.querySelectorAll('.shortcut-card:not(.admin-only)').forEach(card => {
                card.style.display = 'none';
            });
        } else {
            setupCardRedirects(userRedirects);
            document.querySelectorAll('.admin-only').forEach(card => {
                card.style.display = 'none';
            });
            document.querySelector('.shortcuts-grid').style.gridTemplateColumns = 'repeat(4, 1fr)';
        }
    }

    function setupCardRedirects(redirectMap) {
        allCards.forEach(card => {
            const titleElement = card.querySelector('h3');
            if (titleElement) {
                const cardTitle = titleElement.textContent;
                if (redirectMap[cardTitle]) {
                    card.style.cursor = 'pointer';
                    card.addEventListener('click', () => {
                        window.location.href = redirectMap[cardTitle];
                    });

                    card.addEventListener('mouseenter', () => {
                        card.style.transform = 'translateY(-5px)';
                        card.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
                        card.style.transition = 'all 0.3s ease';
                    });

                    card.addEventListener('mouseleave', () => {
                        card.style.transform = 'translateY(0)';
                        card.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
                    });
                }
            }
        });
    }

    // Função para gerar avatar com base no nome ou email
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

    function updateUserData() {
        if (usuario.foto) {
            userAvatar.src = usuario.foto;
        } else {
            const fullName = usuario.nome ? `${usuario.nome} ${usuario.sobrenome || ''}`.trim() : '';
            userAvatar.src = generateAvatar(fullName, usuario.email);
        }

        welcomeTitle.textContent = usuario.nome
            ? `Bem-vindo, ${usuario.nome} ${usuario.sobrenome || ''}`.trim()
            : 'Bem-vindo';

        userEmail.textContent = usuario.email || 'E-mail não cadastrado';
    }

    function redirectToEditPage() {
        window.location.href = "telaDeEdicao.html";
    }

    if (editBtn) editBtn.addEventListener('click', redirectToEditPage);
    if (editEmailIcon) editEmailIcon.addEventListener('click', redirectToEditPage);

    updateUserData();
    checkAdminStatus();
});