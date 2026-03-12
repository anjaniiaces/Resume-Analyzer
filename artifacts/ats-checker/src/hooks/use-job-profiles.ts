import { useQueryClient } from "@tanstack/react-query";
import {
  useListJobProfiles,
  useCreateJobProfile,
  useUpdateJobProfile,
  useDeleteJobProfile,
  getListJobProfilesQueryKey,
} from "@workspace/api-client-react";

export function useJobProfiles() {
  return useListJobProfiles();
}

export function useCreateProfile() {
  const queryClient = useQueryClient();
  return useCreateJobProfile({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListJobProfilesQueryKey() });
      },
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useUpdateJobProfile({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListJobProfilesQueryKey() });
      },
    },
  });
}

export function useDeleteProfile() {
  const queryClient = useQueryClient();
  return useDeleteJobProfile({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListJobProfilesQueryKey() });
      },
    },
  });
}
