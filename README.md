# 🕹️ SaveState Market // NULL//EXCHANGE

> **Plataforma P2P e marketplace descentralizado para compra, venda e negociação de mídias físicas retrô e clássicas.**

Projeto desenvolvido para a disciplina de Programação Web, integrando uma arquitetura moderna baseada em **React**, estilização utilitária com **Tailwind CSS**, abordagem **Mobile-First** e persistência de dados via API REST simulada com **JSON Server**.

---

## 🎯 Sobre o Projeto

O **SaveState Market** (codinome de interface *NULL//EXCHANGE*) é uma aplicação web interativa focada no público colecionador de consoles antigos e jogos clássicos. O visual da plataforma adota a estética *neo-noir / cyberpunk*, incorporando linhas de varredura CRT (*scanlines*), efeitos de brilho em neon e cortes angulares nos elementos da interface.

### Principais Recursos
- **Catálogo Interativo (Market Feed):** Listagem dinâmica com filtros instantâneos por mídia (Cartuchos, Discos Ópticos, Plataformas específicas) e busca textual por títulos ou identificadores.
- **Dossiê do Operador (Profile & Reviews):** Perfil de usuário com histórico de transações, métricas de sucesso, inventário em tempo real e sistema relacional de reputação com suporte a atualização de logs existentes.
- **Diagnóstico & Cadastro de Mídias (Drop Asset):** Formulário de publicação com validação de conservação física (box, manual e funcionalidade) e processamento/compressão de imagem em canvas client-side.
- **Mesa de Negociação (Negotiation Desk):** Sistema de contrapropostas com cálculo de desconto automático, simulador de propostas e protocolos de troca P2P.
- **Protocolo de Suporte (Dispatch Ticket):** Central de atendimento ao consumidor para relato de divergências de hardware ou mediação de custódia.
- **Benchmark de Preço:** Estimativa comparativa em tempo real entre o valor da mídia física anunciada e a cotação digital.

---

## 🛠️ Tecnologias Utilizadas

| Camada | Tecnologia | Finalidade |
| :--- | :--- | :--- |
| **Frontend Core** | [React 18](https://react.dev/) | Biblioteca para construção da interface declarativa em componentes |
| **Build Tool** | [Vite](https://vitejs.dev/) | Ferramenta de build rápida com suporte a Hot Module Replacement (HMR) |
| **Roteamento** | [React Router DOM v6](https://reactrouter.com/) | Gerenciamento de rotas e navegação client-side (SPA) |
| **Estilização** | [Tailwind CSS v3](https://tailwindcss.com/) | Framework CSS utilitário para design responsivo e customização de tema |
| **Gerenciamento de Estado** | React Context API | Controle global de autenticação de operadores e persistência local |
| **Backend Mock** | [JSON Server](https://github.com/typicode/json-server) | Emulação de API REST com suporte a operações CRUD (`GET`, `POST`, `PATCH`) |
| **Concorrência** | [Concurrently](https://github.com/open-cli-tools/concurrently) | Execução simultânea do frontend e do servidor mock em um único terminal |

---

## 📂 Estrutura de Diretórios

```
SaveStateMarket/
├── db.json                 # Base de dados simulada para o JSON Server
├── index.html              # Ponto de entrada HTML do Vite
├── package.json            # Dependências e scripts do ecossistema Node.js
├── postcss.config.js       # Configuração do PostCSS para compilação do Tailwind
├── tailwind.config.js      # Paleta de cores neo-noir e tipografia customizada
├── vite.config.js          # Configurações do compilador Vite e plugins
└── src/
    ├── App.jsx             # Definição de rotas e providers globais
    ├── index.css           # Diretivas Tailwind e classes utilitárias CRT
    ├── main.jsx            # Ponto de inicialização do React DOM
    ├── components/         # Componentes compartilhados
    │   ├── CRTOverlay.jsx  # Efeito visual de tela e iluminação ambiente
    │   ├── Header.jsx      # Topbar modular adaptável por página
    │   └── Navbar.jsx      # Barra de navegação inferior (Mobile-First)
    ├── context/
    │   └── AuthContext.jsx # Provedor de contexto de sessão do operador
    └── pages/              # Páginas e fluxos da aplicação
        ├── AuthLogin.jsx
        ├── DropAsset.jsx
        ├── MarketFeed.jsx
        ├── NegotiationDesk.jsx
        ├── OperativeProfile.jsx
        ├── ProductDetails.jsx
        ├── SupportTicket.jsx
        └── SystemGuide.jsx
```

---

## 🚀 Como Executar a Aplicação

### Pré-requisitos
Certifique-se de possuir o [Node.js](https://nodejs.org/) (versão 18 ou superior) instalado em seu ambiente.

### 1. Clonar ou Baixar o Repositório
```bash
git clone [https://github.com/seu-usuario/SaveStateMarket.git](https://github.com/seu-usuario/SaveStateMarket.git)
cd SaveStateMarket
```

### 2. Instalar as Dependências
Na raiz do projeto, instale os pacotes definidos no `package.json`:
```bash
npm install
```

### 3. Executar o Servidor Mock e o Frontend
Para rodar a API REST (`json-server`) e o servidor de desenvolvimento do Vite simultaneamente:
```bash
npm run full-dev
```

### 4. Acessar no Navegador
- **Interface Web (React/Vite):** [`http://localhost:5173`](http://localhost:5173)
- **API REST Mock (JSON Server):** [`http://localhost:3001`](http://localhost:3001)

> **Endpoints disponíveis na API:**
> - `GET / POST / PATCH` → `http://localhost:3001/products`
> - `GET / POST / PATCH` → `http://localhost:3001/profiles`
> - `GET / POST / PATCH` → `http://localhost:3001/profile_reviews`
> - `POST` → `http://localhost:3001/tickets`

---

## 👥 Equipe de Desenvolvimento

Projeto desenvolvido para fins acadêmicos como requisito de avaliação da disciplina de Programação Web:

- **Desenvolvedor 1** -  Luciano Mello
- **Desenvolvedor 2** -  Matheus Dinis
- **Desenvolvedor 3** -  Bernardo Borio

---

## 📜 Licença

Este projeto é de uso acadêmico e educacional, distribuído sob a licença **MIT**. Consulte o arquivo de licença para mais detalhes.
