document.addEventListener('DOMContentLoaded', () => {
    const formulario = document.getElementById('formularioRecuperacao');
    const campoEmail = document.getElementById('email');
    const botaoEnviar = document.getElementById('botaoEnviar');
    const divMensagem = document.getElementById('mensagem');
    const indicadorCarregamento = document.querySelector('.indicador-carregamento');
    const textoBotao = document.querySelector('.texto-botao');
  
    const mostrarMensagem = (texto, tipo) => {
      divMensagem.textContent = texto;
      divMensagem.className = `mensagem ${tipo}`;
      divMensagem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
  
    const validarEmail = (email) => {
      const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return regexEmail.test(email);
    };
  
    const alternarCarregamento = (carregando) => {
      botaoEnviar.disabled = carregando;
      indicadorCarregamento.classList.toggle('oculto', !carregando);
      textoBotao.textContent = carregando ? 'Enviando...' : 'Enviar Link de Recuperação';
    };
  
    formulario.addEventListener('submit', async (evento) => {
      evento.preventDefault();
  
      const email = campoEmail.value.trim();
  
      if (!validarEmail(email)) {
        mostrarMensagem('Por favor, insira um endereço de e-mail válido.', 'erro');
        campoEmail.focus();
        return;
      }
  
      alternarCarregamento(true);
  
      try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        console.log(email);
        await ApiService.enviarEmailRecuperacao(email);
        mostrarMensagem(
          'Link de recuperação enviado! Por favor, verifique sua caixa de entrada e a pasta de spam.',
          'sucesso'
        );
        campoEmail.value = '';
      } catch (erro) {
        mostrarMensagem(
          'Não foi possível enviar o link de recuperação. Por favor, tente novamente.',
          'erro'
        );
        console.error('Erro ao processar solicitação:', erro);
      } finally {
        alternarCarregamento(false);
      }
    });
  
    campoEmail.addEventListener('input', () => {
      if (divMensagem.className !== 'mensagem oculto') {
        divMensagem.className = 'mensagem oculto';
      }
    });
  });
  