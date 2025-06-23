/*
 * Serviço de API para integração com o backend
 * 
 * Observações importantes:
 * 1. Para os métodos diferentes de:
 *    - autenticacao
 *    - cadastroUsuario
 *    - enviarEmailRecuperacao
 *    - redefinirSenha
 *    é necessário enviar o token guardado no usuário do localStorage
 * 
 * 2. Todas as requisições seguem o padrão:
 *    - Headers com Content-Type: application/json
 *    - Tratamento de erros uniforme
 *    - Retorno padronizado
 */

/**
 * Formata uma data para garantir o padrão DD/MM/AAAA
 * @param {string} dataStr - Data em qualquer formato
 * @returns {string} Data formatada como DD/MM/AAAA
 */
function formatarData(dataStr) {
  if (!dataStr) return '';

  // Se já estiver no formato DD/MM/AAAA, retorna como está
  if (dataStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    return dataStr;
  }

  // Se estiver no formato ISO (2025-05-06T03:30:13.855392Z)
  if (dataStr.includes('T')) {
    const dataParte = dataStr.split('T')[0];
    const [ano, mes, dia] = dataParte.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  // Se não reconhecer o formato, retorna o original
  return dataStr;
}

/**
 * Obtém o token do usuário armazenado no localStorage
 * @returns {string} Token de autenticação
 */
function pegarToken() {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  return usuario.token;
}

/**
 * Verifica se o usuário é administrador
 * @returns {boolean} True se o usuário é admin
 */
function isAdmin() {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  return usuario.admin;
}

/**
 * Obtém o ID do usuário armazenado no localStorage
 * @returns {string} ID do usuário
 */
function pegarIdUsuario() {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  return usuario.id;
}

const ApiService = {
  // ==================================================
  // AUTENTICAÇÃO E CADASTRO
  // ==================================================

  /**
   * Autentica um usuário no sistema
   * @param {Object} credenciais - Email e senha do usuário
   * @returns {Object} Dados do usuário autenticado
   * @throws {Error} Credenciais inválidas ou erro na requisição
   */
  autenticar: async (credenciais) => {
    try {
      const resposta = await fetch('https://giostriconstrucoes.onrender.com/giostri/usuario/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(credenciais),
      });

      if (!resposta.ok) throw new Error("Erro na requisição");

      const dados = await resposta.json();

      if (dados?.success) {
        localStorage.setItem('usuario', JSON.stringify(dados.usuario));
        return dados.usuario;
      }

      throw new Error("Credenciais inválidas");
    } catch (erro) {
      localStorage.removeItem("usuario");
      throw erro;
    }
  },

  /**
   * Cadastra um novo usuário no sistema
   * @param {Object} dadosUsuario - Dados do usuário para cadastro
   * @returns {Object} Resposta da API
   * @throws {Error} Erro ao registrar usuário
   */
  cadastrarUsuario: async (dadosUsuario) => {
    const resposta = await fetch('https://giostriconstrucoes.onrender.com/giostri/usuario/registrar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(dadosUsuario)
    });

    if (!resposta.ok) {
      let mensagemErro;
      try {
        const erroJson = await resposta.json();
        mensagemErro = erroJson.message;
      } catch {
        mensagemErro = await resposta.text();
      }
      throw new Error(mensagemErro || "Erro ao registrar usuário");
    }

    return await resposta.json();
  },

  // ==================================================
  // RECUPERAÇÃO DE SENHA
  // ==================================================

  /**
   * Envia e-mail de recuperação de senha
   * @param {string} email - Email do usuário
   * @throws {Error} Erro ao enviar e-mail
   */
  enviarEmailRecuperacao: async (email) => {
    const resposta = await fetch(
      "https://giostriconstrucoes.onrender.com/giostri/usuario/recuperar-senha",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email })
      }
    );

    if (!resposta.ok) {
      throw new Error(await resposta.text() || "Erro ao enviar e-mail");
    }
  }
  ,

  /**
   * Redefine a senha do usuário
   * @param {string} email - Email do usuário
   * @param {string} novaSenha - Nova senha
   * @returns {boolean} True se a operação foi bem sucedida
   * @throws {Error} Erro ao alterar senha
   */
  redefinirSenha: async (email, novaSenha) => {
    const payload = {
      email: email,
      senha: novaSenha
    };

    const resposta = await fetch(
      "https://giostriconstrucoes.onrender.com/giostri/usuario/redefinir-senha",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    );

    let dados = {};
    try {
      dados = await resposta.json();
    } catch (e) {
      throw new Error("Resposta inválida do servidor.");
    }

    if (!resposta.ok || dados.success === false) {
      const mensagem = dados?.message || "Erro desconhecido ao alterar senha.";
      throw new Error(mensagem);
    }

    return dados;
  },

  // ==================================================
  // GERENCIAMENTO DE USUÁRIO
  // ==================================================

  /**
   * Atualiza dados do usuário
   * @param {Object} dadosUsuario - Novos dados do usuário
   * @returns {Object} Dados atualizados do usuário
   * @throws {Error} Erro ao atualizar usuário
   */
  atualizarUsuario: async (dadosUsuario) => {
    const resposta = await fetch(
      "https://giostriconstrucoes.onrender.com/giostri/usuario/alterar-dados-usuario",
      {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${pegarToken()}`
        },
        body: JSON.stringify(dadosUsuario)
      }
    );

    if (!resposta.ok) throw new Error("Erro ao atualizar usuário");

    const dados = await resposta.json();

    localStorage.setItem('usuario', JSON.stringify(dados.usuario));

    return dados;
  },

  /**
   * Altera a senha do usuário logado
   * @param {string} usuarioId - ID do usuário
   * @param {string} senhaAtual - Senha atual
   * @param {string} novaSenha - Nova senha
   * @returns {Object} Resposta da API
   * @throws {Error} Senha atual incorreta ou erro na requisição
   */
  alterarSenhaUsuario: async (usuarioId, senhaAtual, novaSenha) => {
    const resposta = await fetch(
      "https://giostriconstrucoes.onrender.com/giostri/usuario/alterar-senha-usuario",
      {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${pegarToken()}`
        },
        body: JSON.stringify({
          id: usuarioId,
          senhaAtual,
          novaSenha
        })
      }
    );

    if (!resposta.ok) {
      const erro = await resposta.json();
      throw new Error(erro.message || "Senha atual incorreta");
    }
    return await resposta.json();
  },

  /**
   * Exclui um usuário
   * @param {string} usuarioId - ID do usuário a ser excluído
   * @throws {Error} Erro ao excluir usuário
   */
  excluirUsuario: async (usuarioId) => {
    const resposta = await fetch(
      `https://giostriconstrucoes.onrender.com/giostri/usuario/deletar-usuario?id=${usuarioId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${pegarToken()}`
        }
      }
    );

    if (!resposta.ok) {
      throw new Error(await resposta.text() || "Erro ao excluir usuário");
    }
  },

  // ==================================================
  // ENDEREÇOS DO USUÁRIO
  // ==================================================

  /**
   * Adiciona um novo endereço para o usuário
   * @param {string} usuarioId - ID do usuário
   * @param {Object} endereco - Dados do endereço
   * @returns {Object} Endereço criado
   * @throws {Error} Falha ao adicionar endereço
   */
  adicionarEndereco: async (usuarioId, endereco) => {
    const enderecoAtualizado = {
      id: "",
      cep: endereco.cep,
      logradouro: endereco.logradouro,
      numero: endereco.numero,
      complemento: endereco.complemento,
      bairro: endereco.bairro,
      cidade: endereco.cidade,
      uf: endereco.uf
    }

    const resp = {
      usuarioId: usuarioId,
      endereco: enderecoAtualizado
    }

    const resposta = await fetch("https://giostriconstrucoes.onrender.com/giostri/usuario/salvar-endereco", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        'Authorization': `Bearer ${pegarToken()}`
      },
      body: JSON.stringify(resp)
    })
      .then(async (res) => {
        if (!res.ok) {
          const erro = await res.json();
          console.error("Erro do backend:", erro.message || "Erro desconhecido");
          throw new Error(erro.message || "Erro desconhecido");
        }



        const dados = res.json();

        localStorage.setItem('usuario', JSON.stringify(dados.usuario));

        return dados;
      })
      .then(data => {
        console.log("Endereço salvo com sucesso:", data);
      })
      .catch(error => {
        console.error("Erro ao salvar endereço:", error.message);
      });

    if (!resposta.ok) throw new Error("Falha ao adicionar endereço");
    return await resposta.json();
  },

  /**
   * Atualiza um endereço existente
   * @param {string} usuarioId - ID do usuário
   * @param {Object} endereco - Dados atualizados do endereço
   * @returns {Object} Endereço atualizado
   * @throws {Error} Falha ao atualizar endereço
   */
  atualizarEndereco: async (usuarioId, enderecoId, endereco) => {
  const enderecoAtualizado = {
    id: enderecoId,
    cep: endereco.cep,
    logradouro: endereco.logradouro,
    numero: endereco.numero,
    complemento: endereco.complemento,
    bairro: endereco.bairro,
    cidade: endereco.cidade,
    uf: endereco.uf
  };

  const resp = {
    usuarioId: usuarioId,
    endereco: enderecoAtualizado
  };

  try {
    const res = await fetch("https://giostriconstrucoes.onrender.com/giostri/usuario/salvar-endereco", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        'Authorization': `Bearer ${pegarToken()}`
      },
      body: JSON.stringify(resp)
    });

    if (!res.ok) {
      const erro = await res.json();
      console.error("Erro do backend:", erro.message || "Erro desconhecido");
      throw new Error(erro.message || "Erro desconhecido");
    }

    const dados = await res.json();
    localStorage.setItem('usuario', JSON.stringify(dados.usuario));
    console.log("Endereço salvo com sucesso:", dados);

    return dados;

  } catch (error) {
    console.error("Erro ao salvar endereço:", error.message);
    throw error;
  }
},


  /**
   * Remove um endereço do usuário
   * @param {string} enderecoId - ID do endereço a ser removido
   * @returns {boolean} True se a operação foi bem sucedida
   * @throws {Error} Falha ao remover endereço
   */
  excluirEndereco: async (enderecoId) => {
    try {
      const resposta = await fetch(
        `https://giostriconstrucoes.onrender.com/giostri/usuario/remover-endereco?id=${enderecoId}`,
        {
          method: "DELETE",
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${pegarToken()}`
          }
        }
      );

      const respostaJson = await resposta.json();

      localStorage.setItem('usuario', JSON.stringify(dados.usuario));

      if (!resposta.ok) {
        throw new Error(respostaJson.message || "Falha ao remover endereço");
      }

      console.log("Endereço excluído com sucesso:", respostaJson.message);
      return true;
    } catch (error) {
      console.error("Erro ao excluir endereço:", error.message);
      return false;
    }
  },

  // ==================================================
  // PRODUTOS
  // ==================================================

  /**
   * Adiciona um novo produto
   * @param {Object} product - Dados do produto
   * @returns {boolean} True se a operação foi bem sucedida
   * @throws {Error} Falha ao adicionar produto
   */
  adicionarProduto: async (product) => {
    const produto = {
      id: "",
      nome: product.nome,
      preco: product.preco,
      categoria: product.categoria,
      descricao: product.descricao,
      quantidadeEmEstoque: product.quantidadeEmEstoque,
      url: product.URL
    };

    console.log(produto)

    const resposta = await fetch(
      `https://giostriconstrucoes.onrender.com/giostri/produto/add`,
      {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${pegarToken()}`
        },
        body: JSON.stringify(produto)
      }
    );

    if (!resposta.ok) {
      console.log(resposta.text())
      throw new Error("Falha ao adicionar produto.");
    }
    return resposta.ok;
  },

  /**
   * Lista todos os produtos
   * @returns {Array} Lista de produtos
   * @throws {Error} Falha ao buscar a lista de produtos
   */
  listarProdutos: async () => {
    try {
      const resposta = await fetch(`https://giostriconstrucoes.onrender.com/giostri/produto/all`, {
        method: "GET",
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!resposta.ok) {
        const erro = await resposta.text();
        throw new Error(erro || "Falha ao buscar produtos");
      }

      const dados = await resposta.json();

      if (!Array.isArray(dados)) {
        throw new Error("Formato de dados inválido: esperado array de produtos");
      }

      const produtosValidados = dados.map(produto => {
        return {
          id: produto.id || '',
          nome: produto.nome || 'Sem nome',
          preco: produto.preco || 0,
          categoria: produto.categoria || 'Outros',
          descricao: produto.descricao || '',
          quantidadeEmEstoque: produto.quantidadeEmEstoque || 0,
          url: produto.url || null
        };
      });

      return produtosValidados;
    } catch (erro) {
      console.error("Erro ao listar produtos:", erro);
      throw erro;
    }
  },

  /**
   * Busca um produto por ID
   * @param {number} id - ID do produto
   * @returns {Object} Dados do produto
   * @throws {Error} Falha ao buscar produto ou produto não encontrado
   */
  buscarProdutoPorId: async (id) => {
    try {
      const resposta = await fetch(`https://giostriconstrucoes.onrender.com/giostri/produto/${id}`, {
        method: "GET",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${pegarToken()}`
        }
      });

      if (!resposta.ok) {
        if (resposta.status === 404) {
          throw new Error("Produto não encontrado");
        }
        const erro = await resposta.text();
        throw new Error(erro || "Falha ao buscar produto");
      }

      const produto = await resposta.json();

      console.log(produto)

      // Valida campos obrigatórios
      return {
        id: produto.id || '',
        nome: produto.nome || 'Sem nome',
        preco: produto.preco || 0,
        categoria: produto.categoria || 'Outros',
        descricao: produto.descricao || '',
        quantidadeEmEstoque: produto.quantidadeEmEstoque || 0,
        url: produto.url || null
      };
    } catch (erro) {
      console.error("Erro ao buscar produto:", erro);
      throw erro;
    }
  },

  /**
   * Deleta um produto por ID
   * @param {number} id - ID do produto
   * @returns {boolean} True se a operação foi bem sucedida
   * @throws {Error} Falha ao deletar produto ou produto não encontrado
   */
  deletarProduto: async (id) => {
    try {
      const resposta = await fetch(`https://giostriconstrucoes.onrender.com/giostri/produto/delete/${id}`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${pegarToken()}`
        }
      });

      if (!resposta.ok) {
        if (resposta.status === 404) {
          throw new Error("Produto não encontrado");
        }
        const erro = await resposta.text();
        throw new Error(erro || "Falha ao deletar produto");
      }

      return true;
    } catch (erro) {
      console.error("Erro ao deletar produto:", erro);
      throw erro;
    }
  },

  /**
   * Atualiza um produto existente
   * @param {number} id - ID do produto
   * @param {Object} product - Dados do produto
   * @returns {Object} Resposta da API
   * @throws {Error} Falha ao atualizar produto ou produto não encontrado
   */
  atualizarProduto: async (id, product) => {
    try {
      const resposta = await fetch(
        `https://giostriconstrucoes.onrender.com/giostri/produto/update/${id}`,
        {
          method: "PUT",
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${pegarToken()}`,
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            id: id,
            nome: product.nome,
            preco: product.preco,
            categoria: product.categoria,
            descricao: product.descricao,
            quantidadeEmEstoque: product.quantidadeEmEstoque,
            url: product.URL
          })
        }
      );

      const responseText = await resposta.text();

      let responseData;
      try {
        responseData = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        responseData = { message: responseText };
      }

      if (!resposta.ok) {
        throw new Error(responseData.message || "Falha ao atualizar produto");
      }

      return responseData;
    } catch (erro) {
      console.error("Erro ao atualizar produto:", erro);
      throw erro;
    }
  },

  /**
   * Favorita um produto para o usuário
   * @param {string} usuarioId - ID do usuário
   * @param {string} produtoId - ID do produto
   * @returns {Object} Resposta da API
   * @throws {Error} Falha ao favoritar produto
   */
  favoritarProduto: async (usuarioId, produtoId) => {
    try {
      const token = pegarToken();
      if (!token) {
        throw new Error("Token de autenticação não disponível");
      }

      const resposta = await fetch(
        `https://giostriconstrucoes.onrender.com/giostri/favoritos/favoritar`,
        {
          method: "PUT",
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            usuarioID: usuarioId,
            produtoID: produtoId
          })
        }
      );

      if (resposta.status === 403) {
        // Token pode ser inválido - forçar novo login
        localStorage.removeItem("usuario");
        window.location.href = "/paginas/telaDeLogin.html";
        throw new Error("Acesso negado - faça login novamente");
      }

      if (!resposta.ok) {
        const erroTexto = await resposta.text();
        throw new Error(erroTexto || "Falha ao favoritar produto");
      }

      return resposta.status === 204 ? {} : await resposta.json();
    } catch (erro) {
      console.error("Erro ao favoritar produto:", erro);
      throw erro;
    }
  },

  /**
   * Remove um produto dos favoritos do usuário
   * @param {string} usuarioId - ID do usuário
   * @param {string} produtoId - ID do produto
   * @returns {Object} Resposta da API
   * @throws {Error} Falha ao desfavoritar produto
   */
  desfavoritarProduto: async (usuarioId, produtoId) => {
    try {
      const token = pegarToken();
      if (!token) {
        throw new Error("Token de autenticação não disponível");
      }

      const resposta = await fetch(
        `https://giostriconstrucoes.onrender.com/giostri/favoritos/desfavoritar`,
        {
          method: "PUT",
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            usuarioID: usuarioId,
            produtoID: produtoId
          })
        }
      );

      if (resposta.status === 403) {
        // Token inválido - forçar novo login
        localStorage.removeItem("usuario");
        window.location.href = "/paginas/telaDeLogin.html";
        throw new Error("Acesso negado - faça login novamente");
      }

      if (!resposta.ok) {
        const erroTexto = await resposta.text();
        throw new Error(erroTexto || "Falha ao desfavoritar produto");
      }

      return resposta.status === 204 ? {} : await resposta.json();
    } catch (erro) {
      console.error("Erro ao desfavoritar produto:", erro);
      throw erro;
    }
  },

  /**
   * Busca produtos favoritados pelo usuário
   * @param {string} usuarioId - ID do usuário
   * @returns {Array} Lista de produtos favoritos
   * @throws {Error} Falha ao buscar produtos favoritos
   */
  buscarProdutosFavoritados: async (usuarioId) => {
    try {
      const token = pegarToken();
      if (!token) throw new Error("Token de autenticação não disponível");

      const resposta = await fetch(
        `https://giostriconstrucoes.onrender.com/giostri/favoritos/produtosFavoritos?id=${usuarioId}`,
        {
          method: "GET",
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }
      );

      if (resposta.status === 403) {
        localStorage.removeItem("usuario");
        window.location.href = "/paginas/telaDeLogin.html";
        throw new Error("Acesso negado - faça login novamente");
      }

      if (resposta.status === 204) {
        return []; // Nenhum produto favoritado
      }

      if (!resposta.ok) {
        const erroTexto = await resposta.text();
        throw new Error(erroTexto || "Erro ao buscar produtos favoritos");
      }

      return await resposta.json(); // Lista de ProdutoDTO
    } catch (erro) {
      console.error("Erro ao buscar produtos favoritos:", erro);
      throw erro;
    }
  },

  // ==================================================
  // CARRINHO DE COMPRAS
  // ==================================================

  /**
   * Adiciona produto ao carrinho
   * @param {string} produtoId - ID do produto
   * @param {string} usuarioId - ID do usuário
   * @param {number} quantidade - Quantidade do produto
   * @returns {Object} Resposta da API
   * @throws {Error} Falha ao adicionar ao carrinho
   */
  enviarParaCarrinho: async (produtoId, usuarioId, quantidade) => {
    try {
      const token = pegarToken();
      if (!token) throw new Error("Token de autenticação não disponível");

      const item = {
        produtoId: String(produtoId),
        usuarioId: String(usuarioId),
        quantidade: String(quantidade)
      };

      console.log(item)

      const resposta = await fetch(
        `https://giostriconstrucoes.onrender.com/giostri/carrinho/enviar`,
        {
          method: "POST",
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(item)
        }
      );

      if (!resposta.ok) {
        const erroTexto = await resposta.text();
        throw new Error(erroTexto || "Erro ao enviar para o carrinho");
      }

      return await resposta.json(); // Lista de ProdutoDTO
    } catch (erro) {
      console.error("Erro ao enviar para o carrinho: ", erro);
      throw erro;
    }
  },

  /**
   * Busca itens do carrinho do usuário
   * @param {string} usuarioId - ID do usuário
   * @returns {Array} Itens do carrinho
   * @throws {Error} Falha ao buscar carrinho
   */
  buscarCarrinho: async (usuarioId) => {
    try {
      const token = pegarToken();
      if (!token) throw new Error("Token de autenticação não disponível");

      const resposta = await fetch(
        `https://giostriconstrucoes.onrender.com/giostri/carrinho/itensCarrinho/${usuarioId}`,
        {
          method: "GET",
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }
      );

      if (resposta.status === 204) {
        return []; // Nenhum produto no carrinho
      }

      if (!resposta.ok) {
        const erroTexto = await resposta.text();
        throw new Error(erroTexto || "Erro ao buscar carrinho.");
      }

      // Armazena o resultado em uma variável antes de usar
      const dadosCarrinho = await resposta.json();
      return dadosCarrinho;

    } catch (erro) {
      console.error("Erro ao buscar carrinho.", erro);
      throw erro;
    }
  },

  /**
   * Atualiza item do carrinho
   * @param {Object} itemDTO - Dados do item do carrinho
   * @returns {Promise} Resposta da requisição
   */
  atualizarItemCarrinho: async (itemDTO) => {
    const token = pegarToken();

    const item = {
      id: String(itemDTO.id),
      quantidade: String(itemDTO.quantidade)
    };

    return await fetch(`https://giostriconstrucoes.onrender.com/giostri/carrinho/atualizarItem`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(item)
    });
  },

  /**
   * Remove item do carrinho
   * @param {string} produtoId - ID do produto
   * @returns {Promise} Resposta da requisição
   */
  removerItemCarrinho: async (produtoId) => {
    const token = pegarToken();
    return await fetch(`https://giostriconstrucoes.onrender.com/giostri/carrinho/removerItem/${produtoId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  /**
   * Finaliza o carrinho e cria um pedido
   * @param {string} desc - Descrição do pedido
   * @param {number} taxa - Taxa do pedido
   * @returns {Promise} Resposta da requisição
   */
  finalizarCarrinho: async (desc, taxa) => {
    const token = pegarToken();
    const usuarioId = pegarIdUsuario(); // deve ser só uma string ou número

    const response = {
      usuarioId: String(usuarioId),
      taxa: String(taxa),
      descricao: String(desc)
    };

    return await fetch(`https://giostriconstrucoes.onrender.com/giostri/carrinho/finalizarCarrinho`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' // importante: não é JSON
      },
      body: JSON.stringify(response)
    });
  },

  // ==================================================
  // PEDIDOS
  // ==================================================

  /**
   * Lista todos os pedidos
   * @returns {Array} Lista de pedidos
   * @throws {Error} Falha ao buscar pedidos
   */
  listarPedidos: async () => {
    try {
      const token = pegarToken();
      const resposta = await fetch('https://giostriconstrucoes.onrender.com/giostri/pedido', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!resposta.ok) {
        const erro = await resposta.text();
        throw new Error(erro || "Falha ao buscar pedidos");
      }

      const pedidos = await resposta.json();
      return pedidos.map(pedido => ({
        ...pedido,
        data: formatarData(pedido.data) // Apenas uma formatação
      }));
    } catch (erro) {
      console.error("Erro ao listar pedidos:", erro);
      throw erro;
    }
  },

  /**
   * Busca pedidos do usuário logado
   * @returns {Array} Lista de pedidos do usuário
   * @throws {Error} Falha ao buscar pedidos
   */
  buscarMeusPedidos: async () => {
    try {
      const token = pegarToken();
      const resposta = await fetch(`https://giostriconstrucoes.onrender.com/giostri/pedido/meusPedidos/${pegarIdUsuario()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!resposta.ok) {
        const erro = await resposta.text();
        throw new Error(erro || "Falha ao buscar seus pedidos");
      }

      return await resposta.json();
    } catch (erro) {
      console.error("Erro ao buscar pedidos do usuário:", erro);
      throw erro;
    }
  },

  /**
   * Busca um pedido por ID
   * @param {string} id - ID do pedido
   * @returns {Object} Dados do pedido
   * @throws {Error} Falha ao buscar pedido
   */
  buscarPedidoPorId: async (id) => {
    try {
      const token = pegarToken();
      const resposta = await fetch(`https://giostriconstrucoes.onrender.com/giostri/pedido/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!resposta.ok) {
        if (resposta.status === 404) {
          throw new Error("Pedido não encontrado");
        }
        const erro = await resposta.text();
        throw new Error(erro || "Falha ao buscar pedido");
      }

      const pedido = await resposta.json();
      return {
        ...pedido,
        data: formatarData(formatarData(pedido.data))
      };
    } catch (erro) {
      console.error("Erro ao buscar pedido:", erro);
      throw erro;
    }
  },

  /**
   * Lista produtos de um pedido
   * @param {string} id - ID do pedido
   * @returns {Array} Lista de produtos do pedido
   * @throws {Error} Falha ao buscar produtos do pedido
   */
  listarProdutosDoPedido: async (id) => {
    try {
      const token = pegarToken();
      const resposta = await fetch(`https://giostriconstrucoes.onrender.com/giostri/pedido/todosProdutos/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!resposta.ok) {
        const erro = await resposta.text();
        throw new Error(erro || "Falha ao buscar produtos do pedido");
      }

      return await resposta.json();
    } catch (erro) {
      console.error("Erro ao listar produtos do pedido:", erro);
      throw erro;
    }
  },

  /**
   * Atualiza status de um pedido
   * @param {string} id - ID do pedido
   * @param {string} status - Novo status
   * @returns {Object} Resposta da API
   * @throws {Error} Falha ao atualizar status
   */
  atualizarStatusPedido: async (id, status) => {
    try {
      const token = pegarToken();
      const resposta = await fetch(`https://giostriconstrucoes.onrender.com/giostri/pedido/update/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: String(status)
      });

      if (!resposta.ok) {
        const erro = await resposta.text();
        throw new Error(erro || "Falha ao atualizar status do pedido");
      }

      return await resposta.json();
    } catch (erro) {
      console.error("Erro ao atualizar status do pedido:", erro);
      throw erro;
    }
  },

  /**
   * Verifica se usuário é admin
   * @returns {boolean} True se usuário é admin
   */
  isAdmin() {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    return usuario.admin;
  },

  // ==================================================
  // PAGAMENTOS
  // ==================================================

  /**
   * Processa pagamento com cartão
   * @param {Object} dadosPagamento - Dados do pagamento
   * @returns {Object} Resposta da API
   * @throws {Error} Falha ao processar pagamento
   */
  processarPagamentoCartao: async (dadosPagamento) => {
    try {
      // Validação reforçada para débito
      if (dadosPagamento.metodoPagamento === 'debit_card') {
        const bandeirasPermitidas = ['visa', 'master', 'elo'];
        if (!bandeirasPermitidas.includes(dadosPagamento.bandeira)) {
          throw new Error(`Bandeira ${dadosPagamento.bandeira} não é aceita para débito. Use: ${bandeirasPermitidas.join(', ')}`);
        }

        if (dadosPagamento.parcelas > 1) {
          throw new Error('Pagamento com débito não pode ser parcelado');
        }
      }

      console.log("Dados enviados:", dadosPagamento);
      const resposta = await fetch('https://giostriconstrucoes.onrender.com/giostri/pagamento/cartao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${pegarToken()}`
        },
        body: JSON.stringify(dadosPagamento)
      });

      if (!resposta.ok) {
        const erro = await resposta.json();
        throw new Error(erro.mensagem || 'Erro ao processar pagamento');
      }

      return await resposta.json();
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      throw error;
    }
  },

  /**
   * Realiza pagamento via PIX
   * @param {Object} dadosPix - Dados do pagamento PIX
   * @returns {Object} Dados do pagamento PIX
   * @throws {Error} Falha ao processar pagamento PIX
   */
  pagarComPix: async (dadosPix) => {
    try {
      const resposta = await fetch("https://giostriconstrucoes.onrender.com/giostri/pagamento/pix", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${pegarToken()}`
        },
        body: JSON.stringify(dadosPix)
      });

      if (!resposta.ok) {
        const erro = await resposta.json();
        throw new Error(erro.mensagem || "Erro ao processar pagamento PIX");
      }

      return await resposta.json();
    } catch (error) {
      console.error("Erro no pagamento PIX:", error);
      throw error;
    }
  }, relatorioVendas: async () => {
    try {
      const resposta = await fetch("https://giostriconstrucoes.onrender.com/giostri/relatorio/vendas", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${pegarToken()}`
        }
      });

      if (!resposta.ok) {
        const erro = await resposta.text();
        throw new Error(erro || "Erro ao processar relatório de vendas.");
      }

      const blob = await resposta.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (error) {
      console.error("Erro no relatório de vendas:", error);
    }
  },
  relatorioEstoque: async () => {
    try {
      const resposta = await fetch("https://giostriconstrucoes.onrender.com/giostri/relatorio/estoque", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${pegarToken()}`
        }
      });

      if (!resposta.ok) {
        const erro = await resposta.text();
        throw new Error(erro || "Erro ao processar relatório de estoque.");
      }

      const blob = await resposta.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (error) {
      console.error("Erro no relatório de estoque:", error);
    }
  },
  relatorioUsuarios: async () => {
    try {
      const resposta = await fetch("https://giostriconstrucoes.onrender.com/giostri/relatorio/usuarios", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${pegarToken()}`
        }
      });

      if (!resposta.ok) {
        const erro = await resposta.text();
        throw new Error(erro || "Erro ao processar relatório de usuários.");
      }

      const blob = await resposta.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (error) {
      console.error("Erro no relatório de usuários:", error);
    }
  }

};
