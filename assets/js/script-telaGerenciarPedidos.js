document.addEventListener('DOMContentLoaded', function () {
    // Carrega os pedidos
    carregarPedidos();

    // Configura os listeners
    document.getElementById('busca-pedidos').addEventListener('input', filtrarPedidos);
    document.getElementById('filtro-status').addEventListener('change', filtrarPedidos);
    document.getElementById('btn-anterior').addEventListener('click', paginaAnterior);
    document.getElementById('btn-proximo').addEventListener('click', paginaProxima);

    // Modal
    const modal = document.getElementById('modal-detalhes');
    const span = document.getElementsByClassName('close-modal')[0];

    span.onclick = function () {
        modal.style.display = 'none';
    }

    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }
});

// Variáveis de estado
let pedidos = [];
let pedidosFiltrados = [];
let paginaAtual = 1;
const itensPorPagina = 10;

// Função para carregar os pedidos (simulando dados)
async function carregarPedidos() {
    // Simulação de dados - em uma aplicação real, isso viria de uma API
    pedidos = await ApiService.listarPedidos();

    pedidosFiltrados = [...pedidos];
    atualizarTabela();
}

// Função para filtrar os pedidos
function filtrarPedidos() {
    const termoBusca = document.getElementById('busca-pedidos').value.toLowerCase();
    const filtroStatus = document.getElementById('filtro-status').value;

    pedidosFiltrados = pedidos.filter(pedido => {
        const correspondeBusca =
            pedido.id.toString().includes(termoBusca) ||
            pedido.cliente.toLowerCase().includes(termoBusca);

        const correspondeStatus =
            filtroStatus === 'todos' ||
            pedido.status === filtroStatus;

        return correspondeBusca && correspondeStatus;
    });

    paginaAtual = 1;
    atualizarTabela();
}

// Função para atualizar a tabela de pedidos
function atualizarTabela() {
    const tabela = document.getElementById('lista-pedidos');
    tabela.innerHTML = '';

    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const pedidosPagina = pedidosFiltrados.slice(inicio, fim);

    if (pedidosPagina.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="6" style="text-align: center;">Nenhum pedido encontrado</td>';
        tabela.appendChild(tr);
    } else {
        pedidosPagina.forEach(pedido => {
            const tr = document.createElement('tr');

            // A data já vem formatada da API (DD/MM/AAAA)
            const dataFormatada = pedido.data;

            // Formata o total para moeda brasileira
            const totalFormatado = parseFloat(pedido.total).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            });

            tr.innerHTML = `
                <td>${pedido.id}</td>
                <td>${pedido.cliente}</td>
                <td>${dataFormatada}</td>
                <td><span class="status status-${pedido.status}">${formatarStatus(pedido.status)}</span></td>
                <td>${totalFormatado}</td>
                <td>
                    <button class="btn-acao btn-detalhes" onclick="verDetalhes('${pedido.id}')">Detalhes</button>
                    ${pedido.status !== 'entregue' && pedido.status !== 'cancelado' ?
                    `<button class="btn-acao btn-entregue" onclick="marcarComoEntregue('${pedido.id}')">Entregue</button>` : ''}
                    ${pedido.status !== 'cancelado' ?
                    `<button class="btn-acao btn-cancelar" onclick="cancelarPedido('${pedido.id}')">Cancelar</button>` : ''}
                </td>
            `;

            tabela.appendChild(tr);
        });
    }

    // Atualiza a paginação
    document.getElementById('pagina-atual').textContent = paginaAtual;
    document.getElementById('btn-anterior').disabled = paginaAtual === 1;
    document.getElementById('btn-proximo').disabled =
        paginaAtual * itensPorPagina >= pedidosFiltrados.length;
}

// Função para formatar o status para exibição
function formatarStatus(status) {
    const statusMap = {
        'pendente': 'Pendente',
        'processando': 'Processando',
        'enviado': 'Enviado',
        'entregue': 'Entregue',
        'cancelado': 'Cancelado'
    };

    return statusMap[status] || status;
}

// Funções de paginação
function paginaAnterior() {
    if (paginaAtual > 1) {
        paginaAtual--;
        atualizarTabela();
    }
}

function paginaProxima() {
    if (paginaAtual * itensPorPagina < pedidosFiltrados.length) {
        paginaAtual++;
        atualizarTabela();
    }
}

// Funções de ações nos pedidos
async function verDetalhes(pedidoId) {
    console.log('Procurando pedido com ID:', pedidoId, 'Tipo:', typeof pedidoId);
    console.log('Todos os pedidos:', pedidos);

    // Usar == em vez de === para comparar independente do tipo
    const pedido = pedidos.find(p => p.id == pedidoId);

    if (!pedido) {
        console.error('Pedido não encontrado. ID procurado:', pedidoId, 'Tipo:', typeof pedidoId);
        console.error('IDs disponíveis:', pedidos.map(p => ({ id: p.id, tipo: typeof p.id })));
        return;
    }

    // Simulação de detalhes do pedido - em uma aplicação real, isso viria de uma API
    const produtos = await ApiService.listarProdutosDoPedido(pedidoId);

    console.log(await ApiService.listarProdutosDoPedido(pedidoId))

    const totalPedido = produtos.reduce((total, produto) =>
        total + (produto.preco * produto.quantidade), 0);

    document.getElementById('pedido-id').textContent = pedido.id;

    const detalhesPedido = document.getElementById('detalhes-pedido');
    detalhesPedido.innerHTML = `
      <div class="detalhes-cliente">
          <h3>Informações do Cliente</h3>
          <p><strong>Nome:</strong> ${pedido.cliente}</p>
          <p><strong>Data do Pedido:</strong> ${pedido.data}</p>
          <p><strong>Status:</strong> <span class="status status-${pedido.status}">${formatarStatus(pedido.status)}</span></p>
      </div>
      
      <div class="detalhes-produtos">
          <h3>Produtos</h3>
          <table>
              <thead>
                  <tr>
                      <th>Produto</th>
                      <th>Quantidade</th>
                      <th>Preço Unitário</th>
                      <th>Total</th>
                  </tr>
              </thead>
              <tbody>
                  ${produtos.map(produto => `
                      <tr>
                          <td>${produto.nome}</td>
                          <td>${produto.quantidade}</td>
                          <td>${produto.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                          <td>${(produto.quantidade * produto.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                      </tr>
                  `).join('')}
              </tbody>
          </table>
      </div>
      
      <div class="detalhes-total">
          <p><strong>Total do Pedido:</strong> ${totalPedido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
      </div>
  `;

    document.getElementById('modal-detalhes').style.display = 'block';
}

async function marcarComoEntregue(pedidoId) {
    if (confirm('Deseja marcar este pedido como entregue?')) {
        const pedidoIndex = pedidos.findIndex(p => p.id === pedidoId);
        if (pedidoIndex !== -1) {
            pedidos[pedidoIndex].status = 'entregue';
            filtrarPedidos();
            await ApiService.atualizarStatusPedido(pedidoId, "entregue")
            alert('Pedido marcado como entregue com sucesso!');
        }
    }
}

async function cancelarPedido(pedidoId) {
    if (confirm('Deseja realmente cancelar este pedido?')) {
        const pedidoIndex = pedidos.findIndex(p => p.id === pedidoId);
        if (pedidoIndex !== -1) {
            pedidos[pedidoIndex].status = 'cancelado';
            filtrarPedidos();
            await ApiService.atualizarStatusPedido(pedidoId, "cancelado")
            alert('Pedido cancelado com sucesso!');
        }
    }
}