// Dados de exemplo dos pedidos
let pedidos = [];
console.log(pedidos)

// Mapeamento de status
const statusMap = {
    recebido: { 
        text: "Recebido", 
        class: "status-recebido", 
        icon: "fa-box-open",
        color: "#4361ee"
    },
    separacao: { 
        text: "Separação", 
        class: "status-separacao", 
        icon: "fa-people-carry",
        color: "#4cc9f0"
    },
    andamento: { 
        text: "Em Transporte", 
        class: "status-andamento", 
        icon: "fa-truck",
        color: "#f72585"
    },
    entregue: { 
        text: "Entregue", 
        class: "status-entregue", 
        icon: "fa-check-circle",
        color: "#28a745"
    },
    cancelado: {
        text: "Cancelado",
        class: "status-cancelado",
        icon: "fa-ban",
        color: "#6c757d"
    }
};

// Elementos do DOM
const pedidosList = document.getElementById('pedidosList');
const statusModal = document.getElementById('statusModal');
const confirmationModal = document.getElementById('confirmationModal');
const statusTracker = document.getElementById('statusTracker');
const modalActions = document.getElementById('modalActions');
const modalPedidoNumero = document.getElementById('modalPedidoNumero');
const modalPedidoData = document.getElementById('modalPedidoData');
const modalPedidoCliente = document.getElementById('modalPedidoCliente');
const modalPedidoEndereco = document.getElementById('modalPedidoEndereco');
const modalPedidoPagamento = document.getElementById('modalPedidoPagamento');
const btnConfirmarCancelamento = document.getElementById('btnConfirmarCancelamento');
const btnVoltarCancelamento = document.getElementById('btnVoltarCancelamento');
const closeModal = document.querySelector('.close-modal');
const filterButtons = document.querySelectorAll('.filter-btn');

// Variável para armazenar o pedido atual sendo cancelado
let pedidoParaCancelar = null;

// Carrega a lista de pedidos
async function carregarPedidos(filtro = 'todos') {

    pedidos = await ApiService.buscarMeusPedidos();
    console.log(pedidos)

    pedidosList.innerHTML = '';
    
    const pedidosFiltrados = pedidos.filter(pedido => {
        if (filtro === 'todos') return true;
        if (filtro === 'andamento') return pedido.status !== 'entregue' && pedido.status !== 'cancelado';
        if (filtro === 'entregues') return pedido.status === 'entregue';
        if (filtro === 'cancelados') return pedido.status === 'cancelado';
        return true;
    });
    
    if (pedidosFiltrados.length === 0) {
        pedidosList.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--gray)">Nenhum pedido encontrado</p>';
        return;
    }
    
    pedidosFiltrados.forEach((pedido, index) => {
        const statusInfo = statusMap[pedido.status] || statusMap.recebido;
        
        const pedidoCard = document.createElement('div');
        pedidoCard.className = 'pedido-card';
        pedidoCard.style.animationDelay = `${index * 0.1}s`;
        
        pedidoCard.innerHTML = `
            <div class="pedido-header">
                <span class="pedido-numero">${pedido.numero}</span>
                <span class="pedido-data">${pedido.data}</span>
            </div>
            <div class="pedido-body">
                <div class="pedido-info">
                    <span class="pedido-info-label">Itens</span>
                    <span class="pedido-info-value">${pedido.produtos} ${pedido.produtos > 1 ? 'itens' : 'item'}</span>
                </div>
                <div class="pedido-info">
                    <span class="pedido-info-label">Endereço</span>
                    <span class="pedido-info-value">${pedido.endereco.split(' - ')[0]}</span>
                </div>
                <div class="pedido-total">${pedido.total}</div>
            </div>
            <div class="pedido-footer">
                <span class="pedido-status ${statusInfo.class}">
                    <i class="fas ${statusInfo.icon}"></i> ${statusInfo.text}
                </span>
                <button class="btn-status" data-numero="${pedido.numero}">
                    <i class="fas fa-search"></i> Status do Pedido
                </button>
            </div>
        `;
        
        pedidosList.appendChild(pedidoCard);
    });
    
    // Adiciona eventos aos botões de status
    document.querySelectorAll('.btn-status').forEach(btn => {
        btn.addEventListener('click', () => {
            const numeroPedido = btn.getAttribute('data-numero');
            abrirModalStatus(numeroPedido);
        });
    });
}

// Atualiza o rastreamento de status no modal
function atualizarStatusTracker(pedido) {
    statusTracker.innerHTML = '';
    
    pedido.statusSteps.forEach((step, index) => {
        const stepElement = document.createElement('div');
        stepElement.className = `status-step ${step.concluido ? 'completed' : ''} ${step.atual ? 'active' : ''}`;
        
        const iconClass = step.concluido ? 'fa-check' : 
                         step.atual ? statusMap[step.status].icon : '';
        
        stepElement.innerHTML = `
            <div class="step-icon">
                ${step.concluido ? '<i class="fas fa-check"></i>' : 
                  step.atual ? `<i class="fas ${statusMap[step.status].icon}"></i>` : ''}
            </div>
            <div>
                <div class="step-text">${step.texto}</div>
                <div class="step-date">${step.data}</div>
            </div>
        `;
        
        statusTracker.appendChild(stepElement);
    });
}

// Atualiza as ações do modal (mostra/oculta botão de cancelamento)
function atualizarModalActions(pedido) {
    modalActions.innerHTML = '';
    
    if (pedido.status !== 'cancelado') {
        modalActions.innerHTML = `
            <button class="modal-btn btn-cancel" id="btnCancelarPedido">
                <i class="fas fa-times"></i> Cancelar Pedido
            </button>
        `;
        
        // Adiciona evento ao botão de cancelamento
        document.getElementById('btnCancelarPedido').addEventListener('click', async () => {
            statusModal.classList.remove('show');
            confirmationModal.classList.add('show');
            await ApiService.atualizarStatusPedido(pedido.numero.replace("CONSTRU2025", ""), "cancelado")
        });
    }
}

// Abre o modal de status
function abrirModalStatus(numeroPedido) {
    const pedido = pedidos.find(p => p.numero === numeroPedido);
    if (!pedido) return;
    
    // Armazena o pedido atual
    pedidoParaCancelar = pedido;
    
    // Atualiza as informações do modal
    modalPedidoNumero.textContent = pedido.numero;
    modalPedidoData.textContent = pedido.data;
    modalPedidoCliente.textContent = pedido.cliente;
    modalPedidoEndereco.textContent = pedido.endereco;
    modalPedidoPagamento.textContent = pedido.pagamento;
    
    // Atualiza o rastreamento de status
    atualizarStatusTracker(pedido);
    
    // Atualiza as ações do modal (mostra/oculta botão de cancelamento)
    atualizarModalActions(pedido);
    
    // Exibe o modal
    statusModal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// Fecha o modal
function fecharModal() {
    statusModal.classList.remove('show');
    confirmationModal.classList.remove('show');
    document.body.style.overflow = 'auto';
}

// Cancela o pedido
function cancelarPedido() {
    if (!pedidoParaCancelar) return;
    
    // Aqui você faria a chamada para a API para cancelar o pedido
    // Por enquanto, apenas atualizamos o status localmente
    pedidoParaCancelar.status = "cancelado";
    
    // Adiciona o passo de cancelamento ao histórico
    pedidoParaCancelar.statusSteps = [
        ...pedidoParaCancelar.statusSteps.filter(step => step.status !== 'cancelado'),
        { 
            status: "cancelado", 
            texto: "Pedido Cancelado", 
            data: new Date().toLocaleString('pt-BR'), 
            concluido: true, 
            atual: true 
        }
    ];
    
    // Fecha os modais
    fecharModal();
    
    // Recarrega a lista de pedidos
    carregarPedidos();
    
    // Mostra mensagem de sucesso (opcional)
    alert(`Pedido ${pedidoParaCancelar.numero} cancelado com sucesso!`);
}

// Event Listeners
closeModal.addEventListener('click', fecharModal);

window.addEventListener('click', (event) => {
    if (event.target === statusModal || event.target === confirmationModal) {
        fecharModal();
    }
});

btnConfirmarCancelamento.addEventListener('click', cancelarPedido);

btnVoltarCancelamento.addEventListener('click', () => {
    confirmationModal.classList.remove('show');
    statusModal.classList.add('show');
});

filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const filtro = btn.textContent.toLowerCase();
        carregarPedidos(filtro === 'todos' ? 'todos' : 
                        filtro === 'em andamento' ? 'andamento' : 
                        filtro === 'entregues' ? 'entregues' : 
                        filtro === 'cancelados' ? 'cancelados' : 'todos');
    });
});

// Inicializa a página
document.addEventListener('DOMContentLoaded', async () => {

    carregarPedidos();
});