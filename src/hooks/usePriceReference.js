import { useQuery, useQueries } from "@tanstack/react-query";
import { getPriceReference, refKey, compareWithReference } from "../services/priceReference";

const queryFor = (title) => ({
  queryKey: ["price-reference", refKey(title)],
  queryFn: () => getPriceReference(title),
  staleTime: 60 * 60_000,
  retry: 0,
});

export const usePriceReference = (title) =>
  useQuery({ ...queryFor(title), enabled: Boolean(title) });

// Média da variação (%) dos anúncios que possuem referência externa.
export const useMarketBenchmark = (products) => {
  const results = useQueries({ queries: products.map((p) => queryFor(p.title)) });

  const samples = [];
  results.forEach((r, i) => {
    const diff = compareWithReference(products[i].price, r.data);
    if (diff !== null) samples.push(diff);
  });

  return {
    average: samples.length ? samples.reduce((a, b) => a + b, 0) / samples.length : null,
    matched: samples.length,
    total: products.length,
    isLoading: results.some((r) => r.isLoading),
  };
};