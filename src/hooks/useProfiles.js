import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profilesApi, reviewsApi } from "../services/api";
import { saveReviewAndSyncReputation } from "../services/domain";

export const useProfiles = () =>
  useQuery({ queryKey: ["profiles"], queryFn: profilesApi.list });

export const useReviews = (profileId) =>
  useQuery({
    queryKey: ["reviews", profileId],
    queryFn: () => reviewsApi.listByProfile(profileId),
    enabled: Boolean(profileId),
  });

// Cria ou atualiza a avaliação e sincroniza a reputação do avaliado.
export const useSaveReview = (profileId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveReviewAndSyncReputation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", profileId] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
    },
  });
};
