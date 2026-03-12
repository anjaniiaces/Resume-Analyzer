import { useQueryClient } from "@tanstack/react-query";
import {
  useListResumes,
  useUploadResume,
  useDeleteResume,
  getListResumesQueryKey,
} from "@workspace/api-client-react";

export function useResumes(refNo?: string) {
  return useListResumes(refNo ? { refNo } : undefined);
}

export function useUploadNewResume() {
  const queryClient = useQueryClient();
  return useUploadResume({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListResumesQueryKey() });
      },
    },
  });
}

export function useRemoveResume() {
  const queryClient = useQueryClient();
  return useDeleteResume({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListResumesQueryKey() });
      },
    },
  });
}
