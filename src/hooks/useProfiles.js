import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profilesApi, reviewsApi } from "../services/api";

export const useProfiles = () =>
  useQuery({ queryKey: ["profiles"], queryFn: profilesApi.list });

export const useReviews = (profileId) =>
  useQuery({
    queryKey: ["reviews", profileId],
    queryFn: () => reviewsApi.listByProfile(profileId),
    enabled: Boolean(profileId),
  });

// Cria a avaliação ou atualiza a existente (quando "id" é informado).
export const useSaveReview = (profileId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) =>
      id ? reviewsApi.update(id, data) : reviewsApi.create(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["reviews", profileId] }),
  });
};
