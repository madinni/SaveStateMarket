# CENTRO FEDERAL DE EDUCAÇÃO TECNOLÓGICA CELSO SUCKOW DA FONSECA -- CEFET/RJ

Curso de Graduação

## GERÊNCIA DE PROJETOS DE TI

### SAVESTATE MARKET
Artefato 03: Plano do Projeto

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

# 3. Plano do Projeto

## 3.1 Objetivo do Plano

O Plano do Projeto estabelece como o SaveState Market será organizado, executado, monitorado e controlado, garantindo que as entregas previstas sejam desenvolvidas de forma coerente com os objetivos definidos no Termo de Abertura.

## 3.2 Abordagem de Desenvolvimento

O desenvolvimento será conduzido de maneira incremental, priorizando primeiramente o fluxo principal do MVP.

A estratégia busca garantir que o projeto entregue inicialmente o principal valor esperado antes da implementação de funcionalidades complementares.

## 3.3 Cronograma do Projeto

O cronograma a seguir detalha as atividades, responsáveis, predecessoras, durações estimadas e dependências do projeto.

| ID | Atividade / Entregável | Responsável | Predecessora | Duração | Início | Fim |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Gerenciamento do Projeto | Gustavo Andrade de Souza | — | 14 sem. | 01/08/2026 | 02/11/2026 |
| 1.1 | Elaboração e aprovação do TAP | Maria Clara Mousinho de Salles | — | 2 sem. | 01/08/2026 | 15/08/2026 |
| 2 | Requisitos e Escopo | Letícia Mendonça dos Santos | 1.1 | 2 sem. | 16/08/2026 | 29/08/2026 |
| 3 | Projeto da Solução | Rafael Barrionuevo de Souza | 2 | 2 sem. | 30/08/2026 | 12/09/2026 |
| 4.1 | Módulo de Usuários | Matheus Dinis Francellino | 3 | 2 sem. | 13/09/2026 | 26/09/2026 |
| 4.2 | Catálogo de Jogos | Luciano Cunha Damaso Mello / Bernardo Dias Borio | 3 | 2 sem. | 13/09/2026 | 26/09/2026 |
| 4.3 | Módulo de Anúncios | Luciano Cunha Damaso Mello / Matheus Dinis Francellino | 4.1; 4.2 | 1.5 sem. | 27/09/2026 | 05/10/2026 |
| 4.4 | Pesquisa e Descoberta | Matheus Dinis Francellino | 4.3 | 1 sem. | 27/09/2026 | 05/10/2026 |
| 4.5 | Benchmark de Preços | Bernardo Dias Borio | 4.4 | 1.5 sem. | 06/10/2026 | 17/10/2026 |
| 4.6 | Ofertas e Negociação | Luciano Cunha Damaso Mello | 4.4 | 1.5 sem. | 11/10/2026 | 23/10/2026 |
| 4.7 | Transações | Luciano Cunha Damaso Mello | 4.6 | 1 sem. | 18/10/2026 | 26/10/2026 |
| 5 | Testes e Validação | Rafael Barrionuevo de Souza | 4.5; 4.7 | 1 sem. | 25/10/2026 | 30/10/2026 |
| — | Entrega da versão final | Gustavo Andrade de Souza | 5 | 0.5 sem. | 28/10/2026 | 02/11/2026 |
| — | Encerramento do projeto | Gustavo Andrade de Souza | Entrega | 0.5 sem. | 30/10/2026 | 02/11/2026 |

**Caminho crítico:** 1.1 → 2 → 3 → 4.1 / 4.2 → 4.3 → 4.4 → 4.6 → 4.7 → 5 → Entrega da versão final → Encerramento do projeto (Conclusão contratual em 02/11/2026).

**Folgas identificadas:**

| Atividade | Folga | Observação |
| :--- | :--- | :--- |
| 4.2 (Catálogo) | 0 sem. | Paralelo com 4.1; ambos predecessores de 4.3. |
| 4.5 (Benchmark) | 1 sem. | Término em 17/10; Testes (5) iniciam em 25/10. |

### 3.3.1 Matriz de Alocação Semanal de Esforço (Pessoa × Tarefa × Horas)

A matriz a seguir detalha a distribuição das **5 horas semanais por integrante** ao longo das 14 semanas letivas principais de execução (S1 a S14), totalizando **70 horas por pessoa e 490 horas totais de esforço acadêmico**, vinculando cada membro nominal aos pacotes de trabalho da EAP:

| Integrante | Papel Principal | S1–S2 | S3–S4 | S5–S6 | S7–S8 | S9–S10 | S11–S12 | S13–S14 | Carga Semanal | Total Horas |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Bernardo Dias Borio** | Dev / PSW | 3.3 (5h) | 3.3 (5h) | 3.1 (5h) | 4.2.2 (5h) | 4.5.1 (5h) | 4.5.2 (5h) | 5.4 (5h) | 5h/sem. | **70h** |
| **Luciano Cunha Damaso Mello** | Dev / PSW | 3.4 (5h) | 3.4 (5h) | 3.2 (5h) | 4.2.1 (5h) | 4.3.1 (5h) | 4.6.1 (5h) | 4.7 / 5.5 (5h) | 5h/sem. | **70h** |
| **Matheus Dinis Francellino** | Dev / PSW | 3.2 (5h) | 3.2 (5h) | 3.2 (5h) | 4.1.1 (5h) | 4.3.2 (5h) | 4.4.1 (5h) | 4.4 / 5.2 (5h) | 5h/sem. | **70h** |
| **Gustavo Andrade de Souza** | GP / GPTI | 1.1 (5h) | 1.2 (5h) | 1.3 (5h) | 1.3 (5h) | 1.3 / M1 (5h) | 1.3 (5h) | 5.3 / Enc. (5h) | 5h/sem. | **70h** |
| **Letícia Mendonça dos Santos** | Gerência / GPTI | 2.1 (5h) | 2.2 (5h) | 2.3 (5h) | 1.3 (5h) | 1.3 / M1 (5h) | 1.3 (5h) | 5.3 / 5.6 (5h) | 5h/sem. | **70h** |
| **Maria Clara Mousinho de Salles** | Gerência / GPTI | 1.1 (5h) | 1.1 (5h) | 2.4 (5h) | 1.3 (5h) | 1.3 / M1 (5h) | 1.3 (5h) | 5.6 (5h) | 5h/sem. | **70h** |
| **Rafael Barrionuevo de Souza** | Gerência / GPTI | 1.4 (5h) | 1.4 (5h) | 3.1 (5h) | 1.4 (5h) | 1.4 / M1 (5h) | 5.1 (5h) | 5.1 / Enc. (5h) | 5h/sem. | **70h** |
| **Total Horas / Bloco** | | **70h** | **70h** | **70h** | **70h** | **70h** | **70h** | **70h** | **35h/sem.** | **490h** |

* **Detalhamento dos blocos de semanas:**
  * **S1–S2 (01/08 a 15/08):** Abertura do projeto, elaboração do TAP (1.1), levantamento inicial de requisitos (2.1), prototipação preliminar e mapeamento de riscos.
  * **S3–S4 (16/08 a 29/08):** Elaboração do Plano do Projeto (1.2), especificação e delimitação do escopo (2.2), modelagem de dados inicial e matriz de riscos.
  * **S5–S6 (30/08 a 12/09):** Projeto da solução, arquitetura inicial (3.1), protótipo navegável (3.2), critérios observáveis de aceite (2.4) e setup do ambiente de testes.
  * **S7–S8 (13/09 a 26/09):** Desenvolvimento do Módulo de Usuários (4.1), estrutura e carga inicial do Catálogo de Jogos (4.2), acompanhamento e controle de sprints no Pipefy.
  * **S9–S10 (27/09 a 10/10):** Desenvolvimento do Módulo de Anúncios (4.3), pesquisa inicial (4.4), fechamento e auditoria formal do **Marco 1 (M1 — 05/10/2026)**.
  * **S11–S12 (11/10 a 24/10):** Módulo de Benchmark de Preços (4.5), Módulo de Ofertas e Negociação (4.6), execução da primeira bateria de testes funcionais (5.1).
  * **S13–S14 (25/10 a 02/11):** Módulo de Transações (4.7), testes de responsividade (5.2), validação final do MVP (5.3), correção de falhas (5.4), versão final (5.5), consolidação documental e encerramento formal do **Marco 2 (M2 — 02/11/2026)**.

## 3.4 Fluxo de Execução do Projeto

1. Planejamento e definição do projeto;
2. levantamento e organização dos requisitos;
3. definição do escopo do MVP;
4. elaboração do protótipo e arquitetura inicial;
5. desenvolvimento do módulo de usuários;
6. desenvolvimento dos anúncios e pesquisa;
7. integração do benchmark de preços;
8. desenvolvimento das ofertas e transações;
9. testes e validação;
10. entrega da versão final e encerramento.

## 3.5 Gerenciamento do Escopo

O escopo será controlado por meio do Termo de Abertura, requisitos, EAP e critérios de aceite.

A prioridade será a conclusão das funcionalidades essenciais do MVP. Funcionalidades complementares somente serão desenvolvidas após a validação do fluxo principal.

## 3.6 Gerenciamento de Requisitos

Os requisitos serão identificados, documentados e relacionados às respectivas entregas da EAP.

| ID | Requisito | Fase |
| :--- | :--- | :--- |
| RF01 | Permitir cadastro e autenticação de usuários. | MVP |
| RF02 | Permitir publicação e gerenciamento de anúncios. | MVP |
| RF03 | Permitir pesquisa e filtragem de anúncios. | MVP |
| RF04 | Permitir visualização detalhada dos produtos. | MVP |
| RF05 | Disponibilizar referências externas de preços. | MVP |
| RF06 | Permitir envio e recebimento de ofertas. | MVP |
| RF07 | Registrar pedidos e transações. | MVP |
| RF08 | Permitir comunicação entre compradores e vendedores. | Pós-MVP |
| RF09 | Disponibilizar perfil e reputação dos usuários. | Pós-MVP |
| RF10 | Disponibilizar sistema de suporte. | Pós-MVP |
| RNF01 | A plataforma deverá possuir abordagem web mobile-first, sendo responsiva para smartphones, tablets e desktops. | MVP |
| RNF02 | O tempo médio de carregamento das páginas principais não deverá ultrapassar 3 segundos em ambiente de desenvolvimento local com json-server. | MVP |
| RNF03 | No protótipo com json-server, as senhas serão armazenadas em texto simples por limitação da ferramenta. A arquitetura do módulo de autenticação será projetada para suportar hash seguro (bcrypt ou argon2) em ambiente de produção. | MVP |
| RNF04 | Os dados pessoais dos usuários deverão ser tratados de acordo com as políticas de privacidade definidas para o sistema, e dados de contato só serão liberados após aceite mútuo da oferta. | MVP |
| RNF05 | No contexto do protótipo acadêmico, a disponibilidade será limitada ao ambiente de desenvolvimento local. A arquitetura será projetada visando *uptime* de 99% para eventual migração a produção. | MVP |
| RNF06 | A interface deverá seguir princípios de usabilidade, incluindo navegação intuitiva, feedback visual de ações e mensagens de erro claras. | MVP |

## 3.7 Gerenciamento da Qualidade

A qualidade será acompanhada por meio de:

* testes das funcionalidades;
* validação dos critérios de sucesso;
* verificação da responsividade;
* validação do fluxo principal do MVP;
* revisão dos requisitos;
* identificação e correção de falhas;
* validação dos critérios de aceite das entregas.

## 3.8 Gerenciamento dos Riscos

Os riscos serão acompanhados durante o projeto considerando tipo (ameaça ou oportunidade), probabilidade, impacto, severidade, responsável e estratégia de resposta.

| Risco | Tipo | Prob. | Impacto | Severid. | Responsável | Estratégia | Contingência |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Dependência de fontes externas | Ameaça | Média | Alto | Alta | Bernardo Dias Borio | Mitigar: avaliar múltiplas fontes de preços. | Permitir inserção manual do preço de mercado pelo vendedor. |
| Informações incorretas | Ameaça | Média | Alto | Alta | Maria Clara Mousinho de Salles | Mitigar: campos estruturados e fotos obrigatórias. | Moderação manual de denúncias e suspensão de anúncios. |
| Baixa adesão | Ameaça | Média | Médio | Média | Letícia Mendonça dos Santos | Mitigar: divulgação em comunidades e cadastro de acervo. | Cadastrar acervo próprio da equipe para popular a plataforma. |
| Fraudes e conflitos | Ameaça | Baixa | Alto | Média | Rafael Barrionuevo de Souza | Mitigar: registro de etapas das negociações. | Bloqueio e investigação de contas denunciadas. |
| Crescimento do escopo | Ameaça | Alta | Alto | Alta | Gustavo Andrade de Souza | Evitar: priorizar MVP e postergar complementos. | Cortar requisitos RF08–RF10 para garantir entrega. |
| Segurança e privacidade | Ameaça | Baixa | Alto | Média | Matheus Dinis Francellino | Mitigar: validação de dados e boas práticas de segurança. | Revisão emergencial de segurança e correção prioritária. |
| Atraso por curva de aprendizado | Ameaça | Alta | Médio | Média | Luciano Cunha Damaso Mello | Mitigar: treinamento da stack nas semanas iniciais. | Redistribuição de tarefas e simplificação de módulos. |
| Adoção por comunidades de colecionadores | Oportunidade | Média | Alto | Alta | Letícia Mendonça dos Santos | Explorar: divulgação em fóruns e grupos especializados em jogos físicos. | Criar conteúdo demonstrativo e parcerias com comunidades para atrair primeiros usuários. |

## 3.9 Gerenciamento das Comunicações

### Plano de comunicação

| Informação | Responsável | Meio |
| :--- | :--- | :--- |
| Andamento do projeto | Gustavo Andrade de Souza | Reuniões semanais e canais internos |
| Decisões do projeto | Gustavo Andrade de Souza | Reuniões e documentação no repositório |
| Alterações de escopo | Gustavo Andrade de Souza e Letícia Mendonça dos Santos | Registro formal e discussão em reunião |
| Artefatos | Rafael Barrionuevo de Souza | Repositório do projeto |
| Validações acadêmicas | Maria Clara Mousinho de Salles | Apresentações e entregas |

## 3.10 Gerenciamento dos Recursos

Os principais recursos envolvidos são:

* integrantes da equipe (7 membros);
* ferramentas de desenvolvimento web;
* ferramentas de controle de versão (Git/GitHub);
* ferramentas de prototipação;
* fontes externas de dados;
* ambiente para hospedagem e execução da plataforma (tier gratuito em nuvem);
* ferramentas de comunicação e documentação.

## 3.11 Controle de Mudanças

Qualquer alteração significativa deverá ser analisada considerando:

* impacto sobre o escopo;
* impacto sobre os requisitos;
* impacto sobre as entregas;
* impacto sobre os recursos;
* impacto sobre a qualidade;
* impacto sobre a capacidade de conclusão do MVP.

Alterações que comprometam as funcionalidades prioritárias deverão ser postergadas ou submetidas à aprovação do patrocinador.

---

## Aprovação do Plano do Projeto

**Patrocinador:** Patrocinador do Projeto (Papel de Validação e Aceite Formal)  
**Assinatura:** __________________________________________________  
**Data:** ____ / ____ / ________

<br>

**Gerente de Projeto:** Gustavo Andrade de Souza  
**Assinatura:** __________________________________________________  
**Data:** ____ / ____ / ________
