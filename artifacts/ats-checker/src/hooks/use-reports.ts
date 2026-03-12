import {
  useGetSummaryReport,
  exportReport,
} from "@workspace/api-client-react";

export function useSummaryReport(refNo: string) {
  return useGetSummaryReport(refNo, {
    query: {
      enabled: !!refNo,
      retry: false, // Don't retry if the report doesn't exist yet
    }
  });
}

export { exportReport };
