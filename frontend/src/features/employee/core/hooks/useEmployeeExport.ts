import { useMutation } from '@tanstack/react-query';
import type { ApiError } from '@/shared/api/apiError';
import { employeeApi } from '../api/employeeApi';

export type EmployeeExportKind = 'activity' | 'security';

/** Hands the browser the CSV file the API answers (a download, not a page). */
const saveFile = (blob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};

/** Answers the saved file's name. */
export const useEmployeeExport = (employeeId: string, kind: EmployeeExportKind) =>
  useMutation<string, ApiError>({
    mutationFn: async () => {
      const blob =
        kind === 'activity'
          ? await employeeApi.exportActivity(employeeId)
          : await employeeApi.exportSecurityLog(employeeId);
      const fileName = `${kind === 'activity' ? 'activity' : 'security-log'}-${employeeId}.csv`;
      saveFile(blob, fileName);
      return fileName;
    },
  });
