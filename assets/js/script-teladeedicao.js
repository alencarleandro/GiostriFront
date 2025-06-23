document.addEventListener('DOMContentLoaded', () => {
  // Elementos do DOM
  const elementos = {
    formularioInfo: document.querySelector('#basicInfoForm'),
    formularioSenha: document.querySelector('#passwordForm'),
    formularioEndereco: document.querySelector('#newAddressForm'),
    listaEnderecos: document.querySelector('#addressList'),
    popupSucesso: document.querySelector('#successPopup'),
    popupConfirmacao: document.querySelector('#deleteConfirmPopup'),
    popupConfirmacaoEndereco: document.querySelector('#deleteAddressConfirmPopup'),
    popupSenha: document.querySelector('#changePasswordPopup'),
    btnAdicionarEndereco: document.querySelector('#addAddressBtn'),
    formularioEnderecoContainer: document.querySelector('#addressForm'),
    btnFecharFormulario: document.querySelector('#closeAddressForm'),
    tituloFormulario: document.querySelector('.form-title'),
    btnSalvarEndereco: document.querySelector('#addressForm button[type="submit"]'),
    formFields: {
      zipCode: document.getElementById("zipCode"),
      street: document.getElementById("street"),
      number: document.getElementById("number"),
      complement: document.getElementById("complement"),
      neighborhood: document.getElementById("neighborhood"),
      city: document.getElementById("city"),
      state: document.getElementById("state")
    }
  };

  // Estado da aplicação
  const estado = {
    carregando: false,
    enderecos: [],
    enderecoExcluindo: null,
    editIndex: null // Índice do endereço que será editado
  };

  // Utilitários
  const utils = {
    mostrarElemento: (elemento) => elemento.classList.remove('hidden'),
    ocultarElemento: (elemento) => elemento.classList.add('hidden'),
    resetarFormulario: (formulario) => formulario.reset(),

    mostrarFeedback: (mensagem, tipo = 'sucesso') => {
      elementos.popupSucesso.textContent = mensagem;
      elementos.popupSucesso.className = `popup ${tipo}`;
      utils.mostrarElemento(elementos.popupSucesso);
      setTimeout(() => utils.ocultarElemento(elementos.popupSucesso), 3000);
    },

    alternarCarregamento: (carregando) => {
      estado.carregando = carregando;
      document.querySelectorAll('button').forEach(botao => {
        botao.disabled = carregando;
      });
    },

    togglePasswordVisibility: (inputId) => {
      const input = document.getElementById(inputId);
      const icon = document.querySelector(`.toggle-password[data-toggle="${inputId}"]`);
      if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
      } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
      }
    },

    mostrarFormularioEndereco: () => {
      elementos.formularioEndereco.reset();
      elementos.tituloFormulario.textContent = 'CADASTRAR NOVO ENDEREÇO';
      elementos.btnSalvarEndereco.textContent = 'SALVAR ENDEREÇO';
      utils.mostrarElemento(elementos.formularioEnderecoContainer);
      utils.ocultarElemento(elementos.btnAdicionarEndereco);
    },

    ocultarFormularioEndereco: () => {
      utils.ocultarElemento(elementos.formularioEnderecoContainer);
      utils.mostrarElemento(elementos.btnAdicionarEndereco);
      elementos.formularioEndereco.reset();
      estado.editIndex = null;
    },

    confirmarExclusao: (mensagem, callback) => {
      const popup = elementos.popupConfirmacaoEndereco;
      popup.querySelector('p').textContent = mensagem;
      utils.mostrarElemento(popup);

      document.querySelector('#confirmDeleteAddress').onclick = () => {
        callback();
        utils.ocultarElemento(popup);
      };
    },

    limparFormularioEndereco: () => {
      for (let key in elementos.formFields) {
        elementos.formFields[key].value = "";
      }
      estado.editIndex = null;
    }
  };

  // Gerenciamento de Endereços
  const enderecoManager = {
    getEnderecos: () => {
      const usuario = JSON.parse(localStorage.getItem("usuario")) || {};
      return usuario.enderecos || [];
    },

    salvarEnderecos: (enderecos) => {
      const usuario = JSON.parse(localStorage.getItem("usuario")) || {};
      usuario.enderecos = enderecos;
      localStorage.setItem("usuario", JSON.stringify(usuario));
    },

    adicionar: async (dadosEndereco) => {
      try {
        utils.alternarCarregamento(true);
        const usuario = JSON.parse(localStorage.getItem("usuario"));

        if (estado.editIndex !== null) {
          // Edição de endereço existente
          const resposta = await ApiService.atualizarEndereco(
            usuario.id,
            estado.enderecos[estado.editIndex].id,
            dadosEndereco
          );

          console.log("Resposta da atualização:", resposta);
          localStorage.setItem('usuario', JSON.stringify(resposta.usuario));
          window.location.href = "";

        } else {
          // Novo endereço
          const resposta = await ApiService.adicionarEndereco(usuario.id, dadosEndereco);
          estado.enderecos.push(resposta.endereco);
        }

      } catch (erro) {
        console.error("Erro ao salvar endereço:", erro);
        utils.mostrarFeedback("Erro ao salvar endereço. Tente novamente.", "erro");
      } finally {
        utils.alternarCarregamento(false);


      }
    },

    editar: (index) => {
      const endereco = estado.enderecos[index];

      for (let key in elementos.formFields) {
        // Mapeia os nomes dos campos para os nomes da API
        const fieldMap = {
          zipCode: 'cep',
          street: 'logradouro',
          number: 'numero',
          complement: 'complemento',
          neighborhood: 'bairro',
          city: 'cidade',
          state: 'uf'
        };

        elementos.formFields[key].value = endereco[fieldMap[key] || key] || '';
      }

      estado.editIndex = index;
      elementos.tituloFormulario.textContent = 'EDITAR ENDEREÇO';
      elementos.btnSalvarEndereco.textContent = 'ATUALIZAR ENDEREÇO';
      utils.mostrarElemento(elementos.formularioEnderecoContainer);
      utils.ocultarElemento(elementos.btnAdicionarEndereco);
    },

    excluir: async (id) => {
      try {
        utils.alternarCarregamento(true);

        console.log(id);

        await ApiService.excluirEndereco(id);
        estado.enderecos = estado.enderecos.filter(e => e.id !== id);

        enderecoManager.salvarEnderecos(estado.enderecos);
        enderecoManager.renderizar();
        utils.mostrarFeedback("Endereço excluído com sucesso!");
      } catch (erro) {
        console.error("Erro ao excluir endereço:", erro);
        utils.mostrarFeedback("Erro ao excluir endereço. Tente novamente.", "erro");
      } finally {
        utils.alternarCarregamento(false);
      }
    },

    renderizar: () => {
      if (estado.enderecos.length === 0) {
        elementos.listaEnderecos.innerHTML = "<p>Nenhum endereço cadastrado.</p>";
        return;
      }

      elementos.listaEnderecos.innerHTML = estado.enderecos.map((endereco, index) => `
        <div class="address-card" data-id="${endereco.id}">
          <div class="address-card-header">
            <div>
              <p class="font-semibold">${endereco.logradouro}, ${endereco.numero}</p>
              <p class="text-sm text-gray-600">
                ${endereco.bairro} - ${endereco.cidade}/${endereco.uf}
              </p>
              <p class="text-sm text-gray-600">CEP: ${endereco.cep}</p>
              ${endereco.complemento ? `<p class="text-sm text-gray-600">Complemento: ${endereco.complemento}</p>` : ''}
            </div>
            ${endereco.isDefault ? `<span class="address-default">PADRÃO</span>` : ''}
          </div>
          <div class="address-actions">
            <button class="btn-secondary" onclick="enderecoManager.editar(${index})">
              <i class="fas fa-edit"></i> EDITAR
            </button>
            <button class="btn-danger" onclick="utils.confirmarExclusao('Tem certeza que deseja excluir este endereço?', () => enderecoManager.excluir('${endereco.id}'))">
              <i class="fas fa-trash"></i> EXCLUIR
            </button>
          </div>
        </div>
      `).join('');
    }
  };

  // Controladores
  const controller = {
    atualizarUsuario: async () => {
      if (estado.carregando) return;

      try {
        utils.alternarCarregamento(true);
        const usuario = JSON.parse(localStorage.getItem("usuario"));

        usuario.nome = document.querySelector('#nome').value.trim();
        usuario.email = document.querySelector('#email').value.trim();
        usuario.telefone = document.querySelector('#telefone').value.trim();
        usuario.genero = document.querySelector('#genero').value;

        const resposta = await ApiService.atualizarUsuario(usuario);
        localStorage.setItem('usuario', JSON.stringify(resposta.usuario));
        alert('Informações atualizadas com sucesso!');
        utils.mostrarFeedback('Informações atualizadas com sucesso!');
      } catch (erro) {
        console.error("Erro ao atualizar usuário:", erro);
        utils.mostrarFeedback("Erro ao atualizar informações.", "erro");
      } finally {
        utils.alternarCarregamento(false);
      }
    },

    alterarSenha: async (e) => {
      e.preventDefault();
      if (estado.carregando) return;

      const senhaAtual = document.querySelector('#currentPassword').value;
      const novaSenha = document.querySelector('#newPassword').value;
      const confirmacao = document.querySelector('#confirmPassword').value;

      if (novaSenha !== confirmacao) {
        utils.mostrarFeedback("As senhas não coincidem.", "erro");
        return;
      }

      try {
        utils.alternarCarregamento(true);
        const usuario = JSON.parse(localStorage.getItem("usuario"));

        await ApiService.alterarSenhaUsuario(usuario.id, senhaAtual, novaSenha);
        utils.mostrarFeedback('Senha alterada com sucesso!');
        utils.resetarFormulario(elementos.formularioSenha);
        utils.ocultarElemento(elementos.popupSenha);
      } catch (erro) {
        console.error("Erro ao alterar senha:", erro);
        utils.mostrarFeedback(erro.message || "Erro ao alterar senha.", "erro");
      } finally {
        utils.alternarCarregamento(false);
      }
    },

    excluirConta: async () => {
      try {
        utils.alternarCarregamento(true);
        const usuario = JSON.parse(localStorage.getItem("usuario"));

        await ApiService.excluirUsuario(usuario.id);
        localStorage.removeItem("usuario");
        window.location.href = "/paginas/telaDeLogin.html";
      } catch (erro) {
        console.error("Erro ao excluir conta:", erro);
        utils.mostrarFeedback("Erro ao excluir conta. Tente novamente.", "erro");
      } finally {
        utils.alternarCarregamento(false);
      }
    },

    salvarEndereco: async (e) => {
      e.preventDefault();
      if (estado.carregando) return;

      const dados = {
        cep: elementos.formFields.zipCode.value,
        logradouro: elementos.formFields.street.value,
        numero: elementos.formFields.number.value,
        complemento: elementos.formFields.complement.value,
        bairro: elementos.formFields.neighborhood.value,
        cidade: elementos.formFields.city.value,
        uf: elementos.formFields.state.value
      };

      await enderecoManager.adicionar(dados);
    },

    buscarCEP: async (cep) => {
      cep = cep.replace(/\D/g, "");
      if (cep.length !== 8) return;

      try {
        const endereco = await ApiService.buscarCEP(cep);
        elementos.formFields.street.value = endereco.logradouro || '';
        elementos.formFields.neighborhood.value = endereco.bairro || '';
        elementos.formFields.city.value = endereco.cidade || '';
        elementos.formFields.state.value = endereco.uf || '';
      } catch (erro) {
        console.error("Erro ao buscar CEP:", erro);
        utils.mostrarFeedback("CEP não encontrado ou erro na consulta.", "erro");
      }
    }
  };

  // Inicialização
  const init = () => {
    const usuario = JSON.parse(localStorage.getItem("usuario")) || {};

    if (usuario) {
      document.querySelector('#nome').value = usuario.nome || '';
      document.querySelector('#telefone').value = usuario.telefone || '';
      document.querySelector('#email').value = usuario.email || '';
      document.querySelector('#cpf').value = usuario.cpf || '';
      document.querySelector('#nascimento').value = usuario.dataNascimento || '';

      if (usuario.genero) {
        document.querySelector('#genero').value = usuario.genero.toUpperCase();
      }

      if (usuario.enderecos) {
        estado.enderecos = usuario.enderecos;
        enderecoManager.renderizar();
      }
    }

    // Event Listeners
    elementos.formularioInfo.addEventListener('submit', (e) => {
      e.preventDefault();
      controller.atualizarUsuario();
    });

    elementos.formularioSenha.addEventListener('submit', controller.alterarSenha);
    elementos.formularioEndereco.addEventListener('submit', controller.salvarEndereco);

    elementos.btnFecharFormulario.addEventListener('click', () => utils.ocultarFormularioEndereco());

    let timeoutCEP;
    elementos.formFields.zipCode.addEventListener('input', (e) => {
      clearTimeout(timeoutCEP);
      timeoutCEP = setTimeout(() => controller.buscarCEP(e.target.value), 500);
    });

    document.getElementById('editPasswordBtn')?.addEventListener('click', () => {
      utils.mostrarElemento(elementos.popupSenha);
    });

    document.getElementById('deleteAccount')?.addEventListener('click', () => {
      utils.mostrarElemento(elementos.popupConfirmacao);
    });

    document.getElementById('closePasswordForm')?.addEventListener('click', () => {
      utils.ocultarElemento(elementos.popupSenha);
    });

    document.getElementById('cancelDelete')?.addEventListener('click', () => {
      utils.ocultarElemento(elementos.popupConfirmacao);
    });

    document.getElementById('confirmDelete')?.addEventListener('click', () => {
      controller.excluirConta();
    });

    document.getElementById('cancelDeleteAddress')?.addEventListener('click', () => {
      utils.ocultarElemento(elementos.popupConfirmacaoEndereco);
    });

    document.querySelectorAll('.toggle-password').forEach(icon => {
      icon.addEventListener('click', () => {
        const inputId = icon.getAttribute('data-toggle');
        utils.togglePasswordVisibility(inputId);
      });
    });

    // Expor funções necessárias globalmente
    window.enderecoManager = enderecoManager;
    window.utils = utils;
  };

  init();
});