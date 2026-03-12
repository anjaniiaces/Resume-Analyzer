import { useQueryClient } from "@tanstack/react-query";
import {
  useAnalyzeResume,
  useAnalyzeBatch,
  getListResumesQueryKey,
  getGetSummaryReportQueryKey,
} from "@workspace/api-client-react";

export function useAnalyzeSingleResume() {
  const queryClient = useQueryClient();
  return useAnalyzeResume({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListResumesQueryKey() });
      },
    },
  });
}

export function useRunBatchAnalysis() {
  const queryClient = useQueryClient();
  return useAnalyzeBatch({
    mutation: {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: getListResumesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetSummaryReportQueryKey(variables.data.refNo) });
      },
    },
  });
}
