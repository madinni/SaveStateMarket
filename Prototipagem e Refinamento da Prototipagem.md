# Trabalho PSW

**Grupo 3:**
* Bernardo Dias Borio
* Luciano Cunha Damaso Mello
* Matheus Dinis Francellino

---

## Matriz CRUD

| Caso de Uso | Usuário | Jogo Base | Anúncio | Condição Mídia | Referência Preço | Transação |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| UC01: Sugerir preço de venda | | R | R | | R | |
| UC02: Pesquisar jogos | C, U | | R | | | |
| UC03: Comparar preço com benchmark Externo | | | R | | R, U | |
| UC04: Visualizar detalhe e estado da mídia | R | R | R | R | | |
| UC05: Avaliar oferta | R, U, D | | R | | | |
| UC06: Registrar pedido de compra | R | U | | C | | |
| UC07: Avaliar o vendedor | C, R, U | | | | | |
| UC08: Iniciar chat entre vendedor e comprador | C, R | | | | | |
| UC09: Sistema rastreio | R | | | R, U | | |
| UC10: Enviar oferta | C, U | R | | | | |
| UC11: Sistema de alerta de preço | C, U, D | R | R, U | | | |
| UC12: Abrir ticket suporte | C, R, U, D | | | | | |
| UC13: Manter dados do jogo | | C, R, U, D | C, D | | | |
| UC14: Registrar anúncio | | C | C, U | | | |
| UC15: Deletar anúncio | | D | D | | | |
| UC16: Cancelar pedido compra | C | | | D | | |

---

## Matriz Perfil x Funcionalidade

| Caso de Uso / Funcionalidade | Comprador | Vendedor | Administrador |
| :--- | :--- | :--- | :--- |
| UC01: Sugerir preço de venda | | X | |
| UC02: Pesquisar jogos | X | | X |
| UC03: Comparar preço com benchmark Externo | X | X | X |
| UC04: Visualizar detalhe e estado da mídia | X | | X |
| UC05: Fazer oferta | X | | |
| UC06: Registrar pedido de compra | X | | |
| UC07: Avaliar o usuário | X | | X |
| UC08: Iniciar chat entre vendedor e comprador | X | | |
| UC09: Sistema rastreio | X | X | X |
| UC10: Enviar oferta | X | | |
| UC11: Sistema de alerta de preço | X | | |
| UC12: Abrir ticket suporte | X | X | X |
| UC13: Manter dados do jogo | | | X |
| UC14: Registrar anúncio | | X | |
| UC15: Deletar anúncio | | X | X |
| UC16: Cancelar pedido compra | X | X | X |

**Legenda:**
* **X** - Tem acesso
* (Espaço em branco) - Não tem acesso

---

## Responsáveis por entidade/funcionalidade:

* **Usuário** - Matheus
* **Referência Preço** - Bernardo
* **Jogo Base** - Luciano/Bernardo
* **Condição Mídia** - Luciano
* **Anúncio** - Luciano/Matheus
* **Transação** - Luciano

---

## Priorização dos Requisitos:

| ID | Caso de Uso | Prioridade | Nível |
| :--- | :--- | :--- | :--- |
| UC03 | Comparar preço com benchmark Externo | Muito Alto | 1 |
| UC02 | Pesquisar jogos | Muito Alto | 1 |
| UC13 | Manter dados do Jogo | Muito Alto | 1 |
| UC05 | Fazer oferta | Alto | 2 |
| UC14 | Registrar anúncio | Alto | 2 |
| UC15 | Deletar anúncio | Alto | 2 |
| UC06 | Registrar pedido de compra | Alto | 2 |
| UC16 | Cancelar pedido de compra | Alto | 2 |
| UC10 | Enviar oferta | Alto | 2 |
| UC01 | Sugerir preço de venda | Médio | 3 |
| UC04 | Visualizar detalhe e estado da mídia | Médio | 3 |
| UC11 | Sistema de alerta de preço | Médio | 3 |
| UC07 | Avaliar o usuário | Baixo | 4 |
| UC08 | Iniciar chat entre vendedor e comprador | Baixo | 4 |
| UC09 | Sistema rastreio | Baixo | 4 |
| UC12 | Abrir ticket suporte | Baixo | 4 |