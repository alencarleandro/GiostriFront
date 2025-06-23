document.addEventListener('DOMContentLoaded', () => {
    // Elementos do DOM
    const elementos = {
      formularioPessoal: document.getElementById('campos-pessoa-fisica'),
      formularioEndereco: document.getElementById('campos-endereco'),
      botaoContinuar: document.querySelector('.botao-continuar button'),
      botaoVoltar: document.getElementById('botao-voltar'),
      botaoEntrar: document.getElementById('botao-entrar')
    };
  
    // Configurações
    const config = {
      validacao: {
        tamanhoMaximo: {
          nome: 100,
          sobrenome: 100,
          email: 60
        },
        regex: {
          email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
          senha: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/,
          cpf: /^\d{11}$/,
          telefone: /^\d{10,11}$/,
          cep: /^\d{5}-\d{3}$/
        },
        idadeMinima: 18
      },
      formatacao: {
        cpf: (valor) => valor.replace(/\D/g, "").slice(0, 11)
          .replace(/(\d{3})(\d)/, "$1.$2")
          .replace(/(\d{3})(\d)/, "$1.$2")
          .replace(/(\d{3})(\d{1,2})$/, "$1-$2"),
        telefone: (valor) => {
          valor = valor.replace(/\D/g, "");
          if (valor.length > 2) valor = valor.replace(/^(\d{2})(\d)/g, "($1) $2");
          if (valor.length > 10) valor = valor.replace(/(\d{5})(\d)/, "$1-$2");
          return valor.substring(0, 15);
        },
        cep: (valor) => {
          valor = valor.replace(/\D/g, "").slice(0, 8);
          return valor.length > 5 ? valor.replace(/(\d{5})(\d)/, "$1-$2") : valor;
        }
      }
    };
  
    // Estado da aplicação
    const estado = {
      naTelaEndereco: false,
      dadosUsuario: {
        nome: null,
        sobrenome: null,
        genero: null,
        cpf: null,
        email: null,
        telefone: null,
        senha: null,
        dataNascimento: null,
        cep: null,
        logradouro: null,
        numero: null,
        complemento: null,
        bairro: null,
        cidade: null,
        uf: null
      }
    };
  
    // Utilitários
    const utils = {
      formatarCampo: (campo, tipo) => {
        campo.value = config.formatacao[tipo](campo.value);
      },
  
      limitarCaracteres: (campo, maxLength) => {
        campo.value = campo.value.slice(0, maxLength);
      },
  
      validarIdade: (data) => {
        const hoje = new Date();
        const nascimento = new Date(data);
        const idade = hoje.getFullYear() - nascimento.getFullYear();
        const mes = hoje.getMonth() - nascimento.getMonth();
        return idade > config.validacao.idadeMinima || 
               (idade === config.validacao.idadeMinima && mes >= 0);
      },
  
      mostrarErro: (mensagem) => {
        alert(mensagem);
        return false;
      }
    };
  
    // Validações
    const validacao = {
      formularioPessoal: () => {
        const camposObrigatorios = [
          'firstname', 'lastname', 'genero', 'cpf', 
          'birthdate', 'email', 'telefone', 'password', 'confirm-password'
        ];
  
        for (const id of camposObrigatorios) {
          const valor = document.getElementById(id).value.trim();
          if (!valor) return utils.mostrarErro("Preencha todos os campos obrigatórios.");
        }
  
        const cpf = document.getElementById("cpf").value.replace(/\D/g, "");
        if (!config.validacao.regex.cpf.test(cpf)) 
          return utils.mostrarErro("CPF inválido.");
  
        const email = document.getElementById("email").value.trim();
        if (!config.validacao.regex.email.test(email)) 
          return utils.mostrarErro("E-mail inválido.");
  
        const telefone = document.getElementById("telefone").value.replace(/\D/g, "");
        if (!config.validacao.regex.telefone.test(telefone)) 
          return utils.mostrarErro("Telefone inválido.");
  
        const senha = document.getElementById("password").value;
        const confirmarSenha = document.getElementById("confirm-password").value;
        if (senha !== confirmarSenha) 
          return utils.mostrarErro("As senhas não coincidem.");
  
        if (!config.validacao.regex.senha.test(senha)) 
          return utils.mostrarErro("A senha deve conter:\n- Mínimo 8 caracteres\n- Letra maiúscula\n- Letra minúscula\n- Número\n- Caractere especial");
  
        const dataNascimento = document.getElementById("birthdate").value;
        if (!utils.validarIdade(dataNascimento)) 
          return utils.mostrarErro("Você precisa ter pelo menos 18 anos.");
  
        return true;
      },
  
      formularioEndereco: () => {
        const camposObrigatorios = ['cep', 'rua', 'numero', 'bairro', 'cidade', 'estado'];
        for (const id of camposObrigatorios) {
          const valor = document.getElementById(id).value.trim();
          if (!valor) return utils.mostrarErro("Preencha todos os campos de endereço.");
        }
  
        const cep = document.getElementById("cep").value.trim();
        if (!config.validacao.regex.cep.test(cep)) 
          return utils.mostrarErro("CEP inválido.");
  
        return true;
      }
    };
  
    // Controle de interface
    const ui = {
      alternarTelas: () => {
        estado.naTelaEndereco = !estado.naTelaEndereco;
        elementos.formularioPessoal.style.display = estado.naTelaEndereco ? 'none' : 'block';
        elementos.formularioEndereco.style.display = estado.naTelaEndereco ? 'block' : 'none';
        elementos.botaoContinuar.textContent = estado.naTelaEndereco ? "Finalizar Cadastro" : "Continuar";
        elementos.botaoVoltar.style.display = estado.naTelaEndereco ? 'inline-block' : 'none';
      },
  
      preencherEndereco: (dados) => {
        document.getElementById("rua").value = dados.logradouro || '';
        document.getElementById("bairro").value = dados.bairro || '';
        document.getElementById("cidade").value = dados.localidade || '';
        document.getElementById("estado").value = dados.uf || '';
      }
    };
  
    // Controladores
    const controller = {
      salvarDadosPessoais: () => {
        estado.dadosUsuario = {
          ...estado.dadosUsuario,
          nome: document.getElementById("firstname").value.trim(),
          sobrenome: document.getElementById("lastname").value.trim(),
          genero: document.getElementById("genero").value,
          cpf: document.getElementById("cpf").value.replace(/\D/g, ""),
          dataNascimento: document.getElementById("birthdate").value.trim(),
          email: document.getElementById("email").value.trim(),
          telefone: document.getElementById("telefone").value.replace(/\D/g, ""),
          senha: document.getElementById("password").value.trim()
        };
      },
  
      salvarDadosEndereco: () => {
        estado.dadosUsuario = {
          ...estado.dadosUsuario,
          cep: document.getElementById("cep").value.trim(),
          logradouro: document.getElementById("rua").value.trim(),
          numero: document.getElementById("numero").value.trim(),
          complemento: document.getElementById("complemento").value.trim(),
          bairro: document.getElementById("bairro").value.trim(),
          cidade: document.getElementById("cidade").value.trim(),
          uf: document.getElementById("estado").value.trim()
        };
      },
  
      buscarCEP: async (cep) => {
        cep = cep.replace(/\D/g, "");
        if (cep.length !== 8) return;
  
        try {
          const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
          const dados = await resposta.json();
          
          if (!dados.erro) {
            ui.preencherEndereco(dados);
          } else {
            alert("CEP não encontrado");
          }
        } catch (erro) {
          console.error("Erro ao buscar CEP:", erro);
          alert("Erro ao consultar CEP");
        }
      },
  
      handleContinuar: async (event) => {
        event.preventDefault();
  
        if (!estado.naTelaEndereco) {
          if (!validacao.formularioPessoal()) return;
          controller.salvarDadosPessoais();
          ui.alternarTelas();
        } else {
          if (!validacao.formularioEndereco()) return;
          controller.salvarDadosEndereco();
  
          try {
            await ApiService.cadastrarUsuario(estado.dadosUsuario);
            alert("Cadastro realizado com sucesso!");
            setTimeout(() => window.location.href = "/paginas/telaDeLogin.html", 1000);
          } catch (erro) {
            console.error("Erro no cadastro:", erro);
            alert(erro.message || "Erro ao cadastrar. Tente novamente.");
          }
        }
      },
  
      handleVoltar: (event) => {
        event.preventDefault();
        ui.alternarTelas();
      }
    };
  
    // Event Listeners
    document.getElementById("cpf").addEventListener("input", (e) => {
      utils.formatarCampo(e.target, 'cpf');
    });
  
    document.getElementById("telefone").addEventListener("input", (e) => {
      utils.formatarCampo(e.target, 'telefone');
    });
  
    document.getElementById("firstname").addEventListener("input", (e) => {
      utils.limitarCaracteres(e.target, config.validacao.tamanhoMaximo.nome);
    });
  
    document.getElementById("lastname").addEventListener("input", (e) => {
      utils.limitarCaracteres(e.target, config.validacao.tamanhoMaximo.sobrenome);
    });
  
    document.getElementById("email").addEventListener("input", (e) => {
      utils.limitarCaracteres(e.target, config.validacao.tamanhoMaximo.email);
    });
  
    let timeoutCEP;
    document.getElementById("cep").addEventListener("input", (e) => {
      utils.formatarCampo(e.target, 'cep');
      clearTimeout(timeoutCEP);
      timeoutCEP = setTimeout(() => {
        if (e.target.value.replace(/\D/g, "").length === 8) {
          controller.buscarCEP(e.target.value);
        }
      }, 500);
    });
  
    elementos.botaoContinuar.addEventListener('click', controller.handleContinuar);
    elementos.botaoVoltar.addEventListener('click', controller.handleVoltar);
    elementos.botaoEntrar.addEventListener('click', () => {
      window.location.href = "/paginas/telaDeLogin.html";
    });
  
    // Inicialização
    elementos.botaoVoltar.style.display = 'none';
    elementos.formularioEndereco.style.display = 'none';
  });
  
  // Função global para alternar visibilidade da senha
  function togglePasswordVisibility(fieldId, icon) {
    const campo = document.getElementById(fieldId);
    const visivel = campo.type === "text";
    campo.type = visivel ? "password" : "text";
    icon.classList.toggle("fa-eye-slash");
    icon.classList.toggle("fa-eye");
  }