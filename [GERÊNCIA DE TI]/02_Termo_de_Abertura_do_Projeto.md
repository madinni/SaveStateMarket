# CENTRO FEDERAL DE EDUCAÇÃO TECNOLÓGICA CELSO SUCKOW DA FONSECA -- CEFET/RJ

Curso de Graduação

## GERÊNCIA DE PROJETOS DE TI

### SAVESTATE MARKET
Artefato 02: Termo de Abertura do Projeto (TAP)

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

# 2. Termo de Abertura do Projeto

## 2.1 Finalidade e Justificativa

O projeto tem como finalidade criar um ambiente especializado para compra, venda e troca de mídias físicas de jogos usados, oferecendo recursos que auxiliem compradores e vendedores na tomada de decisão e na negociação.

A criação da plataforma é justificada pela necessidade de reduzir a dispersão das ofertas e a assimetria de informação existente nas negociações, principalmente em relação ao preço praticado e ao estado de conservação dos produtos.

## 2.2 Objetivo do Projeto

Desenvolver e validar uma plataforma web mobile-first capaz de permitir o cadastro de usuários, publicação de anúncios, pesquisa de jogos, consulta de referências externas de preço e realização de ofertas entre compradores e vendedores, entregando um fluxo funcional de negociação ao final do projeto.

## 2.3 Escopo do Projeto

### 2.3.1 Escopo do Produto (Visão Geral)

O SaveState Market deverá possuir, em sua versão completa, as seguintes capacidades:

* cadastro e autenticação de usuários;
* publicação de anúncios de jogos usados;
* pesquisa e filtragem de anúncios;
* visualização detalhada dos itens;
* comparação de preços com referências externas;
* envio e recebimento de ofertas;
* registro de pedidos e transações;
* comunicação entre compradores e vendedores;
* perfil e reputação dos usuários;
* sistema de suporte.

### 2.3.2 Escopo do Projeto Inicial (Fase 1 -- MVP)

As funcionalidades obrigatórias para a primeira versão operável são:

* cadastro e autenticação de usuários;
* publicação assistida de anúncios por catálogo;
* pesquisa com filtros;
* visualização dos produtos;
* benchmark de preços;
* fluxo de ofertas;
* registro de pedidos e transações.

### 2.3.3 Fora do Escopo deste Projeto (Fase 2 — Pós-MVP)

As seguintes funcionalidades não fazem parte da linha de base de entrega e critérios formais de validação do MVP para a disciplina de Gerência de TI. 

**Observação sobre o estado do desenvolvimento:** Embora protótipos funcionais e interfaces de algumas dessas funcionalidades já tenham sido previamente desenvolvidos e implementados pelos membros da equipe na base de código do projeto (`src/` e `db.json`), elas foram **formalmente excluídas da linha de base de gerenciamento deste projeto (MVP)** para fins de controle de prazos, estimativas de esforço da EAP e critérios de aceite da AV1:

* **Chat interno em tempo real entre comprador e vendedor (RF08):** Funcionalidade já prototipada na base de código na interface da mesa de negociação (`NegotiationDesk.jsx`) e persistência de mensagens (`messages` em `db.json`), porém desvinculada dos critérios de aceite obrigatórios e da baseline do MVP;
* **Perfil público com sistema de reputação e avaliação (RF09):** Funcionalidade já prototipada na base de código através do perfil operacional (`OperativeProfile.jsx`), com métricas de reputação, taxa de sucesso e avaliações (`profiles` e `profile_reviews` em `db.json`), permanecendo fora da linha de base formal do projeto inicial;
* **Sistema formal de tickets de suporte (RF10):** Funcionalidade já prototipada na base de código através da tela de abertura e acompanhamento de chamados (`SupportTicket.jsx`) e coleção `tickets` no `db.json`, mantida fora da linha de base de entrega do MVP;
* **Desenvolvimento de aplicativo mobile nativo:** Fora do escopo do projeto (a plataforma foca exclusivamente na arquitetura web responsiva mobile-first).

### 2.3.4 Fora do Escopo do Produto

Os seguintes itens não fazem parte do SaveState Market em nenhuma fase:

* criação de uma loja própria de jogos digitais;
* expansão do marketplace para categorias não relacionadas ao escopo definido;
* desenvolvimento de infraestrutura própria para processamento de pagamentos.

## 2.4 Entregas Principais

1. Documento de requisitos e planejamento do projeto.
2. Protótipo da interface da plataforma.
3. Módulo de cadastro e autenticação de usuários.
4. Módulo de publicação e gerenciamento de anúncios.
5. Módulo de pesquisa e visualização de jogos.
6. Módulo de benchmark e comparação de preços.
7. Módulo de ofertas e negociação.
8. Módulo de registro e acompanhamento das transações.
9. Testes, validação e versão final da plataforma.

## 2.5 Partes Interessadas

| Parte interessada | Interesse | Influência / Impacto |
| :--- | :--- | :--- |
| Patrocinador | Viabilizar institucionalmente o projeto, validar entregas estratégicas e emitir o aceite formal dos marcos contratuais (M1 e M2). | Alto impacto e autoridade soberana sobre o aceite e continuidade do projeto. |
| Compradores | Encontrar e adquirir mídias físicas usadas com informações suficientes para comparação. | Alto impacto sobre a adoção e utilização da plataforma. |
| Vendedores | Publicar produtos, definir preços e negociar com compradores. | Alto impacto sobre a quantidade e qualidade dos anúncios. |
| Equipe do projeto | Planejar, desenvolver, testar e evoluir a plataforma. | Alta influência sobre a execução e os resultados. |
| Professor / responsável pela disciplina | Acompanhar, avaliar e validar o desenvolvimento do projeto acadêmico. | Alta influência sobre a aprovação e direcionamento acadêmico. |
| Fornecedores de dados externos | Disponibilizar referências utilizadas para comparação de preços. | Influência técnica sobre o funcionamento do benchmark. |
| Administrador da plataforma | Gerenciar aspectos operacionais e administrativos do sistema. | Influência sobre o funcionamento e a manutenção da plataforma. |

## 2.6 Premissas e Riscos

| Premissa | Risco associado |
| :--- | :--- |
| Os usuários estarão dispostos a utilizar uma plataforma especializada. | Baixa adesão pode reduzir a quantidade de anúncios e a atratividade. |
| Fontes externas de benchmark estarão disponíveis. | Indisponibilidade, limitações ou alterações das APIs podem comprometer o benchmark. |
| As tecnologias escolhidas serão suficientes para o MVP. | Dificuldades técnicas ou curva de aprendizado podem atrasar o fluxo principal. |
| A equipe terá disponibilidade durante o período acadêmico. | Restrições de tempo podem exigir cortes no escopo. |
| Os vendedores fornecerão informações fidedignas. | Informações incorretas podem gerar conflitos entre compradores e vendedores. |

## 2.7 Restrições do Projeto

* o projeto deverá ser desenvolvido dentro do prazo definido para a disciplina;
* a equipe de desenvolvimento será limitada aos integrantes do grupo;
* o desenvolvimento inicial será concentrado em uma plataforma web mobile-first;
* deverá ser priorizado um MVP funcional antes da implementação das funcionalidades complementares;
* a obtenção de referências de preço dependerá da disponibilidade de fontes externas;
* o orçamento disponível é limitado a ferramentas e infraestruturas de custo zero ou planos gratuitos.

## 2.8 Objetivos e Critérios de Sucesso

| Objetivo | Critério de sucesso |
| :--- | :--- |
| Entregar o MVP funcional dentro do prazo acadêmico | O fluxo completo de publicação, pesquisa, benchmark e negociação está operacional até a data de entrega da disciplina. |
| Garantir zero custo de infraestrutura na Fase 1 | Toda a hospedagem e banco de dados utilizam planos gratuitos ou recursos acadêmicos. |
| Alcançar cobertura de 100% dos requisitos do MVP | Todos os requisitos RF01 a RF07 possuem funcionalidade implementada, testada e validada. |
| Manter o escopo controlado | Nenhuma funcionalidade de Pós-MVP é adicionada antes da conclusão e validação do fluxo principal. |
| Validar a integração com fonte externa de preços | A plataforma exibe referências de preço externas para pelo menos uma plataforma de jogos. |
| Obter aprovação acadêmica do projeto | O projeto é aprovado na disciplina de Gerência de Projetos de TI. |

## 2.9 Marcos de Alto Nível

Os marcos de alto nível representam os principais pontos de controle e entregas contratuais do projeto, alinhados rigorosamente aos marcos formais da disciplina (M1 e M2):

| Nº | Marco | Data prevista | Critério de conclusão |
| :--- | :--- | :--- | :--- |
| **M1** | **Marco 1 — Frontend com Backend Simulado** | **05/10/2026** | **Frontend operável sobre `json-server` entregue pela PSW, auditado e verificado contra a EAP.** |
| 1.1 | Termo de Abertura e Plano do Projeto aprovados | 20/08/2026 | Documentação de abertura formalizada e disponível no repositório. |
| 1.2 | Requisitos, Escopo e EAP homologados | 05/09/2026 | Linha de base da EAP e Dicionário aprovados pela equipe. |
| 1.3 | Protótipo da Interface e Módulo de Usuários | 20/09/2026 | Telas principais navegáveis e autenticação local operacional. |
| 1.4 | Publicação, Pesquisa e Negociação Simuladas | 05/10/2026 | Fluxos de anúncio, busca e ofertas funcionais no mock server. |
| **M2** | **Marco 2 — API Própria, Validação e Encerramento** | **02/11/2026** | **Versão final integrada com backend real, testes funcionais concluídos e aceitos.** |
| 2.1 | Catálogo Base e Benchmark Integrados | 17/10/2026 | Entidade de catálogo e referência de preços de mercado ativas. |
| 2.2 | Coleção de Pedidos e API Própria Concluída | 24/10/2026 | Transações registradas em banco relacional definitivo. |
| 2.3 | Bateria de Testes e Validação Final | 29/10/2026 | Testes funcionais e de responsividade homologados. |
| 2.4 | Encerramento Formal e Documentação Consolidada | 02/11/2026 | Artefatos finais aceitos pelo patrocinador e projeto encerrado. |

## 2.10 Orçamento Resumido

O orçamento estimado para o projeto é de **R$ 27.440,00**, calculado com base na taxa-sombra única institucional de R$ 50,00/h sobre a dedicação acadêmica dos 7 integrantes da equipe (490 horas totais no semestre letivo), acrescido de custos diretos e reservas:

* **Esforço da equipe (490h × R$ 50,00/h):** R$ 24.500,00
  * Desenvolvimento (PSW — 3 membros × 14 sem. × 5h/sem. = 210h): R$ 10.500,00
  * Gerência de Projetos (GPTI — 4 membros × 14 sem. × 5h/sem. = 280h): R$ 14.000,00
* **Custos diretos de infraestrutura (domínio):** R$ 40,00
* **Reserva de contingência vinculada a riscos (48h × R$ 50,00/h):** R$ 2.400,00
* **Reserva gerencial:** R$ 500,00
* **Total Geral Estimado:** **R$ 27.440,00**

No contexto acadêmico, os desembolsos financeiros efetivos são limitados a aproximadamente R$ 40,00 (domínio), sendo a infraestrutura hospedada em serviços gratuitos (tier gratuito).

## 2.11 Critérios de Encerramento ou Cancelamento

O projeto poderá ser encerrado quando as funcionalidades prioritárias do MVP forem implementadas, testadas e validadas de acordo com os critérios de sucesso estabelecidos.

O projeto poderá ser reavaliado ou ter seu escopo reduzido caso:

1. as funcionalidades essenciais não possam ser implementadas dentro do prazo estabelecido;
2. uma dependência técnica externa impeça a implementação do benchmark de preços;
3. o crescimento do escopo comprometa a entrega das funcionalidades prioritárias;
4. as restrições existentes tornem inviável a entrega do valor principal definido para o projeto.

## 2.12 Patrocinador e Gerente do Projeto

**Patrocinador:** Patrocinador do Projeto (Papel de Validação e Aceite Formal)

**Gerente de Projeto:** Gustavo Andrade de Souza

O patrocinador será responsável por apoiar e validar decisões estratégicas do projeto e homologar formalmente os marcos contratuais.

O gerente de projeto será responsável pela coordenação das atividades, acompanhamento dos prazos, organização da equipe e controle do escopo.

## 2.13 Autoridade Concedida pelo Termo

Após a aprovação do termo, o gerente de projeto terá autoridade para:

* coordenar as atividades da equipe;
* distribuir tarefas;
* acompanhar prazos;
* organizar reuniões;
* monitorar riscos;
* acompanhar entregas.

Decisões que impliquem alterações significativas no escopo, objetivos, prazos ou entregas principais deverão ser submetidas à avaliação e aprovação do patrocinador.

---

## Aprovação do Termo de Abertura do Projeto

A aprovação formal deste documento autoriza oficialmente o início das atividades de execução e alocação dos recursos previstos no projeto SaveState Market.

**Patrocinador:** Patrocinador do Projeto (Papel de Validação e Aceite Formal)  
**Assinatura:** __________________________________________________  
**Data:** ____ / ____ / ________

<br>

**Gerente de Projeto:** Gustavo Andrade de Souza  
**Assinatura:** __________________________________________________  
**Data:** ____ / ____ / ________
