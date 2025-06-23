document.addEventListener("DOMContentLoaded", function () {
    fetch('../componentes/sidebar.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('sidebar').innerHTML = data;
            configurarSidebar();
        })
        .catch(error => console.error("Erro ao carregar a sidebar:", error));


});

function configurarSidebar() {
    const usuarioLogado = JSON.parse(localStorage.getItem('usuario'));
    const linkMap = {
        "Página Inicial": "telaListagemProdutos.html",
        "Meu Perfil": "telaViewUsuario.html",
        "Meus Pedidos":  ApiService.isAdmin() ? "telaGerenciarPedido.html" : "telaMeusPedidos.html",
        "Favoritos": "telaFavoritos.html",
    };

    document.querySelectorAll('.sidebar-items a[data-tooltip]').forEach(link => {
        const destino = linkMap[link.getAttribute('data-tooltip')];
        if (destino) {
            link.addEventListener('click', (e) => {
                e.preventDefault();

                if (!usuarioLogado && destino !== "index.html") {
                    window.location.href = "/paginas/telaDeLogin.html";
                    return;
                }

                window.location.href = destino;
            });
        }
    });

    const logoutLink = document.querySelector('.sidebar-items a.logout');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = "/paginas/telaDeLogin.html";
        });
    }
}