import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "../services/api";
import { deleteProductCascade, updateProductWithAlerts } from "../services/domain";

export const productKeys = {
  all: ["products"],
  detail: (id) => ["products", String(id)],
};

export const useProducts = () =>
  useQuery({ queryKey: productKeys.all, queryFn: productsApi.list });

export const useProduct = (id) =>
  useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => productsApi.get(id),
    enabled: Boolean(id),
  });

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productKeys.all }),
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateProductWithAlerts(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productKeys.all }),
  });
};

// Remove o anúncio e, em cascata, negociações, mensagens e alertas ligados a ele.
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProductCascade,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({ queryKey: ["offers"] });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
};
