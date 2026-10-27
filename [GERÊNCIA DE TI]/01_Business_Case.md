# CENTRO FEDERAL DE EDUCAÇÃO TECNOLÓGICA CELSO SUCKOW DA FONSECA -- CEFET/RJ

Curso de Graduação

## GERÊNCIA DE PROJETOS DE TI

### SAVESTATE MARKET
Artefato 01: Business Case Simplificado

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

# 1. Business Case

## 1.1 Identificação e Propósito do Projeto

**Nome do projeto:** SaveState Market.

**Grupo:** Grupo 3.

**Declaração de propósito:**
Desenvolver uma plataforma web mobile-first especializada na compra, venda e troca de mídias físicas de jogos eletrônicos usados. A solução visa estruturar o mercado secundário por meio da consolidação de anúncios, fornecimento de referências de preços médios praticados no mercado e padronização do registro das condições físicas de conservação dos itens.

## 1.2 Problema ou Necessidade

O mercado de mídias físicas e jogos usados opera de forma fragmentada, com anúncios distribuídos entre redes sociais, marketplaces e outros canais de negociação.

Esse cenário gera problemas significativos para compradores e vendedores, principalmente relacionados à falta de informações centralizadas, à dificuldade de comparação de preços e à ausência de padronização na descrição das condições dos produtos.

Os principais problemas identificados são:

* **Inexistência de referências centralizadas de preço:** compradores têm dificuldade para avaliar se determinado valor é justo, enquanto vendedores não possuem parâmetros consolidados para definir preços competitivos.
* **Subjetividade na avaliação da conservação:** anúncios podem omitir informações sobre riscos, integridade das caixas, presença de manuais ou funcionamento da mídia.
* **Elevado esforço de pesquisa e negociação:** a dispersão das ofertas em diferentes canais exige pesquisa manual e comunicação pouco estruturada entre compradores e vendedores.

## 1.3 Situação Atual

Atualmente, anúncios de jogos usados podem estar distribuídos em diferentes marketplaces, redes sociais e canais de negociação.

A ausência de um ambiente especializado dificulta a comparação entre ofertas e a avaliação conjunta de preço e condição do produto.

### Situação atual e problemas gerados

| Situação atual | Problema gerado |
| :--- | :--- |
| Ofertas distribuídas em diferentes canais | Dificuldade de localizar e comparar produtos. |
| Preços definidos individualmente | Ausência de uma referência centralizada de mercado. |
| Informações sobre conservação fornecidas pelos vendedores | Possibilidade de informações incompletas ou inconsistentes. |
| Pesquisa de preços realizada manualmente | Maior esforço para compradores e vendedores. |
| Negociações realizadas em diferentes ambientes | Menor centralização das informações da negociação. |

## 1.4 Oportunidade de Negócio

A oportunidade identificada consiste na criação de uma plataforma especializada em mídias físicas de jogos usados, capaz de centralizar anúncios e utilizar referências externas de preços para auxiliar os usuários durante a compra e a venda.

O diferencial do SaveState Market está na combinação de três elementos:

1. marketplace especializado em jogos físicos usados;
2. comparação de preços utilizando referências externas;
3. informações estruturadas sobre a condição física dos produtos.

Dessa forma, a plataforma busca transformar informações atualmente dispersas em referências úteis para a tomada de decisão.

## 1.5 Valor Esperado

O projeto busca gerar valor por meio dos seguintes resultados mensuráveis:

* o protótipo permite que um vendedor publique um anúncio com jogo selecionado do catálogo, condição da mídia em campos estruturados e fotos em um fluxo assistido;
* o protótipo exibe, para cada anúncio, uma referência de preço de mercado obtida de fonte externa para o mesmo título e plataforma;
* o fluxo completo — do cadastro do usuário à publicação do anúncio, pesquisa, envio de oferta e registro da transação — é executável de ponta a ponta no protótipo;
* a pesquisa retorna anúncios filtrados por título, plataforma e condição da mídia;
* centralização de anúncios de mídias físicas em um ambiente dedicado a videogames;
* informações padronizadas sobre a conservação do item, com campos obrigatórios para condição da mídia, caixa e manual.

## 1.6 Proposta de Valor

### 1.6.1 Valor para Compradores

Para os compradores, a plataforma oferecerá:

* centralização de anúncios de mídias físicas;
* comparação de preços com referências externas de mercado;
* visualização estruturada das condições da mídia, caixa e demais componentes;
* maior transparência durante a negociação;
* facilidade para pesquisar e comparar diferentes ofertas.

### 1.6.2 Valor para Vendedores

Para os vendedores, a solução oferecerá:

* cadastro assistido por catálogo pré-existente de jogos e plataformas;
* auxílio na definição de preços competitivos;
* publicação estruturada por meio de campos guiados;
* painel para gerenciamento de inventário e anúncios ativos;
* maior exposição dos produtos para compradores interessados.

## 1.7 Processo de Negócio Principal

O fluxo central de geração de valor do SaveState Market é composto pelas seguintes etapas:

1. **Autenticação:** o usuário acessa o sistema como comprador ou vendedor utilizando uma conta única.
2. **Cadastro assistido do anúncio:** o vendedor localiza o título no catálogo do sistema e preenche informações sobre a conservação e fotos reais do produto.
3. **Referência de preço:** a plataforma consulta fontes externas de benchmark e apresenta uma faixa de preço de mercado.
4. **Publicação da oferta:** o vendedor valida as informações, define o preço final e publica o anúncio.
5. **Descoberta e comparação:** o comprador pesquisa o jogo, consulta informações, fotos e compara o preço anunciado com a referência de mercado.
6. **Negociação e fechamento:** o comprador realiza uma proposta ou aceita o preço anunciado e o sistema registra o pedido, formalizando a transação.

## 1.8 Alternativas Consideradas

### 1.8.1 Alternativa 1 -- Manter a Situação Atual

Continuar utilizando marketplaces, redes sociais e outros canais existentes.

Essa alternativa não exige desenvolvimento de uma nova solução, porém mantém a dispersão das ofertas e a dificuldade de comparação de preços.

### 1.8.2 Alternativa 2 -- Utilizar um Marketplace Genérico

Utilizar plataformas de comércio eletrônico existentes para centralizar os anúncios.

Embora essa alternativa facilite a publicação dos produtos, ela não resolve especificamente a necessidade de comparação com referências de preço nem a organização das informações relacionadas à condição das mídias físicas.

### 1.8.3 Alternativa 3 -- Desenvolver o SaveState Market

Desenvolver uma plataforma própria especializada em mídias físicas de jogos usados, integrando publicação de anúncios, pesquisa, comparação de preços, negociação e registro das transações.

## 1.9 Alternativa Escolhida

A alternativa escolhida é o desenvolvimento do SaveState Market.

Essa alternativa apresenta maior alinhamento com o problema identificado porque reúne em um único ambiente as atividades de publicação de anúncios, pesquisa, comparação de preços, visualização das condições dos produtos, negociação e acompanhamento das transações.

O uso de referências externas de preço constitui um diferencial da solução, auxiliando compradores e vendedores na avaliação dos valores praticados no mercado.

## 1.10 Viabilidade Inicial

### 1.10.1 Viabilidade Técnica

O projeto apresenta viabilidade técnica para uma primeira versão web, uma vez que suas funcionalidades podem ser implementadas utilizando tecnologias de desenvolvimento web e integração com fontes externas de dados.

A principal dependência técnica está relacionada à disponibilidade e ao formato das fontes utilizadas para o benchmark de preços.

### 1.10.2 Viabilidade Operacional

A solução poderá ser utilizada por compradores e vendedores por meio de uma interface web mobile-first, permitindo acesso às principais funcionalidades sem a necessidade de desenvolvimento de um aplicativo mobile nativo.

### 1.10.3 Viabilidade Econômica

O desenvolvimento inicial utilizará tecnologias e ferramentas de código aberto, sem custo de licenciamento. O dimensionamento econômico é estruturado a partir da **taxa-sombra única institucional de R$ 50,00/h** aplicada sobre a dedicação acadêmica formal dos 7 integrantes da equipe (5 horas semanais por membro ao longo das 14 semanas letivas, totalizando 490 horas de esforço), complementado por custos diretos de infraestrutura e reservas formais:

#### Estimativa de custos do projeto

| Categoria | Detalhamento | Qtde | Valor unitário | Total estimado |
| :--- | :--- | :--- | :--- | :--- |
| Esforço de Desenvolvimento (PSW) | 3 integrantes (Bernardo, Luciano, Matheus) × 14 sem. × 5h/sem. | 210h | R$ 50,00/h | R$ 10.500,00 |
| Esforço de Gerenciamento (GPTI) | 4 integrantes (Gustavo, Letícia, Maria Clara, Rafael) × 14 sem. × 5h/sem. | 280h | R$ 50,00/h | R$ 14.000,00 |
| Hospedagem em nuvem | Tier gratuito (Vite + json-server em ambiente local/nuvem gratuita) | 6 meses | R$ 0,00 | R$ 0,00 |
| Registro de domínio | Domínio próprio para plataforma | 1 ano | R$ 40,00 | R$ 40,00 |
| Ferramentas de desenvolvimento | Git, GitHub, VS Code, Pipefy (planos educacionais/gratuitos) | --- | R$ 0,00 | R$ 0,00 |
| Reserva de contingência¹ | Vinculada a riscos específicos (48h × R$ 50,00/h) | 48h | R$ 50,00/h | R$ 2.400,00 |
| Reserva gerencial | Margem gerencial para imprevistos estratégicos (~2%) | --- | --- | R$ 500,00 |
| **Custo total estimado** | | | | **R$ 27.440,00** |

¹ **Composição da reserva de contingência (vinculada aos eventos de risco da Matriz):**

| Risco vinculado | Impacto estimado | Reserva |
| :--- | :--- | ---: |
| Dependência de fontes externas (retrabalho de integração da API de benchmark) | 20h × R$ 50,00/h | R$ 1.000,00 |
| Atraso por curva de aprendizado (horas adicionais de capacitação na stack) | 16h × R$ 50,00/h | R$ 800,00 |
| Crescimento do escopo (retrabalho de alinhamento e refino de requisitos) | 12h × R$ 50,00/h | R$ 600,00 |
| **Total da reserva de contingência** | | **R$ 2.400,00** |

**Observação:** Os valores de esforço da equipe representam valoração acadêmica por taxa-sombra institucional única para fins de controle gerencial e orçamentário. No contexto acadêmico, o desembolso financeiro efetivo é restrito a R$ 40,00 (domínio), sendo a infraestrutura hospedada em serviços sem custos.

O modelo de receita previsto para uma eventual operação comercial pós-acadêmica seria baseado em taxa por transação concluída, com percentual a ser definido em estudo de mercado futuro.

### 1.10.4 Viabilidade de Mercado

A oportunidade está relacionada à existência de ofertas dispersas e à dificuldade de comparação de preços no mercado de jogos físicos usados.

A especialização da plataforma e o uso de referências externas representam mecanismos de diferenciação em relação aos marketplaces genéricos.

## 1.11 Benefícios Esperados

### Benefícios esperados

| Público | Benefício |
| :--- | :--- |
| **Compradores** | Maior assertividade na localização de títulos e avaliação das condições dos produtos. |
| **Vendedores** | Redução do esforço para criação dos anúncios e maior assertividade na definição dos preços. |
| **Negociação** | Redução da necessidade de comunicação desestruturada em canais externos. |
| **Plataforma** | Possível redução de cancelamentos e disputas causadas por divergências sobre a condição dos produtos. |

## 1.12 Principais Riscos Iniciais

1. **Dependência de fontes externas:** indisponibilidade, limitações ou alterações nas APIs e fontes utilizadas podem comprometer o benchmark de preços.
2. **Confiabilidade das informações:** informações incorretas fornecidas pelos vendedores podem gerar conflitos e reduzir a confiança na plataforma.
3. **Baixa adesão de usuários:** uma quantidade reduzida de compradores ou vendedores pode diminuir a variedade de anúncios.
4. **Fraudes e conflitos:** negociações podem envolver informações falsas ou problemas relacionados aos produtos.
5. **Crescimento do escopo:** novas funcionalidades podem aumentar a complexidade e comprometer o prazo disponível.
6. **Segurança e privacidade:** o sistema poderá lidar com informações de usuários, mensagens e registros de transações.

## 1.13 Premissas Iniciais

* Os usuários estarão dispostos a utilizar uma plataforma especializada para negociação de mídias físicas.
* Será viável obter referências confiáveis de preços por meio de fontes externas ou APIs compatíveis.
* As tecnologias escolhidas serão suficientes para implementar as funcionalidades prioritárias dentro do prazo acadêmico.
* A equipe terá disponibilidade e dedicação regular durante o período letivo.
* Os vendedores fornecerão informações e fotos condizentes com o estado real dos produtos.

---

## Aprovação do Business Case

**Patrocinador:** Patrocinador do Projeto (Papel de Validação e Aceite Formal)  
**Assinatura:** __________________________________________________  
**Data:** ____ / ____ / ________

<br>

**Gerente de Projeto:** Gustavo Andrade de Souza  
**Assinatura:** __________________________________________________  
**Data:** ____ / ____ / ________
