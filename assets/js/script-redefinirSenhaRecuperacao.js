// script-redefinirSenhaRecuperacao.js
document.addEventListener('DOMContentLoaded', () => {
  // Elementos do formulário
  const formulario = document.getElementById('formularioSenha');
  const senhaInput = document.getElementById('senha');
  const confirmarSenhaInput = document.getElementById('confirmarSenha');
  const botaoSalvar = document.getElementById('botaoSalvar');
  const botoesAlternarSenha = document.querySelectorAll('.alternar-senha');
  const botaoCancelar = document.querySelector('.botao-secundario');

  // Elementos das regras de senha
  const regras = {
      tamanho: document.getElementById('regra-tamanho'),
      maiuscula: document.getElementById('regra-maiuscula'),
      minuscula: document.getElementById('regra-minuscula'),
      numero: document.getElementById('regra-numero'),
      especial: document.getElementById('regra-especial')
  };

  // Expressões regulares para validação
  const regex = {
      maiuscula: /[A-Z]/,
      minuscula: /[a-z]/,
      numero: /[0-9]/,
      especial: /[!@#$%^&*]/
  };

  // Estados de validação
  let validacao = {
      tamanho: false,
      maiuscula: false,
      minuscula: false,
      numero: false,
      especial: false,
      confirmacao: false
  };

  // Função para alternar visibilidade da senha
  function alternarVisibilidadeSenha(input) {
      const tipo = input.getAttribute('type') === 'password' ? 'text' : 'password';
      input.setAttribute('type', tipo);
  }

  // Função para validar a senha
  function validarSenha(senha) {
      validacao.tamanho = senha.length >= 8;
      validacao.maiuscula = regex.maiuscula.test(senha);
      validacao.minuscula = regex.minuscula.test(senha);
      validacao.numero = regex.numero.test(senha);
      validacao.especial = regex.especial.test(senha);

      // Atualizar visual das regras
      regras.tamanho.style.color = validacao.tamanho ? 'green' : 'red';
      regras.maiuscula.style.color = validacao.maiuscula ? 'green' : 'red';
      regras.minuscula.style.color = validacao.minuscula ? 'green' : 'red';
      regras.numero.style.color = validacao.numero ? 'green' : 'red';
      regras.especial.style.color = validacao.especial ? 'green' : 'red';

      return Object.values(validacao).every(v => v);
  }

  // Função para validar confirmação de senha
  function validarConfirmacao() {
      const senha = senhaInput.value;
      const confirmacao = confirmarSenhaInput.value;
      
      validacao.confirmacao = senha === confirmacao && senha !== '';
      
      if (confirmacao !== '') {
          confirmarSenhaInput.style.borderColor = validacao.confirmacao ? 'green' : 'red';
      } else {
          confirmarSenhaInput.style.borderColor = '';
      }
      
      return validacao.confirmacao;
  }

  // Função para atualizar estado do botão
  function atualizarBotao() {
      const senhaValida = Object.values(validacao).every(v => v);
      botaoSalvar.disabled = !senhaValida;
  }

  // Event listeners
  if (senhaInput) {
      senhaInput.addEventListener('input', (e) => {
          validarSenha(e.target.value);
          validarConfirmacao();
          atualizarBotao();
      });
  }

  if (confirmarSenhaInput) {
      confirmarSenhaInput.addEventListener('input', () => {
          validarConfirmacao();
          atualizarBotao();
      });
  }

  if (botoesAlternarSenha) {
      botoesAlternarSenha.forEach(botao => {
          botao.addEventListener('click', () => {
              const input = botao.parentElement.querySelector('input');
              alternarVisibilidadeSenha(input);
          });
      });
  }

  if (botaoCancelar) {
      botaoCancelar.addEventListener('click', () => {
          window.location.href = 'telaDeLogin.html';
      });
  }

  if (formulario) {
      formulario.addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const senha = senhaInput.value;

          try {
              // Desabilita o botão durante a requisição
              botaoSalvar.disabled = true;
              botaoSalvar.textContent = 'Salvando...';

              // Chama a API para redefinir a senha
              const parametros = new URLSearchParams(window.location.search);
              const email = parametros.get('email');

              await ApiService.redefinirSenha(email, senha);
              
              alert('Senha redefinida com sucesso! Você será redirecionado para a página de login.');
              window.location.href = 'telaDeLogin.html';
          } catch (erro) {
              console.error('Erro ao redefinir senha:', erro);
              alert(erro.message || 'Erro ao redefinir senha. Por favor, tente novamente.');
          } finally {
              botaoSalvar.disabled = false;
              botaoSalvar.textContent = 'Salvar Nova Senha';
          }
      });
  }

  // Inicializa o botão como desabilitado
  if (botaoSalvar) {
      botaoSalvar.disabled = true;
  }
});