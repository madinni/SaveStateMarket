# Correção da AV1 — GPTI — SaveState Market

Repositório do grupo: https://github.com/madinni/SaveStateMarket

Artefato: `AV1 - BusinessCase, Termo, Plano e EAP.md`, no repositório https://github.com/semdoce/gerencia-ti, commit `bd8f3a8a` de 04/10/2026 às 22h50. A cópia em `[GERÊNCIA DE TI]/` no SaveStateMarket é de 13/10. A correção usa a versão de 04/10, que está no prazo. O caso, o termo, o plano, a EAP e o dicionário estão no mesmo arquivo, com 954 linhas.

A nota é do Grupo D de GPTI e vale para cada aluno do grupo. Nesta etapa, a ausência de commit não zera ninguém. O nome na atividade do cronograma é o contrato da etapa seguinte. A especificação de referência é o refinamento do grupo 3 de PSW, corrigido na AV1 de PSW: catálogo, anúncio com condição da mídia, pesquisa, benchmark externo, oferta e negociação, usuário, sobre `json-server`.

Maria Clara Mousinho de Salles e Letícia Mendonça dos Santos têm outra nota, na AV1 de PSW do Fio a Fio. Esta nota é a do papel de GPTI no SaveState Market.

| Aluno | Nota |
| --- | ---: |
| Maria Clara Mousinho de Salles | 51 |
| Letícia Mendonça dos Santos | 51 |
| Gustavo Andrade de Souza | 51 |
| Rafael Barrionuevo de Souza | 51 |

## Parte comum — 51/100

| Parte | Nota |
| --- | ---: |
| Business case | 8/10 |
| Termo de abertura | 9/15 |
| Escopo e EAP | 11/15 |
| Cronograma com nomes | 4/25 |
| Custo, partes e riscos | 8/15 |
| Dicionário da EAP | 9/15 |
| Um projeto só | 2/5 |

O documento tem as cinco partes, com sumário, e trata do mesmo produto do início ao fim. O que atravessa todas as partes é a ausência dos alunos: o gerente do projeto é o professor, o patrocinador está em branco, e o responsável no cronograma e no dicionário é "Equipe", "Desenvolvedores" ou o professor. A capa lista os sete integrantes; nenhum deles aparece em uma atividade, um pacote, um risco ou uma comunicação.

### Business case — 8/10

O caso segue a estrutura do molde: propósito, problema, situação atual com tabela, oportunidade, valor esperado com metas, proposta de valor para comprador e vendedor, processo de negócio em seis etapas, três alternativas com a escolha justificada, viabilidade em quatro dimensões, benefícios, riscos e premissas.

Descontos:

- 1 ponto. O valor esperado (50% a menos no tempo de pesquisa, 30% a menos nas desistências, benchmark em 100% dos anúncios) é o retorno de uma operação comercial, apresentado como o retorno deste projeto. O protótipo da disciplina não mede nenhum desses três.
- 1 ponto. A estimativa de custos é de 420 h de desenvolvimento a R$ 50/h e 80 h de gerenciamento a R$ 80/h. O molde da disciplina mede o protótipo em horas de 5 h semanais por pessoa e taxa-sombra única, e os quatro alunos de GPTI não entram nessas 80 h.

### Termo de abertura — 9/15

O termo traz finalidade, objetivo, escopo do produto e do projeto, dentro e fora, entregas, partes interessadas, premissas com risco associado, restrições, critérios de sucesso, marcos, orçamento resumido, critérios de encerramento e autoridade do gerente.

Descontos:

- 2 pontos. O patrocinador está em branco na seção 2.12 e na aprovação da seção 10. Sem patrocinador, o termo não tem quem o autorize.
- 2 pontos. O gerente do projeto é o professor. A autoridade da seção 2.13 (coordenar, distribuir tarefas, acompanhar prazos) é concedida a quem avalia o projeto. Nenhum dos quatro alunos de GPTI recebe papel no termo.
- 1 ponto. Os marcos 1 a 3 (15/08, 29/08, 12/09) são anteriores ao início deste plano, e nenhum marco corresponde ao M1 de 05/10 e ao M2 de 30/11 da disciplina.
- 1 ponto. Caso, termo, plano, EAP e dicionário estão no mesmo arquivo. São documentos separados no molde, com aprovação própria.

### Escopo e EAP — 11/15

O escopo do produto (2.3.1), do MVP (2.3.2) e o fora de escopo (2.3.3 e 2.3.4) são claros. Os requisitos RF01 a RF10 separam MVP e pós-MVP. A EAP tem seis entregas de primeiro nível, decompostas até o módulo e, no desenvolvimento, até a função. A matriz de rastreabilidade liga requisito, pacote, fase e critério. O MVP é a mesma loja do refinamento de PSW: anúncio com condição da mídia, pesquisa, benchmark, oferta e transação.

Descontos:

- 2 pontos. RNF02 (3 segundos em 4G), RNF03 (hash com bcrypt ou argon2) e RNF05 (uptime de 99%) são requisitos de produção dentro da linha de base do MVP. O protótipo roda sobre `json-server`, sem servidor, sem hash e sem disponibilidade a medir.
- 1 ponto. O refinamento de PSW tem o jogo base e o catálogo como entidades com dono. A EAP não tem um pacote para o catálogo; ele aparece como entrada do 4.2.
- 1 ponto. O pacote 5 (Pós-MVP) está dentro da EAP com estimativa "a definir". Um pacote sem estimativa na linha de base não é um pacote da linha de base.

### Cronograma com nomes — 4/25

A seção 3.3 tem doze linhas com duração, início e fim, de 01/08 a 21/11, e as janelas de 4.3 e 4.6 sobrepostas às de 4.2 e 4.5 mostram paralelismo. Isso sustenta os 4 pontos.

Descontos:

- 13 pontos. O cronograma para no pacote. O responsável é "Equipe", "Desenvolvedores" ou o professor. Nenhum dos sete integrantes está em linha alguma. Não há lista de atividades com uma pessoa, uma predecessora e uma duração.
- 5 pontos. Não há predecessora declarada na tabela, caminho crítico ou folga. As dependências estão só no dicionário, no nível do pacote.
- 3 pontos. Não há alocação semanal com uma pessoa, uma tarefa e as horas.

### Custo, partes e riscos — 8/15

O orçamento (1.10.3 e 2.10) soma R$ 30.184, com contingência de R$ 2.744. As partes interessadas (2.5) têm interesse e influência. Há sete riscos com probabilidade, impacto, severidade, estratégia e contingência (3.8), e um plano de comunicação (3.9).

Descontos:

- 2 pontos. O orçamento é o de uma equipe contratada: 420 h a R$ 50/h, 80 h a R$ 80/h, hospedagem por seis meses e domínio. O molde da disciplina mede horas dos alunos com taxa-sombra. O orçamento não é o deste projeto.
- 2 pontos. A contingência é um percentual, 10%, sem ligação com um evento de risco da tabela 3.8, e não há reserva gerencial separada.
- 1 ponto. Os sete riscos são ameaças. A linha "Explorar: divulgação em comunidades" é a resposta a uma ameaça, baixa adesão. Não há uma oportunidade registrada.
- 1 ponto. Os responsáveis por risco e por comunicação são "Equipe", "Gerente de projeto" ou "Gerente e equipe". Nenhum risco tem o nome de um aluno.
- 1 ponto. O patrocinador não está entre as partes interessadas, e o professor aparece como "Professor / responsável pela disciplina", com interesse de avaliar.

### Dicionário da EAP — 9/15

Cada entrada tem código, descrição, responsável, entradas, saídas, dependências, critério de aceite, prioridade e estimativa. O aceite dos módulos 4.1 a 4.6 é observável: "vendedor consegue cadastrar e publicar um anúncio contendo jogo selecionado do catálogo, condição da mídia em campos estruturados, fotos reais do produto e preço definido"; "o preço anunciado é exibido ao lado de uma referência externa de mercado para o mesmo título e plataforma". As dependências encadeiam 4.1 → 4.2 → 4.3 → 4.4 e 4.3 → 4.5 → 4.6.

Descontos:

- 4 pontos. O responsável é "Equipe de desenvolvimento", "Equipe do projeto" ou o professor em todas as doze entradas. Não há um A nominal em pacote algum.
- 2 pontos. As folhas da EAP (1.1 a 1.4, 2.1 a 2.4, 3.1 a 3.4, 4.x.y, 6.1 a 6.6) não têm entrada. O dicionário para no módulo, um nível acima da folha.

### Um projeto só — 2/5

O produto é o mesmo nas cinco partes, e os códigos da EAP batem com o dicionário e com a rastreabilidade.

Descontos:

- 2 pontos. A seção 8 diz que os artefatos estão em `savestate-market/projeto-gp`, que não existe. No prazo, o arquivo estava em `semdoce/gerencia-ti`, fora do repositório do grupo; a cópia para o SaveStateMarket é de 13/10.
- 1 ponto. A capa lista sete integrantes e quatro na equipe de gerenciamento; o corpo do documento nomeia só o professor.

## O que esta nota deixa para a etapa seguinte

A etapa seguinte não tem, neste plano, uma atividade, um pacote ou um risco no nome de um aluno. O único nome em todo o documento é o do professor. Sem a semana e a tarefa no nome de cada pessoa, a etapa seguinte não tem o que cobrar de Maria Clara, Letícia, Gustavo ou Rafael além da execução genérica de "Equipe".
