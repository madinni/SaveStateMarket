# CENTRO FEDERAL DE EDUCAÇÃO TECNOLÓGICA CELSO SUCKOW DA FONSECA -- CEFET/RJ

Curso de Graduação

## GERÊNCIA DE PROJETOS DE TI

### SAVESTATE MARKET
Artefato 04: Estrutura Analítica do Projeto (EAP) e Matriz de Rastreabilidade

---

**Grupo:** Grupo 3

**Integrantes:**
- Bernardo Dias Borio  
- Luciano Cunha Damaso Mello  
- Matheus Dinis Francellino  

**Gerente de Projeto:** Gustavo Andrade de Souza

**Equipe de Gerenciamento:**
- Gustavo Andrade  
- Letícia Mendonça  
- Maria Clara Mousinho  
- Rafael Barrionuevo  

**Professor:** Diogo Silveira Mendonça  

Rio de Janeiro -- RJ  
2026

---

# 4. Estrutura Analítica do Projeto -- EAP

A Estrutura Analítica do Projeto organiza hierarquicamente as principais entregas e componentes necessários para a realização do SaveState Market.

A estrutura foi construída a partir das entregas, escopo e prioridades definidas no Termo de Abertura.

## 4.1 EAP de Primeiro Nível

1. **Gerenciamento e Planejamento do Projeto**
2. **Requisitos e Escopo**
3. **Projeto da Solução**
4. **Desenvolvimento do MVP**
5. **Testes, Validação e Encerramento**

> **Nota sobre o escopo do MVP:** Em conformidade com as boas práticas de gerenciamento de projetos (onde a EAP deve conter estritamente o trabalho a ser realizado na linha de base do projeto), as funcionalidades pós-MVP (RF08, RF09, RF10) não integram a EAP do MVP. O pacote de testes, validação e encerramento assume, portanto, a numeração sequencial de pacote 5.

## 4.2 EAP Decomposta

1. **Gerenciamento e Planejamento do Projeto**
   1. Termo de Abertura
   2. Plano do Projeto
   3. Acompanhamento do projeto
   4. Gerenciamento de riscos
2. **Requisitos e Escopo**
   1. Levantamento de requisitos
   2. Definição do escopo
   3. Priorização do MVP
   4. Critérios de sucesso e aceite
3. **Projeto da Solução**
   1. Arquitetura inicial
   2. Protótipo da interface
   3. Modelagem dos dados
   4. Fluxo de navegação
4. **Desenvolvimento do MVP**
   1. Módulo de Usuários
      1. Cadastro
      2. Autenticação
   2. Catálogo de Jogos
      1. Estrutura do catálogo
      2. Carga inicial de dados
   3. Módulo de Anúncios
      1. Cadastro assistido do anúncio
      2. Publicação do anúncio
      3. Gerenciamento dos anúncios
   4. Módulo de Pesquisa e Descoberta
      1. Pesquisa por título e plataforma
      2. Filtros de busca
      3. Visualização detalhada dos anúncios
   5. Módulo de Benchmark de Preços
      1. Integração com fonte externa
      2. Consulta e apresentação da referência
   6. Módulo de Ofertas e Negociação
      1. Envio e recebimento de oferta
      2. Aceite ou recusa
   7. Módulo de Transações
      1. Registro do pedido
      2. Acompanhamento e status da transação
5. **Testes, Validação e Encerramento**
   1. Testes funcionais
   2. Testes de responsividade
   3. Validação do MVP
   4. Correção de falhas
   5. Versão final
   6. Documentação e encerramento

---

# 6. Matriz de Rastreabilidade

A matriz de rastreabilidade estabelece a relação entre os requisitos, as entregas da EAP, a fase correspondente e os critérios utilizados para validar a solução.

| ID | Requisito | EAP | Fase | Critério de validação |
| :--- | :--- | :--- | :--- | :--- |
| RF01 | Cadastro e autenticação de usuários | 4.1 | MVP | Usuário consegue criar conta e autenticar conforme RNF03. |
| RF02 | Publicação e gerenciamento de anúncios | 4.2 / 4.3 | MVP | Vendedor seleciona jogo do catálogo (4.2), cadastra condição, fotos, preço e publica anúncio (4.3). |
| RF03 | Pesquisa e filtragem | 4.4 | MVP | Usuário consegue localizar anúncios por título, plataforma e condição. |
| RF04 | Visualização detalhada | 4.4 | MVP | Informações completas do produto, fotos e condição são apresentadas. |
| RF05 | Benchmark de preços | 4.5 | MVP | Referência externa de preço é consultada e exibida ao lado do valor anunciado. |
| RF06 | Envio e recebimento de ofertas | 4.6 | MVP | Oferta pode ser enviada, recebida, aceita ou recusada com registro histórico. |
| RF07 | Registro de pedidos e transações | 4.7 | MVP | Negociação concluída gera registro de pedido com acompanhamento de status. |
| RF08 | Comunicação entre usuários | — | Fora da linha de base (Pós-MVP) | Protótipo funcional implementado no código (`NegotiationDesk.jsx`), mantido fora da baseline do MVP. |
| RF09 | Perfil e reputação | — | Fora da linha de base (Pós-MVP) | Protótipo funcional implementado no código (`OperativeProfile.jsx`), mantido fora da baseline do MVP. |
| RF10 | Sistema de suporte | — | Fora da linha de base (Pós-MVP) | Protótipo funcional implementado no código (`SupportTicket.jsx`), mantido fora da baseline do MVP. |
| RNF01 | Plataforma web mobile-first e responsiva | 3 / 4 | MVP | Interface funciona em diferentes dispositivos (mobile, tablet, desktop). |
| RNF02 | Desempenho de carregamento | 4 / 5 | MVP | Páginas carregam em tempo aceitável em ambiente local. |
| RNF03 | Segurança de senhas | 4.1 | MVP | Senhas armazenadas com hash seguro (planejado para produção). |
| RNF04 | Privacidade de dados | 4.1 / 4.6 | MVP | Dados de contato protegidos até aceite mútuo. |
| RNF05 | Disponibilidade | 4 / 5 | MVP | Aplicação operacional em ambiente local (json-server + front-end). |
| RNF06 | Usabilidade | 3 / 4 | MVP | Navegação intuitiva e feedback visual. |

---

# 7. Visão Consolidada das Entregas

### Relação entre entregas, prioridade e resultado esperado

| ID | Entrega | Prioridade | Resultado esperado |
| :--- | :--- | :--- | :--- |
| 1 | Gerenciamento e planejamento | MVP | Base documental do projeto. |
| 2 | Requisitos e escopo | MVP | Escopo e requisitos definidos. |
| 3 | Projeto da solução | MVP | Protótipo e arquitetura inicial. |
| 4.1 | Módulo de usuários | MVP | Controle de acesso dos usuários. |
| 4.2 | Catálogo de jogos | MVP | Base de títulos e plataformas para criação assistida de anúncios. |
| 4.3 | Módulo de anúncios | MVP | Criação, publicação e gerenciamento dos produtos. |
| 4.4 | Módulo de pesquisa e descoberta | MVP | Localização e consulta dos anúncios. |
| 4.5 | Módulo de benchmark de preços | MVP | Referência para avaliação dos valores. |
| 4.6 | Módulo de ofertas e negociação | MVP | Fluxo de negociação entre usuários. |
| 4.7 | Módulo de transações | MVP | Acompanhamento das negociações concluídas. |
| 5 | Testes, validação e encerramento | MVP | Entrega validada da plataforma. |

---

## Aprovação da EAP e Rastreabilidade

**Patrocinador:** Patrocinador do Projeto (Papel de Validação e Aceite Formal)  
**Assinatura:** __________________________________________________  
**Data:** ____ / ____ / ________

<br>

**Gerente de Projeto:** Gustavo Andrade de Souza  
**Assinatura:** __________________________________________________  
**Data:** ____ / ____ / ________
