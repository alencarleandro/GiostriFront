document.addEventListener('DOMContentLoaded', () => {
  // Elementos do DOM
  const elementos = {
    formulario: document.querySelector('#formularioLogin'),
    campoEmailCPF: document.querySelector('#emailCPF'),
    campoSenha: document.querySelector('#senha'),
    botaoLogin: document.querySelector('#botao-entrar'),
    botaoRegistrar: document.querySelector('#botao-registrar'),
    toggleSenha: document.querySelector('#togglePassword')
  };

  // Utilitários
  const utils = {
    alternarVisibilidadeSenha: () => {
      const tipoAtual = elementos.campoSenha.getAttribute('type');
      const novoTipo = tipoAtual === 'password' ? 'text' : 'password';
      elementos.campoSenha.setAttribute('type', novoTipo);
      elementos.toggleSenha.classList.toggle('fa-eye-slash');
    },

    redirecionarParaCadastro: (evento) => {
      evento.preventDefault();
      window.location.href = "telaDeCadastro.html";
    },

    validarCampos: () => {
      if (!elementos.campoEmailCPF.value.trim() || !elementos.campoSenha.value.trim()) {
        alert("Por favor, preencha todos os campos.");
        return false;
      }
      return true;
    }
  };

  // Controladores
  const controller = {
    handleLogin: async (evento) => {
      evento.preventDefault();
      
      if (!utils.validarCampos()) return;

      const credenciais = {
        emailCPF: elementos.campoEmailCPF.value.trim(),
        senha: elementos.campoSenha.value.trim()
      };

      try {
        // Chamada para o método autenticar do ApiService
        const usuario = await ApiService.autenticar(credenciais);
        
        alert("Login realizado com sucesso! Redirecionando...");
        window.location.href = "telaListagemProdutos.html";
      } catch (erro) {
        console.error("Erro no login:", erro);
        alert(erro.message || "Credenciais inválidas. Tente novamente.");
      }
    },

    handleToggleSenha: (evento) => {
      evento.preventDefault();
      utils.alternarVisibilidadeSenha();
    },

    handleRegistrar: (evento) => {
      utils.redirecionarParaCadastro(evento);
    }
  };

  // Configuração dos Event Listeners
  elementos.botaoLogin?.addEventListener('click', controller.handleLogin);
  elementos.toggleSenha?.addEventListener('click', controller.handleToggleSenha);
  elementos.botaoRegistrar?.addEventListener('click', controller.handleRegistrar);

  // Inicialização
  localStorage.removeItem("usuario"); // Limpa dados de sessão anteriores
});