// Limitador de taxa em memória (janela fixa), reaproveitado pelo login, troca de senha,
// cadastro e tickets de visitante. Conte com hit() ANTES do trabalho caro (bcrypt, gravação
// no banco). Atrás de proxy, req.ip só é confiável com app.set("trust proxy", ...),
// que não é ativado por padrão.
const limitadores = new Set();

export function criarLimitador({ max, janelaMs }) {
  const registros = new Map(); // chave → { count, inicio }

  const ativo = (chave, agora = Date.now()) => {
    const registro = registros.get(chave);
    if (!registro) return null;
    if (agora - registro.inicio >= janelaMs) {
      registros.delete(chave);
      return null;
    }
    return registro;
  };

  const limitador = {
    // true se a chave já atingiu o máximo dentro da janela.
    bloqueado: (chave) => (ativo(chave)?.count ?? 0) >= max,
    // Registra uma tentativa.
    hit(chave) {
      const agora = Date.now();
      const registro = ativo(chave, agora);
      if (registro) registro.count += 1;
      else registros.set(chave, { count: 1, inicio: agora });
      // Faxina simples para o Map não crescer sem limite.
      if (registros.size > 10000) {
        for (const [k, r] of registros) if (agora - r.inicio >= janelaMs) registros.delete(k);
      }
    },
    // Desfaz uma tentativa registrada (ex.: o login deu certo e não deve contar como falha).
    desfazer(chave) {
      const registro = ativo(chave);
      if (registro) registro.count = Math.max(0, registro.count - 1);
    },
    reset: (chave) => registros.delete(chave),
    resetAll: () => registros.clear(),
  };
  limitadores.add(limitador);
  return limitador;
}

export const ipDe = (req) => req.ip || req.socket?.remoteAddress || "?";

// Usado pelos testes para não deixar contadores vazarem entre cenários.
export function resetAllLimiters() {
  for (const limitador of limitadores) limitador.resetAll();
}
