# Trabalho 5 – Plano Integrado e Escopo
Gerência de Projetos de TI
CEFET/RJ

**Integrantes:**
Gustavo Andrade
Letícia Mendonça
Maria Clara Mousinho
Rafael Barrionuevo

## 1. Requisitos

| ID | Requisito | Tipo | Origem |
| :--- | :--- | :--- | :--- |
| REQ-01 | As informações das inscrições devem ser centralizadas em um único processo de gerenciamento. | Negócio | Gestão de Pessoas |
| REQ-02 | O candidato deve conseguir realizar sua inscrição de forma independente. | Usuário | Candidato |
| REQ-03 | O candidato deve conseguir acompanhar o status de sua inscrição durante o processo seletivo. | Usuário | Candidato |
| REQ-04 | Os responsáveis pelo processo devem conseguir consultar e atualizar as informações dos candidatos. | Funcional | Gestão de Pessoas |
| REQ-05 | O processo deve permitir o registro da etapa em que cada candidato se encontra. | Funcional | Gestão de Pessoas |
| REQ-06 | As informações dos candidatos devem ser acessíveis somente por pessoas autorizadas. | Não funcional | Gestão de Pessoas / Web |
| REQ-07 | O acesso ao sistema deve ocorrer por navegador web. | Restrição | Projeto |
| REQ-08 | O processo deve reduzir a dependência de planilhas para o gerenciamento das inscrições. | Negócio | Gestão de Pessoas |

## 2. Necessidade e solução

**Necessidade 1**
O candidato precisa saber em que situação sua inscrição se encontra.

**Possíveis soluções:**
Área de acompanhamento no sistema, notificações ou outro mecanismo de consulta.

**Necessidade 2**
Os responsáveis precisam gerenciar as informações dos candidatos sem depender de múltiplas planilhas.

**Possíveis soluções:**
Sistema centralizado de gerenciamento, banco de dados integrado ou outra solução que centralize as informações.

**Necessidade 3**
Os responsáveis precisam controlar em qual etapa do processo cada candidato está.

**Possíveis soluções:**
Controle de etapas dentro do sistema, painel de acompanhamento ou outro mecanismo de gerenciamento.

## 3. Itens fora do escopo

1. Desenvolvimento de aplicativo móvel nativo.
2. Reestruturação completa dos sistemas do IEEE.
3. Implantação da solução em outros ramos estudantis.

## 4. Declaração do escopo

### 4.1 Objetivo
Desenvolver uma solução web para centralizar e gerenciar o processo de ingresso de novos membros do ramo, reduzindo a dependência de procedimentos manuais e facilitando o acompanhamento das inscrições.

### 4.2 Entregas principais
1. Processo de inscrição de candidatos.
2. Gerenciamento das informações dos candidatos.
3. Acompanhamento das etapas e status das inscrições.
4. Preparação da solução para utilização no processo seletivo.

### 4.3 Exclusões
1. Aplicativo móvel nativo.
2. Reestruturação completa dos sistemas do IEEE.
3. Implantação da solução em outros ramos estudantis.

### 4.4 Premissas
1. Os líderes de Gestão de Pessoas e Web estarão disponíveis para validar as necessidades e entregas.
**Risco associado:** A ausência de validação pode provocar retrabalho ou atrasar decisões sobre o escopo.

2. Os candidatos utilizarão o novo processo como principal meio de inscrição.
**Risco associado:** A manutenção de processos paralelos pode reduzir o benefício esperado de centralização.

### 4.5 Critérios de aceite
1. Uma inscrição pode ser realizada e suas informações ficam registradas de forma consultável.
2. O candidato consegue verificar o status correspondente à etapa em que sua inscrição se encontra.
3. Os responsáveis conseguem consultar e atualizar as informações dos candidatos sem que a planilha seja necessária como etapa obrigatória do processo.

## 5. Estrutura Analítica do Projeto (EAP)

Sistema de Ingresso de Novos Membros
- Gestão do Projeto
- Inscrição de Candidatos
- Gerenciamento de Candidatos
- Acompanhamento do Processo Seletivo
  - Controle das etapas
  - Atualização do status
  - Consulta do andamento
- Controle de Acesso
- Validação e Testes
- Preparação para Utilização

## 6. Aceite de três folhas da EAP

**1.4.1 – Controle das etapas**
**Critério de aceite:**
Os responsáveis conseguem identificar em qual etapa do processo seletivo cada candidato se encontra.

**1.4.2 – Atualização do status**
**Critério de aceite:**
Os responsáveis conseguem atualizar o status de uma inscrição, e a alteração fica registrada para consulta.

**1.4.3 – Consulta do andamento**
**Critério de aceite:**
O candidato consegue consultar o status correspondente à situação atual de sua inscrição.
