# Giostri Frontend

Frontend do sistema Giostri Materiais para Construção.

## 🚀 Deploy no Vercel

Este projeto está configurado para deploy no Vercel. Todas as correções necessárias foram aplicadas:

### ✅ Correções Aplicadas

1. **Imports CSS corrigidos**: Todos os imports relativos nos arquivos CSS dos componentes foram corrigidos para usar `../cores.css`
2. **Links HTML padronizados**: Todos os links CSS, JS e imagens agora usam caminhos absolutos começando com `/`
3. **Links de navegação corrigidos**: Todos os links entre páginas foram padronizados para usar caminhos absolutos
4. **Configuração Vercel**: Arquivo `vercel.json` criado com configurações otimizadas

### 📁 Estrutura do Projeto

```
GiostriFront/
├── assets/
│   ├── css/
│   │   ├── componentes/
│   │   │   ├── header-componente.css
│   │   │   ├── sidebar-componente.css
│   │   │   └── footer-componente.css
│   │   ├── cores.css
│   │   └── style-*.css
│   ├── js/
│   │   ├── componentes/
│   │   ├── requisicoes/
│   │   └── script-*.js
│   └── img/
├── componentes/
├── paginas/
├── index.html
└── vercel.json
```

### 🔧 Como Fazer Deploy

1. **Conecte seu repositório ao Vercel**:
   - Acesse [vercel.com](https://vercel.com)
   - Faça login e conecte seu repositório GitHub/GitLab
   - Selecione este projeto

2. **Configurações automáticas**:
   - O Vercel detectará automaticamente que é um projeto estático
   - O arquivo `vercel.json` já está configurado

3. **Deploy**:
   - O Vercel fará o deploy automaticamente
   - Cada push para a branch principal gerará um novo deploy

### 🌐 URLs dos Arquivos

Todos os arquivos agora usam caminhos absolutos:
- CSS: `/assets/css/style-*.css`
- JS: `/assets/js/script-*.js`
- Imagens: `/assets/img/*`
- Páginas: `/paginas/*.html`

### 📱 Funcionalidades

- ✅ Sistema de login e cadastro
- ✅ Listagem de produtos
- ✅ Carrinho de compras
- ✅ Favoritos
- ✅ Gerenciamento de pedidos
- ✅ Perfil do usuário
- ✅ Responsivo para mobile

### 🛠️ Tecnologias

- HTML5
- CSS3 (com variáveis CSS)
- JavaScript (Vanilla)
- Font Awesome (ícones)
- Google Fonts (Inter, Open Sans)

### 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.