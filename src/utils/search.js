// Busca por título com tolerância a erro de digitação (coeficiente de Sørensen-Dice).
// Tudo puro e client-side: roda sobre os anúncios que o feed já carregou.

// "Chrono Trigger (SNES)" → "chrono trigger snes" (sem acento, minúsculo, só letras/números).
export const normalizeText = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

// Pares de letras vizinhas de cada palavra: "trigr" → tr, ri, ig, gr.
const bigrams = (text) => {
  const pairs = new Map();
  for (const word of text.split(" ")) {
    for (let i = 0; i < word.length - 1; i += 1) {
      const pair = word.slice(i, i + 2);
      pairs.set(pair, (pairs.get(pair) || 0) + 1);
    }
  }
  return pairs;
};

const countPairs = (pairs) => [...pairs.values()].reduce((sum, n) => sum + n, 0);

// Sørensen-Dice: 2·|A∩B| / (|A| + |B|) sobre os bigramas. 1 = iguais, 0 = nada em comum.
export function diceCoefficient(a, b) {
  const left = normalizeText(a);
  const right = normalizeText(b);
  if (!left || !right) return 0;
  if (left === right) return 1;

  const leftPairs = bigrams(left);
  const rightPairs = bigrams(right);
  const total = countPairs(leftPairs) + countPairs(rightPairs);
  if (total === 0) return 0; // palavras de uma letra só

  let shared = 0;
  for (const [pair, count] of leftPairs) {
    shared += Math.min(count, rightPairs.get(pair) || 0);
  }
  return (2 * shared) / total;
}

// Nota de 0 a 1 de quanto o título combina com o termo digitado.
// Trecho exato (ou começo de palavra) ganha de similaridade aproximada.
export function titleScore(title, term) {
  const t = normalizeText(title);
  const q = normalizeText(term);
  if (!q || !t) return 0;
  if (t.startsWith(q)) return 1;
  if (t.includes(` ${q}`)) return 0.95;
  if (t.includes(q)) return 0.9;
  // Compara com o título inteiro e com o trecho do mesmo tamanho do termo (ex.: "chrono trigr").
  const prefix = t.slice(0, q.length + 2);
  return Math.max(diceCoefficient(t, q), diceCoefficient(prefix, q)) * 0.85;
}

// Limiar a partir do qual um título conta como "parecido" com o termo.
export const FUZZY_THRESHOLD = 0.45;

export const matchesTitle = (title, term) => !normalizeText(term) || titleScore(title, term) >= FUZZY_THRESHOLD;

// Sugestões únicas de título, da mais parecida para a menos, no máximo `limit`.
export function suggestTitles(titles, term, limit = 6) {
  if (!normalizeText(term)) return [];
  const best = new Map(); // título normalizado → { title, score }
  for (const title of titles) {
    if (!title) continue;
    const score = titleScore(title, term);
    if (score < FUZZY_THRESHOLD) continue;
    const key = normalizeText(title);
    if (!best.has(key) || best.get(key).score < score) best.set(key, { title, score });
  }
  return [...best.values()]
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, "pt-BR"))
    .slice(0, limit)
    .map((entry) => entry.title);
}
