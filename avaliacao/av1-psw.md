# Correção da AV1 — PSW — SaveState Market

Repositório: https://github.com/madinni/SaveStateMarket

A nota de cada aluno é a parte comum do grupo mais a qualidade individual. Quem não tem commit no aplicativo recebe a parte comum do grupo, sem a parte individual. A parte comum vale 60 pontos: stack da disciplina (30) e escopo funcionando (30). Os 40 restantes avaliam a qualidade do que o próprio aluno fez.

| Aluno | Nota |
| --- | ---: |
| Matheus Dinis Francellino | 70 |
| Luciano Cunha Damaso Mello | 35 |
| Bernardo Dias Borio | 35 |

## Parte comum — 35/60

A stack vale 15/30.

- 5 pontos. React com rotas de catálogo, detalhe, anúncio, ofertas, perfil, login e ticket.
- 0. React Hook Form não está no `package.json` nem no código. Os formulários usam `useState`.
- 0. Zod não está no projeto.
- 0. TanStack Query não está no projeto. As telas chamam a API com `fetch`.
- 5 pontos. O JSON Server sobe com `npm run server` na porta 3001. O README sobe a API e o Vite juntos com `npm run full-dev`.
- 5 pontos. Tailwind é o framework de interface.

O escopo vale 20/30. A régua é o refinamento do grupo 3. Entrei com os operadores que já estavam no `db.json` e criei outro na tela.

- 5 pontos, pesquisar e abrir o anúncio. A busca por "mario" deixou só Super Mario World. O dossiê de "AV1 Chrono Teste" mostra plataforma, preço e o estado da mídia, com caixa, manual e teste funcional.
- 5 pontos, registrar anúncio. O formulário de venda gravou "AV1 Chrono Teste", SNES, R$ 95, vendedor @K3nji_Zero. O registro continuou em `GET /products` e apareceu no catálogo e no perfil.
- 0, atualizar e remover anúncio. O refinamento pede manter o jogo e deletar o anúncio. Não há botão de editar ou excluir, e as telas não enviam `PATCH` nem `DELETE` para `/products`.
- 5 pontos, oferta e negociação. Logado como @Lume, a proposta de R$ 40 no Minecraft foi gravada como `OFF-MUZXCMOV`. A mesa listou 3 salas. RECUSAR deixou a oferta `REJECTED` e gravou a mensagem do sistema.
- 5 pontos, usuário. O cadastro de @Av1Teste, com o e-mail `av1.teste@null-exchange.net`, entrou em `/profiles` e abriu o dossiê. Login e perfil dos operadores de teste também funcionaram. A matriz do refinamento não tem exclusão de conta como caso de uso, e ela fica fora desta conta.
- 0, referência de preço. O refinamento lista a comparação com benchmark externo como UC03, prioridade 1, e não a situa em outra etapa. O cartão do catálogo mostra "BENCHMARK_SCANNER // ACTIVE" e o valor fixo -42,8%. `SystemGuide.jsx` descreve a CheapShark, e nenhuma tela chama essa API.

O README diz que os pushes ficaram com uma pessoa porque o grupo usou Live Share. O histórico tem commits de Matheus Dinis Francellino e de LumeMello. O Live Share deixa o commit no nome de quem hospeda a sessão; o `Co-authored-by` no corpo da mensagem é o que registra os demais autores.

## Matheus Dinis Francellino — 70

O React, o `package.json`, o `db.json` da AV1, a mesa de negociação, o dossiê do anúncio e o ticket estão nos commits dele. A nota reúne os 35 pontos do grupo e 35 de qualidade.

Desconto na parte individual:

- 4 pontos. Em `src/pages/DropAsset.jsx`, o envio do anúncio faz `fetch` e, em seguida, volta para o catálogo. A tela não confere se a resposta veio com sucesso.
- 1 ponto. Em `src/pages/AuthLogin.jsx`, o login consulta `/profiles` com o e-mail e a senha na própria URL. Com o JSON Server esse é o caminho disponível para a consulta; o ponto é pela senha ficar no histórico do navegador e no log do servidor.

O catálogo separa carregando e lista vazia. A proposta só segue depois de `response.ok`. A mesa impede quem fez a última ação de aceitar a própria oferta.

## Luciano Cunha Damaso Mello — 35

O commit "Versão inicial do sistema", no nome LumeMello, cria as páginas HTML `index.html`, `login.html`, `offers.html`, `product.html`, `profile.html`, `sell.html` e `ticket.html`. O commit seguinte de Matheus, "react1.0", apaga essas páginas e coloca o React que está no ar. Os outros commits de LumeMello alteram o README. O refinamento atribui a ele condição da mídia, anúncio, jogo e transação. Essa parte, na entrega que roda, está no histórico de Matheus. A nota é a parte comum do grupo, 35 pontos. Sem commit no aplicativo React, não há parte individual a avaliar.

## Bernardo Dias Borio — 35

Não há commit, e-mail nem arquivo com o nome dele no repositório. O refinamento atribui a ele a referência de preço e, junto com Luciano, o jogo base. O banner de benchmark está em `src/pages/MarketFeed.jsx`, no commit "react1.0" de Matheus. A nota é a parte comum do grupo, 35 pontos. Sem commit, não há parte individual a avaliar.
