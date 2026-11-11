# 🕹️ SaveState Market // NULL//EXCHANGE

> **Plataforma P2P e marketplace para compra, venda e negociação de mídias físicas retrô e clássicas.**

Projeto desenvolvido para a disciplina de Programação Web, com frontend em **React** + **Tailwind CSS** (abordagem **Mobile-First**) e uma **API REST própria em Node.js/Express**, com autenticação **JWT (Passport)**, validação com **Zod** e persistência em **PostgreSQL**.

---

## 🎯 Sobre o Projeto

O **SaveState Market** (codinome de interface *NULL//EXCHANGE*) é uma aplicação web focada no público colecionador de consoles antigos e jogos clássicos. O visual adota a estética *neo-noir / cyberpunk*, com linhas de varredura CRT (*scanlines*, que podem ser ligadas/desligadas), brilho em neon e cortes angulares nos elementos da interface.

### Principais Recursos
- **Cadastro e Login com JWT:** criação de conta com endereço de entrega, senha armazenada com hash bcrypt e token com validade de 1 hora.
- **Catálogo Interativo (Market Feed):** listagem de anúncios com filtros por mídia/plataforma e busca textual.
- **Publicação de Anúncios (Drop Asset):** escolha do jogo a partir do catálogo, diagnóstico de conservação (caixa, manual, funcionamento) e compressão de imagem no navegador. O anunciante pode editar e excluir os próprios anúncios.
- **Mesa de Negociação (Negotiation Desk):** propostas e contrapropostas entre comprador e vendedor, com chat por negociação (somente leitura após encerrada).
- **Carrinho e Checkout com PIX simulado:** o servidor calcula os valores e gera um código PIX “copia e cola” de demonstração. Ao aprovar o pagamento, os anúncios saem do catálogo e os vendedores são notificados.
- **Cancelamento de Entrega e Reembolso:** o vendedor pode cancelar a entrega; um reembolso PIX é gerado e a conta fica bloqueada para novas compras/anúncios até a quitação.
- **Dossiê do Operador (Perfil & Avaliações):** histórico de pedidos, inventário e reputação calculada a partir das avaliações.
- **Alertas de Preço por Título:** avisa quando surgir um anúncio do jogo desejado pelo preço-alvo ou menos.
- **Notificações:** geradas pelo servidor para propostas, vendas, avaliações, alertas e reembolsos.
- **Benchmark de Preço:** comparação do valor anunciado com a cotação digital (API CheapShark + câmbio USD→BRL), com cache de 24h.
- **Protocolo de Suporte (Tickets):** abertura de chamados, inclusive por visitantes.

---

## 🛠️ Tecnologias Utilizadas

| Camada | Tecnologia | Finalidade |
| :--- | :--- | :--- |
| **Frontend** | [React 18](https://react.dev/) + [Vite 5](https://vitejs.dev/) | Interface em componentes e servidor de desenvolvimento com HMR |
| **Roteamento** | [React Router](https://reactrouter.com/) | Navegação client-side (SPA) e rotas protegidas |
| **Dados no cliente** | [TanStack Query](https://tanstack.com/query) | Cache e sincronização das requisições à API |
| **Formulários** | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) | Formulários com validação no cliente |
| **Estilização** | [Tailwind CSS v3](https://tailwindcss.com/) | CSS utilitário e tema neo-noir customizado |
| **Estado global** | React Context API | Sessão, carrinho e efeito CRT |
| **Backend** | [Express 5](https://expressjs.com/) | API REST |
| **Autenticação** | [Passport](https://www.passportjs.org/) + `passport-jwt`, `jsonwebtoken`, `bcryptjs` | Login com JWT e hash de senhas |
| **Validação no servidor** | [Zod](https://zod.dev/) | A API valida todo corpo recebido |
| **Persistência** | PostgreSQL (`pg`) | Registros JSONB por coleção, acessados pela camada `server/store.js`; importa dados legados de `db.json` uma única vez |
| **Testes** | `node:test` | Testes de integração da API |
| **Concorrência** | [Concurrently](https://github.com/open-cli-tools/concurrently) | Sobe API e frontend em um único terminal |

---

## 📂 Estrutura de Diretórios

```
SaveStateMarket/
├── .env.example            # Modelo das variáveis de ambiente (copiar para .env)
├── db.json                 # Dados legados, importados uma única vez para o PostgreSQL
├── index.html              # Ponto de entrada HTML do Vite
├── package.json            # Dependências e scripts
├── postcss.config.js       # PostCSS para compilação do Tailwind
├── tailwind.config.js      # Paleta neo-noir e tipografia
├── vite.config.js          # Configuração do Vite
├── server/                 # API REST (Express)
│   ├── index.js            # Inicialização: carrega .env, roda a migração e sobe a API
│   ├── app.js              # Middlewares (CORS, JSON, Passport) e tratamento de erros
│   ├── auth.js             # Cadastro, login, JWT e perfis
│   ├── resources.js        # Anúncios, jogos, ofertas, mensagens, tickets, pedidos, reembolsos, denúncias...
│   ├── admin.js            # Rotas do administrador (/admin/*): tickets, reembolsos e denúncias
│   ├── schemas.js          # Validação Zod do lado do servidor
│   ├── store.js            # Camada de dados PostgreSQL e importação do JSON legado
│   ├── migrate.js          # Migrações idempotentes dos registros
│   ├── alerts.js           # Regras dos alertas de preço
│   ├── notify.js           # Criação de notificações
│   ├── pix.js              # Gerador de PIX simulado
│   ├── http.js             # Erros HTTP, filtros de consulta e helpers
│   └── tests/
│       └── api.test.mjs    # Testes de integração
└── src/                    # Frontend (React)
    ├── App.jsx             # Rotas e providers globais
    ├── config.js           # URL da API
    ├── components/         # Header, Navbar, CRTOverlay, RequireAuth, PriceBenchmark...
    ├── context/            # AuthContext, CartContext, CrtContext
    ├── hooks/              # Hooks de dados (useProducts, useOffers, useTickets...)
    ├── pages/              # Telas da aplicação
    ├── schemas/            # Schemas Zod dos formulários
    ├── services/           # Cliente da API, token, benchmark de preço
    └── utils/              # Formatação, endereço, PIX, alertas
```

---

## 🚀 Como Executar a Aplicação

### Pré-requisitos
- [Node.js](https://nodejs.org/) **20 ou superior** (o script da API usa `node --watch` e os testes usam `node --test`).
- npm (instalado junto com o Node.js).
- PostgreSQL 14 ou superior (local ou serviço gerenciado) e um banco criado para a aplicação.

### 1. Clonar o repositório
```bash
git clone <url-do-repositorio>
cd SaveStateMarket
```

### 2. Instalar as dependências
```bash
npm install
```

### 3. Configurar as variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto a partir do modelo `.env.example`:

```bash
# Linux / macOS / Git Bash
cp .env.example .env

# Windows (PowerShell)
Copy-Item .env.example .env
```

Configure `DATABASE_URL` no `.env` com a URL de conexão do PostgreSQL e defina um valor próprio para `SEGREDO` (pelo menos 32 caracteres; a API não sobe com o valor de exemplo). Para gerar o segredo:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

| Variável | Obrigatória | Padrão | Descrição |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | ✅ | — | URL de conexão PostgreSQL, por exemplo `postgresql://usuario:senha@localhost:5432/savestate_market`. |
| `SEGREDO` | ✅ | — | Segredo usado para assinar os tokens JWT. A API não inicia se ele faltar, for o valor de exemplo `troque-por-um-segredo` ou tiver menos de 32 caracteres. |
| `PORT` | | `3001` | Porta da API. |
| `CORS_ORIGIN` | | `http://localhost:5173` | Origem do frontend autorizada a chamar a API. |
| `DB_PATH` | | `db.json` | Caminho do JSON legado a importar na primeira inicialização. Depois da importação, o backend usa somente o PostgreSQL. |

> Se mudar a porta da API, atualize também `API_URL` em `src/config.js`.

### 4. Subir a API e o frontend
Para rodar os dois juntos em um único terminal:
```bash
npm run full-dev
```

Ou, se preferir, em dois terminais separados:
```bash
npm run server   # API Express em http://localhost:3001 (reinicia ao salvar arquivos)
npm run dev      # Frontend Vite em http://localhost:5173
```

Na primeira execução, a API cria as tabelas necessárias e importa os dados de `db.json` (se o arquivo existir). A importação é registrada e não se repete; as migrações de dados existentes, como hashes de senha, são aplicadas em seguida. Faça backup do banco antes de iniciar uma migração em produção.

### 5. Acessar no navegador
- **Interface Web:** [`http://localhost:5173`](http://localhost:5173)
- **API REST:** [`http://localhost:3001`](http://localhost:3001) (responde `{"api":"SaveState Market","status":"online"}`)

Crie uma conta em **/cadastrar** e depois entre em **/entrar** para usar as áreas protegidas (vender, negociar, checkout e notificações).

### Outros scripts
| Comando | Descrição |
| :--- | :--- |
| `npm test` | Executa os testes de integração; requer `TEST_DATABASE_URL` apontando para um banco PostgreSQL descartável. Os testes criam e removem schemas isolados. |
| `npm run build` | Gera o build de produção do frontend em `dist/`. |

No PowerShell, configure a URL do banco exclusivo para testes antes de executar a suíte:
```powershell
$env:TEST_DATABASE_URL = "postgresql://usuario:senha@localhost:5432/savestate_market_test"
npm test
```

---

## 🔌 Endpoints da API

Rotas marcadas com 🔒 exigem o cabeçalho `Authorization: Bearer <token>`. As rotas de listagem aceitam filtros `?campo=valor`, além de `_sort`, `_order` e `_limit`.

| Recurso | Endpoints |
| :--- | :--- |
| **Autenticação** | `POST /usuarios` (cadastro; senha de 8 a 72 bytes; 10 cadastros por IP por hora, depois `429`) · `POST /login` (após 5 falhas em 15 min para o mesmo IP + e-mail, ou 20 falhas do mesmo IP em qualquer e-mail, responde `429`) · 🔒 `GET/PATCH /usuarios/me` (`avatar_url` só `http(s)` ou `data:image/png\|jpeg\|webp\|gif;base64`, até 1,5 MB) · 🔒 `PATCH /usuarios/me/senha` (`{ current_password, new_password }`, nova com 8 a 72 bytes e diferente da atual; senha atual errada → `400` com `field: "current_password"`; 5 tentativas por usuário em 15 min, depois `429`; responde `{ message, token }` e **revoga todos os tokens anteriores**) |
| **Perfis públicos** | `GET /usuarios` · `GET /profiles` · `GET /profiles/:id` · 🔒 `PATCH /profiles/:id` (só o próprio) |
| **Anúncios** | `GET /products` · `GET /products/:id` · 🔒 `POST /products` (`game_id` do catálogo obrigatório; título e plataforma vêm do jogo; `image_url` com a mesma regra do `avatar_url`) · 🔒 `PATCH/DELETE /products/:id` (só o anunciante; `PATCH` sem `game_id` mantém o jogo) |
| **Catálogo de jogos** | `GET /games` · `GET /games/:id` (somente leitura) |
| **Referência de preço** | `GET/POST /price_references` · `PATCH /price_references/:id` |
| **Avaliações** | `GET /profile_reviews` · 🔒 `POST /profile_reviews` · 🔒 `PATCH /profile_reviews/:id` (só com pedido `approved` entre as partes; senão `403`) |
| **Negociações** | 🔒 `GET/POST /offers` · 🔒 `GET/PATCH/DELETE /offers/:id` (`DELETE` de negociação `ACCEPTED` responde `409`). Quando o anúncio sai do catálogo (venda, exclusão pelo dono ou pelo admin), as negociações `ACCEPTED` e suas mensagens são preservadas com `product_title`, `product_price` e `product_removed: true`; as demais são apagadas. |
| **Mensagens** | 🔒 `GET/POST /messages` |
| **Tickets** | `POST /tickets` (visitantes também, com `contact_email` obrigatório; o visitante recebe uma única vez `access_code` na resposta `201`; visitante: 5 tickets por IP por hora, depois `429`) · `POST /tickets/consulta` (`{ id, codigo }` → `200` com `id`, `subject`, `category`, `priority`, `status`, `admin_reply`, `replied_at`, `created_at`, `updated_at`; ticket inexistente ou código errado → `404`; 10 tentativas por IP em 15 min, depois `429`) · 🔒 `GET /tickets` · 🔒 `GET/PATCH/DELETE /tickets/:id` |
| **Notificações** | 🔒 `GET /notifications` · 🔒 `PATCH/DELETE /notifications/:id` |
| **Alertas de preço** | 🔒 `GET/POST /price_alerts` · 🔒 `PATCH/DELETE /price_alerts/:id` |
| **Pedidos** | 🔒 `GET/POST /orders` · 🔒 `GET/PATCH /orders/:id` |
| **Reembolsos** | 🔒 `GET/POST /refunds` · 🔒 `PATCH /refunds/:id` (vendedor confirma o pagamento: `pending → paid`; a conta **continua bloqueada** até o admin liberar) |
| **Denúncias** | 🔒 `POST /reports` (`reason`: `FALSIFICADO`, `GOLPE`, `DESCRICAO_ENGANOSA`, `CONTEUDO_IMPROPRIO` ou `OUTRO`; `403` no próprio anúncio, `409` se já houver denúncia aberta sua para o anúncio). Não há listagem pública. |
| **Administrador** 🛡️ | 🔒 `GET /admin/tickets` · 🔒 `PATCH /admin/tickets/:id` (`status`, `admin_reply`) · 🔒 `GET /admin/refunds` · 🔒 `PATCH /admin/refunds/:id/liberar` (só `paid` → `released`; senão `409`) · 🔒 `GET /admin/reports` (abertas primeiro) · 🔒 `PATCH /admin/reports/:id` (`{ "status": "DISMISSED" }`) · 🔒 `DELETE /admin/products/:id` (remove o anúncio em cascata e marca as denúncias como `RESOLVED_REMOVED`) |

As rotas `/admin/*` exigem um usuário com `role: "admin"`: sem token respondem `401` e, para usuários comuns, `403` ("Acesso restrito ao administrador."). O papel nunca é definido pelo cliente.

> ⚠️ **Conta de administrador.** Ao subir, a API cria (se ainda não existir nenhum admin) o administrador com login `admin` e senha `admin`. É uma credencial fraca e pública, só para a demonstração acadêmica (decisão ainda pendente com o grupo). A senha pode ser trocada em `PATCH /usuarios/me/senha`.

Respostas de erro seguem o padrão `{ "message": "...", "field": "..." }`, com `400` (dados inválidos), `401` (sem token, token inválido ou emitido antes da última troca de senha), `403` (registro de outra pessoa), `404` (não encontrado), `409` (conflito), `413` (corpo grande demais: 100 KB em geral, 2 MB nas rotas com imagem) e `429` (limite de tentativas: login, troca de senha, cadastro, ticket de visitante ou consulta de ticket).

A API desativa o `X-Powered-By` e usa o `helmet` (CSP `default-src 'none'`). O build do front (`npm run build`) injeta uma CSP no `index.html` (plugin em `vite.config.js`); se mudar a `API_URL` ou chamar outra API externa, atualize a lista de origens lá.

---

## 👥 Equipe de Desenvolvimento

Projeto desenvolvido para fins acadêmicos como requisito de avaliação da disciplina de Programação Web (Grupo 3):

- **Bernardo Dias Borio**
- **Luciano Cunha Damaso Mello**
- **Matheus Dinis Francellino**

---

## 📜 Licença

Este projeto é de uso acadêmico e educacional, distribuído sob a licença **MIT**.
