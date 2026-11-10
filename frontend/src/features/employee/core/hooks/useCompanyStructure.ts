import {
  keepPreviousData,
  type MutationFunction,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { ApiError } from '@/shared/api/apiError';
import { structureApi } from '../api/structureApi';
import { employeeKeys } from './queryKeys';

export const useCompanyStructure = () =>
  useQuery({ queryKey: employeeKeys.structure(), queryFn: structureApi.find });

export const HOLDERS_PAGE_SIZE = 5;

/** Who holds a position, five a page; another page keeps the current one until it arrives. */
export const usePositionHolders = (positionId: string, page: number) =>
  useQuery({
    queryKey: employeeKeys.positionHolders(positionId, page),
    queryFn: () => structureApi.holders(positionId, page, HOLDERS_PAGE_SIZE),
    placeholderData: keepPreviousData,
  });

/**
 * Every change re-reads everything about employees — the structure, the position picker, the
 * Employees tabs and lists (a renamed position shows everywhere) — and Insights, grouped by
 * department.
 */
const useStructureMutation = <TResult, TVariables>(
  mutationFn: MutationFunction<TResult, TVariables>,
) => {
  const queryClient = useQueryClient();
  return useMutation<TResult, ApiError, TVariables>({
    mutationFn,
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: employeeKeys.all }),
        queryClient.invalidateQueries({ queryKey: ['insights'] }),
      ]);
    },
  });
};

export const useCreateDepartment = () =>
  useStructureMutation(({ name, idempotencyKey }: { name: string; idempotencyKey: string }) =>
    structureApi.createDepartment(name, idempotencyKey),
  );

export const useRenameDepartment = () =>
  useStructureMutation(
    ({ departmentId, name, version }: { departmentId: string; name: string; version: number }) =>
      structureApi.renameDepartment(departmentId, name, version),
  );

export const useRemoveDepartment = () =>
  useStructureMutation((departmentId: string) => structureApi.removeDepartment(departmentId));

export const useCreatePosition = () =>
  useStructureMutation(
    ({
      departmentId,
      title,
      idempotencyKey,
    }: {
      departmentId: string;
      title: string;
      idempotencyKey: string;
    }) => structureApi.createPosition(departmentId, title, idempotencyKey),
  );

export const useRenamePosition = () =>
  useStructureMutation(
    ({ positionId, title, version }: { positionId: string; title: string; version: number }) =>
      structureApi.renamePosition(positionId, title, version),
  );

export const useRemovePosition = () =>
  useStructureMutation((positionId: string) => structureApi.removePosition(positionId));
