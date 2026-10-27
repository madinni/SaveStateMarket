# CENTRO FEDERAL DE EDUCAÇÃO TECNOLÓGICA CELSO SUCKOW DA FONSECA -- CEFET/RJ

Curso de Graduação

## GERÊNCIA DE PROJETOS DE TI

### SAVESTATE MARKET
Artefato 06: Relatório de Verificação de Escopo — Marco 1 (M1)

---

**Grupo:** Grupo 3 (Grupo D)

**Integrantes de Desenvolvimento (PSW):**
- Bernardo Dias Borio  
- Luciano Cunha Damaso Mello  
- Matheus Dinis Francellino  

**Gerente de Projeto:** Gustavo Andrade de Souza

**Equipe de Gerenciamento (GPTI):**
- Gustavo Andrade de Souza  
- Letícia Mendonça dos Santos  
- Maria Clara Mousinho de Salles  
- Rafael Barrionuevo de Souza  

**Professor:** Diogo Silveira Mendonça  

**Data de Status:** 05/10/2026 *(Data oficial de corte da entrega do Marco 1 da disciplina)*  
**Período Coberto:** 01/08/2026 a 05/10/2026  
**Repositório Auditado:** `https://github.com/madinni/SaveStateMarket` (Commit de corte: `bd8f3a8a`)  
**Base de Confronto:** Declaração de Escopo, EAP (Linha de Base do MVP) e Dicionário da EAP  

Rio de Janeiro -- RJ  
2026

---

# Relatório de Verificação de Escopo — Marco 1 (M1)

## 1. Finalidade do Relatório e Regras de Governança

O presente relatório tem como objetivo confrontar rigorosamente os artefatos de software entregues pela equipe de Programação Web (PSW) contra a **Linha de Base de Escopo** homologada pelo planejamento de GPTI.

Conforme as diretrizes metodológicas da disciplina:
* **Papel de GPTI (Verificação):** A equipe de gerenciamento realiza a auditoria técnica, executa o software localmente, afere cada entrega contra os critérios observáveis do Dicionário da EAP e **emite uma recomendação fundamentada** ao patrocinador.
* **Papel do Patrocinador (Aceite):** O aceite formal é decisão soberana do Patrocinador, após apreciação deste relatório e de sua própria verificação independente. **Nenhum item neste documento é declarado como "aceito" pela equipe de gerência.**
* **Escopo Tecnológico do Marco 1:** Frontend operável e responsivo entregue pela PSW sobre backend simulado via `json-server` (`http://localhost:3001`). A implementação da API própria e banco de dados relacional é escopo exclusivo do Marco 2.

---

## 2. Situação Geral do Marco 1

### 🟡 Semáforo: AMARELO (Aceite Condicional Recomendado)

**Justificativa fundamentada em fatos do escopo:**  
A equipe de desenvolvimento da PSW entregou um protótipo frontend funcional, com identidade visual coesa (*neo-noir / cyberpunk* CRT), roteamento client-side completo e integração ativa com as rotas REST do `json-server`. Foram validados com sucesso o fluxo de autenticação e sessão local (EAP 4.1), a publicação de anúncios com diagnóstico do estado físico da mídia (EAP 4.3), o feed de descoberta com busca textual (EAP 4.4) e a mesa de negociação P2P com proposta, contraproposta e recusa (EAP 4.6).

Entretanto, o status **AMARELO** é determinado por quatro fatos impeditivos de um parecer verde pleno:
1. **Inexistência do Catálogo de Jogos (EAP 4.2 / RF02):** Não há coleção estruturada de jogos nem catálogo de 20 títulos de referência no `db.json`; o formulário de anúncio opera via campo de texto livre.
2. **Ausência do Benchmark de Preços (EAP 4.5 / RF05):** A tela de detalhes do produto não exibe a referência de preço de mercado ao lado do valor anunciado; existe apenas um banner com percentual estático no feed.
3. **Falta de Coleção Dedicada de Pedidos/Transações (EAP 4.7.1 / RF07):** O aceite da oferta altera apenas o estado do registro em `/offers`, sem materializar um pedido com identificador único em entidade autônoma de transações.
4. **Desvio de Escopo (*Scope Creep* não solicitado):** Foram implementadas funcionalidades pertencentes à Fase 2 (Pós-MVP) — Chat P2P (RF08), Perfil de Reputação (RF09) e Chamados de Suporte (RF10) — antes da conclusão dos requisitos obrigatórios da baseline do MVP.

---

## 3. Verificação Pacote por Pacote (Confronto com o Dicionário da EAP)

Abaixo, cada pacote de trabalho previsto para o Marco 1 é avaliado contra seu critério observável homologado no Dicionário da EAP, recebendo a classificação obrigatória: **Passou**, **Falhou** ou **Não foi demonstrado**, acompanhada da respectiva recomendação.

| Código EAP | Pacote de Trabalho | Critério Observável do Dicionário da EAP | Resultado da Verificação | Evidência Técnica no Código-Fonte | Recomendação ao Patrocinador |
|---|---|---|:---:|---|---|
| **EAP 1.1** | Termo de Abertura | TAP formalizado, revisado e disponível no repositório. | 🟢 **Passou** | Documento estruturado e versionado em `[GERÊNCIA DE TI]/`. | Recomenda-se aceitar |
| **EAP 1.2** | Plano do Projeto | Plano com cronograma, riscos, comunicações e recursos definidos. | 🟢 **Passou** | Cronograma com caminho crítico, folgas e matrizes nominais. | Recomenda-se aceitar |
| **EAP 1.3** | Acompanhamento do Projeto | Registros de acompanhamento atualizados ao longo do projeto. | 🟢 **Passou** | Histórico de cartões de tarefas no Kanban Pipefy. | Recomenda-se aceitar |
| **EAP 1.4** | Gerenciamento de Riscos | Riscos com responsável, estratégia e contingência definidos. | 🟢 **Passou** | Matriz com 7 ameaças, 1 oportunidade e reservas separadas. | Recomenda-se aceitar |
| **EAP 2.1** | Levantamento de Requisitos | Requisitos RF01–RF10 e RNF01–RNF06 documentados. | 🟢 **Passou** | Especificação completa e matriz de rastreabilidade. | Recomenda-se aceitar |
| **EAP 2.2** | Definição do Escopo | Escopo definido com limites de dentro e fora aprovados. | 🟢 **Passou** | Seção 2.3 com divisões claras de produto, MVP e pós-MVP. | Recomenda-se aceitar |
| **EAP 2.3** | Priorização do MVP | Priorização aprovada com RF01–RF07 como linha de base. | 🟢 **Passou** | Matriz de prioridades e escopo do MVP homologados. | Recomenda-se aceitar |
| **EAP 2.4** | Critérios de Sucesso e Aceite | Cada entrega do MVP possui critério de aceite observável. | 🟢 **Passou** | Tabela de critérios observáveis presente no Dicionário. | Recomenda-se aceitar |
| **EAP 3.1** | Arquitetura Inicial | Arquitetura documentada e stack tecnológica operacional. | 🟢 **Passou** | React 18, Tailwind v3, Vite, json-server operando na porta 3001. | Recomenda-se aceitar |
| **EAP 3.2** | Protótipo da Interface | Protótipo navegável cobre o fluxo principal do MVP. | 🟢 **Passou** | Telas em `src/pages/` com design system CRT responsivo. | Recomenda-se aceitar |
| **EAP 3.3** | Modelagem dos Dados | Modelo suporta todas as entidades do MVP no `db.json`. | 🔴 **Falhou** | `db.json` possui `profiles`, `products` e `offers`, mas **não possui `games`/`catalog` nem `orders`**. | Recomenda-se rejeitar |
| **EAP 3.4** | Fluxo de Navegação | Todas as telas conectadas com navegação consistente. | 🟢 **Passou** | Roteamento em `App.jsx`, `Navbar.jsx` persistente e `Header.jsx`. | Recomenda-se aceitar |
| **EAP 4.1.1** | Cadastro de Usuário | Usuário consegue criar uma conta com nome, e-mail e senha. | 🟢 **Passou** | `AuthLogin.jsx` (`isRegister`) persiste operador em `POST /profiles`. | Recomenda-se aceitar |
| **EAP 4.1.2** | Autenticação | Usuário cadastrado consegue autenticar e manter sessão ativa. | 🟢 **Passou** | `AuthLogin.jsx` valida credenciais e armazena token em `localStorage`. | Recomenda-se aceitar |
| **EAP 4.2.1** | Estrutura do Catálogo | Estrutura aceita títulos com campos obrigatórios no `db.json`. | 🔴 **Falhou** | Ausência de endpoint ou schema para catálogo base de jogos. | Recomenda-se rejeitar |
| **EAP 4.2.2** | Carga Inicial de Dados | Catálogo com pelo menos 20 títulos reais para criação assistida. | 🟡 **Não demonstrado** | Não há coleção de 20 títulos pré-cadastrados para seleção. | Recomenda-se rejeitar |
| **EAP 4.3.1** | Cadastro Assistido de Anúncio | Vendedor cria anúncio selecionando jogo do catálogo e condição. | 🔴 **Falhou** | `DropAsset.jsx` usa input de texto livre; diagnóstico físico funciona. | Recomenda-se rejeitar |
| **EAP 4.3.2** | Publicação do Anúncio | Anúncio publicado aparece na listagem com fotos e preço. | 🟢 **Passou** | `DropAsset.jsx` persiste em `POST /products`; reflete no `MarketFeed`. | Recomenda-se aceitar |
| **EAP 4.3.3** | Gerenciamento de Anúncios | Vendedor consegue listar, editar e remover anúncios ativos. | 🔴 **Falhou** | Não há tela/botões para edição e exclusão de anúncios ativos. | Recomenda-se rejeitar |
| **EAP 4.4.1** | Pesquisa por Título e Plataforma | Busca retorna anúncios correspondentes a título e plataforma. | 🟢 **Passou** | Input em `MarketFeed.jsx` filtra reativamente título e plataforma. | Recomenda-se aceitar |
| **EAP 4.4.2** | Filtros de Busca | Usuário refina por condição da mídia e faixa de preço. | 🔴 **Falhou** | Há botões de plataforma (`CART`, `DISC`), mas faltam preço e condição. | Recomenda-se rejeitar |
| **EAP 4.4.3** | Visualização Detalhada | Informações completas do produto, fotos e condição exibidas. | 🟢 **Passou** | `ProductDetails.jsx` exibe metadados, fotos e tags de conservação. | Recomenda-se aceitar |
| **EAP 4.5.1** | Integração com Fonte Externa | Sistema consulta e obtém dados de preço de mercado. | 🟡 **Não demonstrado** | Módulo de consulta externa não conectado (está no Backlog Pipefy). | Recomenda-se rejeitar |
| **EAP 4.5.2** | Consulta e Apresentação de Preço | Preço anunciado exibido ao lado da referência de mercado. | 🔴 **Falhou** | `ProductDetails.jsx` não exibe referência externa ao lado do preço. | Recomenda-se rejeitar |
| **EAP 4.6.1** | Envio e Recebimento de Oferta | Comprador envia oferta e vendedor visualiza a proposta. | 🟢 **Passou** | Modal em `ProductDetails.jsx` envia `POST /offers`, listado no painel. | Recomenda-se aceitar |
| **EAP 4.6.2** | Aceite ou Recusa | Vendedor aceita ou recusa oferta com atualização de status. | 🟢 **Passou** | `NegotiationDesk.jsx` executa `PATCH /offers/:id` (ACCEPTED / REJECTED). | Recomenda-se aceitar |
| **EAP 4.7.1** | Registro do Pedido | Oferta aceita gera pedido com ID único e dados das partes. | 🔴 **Falhou** | Aceite atualiza `/offers`, mas **não gera registro em `/orders`**. | Recomenda-se rejeitar |
| **EAP 4.7.2** | Acompanhamento da Transação | Comprador e vendedor visualizam e atualizam status. | 🔴 **Falhou** | Painel restrito ao chat de ofertas; não há tela de pedidos fechados. | Recomenda-se rejeitar |

---

## 4. Requisitos do Marco 1: Atendidos vs. Pendentes

Cruzando a verificação do código com a **Matriz de Rastreabilidade**:

| ID Requisito | Descrição do Requisito | Pacotes EAP Associados | Status no Marco 1 | Diagnóstico Técnico de Verificação |
|:---:|---|:---:|:---:|---|
| **RF01** | Cadastro e autenticação de usuários | 4.1.1, 4.1.2 | 🟢 **Atendido** | Cadastro e login operacionais integrados ao `json-server` (`/profiles`). |
| **RF02** | Publicação e gerenciamento de anúncios | 4.2, 4.3 | 🟡 **Parcialmente Atendido** | Publicação e diagnóstico físico funcionam; seleção por catálogo e edição/exclusão pendentes. |
| **RF03** | Pesquisa e filtragem de anúncios | 4.4.1, 4.4.2 | 🟡 **Parcialmente Atendido** | Busca textual e filtro por plataforma funcionam; filtros de preço e conservação pendentes. |
| **RF04** | Visualização detalhada dos produtos | 4.4.3 | 🟢 **Atendido** | Dossiê completo com fotos, badges de conservação e bloqueio de autocompra. |
| **RF05** | Benchmark de preços de mercado | 4.5.1, 4.5.2 | 🔴 **Pendente** | Não implementado na tela do produto; apenas elemento estático ilustrativo no feed. |
| **RF06** | Envio e recebimento de ofertas | 4.6.1, 4.6.2 | 🟢 **Atendido** | Fluxo de envio de propostas, contrapropostas, aceite e recusa operacionais. |
| **RF07** | Registro de pedidos e transações | 4.7.1, 4.7.2 | 🔴 **Pendente** | Falta criação da entidade dedicada `/orders` ou `/transactions` após o aceite. |
| **RNF01** | Web Mobile-First e Responsiva | 3.2, 3.4 | 🟢 **Atendido** | Layout adaptado para smartphones e desktops via Tailwind CSS. |
| **RNF02** | Tempo de Carregamento (< 3s local) | 3.1 | 🟢 **Atendido** | Resposta instantânea sobre `json-server` e Vite em ambiente local. |
| **RNF03** | Senhas no Protótipo | 4.1.1 | 🟢 **Atendido** | Armazenamento funcional em texto plano justificado pelas restrições do `json-server`. |
| **RNF04** | Privacidade de Contato | 4.1, 4.6 | 🟢 **Atendido** | Contatos não são expostos abertamente no feed público. |
| **RNF05** | Disponibilidade Local | 3.1 | 🟢 **Atendido** | Execução estável via scripts `npm run server` e `npm run dev`. |
| **RNF06** | Usabilidade e Feedback | 3.2 | 🟢 **Atendido** | Notificações visuais de sistema, modais claros e estética CRT consistente. |

---

## 5. Registro de Questões (Issues Log do Marco 1)

Cada desvio negativo ou critério não atendido da baseline foi formalizado como uma **Questão**, contendo identificador, descrição do impacto, responsável nominal e data-limite de correção para o Marco 2:

| ID Questão | Pacote Afetado | Descrição da Não-Conformidade | Impacto no Projeto | Responsável | Prazo de Correção |
|:---:|:---:|---|---|:---:|:---:|
| **ISS-01** | EAP 4.2 | Ausência da coleção `/games` no `db.json` com carga inicial de 20 títulos. | Compromete a padronização e o conceito de cadastro assistido. | Luciano Cunha Damaso Mello / Bernardo Dias Borio | 17/10/2026 |
| **ISS-02** | EAP 4.3.1 | Formulário `DropAsset.jsx` utiliza campo de texto livre em vez de seleção de catálogo. | Risco de inconsistência cadastral de mídias usadas. | Luciano Cunha Damaso Mello | 17/10/2026 |
| **ISS-03** | EAP 4.3.3 | Ausência de interface e rotas para edição e remoção de anúncios ativos do vendedor. | Vendedor não consegue desativar item já vendido ou corrigir preço. | Luciano Cunha Damaso Mello | 24/10/2026 |
| **ISS-04** | EAP 4.4.2 | Filtros de busca restritos a botões de plataforma, sem filtro de preço e condição. | Reduz a capacidade do comprador de refinar itens desejados. | Matheus Dinis Francellino | 17/10/2026 |
| **ISS-05** | EAP 4.5 | Benchmark de preços inexistente na tela `ProductDetails.jsx`. | Falha no diferencial central do produto definido no Business Case. | Bernardo Dias Borio | 24/10/2026 |
| **ISS-06** | EAP 4.7 | Aceite de oferta não gera registro autônomo na coleção de pedidos/transações. | Impede o encadeamento contábil e o rastreamento formal de vendas. | Luciano Cunha Damaso Mello | 24/10/2026 |

---

## 6. Registro de Mudanças / Escopo Não Homologado (*Scope Creep*)

A verificação constatou que a equipe da PSW entregou código e telas para três funcionalidades que constam formalmente **fora da linha de base do MVP (Fase 2 — Pós-MVP)**. Em observância ao princípio de que *"gostar da tela não aprova escopo novo"*, tais itens são registrados abaixo como escopo não solicitado na baseline do Marco 1:

| ID Mudança | Funcionalidade Entregue | Arquivos e Rotas Identificados | Situação na Linha de Base | Parecer da Gerência de Projetos |
|:---:|---|---|:---:|---|
| **CR-01** | Chat P2P Interativo em Tempo Real (RF08) | `NegotiationDesk.jsx`, persistência em `/messages` | Pós-MVP | **Escopo antecipado não autorizado.** A funcionalidade é tecnicamente excelente, mas consumiu horas que deveriam ter sido dedicadas ao Benchmark de Preços e Catálogo. |
| **CR-02** | Perfil de Reputação e Reviews (RF09) | `OperativeProfile.jsx`, `/profiles`, `/profile_reviews` | Pós-MVP | **Escopo antecipado não autorizado.** Métricas de reputação e cofre foram implementadas antes da consolidação do fluxo de pedidos do MVP. |
| **CR-03** | Central de Suporte e Tickets (RF10) | `SupportTicket.jsx`, rota `/ticket` | Pós-MVP | **Escopo antecipado não autorizado.** Módulo de atendimento ao cliente não compõe a linha de base de entrega do Marco 1. |

---

## 7. Próximas Ações e Decisões Pedidas ao Patrocinador

Com base na auditoria realizada, a equipe de Gerência de Projetos (GPTI) submete ao **Patrocinador** as seguintes deliberações com prazo de resposta até **12/10/2026**:

1. **Decisão sobre o Aceite do Marco 1:**
   * **Recomendação da Gerência:** **Aceite Condicional.**  
   * *Condição:* O patrocinador concede o aceite do Marco 1 mediante o compromisso formal da equipe de desenvolvimento (PSW) de sanar as Questões **ISS-01, ISS-02 e ISS-05** (Catálogo e Benchmark) na primeira sprint do Marco 2.
2. **Decisão sobre o Escopo Não Homologado (CR-01, CR-02, CR-03):**
   * **Recomendação da Gerência:** Não incorporar os itens pós-MVP nos critérios formais de aceite do MVP da AV1/AV2, mantendo-os como protótipos em *branch* auxiliar ou como bônus não contratual, evitando diluição do esforço no fechamento da API própria.
3. **Instrução Operacional para o Marco 2 (Status Report 2):**
   * Em alinhamento com a diretriz do professor, a equipe de gerenciamento já orientou os 7 alunos a iniciarem a partir desta semana o **apontamento individual de horas semanais por atividade e o registro do esforço restante**, preparando a base de cálculo para a Análise de Valor Agregado (EVA) no Status Report 2.

---

### Encaminhamento e Assinaturas

**Pela Equipe de Gerência de Projetos (GPTI):**

**Gustavo Andrade de Souza**  
*Gerente de Projeto — Grupo D (SaveState Market)*  

**Assinatura:** __________________________________________________  
**Data:** 05 / 10 / 2026  

<br>

**Pela Equipe de Gerenciamento:**  
- Maria Clara Mousinho de Salles  
- Letícia Mendonça dos Santos  
- Rafael Barrionuevo de Souza  

---

### Decisão Formal do Patrocinador

( ) Aceite Pleno  
( ) Aceite Condicional (com base nas ressalvas ISS-01 a ISS-06)  
( ) Rejeição do Marco 1  

**Patrocinador:** Patrocinador do Projeto (Papel de Validação e Aceite Formal)  
**Assinatura:** __________________________________________________  
**Data:** ____ / ____ / ________
